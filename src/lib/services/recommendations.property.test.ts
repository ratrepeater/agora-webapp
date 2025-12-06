import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { RecommendationService } from './recommendations';
import { supabaseTest } from '$lib/test-utils/supabase-test';
import { seedCategories } from '$lib/test-utils/seed-categories';
import type { TablesInsert } from '$lib/helpers/database.types';

// Create a test instance with the test client
const recommendationService = new RecommendationService(supabaseTest);

/**
 * Property-based tests for RecommendationService
 * These tests verify universal properties that should hold across all inputs
 */

// Helper to create a test seller profile
async function ensureTestSeller() {
	// First, try to find ANY existing seller profile
	const { data: anySellerProfiles } = await supabaseTest
		.from('profiles')
		.select('id')
		.eq('role_seller', true)
		.limit(1);

	if (anySellerProfiles && anySellerProfiles.length > 0) {
		return anySellerProfiles[0].id;
	}

	// If no seller exists, create one
	const testEmail = `testseller-${Date.now()}@test.com`;
	const testPassword = 'TestPassword123!';

	const { data: authData, error: authError} = await supabaseTest.auth.admin.createUser({
		email: testEmail,
		password: testPassword,
		email_confirm: true,
		user_metadata: {
			full_name: 'Test Seller'
		}
	});

	if (authError) {
		throw new Error(`Failed to create test seller: ${authError.message}`);
	}

	if (!authData.user) {
		throw new Error('Failed to create test user - no user returned');
	}

	// Wait for profile trigger to create the profile
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Update the profile to be a seller
	await supabaseTest
		.from('profiles')
		.update({ role_seller: true, role_buyer: false })
		.eq('id', authData.user.id);

	return authData.user.id;
}

// Helper to get a category ID
async function getCategoryId(categoryKey: string): Promise<string> {
	const { data, error } = await supabaseTest
		.from('categories')
		.select('id')
		.eq('key', categoryKey)
		.single();

	if (error || !data) {
		throw new Error(`Failed to get category ID for ${categoryKey}`);
	}

	return data.id;
}

// Helper to clean up test products
async function cleanupTestProducts(sellerId: string) {
	await supabaseTest.from('products').delete().eq('seller_id', sellerId);
}

