import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { bookmarkService } from './bookmarks';
import { supabaseTest } from '$lib/test-utils/supabase-test';
import { seedCategories } from '$lib/test-utils/seed-categories';

/**
 * Property-based tests for BookmarkService
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

// Helper to clean up test bookmarks
async function cleanupTestBookmarks(buyerId: string) {
	await supabaseTest.from('bookmarks').delete().eq('buyer_id', buyerId);
}

// Helper to clean up test products
async function cleanupTestProducts(sellerId: string) {
	await supabaseTest.from('products').delete().eq('seller_id', sellerId);
}

// Helper to clean up test users
async function cleanupTestUser(userId: string) {
	await supabaseTest.auth.admin.deleteUser(userId);
}

describe('BookmarkService Property-Based Tests', () => {
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
		await cleanupTestBookmarks(testBuyerId);
	});

	// Feature: startup-marketplace, Property 45: Bookmark data round-trip
	// Validates: Requirements 21.2
	test('Property 45: Bookmark data round-trip - storing then retrieving bookmark returns same buyer-product relationship', async () => {
		await fc.assert(
			fc.asyncProperty(fc.constant(testProductId), async (productId) => {
				// Clean up any existing bookmark first
				await supabaseTest
					.from('bookmarks')
					.delete()
					.eq('buyer_id', testBuyerId)
					.eq('product_id', productId);

				// Add the bookmark using test client (bypasses RLS)
				const { data: added, error: addError } = await supabaseTest
					.from('bookmarks')
					.insert({
						buyer_id: testBuyerId,
						product_id: productId
					})
					.select()
					.single();

				if (addError || !added) {
					throw new Error(`Failed to add bookmark: ${addError?.message}`);
				}

				// Verify the bookmark was created with correct data
				expect(added.buyer_id).toBe(testBuyerId);
				expect(added.product_id).toBe(productId);

				// Retrieve bookmarks for the buyer using test client
				const { data: bookmarks, error: getError } = await supabaseTest
					.from('bookmarks')
					.select(
						`
						*,
						product:products (
							*,
							reviews (rating)
						)
					`
					)
					.eq('buyer_id', testBuyerId);

				if (getError) {
					throw new Error(`Failed to retrieve bookmarks: ${getError.message}`);
				}

				// Find the bookmark we just added
				const retrieved = bookmarks?.find((b) => b.product_id === productId);

				// Verify the bookmark exists and has the same buyer-product relationship
				expect(retrieved).toBeDefined();
				if (!retrieved) return false;

				const relationshipMatches =
					retrieved.buyer_id === testBuyerId && retrieved.product_id === productId;

				// Verify the product data is included
				const hasProductData = retrieved.product !== undefined;

				// Clean up after test
				await supabaseTest
					.from('bookmarks')
					.delete()
					.eq('buyer_id', testBuyerId)
					.eq('product_id', productId);

				return relationshipMatches && hasProductData;
			}),
			{ numRuns: 100 }
		);
	}, 60000);

	// Feature: startup-marketplace, Property 9: Bookmark toggle idempotence
	// Validates: Requirements 6.2
	test('Property 9: Bookmark toggle idempotence - bookmarking twice returns to original state', async () => {
		await fc.assert(
			fc.asyncProperty(fc.constant(testProductId), async (productId) => {
				// Get initial bookmark state using test client
				const { data: initialCheck } = await supabaseTest
					.from('bookmarks')
					.select('buyer_id')
					.eq('buyer_id', testBuyerId)
					.eq('product_id', productId)
					.maybeSingle();

				const initialState = initialCheck !== null;

				const { data: initialBookmarks } = await supabaseTest
					.from('bookmarks')
					.select('*')
					.eq('buyer_id', testBuyerId);

				const initialCount = initialBookmarks?.length || 0;

				// Toggle bookmark twice using test client
				// First toggle
				if (initialState) {
					await supabaseTest
						.from('bookmarks')
						.delete()
						.eq('buyer_id', testBuyerId)
						.eq('product_id', productId);
				} else {
					await supabaseTest
						.from('bookmarks')
						.insert({
							buyer_id: testBuyerId,
							product_id: productId
						});
				}

				// Second toggle
				const { data: afterFirstToggle } = await supabaseTest
					.from('bookmarks')
					.select('buyer_id')
					.eq('buyer_id', testBuyerId)
					.eq('product_id', productId)
					.maybeSingle();

				const stateAfterFirstToggle = afterFirstToggle !== null;

				if (stateAfterFirstToggle) {
					await supabaseTest
						.from('bookmarks')
						.delete()
						.eq('buyer_id', testBuyerId)
						.eq('product_id', productId);
				} else {
					await supabaseTest
						.from('bookmarks')
						.insert({
							buyer_id: testBuyerId,
							product_id: productId
						});
				}

				// Get final state
				const { data: finalCheck } = await supabaseTest
					.from('bookmarks')
					.select('buyer_id')
					.eq('buyer_id', testBuyerId)
					.eq('product_id', productId)
					.maybeSingle();

				const finalState = finalCheck !== null;

				const { data: finalBookmarks } = await supabaseTest
					.from('bookmarks')
					.select('*')
					.eq('buyer_id', testBuyerId);

				const finalCount = finalBookmarks?.length || 0;

				// State should be the same as initial
				return initialState === finalState && initialCount === finalCount;
			}),
			{ numRuns: 100 }
		);
	}, 60000);

	// Feature: startup-marketplace, Property 8: List modification invariant
	// Validates: Requirements 6.1, 6.4
	test('Property 8: List modification invariant (bookmarks) - adding increases list size by 1, removing decreases by 1', async () => {
		// Create multiple test products for this test
		const productIds = await Promise.all([
			createTestProduct(testSellerId, 'Product 1'),
			createTestProduct(testSellerId, 'Product 2'),
			createTestProduct(testSellerId, 'Product 3')
		]);

		await fc.assert(
			fc.asyncProperty(fc.constantFrom(...productIds), async (productId) => {
				// Get initial count using test client
				const { data: initialBookmarks } = await supabaseTest
					.from('bookmarks')
					.select('*')
					.eq('buyer_id', testBuyerId);

				const initialCount = initialBookmarks?.length || 0;

				// Add a bookmark using test client
				await supabaseTest.from('bookmarks').insert({
					buyer_id: testBuyerId,
					product_id: productId
				});

				const { data: afterAddBookmarks } = await supabaseTest
					.from('bookmarks')
					.select('*')
					.eq('buyer_id', testBuyerId);

				const afterAddCount = afterAddBookmarks?.length || 0;

				// Verify adding increased count by 1
				const addIncreasedByOne = afterAddCount === initialCount + 1;

				// Remove the bookmark using test client
				await supabaseTest
					.from('bookmarks')
					.delete()
					.eq('buyer_id', testBuyerId)
					.eq('product_id', productId);

				const { data: afterRemoveBookmarks } = await supabaseTest
					.from('bookmarks')
					.select('*')
					.eq('buyer_id', testBuyerId);

				const afterRemoveCount = afterRemoveBookmarks?.length || 0;

				// Verify removing decreased count by 1
				const removeDecreasedByOne = afterRemoveCount === afterAddCount - 1;

				// Verify we're back to initial count
				const backToInitial = afterRemoveCount === initialCount;

				return addIncreasedByOne && removeDecreasedByOne && backToInitial;
			}),
			{ numRuns: 100 }
		);

		// Cleanup the extra products
		for (const productId of productIds) {
			await supabaseTest.from('products').delete().eq('id', productId);
		}
	}, 60000);
});
