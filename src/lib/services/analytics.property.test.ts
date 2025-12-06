import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { analyticsService } from './analytics';
import { supabaseTest } from '$lib/test-utils/supabase-test';
import { seedCategories } from '$lib/test-utils/seed-categories';

/**
 * Property-based tests for AnalyticsService
 * These tests verify universal properties that should hold across all inputs
 */

// Helper to create a test seller profile
async function ensureTestSeller(): Promise<string> {
	const testEmail = `testseller-${Date.now()}-${Math.random()}@test.com`;
	const testPassword = 'TestPassword123!';

	const { data: authData, error: authError } = await supabaseTest.auth.admin.createUser({
		email: testEmail,
		password: testPassword,
		email_confirm: true,
		user_metadata: {
			full_name: 'Test Seller'
		}
	});

	if (authError || !authData.user) {
		throw new Error(`Failed to create test seller: ${authError?.message}`);
	}

	await supabaseTest
		.from('profiles')
		.update({ role_seller: true, role_buyer: false, full_name: 'Test Seller' })
		.eq('id', authData.user.id);

	return authData.user.id;
}

// Helper to create a test product
async function createTestProduct(sellerId: string, name: string = 'Test Product'): Promise<string> {
	const { data: categoryData } = await supabaseTest
		.from('categories')
		.select('id')
		.eq('key', 'hr')
		.single();

	if (!categoryData) {
		throw new Error('Failed to get category');
	}

	const { data, error } = await supabaseTest
		.from('products')
		.insert({
			name,
			short_description: 'Test product description',
			price_cents: 1000,
			seller_id: sellerId,
			category_id: categoryData.id,
			status: 'published'
		})
		.select()
		.single();

	if (error || !data) {
		throw new Error(`Failed to create test product: ${error?.message}`);
	}

	return data.id;
}

// Helper to clean up test analytics
async function cleanupTestAnalytics(productId: string) {
	await supabaseTest.from('product_analytics_daily').delete().eq('product_id', productId);
}

// Helper to clean up test products
async function cleanupTestProducts(sellerId: string) {
	await supabaseTest.from('products').delete().eq('seller_id', sellerId);
}