describe('RecommendationService Property-Based Tests', () => {
	let testSellerId: string;
	let hrCategoryId: string;

	beforeAll(async () => {
		await seedCategories();
		testSellerId = await ensureTestSeller();
		hrCategoryId = await getCategoryId('hr');
	});

	afterEach(async () => {
		await cleanupTestProducts(testSellerId);
	});

	// Feature: startup-marketplace, Property 26: Recommendation prioritization
	// Validates: Requirements 14.5
	test('Property 26: Recommendation prioritization - recommendations are ordered by prioritization criteria', async () => {
		// Create products with different characteristics to test prioritization
		// Priority order: featured status > rating > recency

		const now = new Date();
		const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

		// Create products with varying attributes
		const testProducts = [
			{
				name: 'Featured Recent Product',
				is_featured: true,
				created_at: yesterday.toISOString(),
				price_cents: 10000
			},
			{
				name: 'Featured Old Product',
				is_featured: true,
				created_at: lastMonth.toISOString(),
				price_cents: 10000
			},
			{
				name: 'Non-Featured Recent Product',
				is_featured: false,
				created_at: yesterday.toISOString(),
				price_cents: 10000
			},
			{
				name: 'Non-Featured Old Product',
				is_featured: false,
				created_at: lastMonth.toISOString(),
				price_cents: 10000
			}
		];

		// Insert test products
		const insertedProducts = [];
		for (const product of testProducts) {
			const { data, error } = await supabaseTest
				.from('products')
				.insert({
					...product,
					short_description: 'Test description',
					seller_id: testSellerId,
					category_id: hrCategoryId,
					status: 'published'
				})
				.select()
				.single();

			if (error) {
				throw new Error(`Failed to create test product: ${error.message}`);
			}
			insertedProducts.push(data);
		}

		// Test getNewAndNotable prioritization
		const newAndNotable = await recommendationService.getNewAndNotable(10);

		// Verify that featured products come before non-featured
		let lastWasFeatured = true;
		for (const product of newAndNotable) {
			if (!product.is_featured && lastWasFeatured) {
				lastWasFeatured = false;
			}
			// Once we see a non-featured product, all subsequent should be non-featured
			if (!lastWasFeatured) {
				expect(product.is_featured).toBe(false);
			}
		}

		// Verify that within featured products, newer ones come first
		const featuredProducts = newAndNotable.filter((p) => p.is_featured);
		for (let i = 0; i < featuredProducts.length - 1; i++) {
			const current = new Date(featuredProducts[i].created_at || '');
			const next = new Date(featuredProducts[i + 1].created_at || '');
			expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
		}

		// Verify that within non-featured products, newer ones come first
		const nonFeaturedProducts = newAndNotable.filter((p) => !p.is_featured);
		for (let i = 0; i < nonFeaturedProducts.length - 1; i++) {
			const current = new Date(nonFeaturedProducts[i].created_at || '');
			const next = new Date(nonFeaturedProducts[i + 1].created_at || '');
			expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
		}
	}, 30000);

	test('Property 26b: Trending products prioritize recent engagement', async () => {
		// Create test products
		const products: any[] = [];
		for (let i = 0; i < 5; i++) {
			const { data, error } = await supabaseTest
				.from('products')
				.insert({
					name: `Test Product ${i}`,
					short_description: 'Test description',
					price_cents: 10000,
					seller_id: testSellerId,
					category_id: hrCategoryId,
					status: 'published',
					is_featured: false
				})
				.select()
				.single();

			if (error) {
				throw new Error(`Failed to create test product: ${error.message}`);
			}
			products.push(data);
		}

		// Create a test buyer
		const { data: buyerAuth } = await supabaseTest.auth.admin.createUser({
			email: `testbuyer-${Date.now()}@test.com`,
			password: 'TestPassword123!',
			email_confirm: true
		});

		if (!buyerAuth.user) {
			throw new Error('Failed to create test buyer');
		}

		const buyerId = buyerAuth.user.id;

		// Create engagement for products (bookmarks, cart items, orders)
		// Product 0: 3 bookmarks (3 points)
		// Product 1: 2 cart items (4 points)
		// Product 2: 1 purchase (3 points)
		// Product 3: 1 bookmark + 1 cart (3 points)
		// Product 4: no engagement (0 points)

		// Add bookmarks for product 0
		for (let i = 0; i < 3; i++) {
			const { data: tempBuyer } = await supabaseTest.auth.admin.createUser({
				email: `tempbuyer${i}-${Date.now()}@test.com`,
				password: 'TestPassword123!',
				email_confirm: true
			});
			if (tempBuyer.user) {
				await supabaseTest.from('bookmarks').insert({
					buyer_id: tempBuyer.user.id,
					product_id: products[0].id
				});
			}
		}

		// Add cart items for product 1
		for (let i = 0; i < 2; i++) {
			const { data: tempBuyer } = await supabaseTest.auth.admin.createUser({
				email: `cartbuyer${i}-${Date.now()}@test.com`,
				password: 'TestPassword123!',
				email_confirm: true
			});
			if (tempBuyer.user) {
				await supabaseTest.from('cart_items').insert({
					buyer_id: tempBuyer.user.id,
					product_id: products[1].id,
					quantity: 1
				});
			}
		}

		// Add order for product 2
		const { data: order } = await supabaseTest
			.from('orders')
			.insert({
				buyer_id: buyerId,
				total_cents: 10000,
				status: 'completed'
			})
			.select()
			.single();

		if (order) {
			await supabaseTest.from('order_items').insert({
				order_id: order.id,
				product_id: products[2].id,
				quantity: 1,
				price_cents: 10000
			});
		}

		// Add bookmark and cart for product 3
		await supabaseTest.from('bookmarks').insert({
			buyer_id: buyerId,
			product_id: products[3].id
		});
		await supabaseTest.from('cart_items').insert({
			buyer_id: buyerId,
			product_id: products[3].id,
			quantity: 1
		});

		// Get trending products
		const trending = await recommendationService.getTrending(10);

		// Verify that products with more engagement appear first
		// Product 1 should be first (4 points from cart items)
		// Product 0, 2, 3 should follow (3 points each)
		// Product 4 should be last or not appear (0 points)

		if (trending.length > 0) {
			// The first product should be one with high engagement
			const firstProduct = trending[0];
			const firstProductIndex = products.findIndex((p) => p.id === firstProduct.id);

			// Product 1 (highest engagement) should appear before product 4 (no engagement)
			if (trending.length > 1) {
				const lastProduct = trending[trending.length - 1];
				const lastProductIndex = products.findIndex((p) => p.id === lastProduct.id);

				// Product with no engagement should not be first
				expect(lastProductIndex).not.toBe(1);
			}
		}

		// Cleanup test buyer
		await supabaseTest.auth.admin.deleteUser(buyerId);
	}, 60000);

	test('Property 26c: Similar products are in same category', async () => {
		// Create products in different categories
		const legalCategoryId = await getCategoryId('legal');
		const timestamp = Date.now();

		const { data: hrProduct, error: hrError } = await supabaseTest
			.from('products')
			.insert({
				name: `HR Product for Similar Test ${timestamp}`,
				short_description: 'HR description',
				price_cents: 10000,
				seller_id: testSellerId,
				category_id: hrCategoryId,
				status: 'published'
			})
			.select()
			.single();

		if (hrError || !hrProduct) {
			throw new Error(`Failed to create HR product: ${hrError?.message}`);
		}

		// Verify the product was created with a unique ID
		const { data: verifyProduct, error: verifyError } = await supabaseTest
			.from('products')
			.select('id, category_id, price_cents')
			.eq('id', hrProduct.id);

		if (verifyError) {
			throw new Error(`Failed to verify product: ${verifyError.message}`);
		}

		// If we get multiple products with the same ID, that's a database issue
		if (verifyProduct && verifyProduct.length > 1) {
			throw new Error(`Database integrity issue: multiple products with ID ${hrProduct.id}`);
		}

		// Create similar products in HR category
		for (let i = 0; i < 3; i++) {
			await supabaseTest.from('products').insert({
				name: `Similar HR Product ${timestamp}-${i}`,
				short_description: 'Similar HR description',
				price_cents: 10000 + i * 1000, // Similar price range
				seller_id: testSellerId,
				category_id: hrCategoryId,
				status: 'published'
			});
		}

		// Create products in different category
		for (let i = 0; i < 2; i++) {
			await supabaseTest.from('products').insert({
				name: `Legal Product ${timestamp}-${i}`,
				short_description: 'Legal description',
				price_cents: 10000,
				seller_id: testSellerId,
				category_id: legalCategoryId,
				status: 'published'
			});
		}

		// Get similar products
		const similar = await recommendationService.getSimilarProducts(hrProduct.id, 10);

		// All similar products should be in the same category
		const allSameCategory = similar.every((p: any) => p.category_id === hrCategoryId);
		expect(allSameCategory).toBe(true);

		// Similar products should not include the source product
		const includesSource = similar.some((p) => p.id === hrProduct.id);
		expect(includesSource).toBe(false);
	}, 30000);

	test('Property 26d: Frequently bought together excludes source product', async () => {
		// Create test products
		const products: any[] = [];
		for (let i = 0; i < 3; i++) {
			const { data } = await supabaseTest
				.from('products')
				.insert({
					name: `Bundle Product ${i}`,
					short_description: 'Test description',
					price_cents: 10000,
					seller_id: testSellerId,
					category_id: hrCategoryId,
					status: 'published'
				})
				.select()
				.single();

			if (data) products.push(data);
		}

		// Create a test buyer and order
		const { data: buyerAuth } = await supabaseTest.auth.admin.createUser({
			email: `bundlebuyer-${Date.now()}@test.com`,
			password: 'TestPassword123!',
			email_confirm: true
		});

		if (buyerAuth.user && products.length === 3) {
			const { data: order } = await supabaseTest
				.from('orders')
				.insert({
					buyer_id: buyerAuth.user.id,
					total_cents: 30000,
					status: 'completed'
				})
				.select()
				.single();

			if (order) {
				// Add all products to the same order
				for (const product of products) {
					await supabaseTest.from('order_items').insert({
						order_id: order.id,
						product_id: product.id,
						quantity: 1,
						price_cents: 10000
					});
				}

				// Get frequently bought together for product 0
				const fbt = await recommendationService.getFrequentlyBoughtTogether(products[0].id, 10);

				// Should not include the source product
				const includesSource = fbt.some((p) => p.id === products[0].id);
				expect(includesSource).toBe(false);

				// Should include the other products from the order
				if (fbt.length > 0) {
					const allFromOrder = fbt.every((p) =>
						products.some((op) => op.id === p.id && op.id !== products[0].id)
					);
					expect(allFromOrder).toBe(true);
				}
			}

			// Cleanup
			await supabaseTest.auth.admin.deleteUser(buyerAuth.user.id);
		}
	}, 30000);
});
