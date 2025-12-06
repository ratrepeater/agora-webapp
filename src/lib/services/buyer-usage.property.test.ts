import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { supabaseTest } from '$lib/test-utils/supabase-test';
import { BuyerUsageService } from './buyer-usage';
import type { BuyerProductUsage, PurchasedProductSummary } from '$lib/helpers/types';

describe('BuyerUsageService Property Tests', () => {
	let service: BuyerUsageService;
	let testBuyerId: string;
	let testSellerId: string;
	let testCategoryId: string;

	// Helper to create test profiles
	async function createTestProfiles() {
		// Create auth users (profiles will be auto-created by trigger)
		const buyerResult = await supabaseTest.auth.admin.createUser({
			email: `buyer-${crypto.randomUUID()}@test.com`,
			password: 'test123456',
			email_confirm: true
		});

		const sellerResult = await supabaseTest.auth.admin.createUser({
			email: `seller-${crypto.randomUUID()}@test.com`,
			password: 'test123456',
			email_confirm: true
		});

		testBuyerId = buyerResult.data.user!.id;
		testSellerId = sellerResult.data.user!.id;

		// Update the profiles that were auto-created
		await supabaseTest
			.from('profiles')
			.update({
				full_name: 'Test Buyer',
				role_buyer: true,
				role_seller: false
			})
			.eq('id', testBuyerId);

		await supabaseTest
			.from('profiles')
			.update({
				full_name: 'Test Seller',
				role_buyer: false,
				role_seller: true
			})
			.eq('id', testSellerId);
	}

	// Helper to cleanup test profiles
	async function cleanupTestProfiles() {
		// Delete auth users (will cascade to profiles)
		await supabaseTest.auth.admin.deleteUser(testBuyerId);
		await supabaseTest.auth.admin.deleteUser(testSellerId);
	}

	beforeAll(async () => {
		service = new BuyerUsageService(supabaseTest);

		// Create test category
		const { data: categoryData } = await supabaseTest
			.from('categories')
			.insert({
				key: 'test-category',
				name: 'Test Category',
				description: 'Test category for property tests'
			})
			.select()
			.single();
		testCategoryId = categoryData!.id;
	});

	afterAll(async () => {
		// Cleanup category
		await supabaseTest.from('categories').delete().eq('id', testCategoryId);
	});

	beforeEach(async () => {
		// Create fresh profiles for each test
		await createTestProfiles();
	});

	afterEach(async () => {
		// Clean up test data and profiles after each test
		await supabaseTest.from('buyer_product_usage').delete().neq('id', '00000000-0000-0000-0000-000000000000');
		await supabaseTest.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
		await supabaseTest.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
		await supabaseTest.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
		await cleanupTestProfiles();
	});

	// Feature: startup-marketplace, Property 27: Buyer dashboard completeness
	it('should display all purchased products with usage metrics and performance data', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.array(
					fc.record({
						productName: fc.stringMatching(/^[a-zA-Z0-9 ]{5,50}$/),
						price: fc.integer({ min: 100, max: 100000 }),
						usageCount: fc.integer({ min: 0, max: 1000 }),
						roiActual: fc.option(fc.float({ min: -100, max: 500 }), { nil: null }),
						satisfactionScore: fc.option(fc.integer({ min: 1, max: 5 }), { nil: null })
					}),
					{ minLength: 1, maxLength: 5 }
				),
				async (purchasedProducts) => {
					// Create products and orders for the buyer
					const createdProducts = [];
					const createdOrders = [];

					for (const productData of purchasedProducts) {
						// Create product
						const { data: product, error: productError } = await supabaseTest
							.from('products')
							.insert({
								seller_id: testSellerId,
								category_id: testCategoryId,
								name: productData.productName,
								short_description: 'Test product description',
								price_cents: productData.price,
								status: 'published'
							})
							.select()
							.single();

						if (productError || !product) {
							console.error('Failed to create product:', productError);
							continue;
						}
						createdProducts.push(product);

						// Create order
						const { data: order } = await supabaseTest
							.from('orders')
							.insert({
								buyer_id: testBuyerId,
								demo_total_cents: productData.price,
								status: 'completed'
							})
							.select()
							.single();

						if (!order) continue;
						createdOrders.push(order);

						// Create order item
						await supabaseTest.from('order_items').insert({
							order_id: order.id,
							product_id: product.id,
							quantity: 1,
							unit_price_cents: productData.price,
							subtotal_cents: productData.price
						});

						// Create usage tracking
						await supabaseTest.from('buyer_product_usage').insert({
							buyer_id: testBuyerId,
							product_id: product.id,
							order_id: order.id,
							usage_count: productData.usageCount,
							roi_actual: productData.roiActual,
							satisfaction_score: productData.satisfactionScore,
							implementation_status: 'in_progress'
						});
					}

					// Get buyer dashboard
					const dashboard = await service.getBuyerDashboard(testBuyerId);

					// Verify dashboard completeness
					expect(dashboard).not.toBeNull();
					if (!dashboard) return false;

					// Property: All successfully created products should be displayed
					expect(dashboard.purchased_products.length).toBe(createdProducts.length);

					// Property: Each product should have usage metrics
					for (const purchasedProduct of dashboard.purchased_products) {
						expect(purchasedProduct).toHaveProperty('product');
						expect(purchasedProduct).toHaveProperty('purchase_date');
						expect(purchasedProduct).toHaveProperty('implementation_status');
						expect(purchasedProduct).toHaveProperty('usage_count');
						expect(purchasedProduct).toHaveProperty('roi_actual');
						expect(purchasedProduct).toHaveProperty('roi_expected');
						expect(purchasedProduct).toHaveProperty('satisfaction_score');

						// Verify usage count matches for created products
						const createdProduct = createdProducts.find(
							(p) => p.id === purchasedProduct.product.id
						);
						if (createdProduct) {
							const originalProduct = purchasedProducts.find(
								(p) => p.productName === createdProduct.name
							);
							if (originalProduct) {
								expect(purchasedProduct.usage_count).toBe(originalProduct.usageCount);
							}
						}
					}

					// Property: Dashboard should have performance data
					expect(dashboard).toHaveProperty('total_spent');
					expect(dashboard).toHaveProperty('active_products');
					expect(dashboard).toHaveProperty('average_roi');
					expect(dashboard).toHaveProperty('roi_trend');
					expect(dashboard).toHaveProperty('usage_trend');
					expect(dashboard).toHaveProperty('satisfaction_trend');
					expect(dashboard).toHaveProperty('well_performing_products');
					expect(dashboard).toHaveProperty('underutilized_products');
					expect(dashboard).toHaveProperty('spending_by_category');
					expect(dashboard).toHaveProperty('implementation_timeline');

					// Cleanup
					for (const order of createdOrders) {
						await supabaseTest.from('orders').delete().eq('id', order.id);
					}
					for (const product of createdProducts) {
						await supabaseTest.from('products').delete().eq('id', product.id);
					}

					return true;
				}
			),
			{ numRuns: 10 } // Reduced runs for database operations
		);
	});

	// Feature: startup-marketplace, Property 28: Product performance display
	it('should display implementation status, usage statistics, and ROI calculations for purchased products', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.record({
					productName: fc.stringMatching(/^[a-zA-Z0-9 ]{5,50}$/),
					price: fc.integer({ min: 100, max: 100000 }),
					implementationStatus: fc.constantFrom(
						'not_started',
						'in_progress',
						'completed',
						'paused'
					),
					usageCount: fc.integer({ min: 0, max: 1000 }),
					roiActual: fc.float({ min: -100, max: 500 }),
					roiExpected: fc.float({ min: 0, max: 500 }),
					satisfactionScore: fc.integer({ min: 1, max: 5 })
				}),
				async (productData) => {
					// Create product
					const { data: product } = await supabaseTest
						.from('products')
						.insert({
							seller_id: testSellerId,
							category_id: testCategoryId,
							name: productData.productName,
							short_description: 'Test product description',
							price_cents: productData.price,
							status: 'published'
						})
						.select()
						.single();

					if (!product) return false;

					// Create order
					const { data: order } = await supabaseTest
						.from('orders')
						.insert({
							buyer_id: testBuyerId,
							demo_total_cents: productData.price,
							status: 'completed'
						})
						.select()
						.single();

					if (!order) return false;

					// Create order item
					await supabaseTest.from('order_items').insert({
						order_id: order.id,
						product_id: product.id,
						quantity: 1,
						unit_price_cents: productData.price,
						subtotal_cents: productData.price
					});

					// Create usage tracking with all metrics
					await supabaseTest.from('buyer_product_usage').insert({
						buyer_id: testBuyerId,
						product_id: product.id,
						order_id: order.id,
						implementation_status: productData.implementationStatus,
						usage_count: productData.usageCount,
						roi_actual: productData.roiActual,
						roi_expected: productData.roiExpected,
						satisfaction_score: productData.satisfactionScore
					});

					// Get product performance
					const performance = await service.getProductPerformance(testBuyerId, product.id);

					// Verify performance display completeness
					expect(performance).not.toBeNull();
					if (!performance) return false;

					// Property: Should include implementation status
					expect(performance.implementation).toHaveProperty('status');
					expect(performance.implementation.status).toBe(productData.implementationStatus);
					expect(performance.implementation).toHaveProperty('started_at');
					expect(performance.implementation).toHaveProperty('completed_at');

					// Property: Should include usage statistics
					expect(performance.usage_metrics).toHaveProperty('usage_count');
					expect(performance.usage_metrics.usage_count).toBe(productData.usageCount);
					expect(performance.usage_metrics).toHaveProperty('last_used_at');
					expect(performance.usage_metrics).toHaveProperty('active_users');
					expect(performance.usage_metrics).toHaveProperty('usage_frequency');

					// Property: Should include ROI calculations
					expect(performance.performance_metrics).toHaveProperty('roi_actual');
					expect(performance.performance_metrics.roi_actual).toBeCloseTo(
						productData.roiActual,
						2
					);
					expect(performance.performance_metrics).toHaveProperty('roi_expected');
					expect(performance.performance_metrics.roi_expected).toBeCloseTo(
						productData.roiExpected,
						2
					);
					expect(performance.performance_metrics).toHaveProperty('satisfaction_score');
					expect(performance.performance_metrics.satisfaction_score).toBe(
						productData.satisfactionScore
					);
					expect(performance.performance_metrics).toHaveProperty('time_saved_hours');
					expect(performance.performance_metrics).toHaveProperty('cost_saved');

					// Cleanup
					await supabaseTest.from('orders').delete().eq('id', order.id);
					await supabaseTest.from('products').delete().eq('id', product.id);

					return true;
				}
			),
			{ numRuns: 10 }
		);
	});

	// Feature: startup-marketplace, Property 29: Feedback persistence
	it('should store and retrieve buyer feedback for sellers', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.record({
					productName: fc.stringMatching(/^[a-zA-Z0-9 ]{5,50}$/),
					feedbackText: fc.stringMatching(/^[a-zA-Z0-9 .,!?]{10,500}$/),
					featureRequests: fc.array(fc.stringMatching(/^[a-zA-Z0-9 .,!?]{5,100}$/), {
						minLength: 0,
						maxLength: 5
					}),
					issuesReported: fc.array(fc.stringMatching(/^[a-zA-Z0-9 .,!?]{5,100}$/), {
						minLength: 0,
						maxLength: 5
					})
				}),
				async (feedbackData) => {
					// Create product
					const { data: product } = await supabaseTest
						.from('products')
						.insert({
							seller_id: testSellerId,
							category_id: testCategoryId,
							name: feedbackData.productName,
							short_description: 'Test product description',
							price_cents: 10000,
							status: 'published'
						})
						.select()
						.single();

					if (!product) return false;

					// Create order
					const { data: order } = await supabaseTest
						.from('orders')
						.insert({
							buyer_id: testBuyerId,
							demo_total_cents: 10000,
							status: 'completed'
						})
						.select()
						.single();

					if (!order) return false;

					// Create order item
					await supabaseTest.from('order_items').insert({
						order_id: order.id,
						product_id: product.id,
						quantity: 1,
						unit_price_cents: 10000,
						subtotal_cents: 10000
					});

					// Initialize usage tracking
					const usage = await service.initializeUsage(testBuyerId, product.id, order.id);
					if (!usage) return false;

					// Submit feedback
					const updatedUsage = await service.submitFeedback(
						usage.id,
						feedbackData.feedbackText,
						feedbackData.featureRequests,
						feedbackData.issuesReported
					);

					// Verify feedback was stored
					expect(updatedUsage).not.toBeNull();
					if (!updatedUsage) return false;

					// Property: Feedback text should be persisted
					expect(updatedUsage.feedback_text).toBe(feedbackData.feedbackText);

					// Property: Feature requests should be persisted
					if (feedbackData.featureRequests.length > 0) {
						expect(updatedUsage.feature_requests).toEqual(feedbackData.featureRequests);
					}

					// Property: Issues should be persisted
					if (feedbackData.issuesReported.length > 0) {
						expect(updatedUsage.issues_reported).toEqual(feedbackData.issuesReported);
					}

					// Verify seller can retrieve feedback
					const retrievedUsage = await supabaseTest
						.from('buyer_product_usage')
						.select('*')
						.eq('id', usage.id)
						.single();

					expect(retrievedUsage.data).not.toBeNull();
					if (!retrievedUsage.data) return false;

					// Property: Retrieved feedback should match submitted feedback
					expect(retrievedUsage.data.feedback_text).toBe(feedbackData.feedbackText);

					// Cleanup
					await supabaseTest.from('orders').delete().eq('id', order.id);
					await supabaseTest.from('products').delete().eq('id', product.id);

					return true;
				}
			),
			{ numRuns: 10 }
		);
	});
});