describe('AnalyticsService Property-Based Tests', () => {
	let testSellerId: string;
	let testProductId: string;
	let testSellerEmail: string;

	beforeAll(async () => {
		await seedCategories();
		testSellerEmail = `testseller-${Date.now()}-${Math.random()}@test.com`;
		testSellerId = await ensureTestSeller();
		testProductId = await createTestProduct(testSellerId);
	});

	afterEach(async () => {
		await cleanupTestAnalytics(testProductId);
	});

	// Feature: startup-marketplace, Property 49: Analytics data round-trip
	// Validates: Requirements 21.8
	test('Property 49: Analytics data round-trip - storing then retrieving analytics returns equivalent data', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.record({
					views: fc.integer({ min: 0, max: 100 }),
					unique_visitors: fc.integer({ min: 0, max: 50 }),
					bookmarks: fc.integer({ min: 0, max: 20 }),
					cart_adds: fc.integer({ min: 0, max: 20 }),
					purchases: fc.integer({ min: 0, max: 10 }),
					revenue: fc.integer({ min: 0, max: 10000 })
				}),
				async (analyticsData) => {
					const today = new Date().toISOString().split('T')[0];

					// Clean up any existing analytics for today
					await supabaseTest
						.from('product_analytics_daily')
						.delete()
						.eq('product_id', testProductId)
						.eq('date', today);

					// Store analytics data directly using test client
					const { data: stored, error: storeError } = await supabaseTest
						.from('product_analytics_daily')
						.insert({
							product_id: testProductId,
							date: today,
							views: analyticsData.views,
							unique_visitors: analyticsData.unique_visitors,
							bookmarks: analyticsData.bookmarks,
							cart_adds: analyticsData.cart_adds,
							purchases: analyticsData.purchases,
							revenue: analyticsData.revenue
						})
						.select()
						.single();

					if (storeError || !stored) {
						throw new Error(`Failed to store analytics: ${storeError?.message}`);
					}

					// Retrieve analytics using test client (same client, should match exactly)
					const { data: retrieved } = await supabaseTest
						.from('product_analytics_daily')
						.select('*')
						.eq('product_id', testProductId)
						.eq('date', today)
						.maybeSingle();

					if (!retrieved) {
						throw new Error('Failed to retrieve stored analytics');
					}

					// Verify retrieved data matches stored data exactly
					const dataMatches =
						retrieved.views === analyticsData.views &&
						retrieved.unique_visitors === analyticsData.unique_visitors &&
						retrieved.bookmarks === analyticsData.bookmarks &&
						retrieved.cart_adds === analyticsData.cart_adds &&
						retrieved.purchases === analyticsData.purchases &&
						retrieved.revenue === analyticsData.revenue;

					// Clean up
					await supabaseTest
						.from('product_analytics_daily')
						.delete()
						.eq('product_id', testProductId)
						.eq('date', today);

					return dataMatches;
				}
			),
			{ numRuns: 100 }
		);
	}, 60000);

	// Feature: startup-marketplace, Property 30: Seller analytics completeness
	// Validates: Requirements 16.1
	test('Property 30: Seller analytics completeness - seller dashboard includes all required metrics', async () => {
		await fc.assert(
			fc.asyncProperty(fc.constant(testSellerId), async (sellerId) => {
				// Get seller dashboard
				const dashboard = await analyticsService.getSellerDashboard(sellerId);

				// Verify all required fields are present
				const hasOverviewMetrics =
					typeof dashboard.total_products === 'number' &&
					typeof dashboard.total_revenue === 'number' &&
					typeof dashboard.total_orders === 'number' &&
					typeof dashboard.average_rating === 'number';

				const hasPerformanceCharts =
					Array.isArray(dashboard.revenue_trend) &&
					Array.isArray(dashboard.order_trend) &&
					Array.isArray(dashboard.conversion_trend);

				const hasProductPerformance =
					Array.isArray(dashboard.top_products) &&
					Array.isArray(dashboard.underperforming_products);

				const hasCustomerInsights =
					Array.isArray(dashboard.recent_reviews) &&
					Array.isArray(dashboard.customer_segments) &&
					typeof dashboard.repeat_customer_rate === 'number';

				const hasCompetitivePosition =
					dashboard.market_position !== undefined &&
					Array.isArray(dashboard.category_rankings);

				return (
					hasOverviewMetrics &&
					hasPerformanceCharts &&
					hasProductPerformance &&
					hasCustomerInsights &&
					hasCompetitivePosition
				);
			}),
			{ numRuns: 100 }
		);
	}, 60000);

	// Feature: startup-marketplace, Property 35: Product performance metrics display
	// Validates: Requirements 17.4
	test('Property 35: Product performance metrics display - product analytics includes sales, reviews, and engagement', async () => {
		await fc.assert(
			fc.asyncProperty(fc.constant(testProductId), async (productId) => {
				// Get product analytics
				const analytics = await analyticsService.getProductAnalytics(productId);

				// Verify all required metrics are present
				const hasSalesData =
					typeof analytics.total_purchases === 'number' &&
					typeof analytics.total_revenue === 'number' &&
					typeof analytics.average_order_value === 'number' &&
					typeof analytics.conversion_rate === 'number';

				const hasReviewData =
					typeof analytics.average_rating === 'number' &&
					typeof analytics.review_count === 'number' &&
					analytics.rating_distribution !== undefined;

				const hasEngagementData =
					typeof analytics.total_views === 'number' &&
					typeof analytics.total_bookmarks === 'number' &&
					typeof analytics.total_cart_adds === 'number' &&
					typeof analytics.bookmark_rate === 'number' &&
					typeof analytics.cart_add_rate === 'number';

				return hasSalesData && hasReviewData && hasEngagementData;
			}),
			{ numRuns: 100 }
		);
	}, 60000);

	// Feature: startup-marketplace, Property 31: Competitor analysis completeness
	// Validates: Requirements 16.2
	test('Property 31: Competitor analysis completeness - for any product, competitor analysis includes main competitors with comparative metrics and market positioning', async () => {
		// Create competitor products in the same category as testProductId
		const competitorIds: string[] = [];
		for (let i = 0; i < 3; i++) {
			const compId = await createTestProduct(testSellerId, `Competitor ${Date.now()}-${i}`);
			competitorIds.push(compId);
		}

		try {
			// Identify competitors for the test product
			await analyticsService.identifyCompetitors(testProductId);

			await fc.assert(
				fc.asyncProperty(fc.constant(testProductId), async (productId) => {
					// Get competitor analysis
					const analysis = await analyticsService.getCompetitorAnalysis(productId);

					// Property: Analysis should include the product
					expect(analysis.product).toBeDefined();
					expect(analysis.product.id).toBe(productId);

					// Property: Analysis should include competitors array
					expect(analysis.competitors).toBeDefined();
					expect(Array.isArray(analysis.competitors)).toBe(true);

					// Property: Analysis should include market position
					expect(analysis.market_position).toBeDefined();
					expect(['leader', 'challenger', 'follower']).toContain(analysis.market_position);

					// Property: Analysis should include price comparison
					expect(analysis.price_comparison).toBeDefined();
					expect(analysis.price_comparison.your_price).toBeDefined();
					expect(analysis.price_comparison.competitor_average).toBeDefined();
					expect(analysis.price_comparison.market_low).toBeDefined();
					expect(analysis.price_comparison.market_high).toBeDefined();
					expect(['premium', 'competitive', 'budget']).toContain(analysis.price_comparison.position);

					// Property: Analysis should include feature comparison
					expect(analysis.feature_comparison).toBeDefined();
					expect(Array.isArray(analysis.feature_comparison)).toBe(true);

					// Property: Analysis should include metric comparison
					expect(analysis.metric_comparison).toBeDefined();
					expect(analysis.metric_comparison.roi).toBeDefined();
					expect(analysis.metric_comparison.retention).toBeDefined();
					expect(analysis.metric_comparison.implementation_time).toBeDefined();

					// Property: Analysis should include score comparison
					expect(analysis.score_comparison).toBeDefined();
					expect(analysis.score_comparison.your_scores).toBeDefined();
					expect(analysis.score_comparison.competitor_average).toBeDefined();
					expect(analysis.score_comparison.market_leader).toBeDefined();

					// Property: Analysis should include improvement suggestions
					expect(analysis.improvement_suggestions).toBeDefined();
					expect(Array.isArray(analysis.improvement_suggestions)).toBe(true);

					// Property: Each competitor should have required fields
					analysis.competitors.forEach((competitor) => {
						expect(competitor.id).toBeDefined();
						expect(competitor.similarity_score).toBeDefined();
						expect(competitor.market_overlap_score).toBeDefined();
						expect(competitor.price_difference).toBeDefined();
						expect(competitor.price_difference_percentage).toBeDefined();
						expect(competitor.rating_difference).toBeDefined();
						expect(competitor.score_differences).toBeDefined();
						expect(competitor.score_differences.fit).toBeDefined();
						expect(competitor.score_differences.feature).toBeDefined();
						expect(competitor.score_differences.integration).toBeDefined();
						expect(competitor.score_differences.review).toBeDefined();
						expect(competitor.score_differences.overall).toBeDefined();
					});

					return true;
				}),
				{ numRuns: 100 }
			);
		} finally {
			// Cleanup
			await supabaseTest.from('competitor_relationships').delete().eq('product_id', testProductId);
			for (const compId of competitorIds) {
				await supabaseTest.from('products').delete().eq('id', compId);
			}
		}
	}, 60000);
});
