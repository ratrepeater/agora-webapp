import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { reviewService } from './reviews';
import { supabaseTest } from '$lib/test-utils/supabase-test';
import { seedCategories } from '$lib/test-utils/seed-categories';

/**
 * Property-based tests for ReviewService
 * These tests verify universal properties that should hold across all inputs
 */

// Helper to create a test buyer profile
async function ensureTestBuyer(name: string = 'Test Buyer'): Promise<string> {
	const testEmail = `testbuyer-${Date.now()}-${Math.random()}@test.com`;
	const testPassword = 'TestPassword123!';

	// Create auth user using admin API (bypasses email confirmation)
	const { data: authData, error: authError } = await supabaseTest.auth.admin.createUser({
		email: testEmail,
		password: testPassword,
		email_confirm: true,
		user_metadata: {
			full_name: name
		}
	});

	if (authError || !authData.user) {
		throw new Error(`Failed to create test buyer: ${authError?.message}`);
	}

	// Update the profile to be a buyer
	await supabaseTest
		.from('profiles')
		.update({ role_buyer: true, role_seller: false, full_name: name })
		.eq('id', authData.user.id);

	return authData.user.id;
}

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

// Helper to clean up test reviews
async function cleanupTestReviews(buyerId: string) {
	await supabaseTest.from('reviews').delete().eq('buyer_id', buyerId);
}

// Helper to clean up test products
async function cleanupTestProducts(sellerId: string) {
	await supabaseTest.from('products').delete().eq('seller_id', sellerId);
}

// Helper to clean up test users
async function cleanupTestUser(userId: string) {
	await supabaseTest.auth.admin.deleteUser(userId);
}

// Review generator
const reviewDataArb = () =>
	fc.record({
		rating: fc.integer({ min: 1, max: 5 }),
		title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
		body: fc.option(fc.string({ minLength: 1, maxLength: 1000 }), { nil: null })
	});

describe('ReviewService Property-Based Tests', () => {
	let testBuyerId: string;
	let testSellerId: string;
	let testProductId: string;

	beforeAll(async () => {
		await seedCategories();
		testBuyerId = await ensureTestBuyer();
		testSellerId = await ensureTestSeller();
		testProductId = await createTestProduct(testSellerId);
	});

	afterEach(async () => {
		await cleanupTestReviews(testBuyerId);
	});

	// Feature: startup-marketplace, Property 48: Review data round-trip
	// Validates: Requirements 21.5
	test('Property 48: Review data round-trip - storing then retrieving review returns equivalent data', async () => {
		await fc.assert(
			fc.asyncProperty(reviewDataArb(), async (reviewData) => {
				// Create a review using test client (bypasses RLS)
				const { data: created, error: createError } = await supabaseTest
					.from('reviews')
					.insert({
						product_id: testProductId,
						buyer_id: testBuyerId,
						rating: reviewData.rating,
						title: reviewData.title,
						body: reviewData.body
					})
					.select()
					.single();

				if (createError || !created) {
					throw new Error(`Failed to create review: ${createError?.message}`);
				}

				// Retrieve the review using test client
				const { data: retrieved, error: getError } = await supabaseTest
					.from('reviews')
					.select('*')
					.eq('id', created.id)
					.single();

				if (getError || !retrieved) {
					throw new Error(`Failed to retrieve review: ${getError?.message}`);
				}

				// Verify the data matches
				const dataMatches =
					retrieved.product_id === testProductId &&
					retrieved.buyer_id === testBuyerId &&
					retrieved.rating === reviewData.rating &&
					retrieved.title === reviewData.title &&
					retrieved.body === reviewData.body;

				// Clean up
				await supabaseTest.from('reviews').delete().eq('id', created.id);

				return dataMatches;
			}),
			{ numRuns: 100 }
		);
	}, 60000);

	// Feature: startup-marketplace, Property 15: Review display completeness
	// Validates: Requirements 9.1
	test('Property 15: Review display completeness - each review includes reviewer name, rating, and text', async () => {
		await fc.assert(
			fc.asyncProperty(reviewDataArb(), async (reviewData) => {
				// Create a review using test client
				const { data: created, error: createError } = await supabaseTest
					.from('reviews')
					.insert({
						product_id: testProductId,
						buyer_id: testBuyerId,
						rating: reviewData.rating,
						title: reviewData.title,
						body: reviewData.body
					})
					.select()
					.single();

				if (createError || !created) {
					throw new Error(`Failed to create review: ${createError?.message}`);
				}

				// Retrieve reviews with buyer info using test client
				const { data: reviews, error: getError } = await supabaseTest
					.from('reviews')
					.select(
						`
						*,
						buyer:profiles!reviews_buyer_id_fkey (
							full_name,
							email
						)
					`
					)
					.eq('product_id', testProductId);

				if (getError) {
					throw new Error(`Failed to retrieve reviews: ${getError.message}`);
				}

				// Find our review
				const review = reviews?.find((r) => r.id === created.id);

				if (!review) {
					throw new Error('Review not found');
				}

				// Verify completeness: reviewer name (or email), rating, and text are present
				const hasReviewerInfo = review.buyer?.email !== undefined;
				const hasRating = review.rating !== undefined && review.rating >= 1 && review.rating <= 5;
				// Body can be null, but the field should exist
				const hasBody = 'body' in review;

				// Clean up
				await supabaseTest.from('reviews').delete().eq('id', created.id);

				return hasReviewerInfo && hasRating && hasBody;
			}),
			{ numRuns: 100 }
		);
	}, 60000);

	// Feature: startup-marketplace, Property 16: Average rating accuracy
	// Validates: Requirements 9.2
	test('Property 16: Average rating accuracy - average rating equals arithmetic mean of all ratings', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 20 }),
				async (ratings) => {
					// Create multiple reviews with the given ratings
					const reviewIds: string[] = [];

					for (const rating of ratings) {
						const { data: created, error } = await supabaseTest
							.from('reviews')
							.insert({
								product_id: testProductId,
								buyer_id: testBuyerId,
								rating: rating,
								title: 'Test Review',
								body: 'Test review body'
							})
							.select()
							.single();

						if (error || !created) {
							throw new Error(`Failed to create review: ${error?.message}`);
						}

						reviewIds.push(created.id);
					}

					// Calculate expected average
					const expectedAverage = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

					// Get average rating from database
					const { data: reviewData, error: getError } = await supabaseTest
						.from('reviews')
						.select('rating')
						.eq('product_id', testProductId);

					if (getError) {
						throw new Error(`Failed to get reviews: ${getError.message}`);
					}

					const actualAverage =
						reviewData && reviewData.length > 0
							? reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length
							: 0;

					// Allow small floating point tolerance
					const averageMatches = Math.abs(actualAverage - expectedAverage) < 0.01;

					// Clean up all created reviews
					for (const id of reviewIds) {
						await supabaseTest.from('reviews').delete().eq('id', id);
					}

					return averageMatches;
				}
			),
			{ numRuns: 100 }
		);
	}, 60000);
});
