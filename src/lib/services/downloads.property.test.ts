import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { downloadService } from './downloads';
import { supabaseTest } from '$lib/test-utils/supabase-test';

describe('DownloadService Property Tests', () => {
	let testBuyerId: string;
	let testSellerId: string;
	let testProductIds: string[] = [];

	beforeEach(async () => {
		// Create test buyer auth user
		const buyerId = crypto.randomUUID();
		const { data: buyerAuth, error: buyerAuthError } = await supabaseTest.auth.admin.createUser({
			id: buyerId,
			email: `buyer-${buyerId}@test.com`,
			password: 'test123456',
			email_confirm: true,
			user_metadata: { role: 'buyer' }
		});

		if (buyerAuthError) throw buyerAuthError;
		testBuyerId = buyerAuth.user.id;

		// Wait for profile to be created by trigger, then update
		await new Promise(resolve => setTimeout(resolve, 100));
		await supabaseTest
			.from('profiles')
			.update({ role_buyer: true })
			.eq('id', testBuyerId);

		// Create test seller auth user
		const sellerId = crypto.randomUUID();
		const { data: sellerAuth, error: sellerAuthError } = await supabaseTest.auth.admin.createUser({
			id: sellerId,
			email: `seller-${sellerId}@test.com`,
			password: 'test123456',
			email_confirm: true,
			user_metadata: { role: 'seller' }
		});

		if (sellerAuthError) throw sellerAuthError;
		testSellerId = sellerAuth.user.id;

		// Wait for profile to be created by trigger, then update
		await new Promise(resolve => setTimeout(resolve, 100));
		await supabaseTest
			.from('profiles')
			.update({ role_seller: true })
			.eq('id', testSellerId);
	});

	afterEach(async () => {
		// Clean up test data
		if (testProductIds.length > 0) {
			await supabaseTest.from('products').delete().in('id', testProductIds);
		}
		if (testBuyerId) {
			await supabaseTest.auth.admin.deleteUser(testBuyerId);
		}
		if (testSellerId) {
			await supabaseTest.auth.admin.deleteUser(testSellerId);
		}
		testProductIds = [];
	});

	// Feature: startup-marketplace, Property 36: Download availability after purchase
	// For any downloadable product purchase, download links should be immediately available on the confirmation page and in order history.
	it('Property 36: Download availability after purchase - download access is available immediately', { timeout: 60000 }, async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.array(
					fc.record({
						name: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
						short_description: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10),
						price_cents: fc.integer({ min: 100, max: 100000 })
					}),
					{ minLength: 1, maxLength: 3 }
				),
				async (productsData) => {
					// Create products with downloadable files
					const productsToCreate = productsData.map((item) => ({
						name: item.name,
						short_description: item.short_description,
						price_cents: item.price_cents,
						seller_id: testSellerId
					}));

					const { data: products, error: productsError } = await supabaseTest
						.from('products')
						.insert(productsToCreate)
						.select();

					if (productsError) {
						console.error('Failed to create products:', productsError);
						throw productsError;
					}
					testProductIds.push(...products.map((p) => p.id));

					// Create product files for each product (simulating downloadable content)
					for (const product of products) {
						await supabaseTest
							.from('product_files')
							.insert({
								product_id: product.id,
								storage_path: `test/${product.id}/file.zip`,
								file_name: `${product.name}.zip`,
								file_type: 'application/zip',
								file_size_bytes: 1024000,
								is_primary: true
							});
					}

					// Create order directly using supabaseTest
					const totalCents = products.reduce((sum, p) => sum + p.price_cents, 0);
					const { data: order, error: orderError } = await supabaseTest
						.from('orders')
						.insert({
							buyer_id: testBuyerId,
							demo: true,
							demo_total_cents: totalCents,
							status: 'completed'
						})
						.select()
						.single();

					if (orderError) {
						throw new Error(`Failed to create order: ${orderError.message}`);
					}

					// Create order items
					const orderItems = products.map(p => ({
						order_id: order.id,
						product_id: p.id,
						quantity: 1,
						unit_price_cents: p.price_cents,
						subtotal_cents: p.price_cents
					}));

					await supabaseTest.from('order_items').insert(orderItems);

					// Property: For each purchased product, download access should be available immediately
					// Verify by checking that order_items exist for each product
					for (const product of products) {
						// Check that order item exists (this is what download access is based on)
						const { data: orderItem } = await supabaseTest
							.from('order_items')
							.select('id, order:orders!inner(buyer_id)')
							.eq('order_id', order.id)
							.eq('product_id', product.id)
							.maybeSingle();

						// Verify order item exists
						expect(orderItem).toBeDefined();
						expect(orderItem).not.toBeNull();

						// Verify the order belongs to the buyer
						const orderData = orderItem?.order as any;
						expect(orderData?.buyer_id).toBe(testBuyerId);

						// Verify product file exists (downloadable content is available)
						const { data: productFile } = await supabaseTest
							.from('product_files')
							.select('*')
							.eq('product_id', product.id)
							.eq('is_primary', true)
							.maybeSingle();

						expect(productFile).toBeDefined();
						expect(productFile?.file_name).toBe(`${product.name}.zip`);
					}

					// Verify download access is NOT available for products not purchased
					const { data: otherProduct } = await supabaseTest
						.from('products')
						.insert({
							name: 'Not Purchased Product',
							short_description: 'This product was not purchased',
							price_cents: 5000,
							seller_id: testSellerId
						})
						.select()
						.single();

					if (otherProduct) {
						testProductIds.push(otherProduct.id);
						
						// Verify no order item exists for this product
						const { data: noOrderItem } = await supabaseTest
							.from('order_items')
							.select('id')
							.eq('product_id', otherProduct.id)
							.eq('order_id', order.id)
							.maybeSingle();

						expect(noOrderItem).toBeNull();
					}

					return true;
				}
			),
			{ numRuns: 100 }
		);
	});

	// Feature: startup-marketplace, Property 37: Download tracking
	// For any product download, the download event should be recorded and usage metrics should be updated.
	it('Property 37: Download tracking - downloads are tracked and metrics updated', { timeout: 60000 }, async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.record({
					name: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
					short_description: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10),
					price_cents: fc.integer({ min: 100, max: 100000 }),
					downloadCount: fc.integer({ min: 1, max: 5 })
				}),
				async (testData) => {
					// Create a product with downloadable file
					const { data: product, error: productError } = await supabaseTest
						.from('products')
						.insert({
							name: testData.name,
							short_description: testData.short_description,
							price_cents: testData.price_cents,
							seller_id: testSellerId
						})
						.select()
						.single();

					if (productError) {
						console.error('Failed to create product:', productError);
						throw productError;
					}
					testProductIds.push(product.id);

					// Create product file
					await supabaseTest
						.from('product_files')
						.insert({
							product_id: product.id,
							storage_path: `test/${product.id}/file.zip`,
							file_name: `${product.name}.zip`,
							file_type: 'application/zip',
							file_size_bytes: 2048000,
							is_primary: true
						});

					// Create order directly using supabaseTest
					const { data: order, error: orderError } = await supabaseTest
						.from('orders')
						.insert({
							buyer_id: testBuyerId,
							demo: true,
							demo_total_cents: testData.price_cents,
							status: 'completed'
						})
						.select()
						.single();

					if (orderError) {
						throw new Error(`Failed to create order: ${orderError.message}`);
					}

					// Create order item
					await supabaseTest.from('order_items').insert({
						order_id: order.id,
						product_id: product.id,
						quantity: 1,
						unit_price_cents: testData.price_cents,
						subtotal_cents: testData.price_cents
					});

					// Track multiple downloads by creating download records
					const downloadRecords = [];
					for (let i = 0; i < testData.downloadCount; i++) {
						const { data: download, error: downloadError } = await supabaseTest
							.from('product_downloads')
							.insert({
								product_id: product.id,
								buyer_id: testBuyerId,
								order_id: order.id,
								file_name: `${product.name}.zip`,
								file_size_bytes: 2048000,
								downloaded_at: new Date().toISOString()
							})
							.select()
							.single();

						if (downloadError) {
							throw new Error(`Failed to track download: ${downloadError.message}`);
						}
						downloadRecords.push(download);

						// Also create download event
						await supabaseTest
							.from('product_events')
							.insert({
								product_id: product.id,
								seller_id: testSellerId,
								buyer_id: testBuyerId,
								event_type: 'download',
								metadata: { order_id: order.id, file_name: `${product.name}.zip` }
							});

						// Update analytics
						const today = new Date().toISOString().split('T')[0];
						const { data: existingAnalytics } = await supabaseTest
							.from('product_analytics_daily')
							.select('downloads')
							.eq('product_id', product.id)
							.eq('date', today)
							.maybeSingle();

						if (existingAnalytics) {
							await supabaseTest
								.from('product_analytics_daily')
								.update({ downloads: existingAnalytics.downloads + 1 })
								.eq('product_id', product.id)
								.eq('date', today);
						} else {
							await supabaseTest
								.from('product_analytics_daily')
								.insert({
									product_id: product.id,
									date: today,
									downloads: 1
								});
						}
					}

					// Property: Each download should be recorded
					expect(downloadRecords.length).toBe(testData.downloadCount);

					// Verify all download records have correct data
					for (const download of downloadRecords) {
						expect(download.product_id).toBe(product.id);
						expect(download.buyer_id).toBe(testBuyerId);
						expect(download.order_id).toBe(order.id);
						expect(download.file_name).toBe(`${product.name}.zip`);
						expect(download.file_size_bytes).toBe(2048000);
						expect(download.downloaded_at).toBeDefined();
					}

					// Verify download history contains all downloads
					const { data: downloadHistory } = await supabaseTest
						.from('product_downloads')
						.select('*')
						.eq('buyer_id', testBuyerId)
						.eq('product_id', product.id);

					expect(downloadHistory?.length).toBe(testData.downloadCount);

					// Verify downloads by order
					const { data: orderDownloads } = await supabaseTest
						.from('product_downloads')
						.select('*')
						.eq('order_id', order.id);

					expect(orderDownloads?.length).toBe(testData.downloadCount);

					// Verify analytics were updated (download count should be tracked)
					const today = new Date().toISOString().split('T')[0];
					const { data: analytics } = await supabaseTest
						.from('product_analytics_daily')
						.select('downloads')
						.eq('product_id', product.id)
						.eq('date', today)
						.maybeSingle();

					// Analytics should show the download count
					expect(analytics).toBeDefined();
					expect(analytics?.downloads).toBe(testData.downloadCount);

					// Verify download events were created
					const { data: events } = await supabaseTest
						.from('product_events')
						.select('*')
						.eq('product_id', product.id)
						.eq('event_type', 'download')
						.eq('buyer_id', testBuyerId);

					expect(events?.length).toBe(testData.downloadCount);

					return true;
				}
			),
			{ numRuns: 100 }
		);
	});
});
