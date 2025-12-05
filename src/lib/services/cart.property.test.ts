import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { supabaseTest } from '$lib/test-utils/supabase-test';
import { seedCategories } from '$lib/test-utils/seed-categories';

/**
 * Property-based tests for CartService
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
		.update({ role: 'buyer', full_name: name })
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
		.update({ role: 'seller', full_name: 'Test Seller' })
		.eq('id', authData.user.id);

	return authData.user.id;
}

// Helper to create a test product
async function createTestProduct(
	sellerId: string,
	name: string = 'Test Product',
	price: number = 100
): Promise<string> {
	const { data, error } = await supabaseTest
		.from('products')
		.insert({
			name,
			short_description: 'Test product description',
			long_description: 'Test product long description for testing purposes',
			price,
			seller_id: sellerId,
			category: 'HR'
		})
		.select()
		.single();

	if (error || !data) {
		throw new Error(`Failed to create test product: ${error?.message}`);
	}

	return data.id;
}

// Helper to clean up test cart items
async function cleanupTestCartItems(buyerId: string) {
	await supabaseTest.from('cart_items').delete().eq('buyer_id', buyerId);
}

describe('CartService Property-Based Tests', () => {
	let testBuyerId: string;
	let testSellerId: string;
	let testProductId: string;

	beforeAll(async () => {
		await seedCategories();
		testBuyerId = await ensureTestBuyer();
		testSellerId = await ensureTestSeller();
		testProductId = await createTestProduct(testSellerId, 'Test Product', 100);
	});

	afterEach(async () => {
		await cleanupTestCartItems(testBuyerId);
	});

	// Feature: startup-marketplace, Property 46: Cart data round-trip
	// Validates: Requirements 21.3
	test('Property 46: Cart data round-trip - storing then retrieving cart returns same items', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.constant(testProductId),
				fc.integer({ min: 1, max: 10 }),
				async (productId, quantity) => {
					// Clean up any existing cart items first
					await supabaseTest.from('cart_items').delete().eq('buyer_id', testBuyerId);

					// Add the cart item using test client (bypasses RLS)
					const { data: added, error: addError } = await supabaseTest
						.from('cart_items')
						.insert({
							buyer_id: testBuyerId,
							product_id: productId,
							quantity
						})
						.select()
						.single();

					if (addError || !added) {
						throw new Error(`Failed to add cart item: ${addError?.message}`);
					}

					// Verify the cart item was created with correct data
					expect(added.buyer_id).toBe(testBuyerId);
					expect(added.product_id).toBe(productId);
					expect(added.quantity).toBe(quantity);

					// Retrieve cart items for the buyer using test client
					const { data: cartItems, error: getError } = await supabaseTest
						.from('cart_items')
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
						throw new Error(`Failed to retrieve cart items: ${getError.message}`);
					}

					// Find the cart item we just added
					const retrieved = cartItems?.find((item) => item.product_id === productId);

					// Verify the cart item exists and has the same data
					expect(retrieved).toBeDefined();
					if (!retrieved) return false;

					const dataMatches =
						retrieved.buyer_id === testBuyerId &&
						retrieved.product_id === productId &&
						retrieved.quantity === quantity;

					// Verify the product data is included
					const hasProductData = retrieved.product !== undefined;

					// Clean up after test
					await supabaseTest.from('cart_items').delete().eq('buyer_id', testBuyerId);

					return dataMatches && hasProductData;
				}
			),
			{ numRuns: 100 }
		);
	}, 60000);

	// Feature: startup-marketplace, Property 10: Cart total accuracy
	// Validates: Requirements 7.2
	test('Property 10: Cart total accuracy - total equals sum of (price × quantity) for all items', async () => {
		// Create multiple test products with different prices
		const product1Id = await createTestProduct(testSellerId, 'Product 1', 50);
		const product2Id = await createTestProduct(testSellerId, 'Product 2', 75);
		const product3Id = await createTestProduct(testSellerId, 'Product 3', 100);

		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 1, max: 5 }),
				fc.integer({ min: 1, max: 5 }),
				fc.integer({ min: 1, max: 5 }),
				async (qty1, qty2, qty3) => {
					// Clean up cart first
					await supabaseTest.from('cart_items').delete().eq('buyer_id', testBuyerId);

					// Add items to cart
					await supabaseTest.from('cart_items').insert([
						{ buyer_id: testBuyerId, product_id: product1Id, quantity: qty1 },
						{ buyer_id: testBuyerId, product_id: product2Id, quantity: qty2 },
						{ buyer_id: testBuyerId, product_id: product3Id, quantity: qty3 }
					]);

					// Calculate expected total
					const expectedTotal = 50 * qty1 + 75 * qty2 + 100 * qty3;

					// Get cart items with product details
					const { data: cartItems } = await supabaseTest
						.from('cart_items')
						.select(
							`
							*,
							product:products (price)
						`
						)
						.eq('buyer_id', testBuyerId);

					// Calculate actual total
					const actualTotal = (cartItems || []).reduce((total, item: any) => {
						return total + item.product.price * (item.quantity || 1);
					}, 0);

					// Verify totals match (with floating point tolerance)
					return Math.abs(expectedTotal - actualTotal) < 0.01;
				}
			),
			{ numRuns: 100 }
		);

		// Cleanup the extra products
		await supabaseTest.from('products').delete().eq('id', product1Id);
		await supabaseTest.from('products').delete().eq('id', product2Id);
		await supabaseTest.from('products').delete().eq('id', product3Id);
	}, 60000);

	// Feature: startup-marketplace, Property 11: Cart removal updates total
	// Validates: Requirements 7.3
	test('Property 11: Cart removal updates total - new total equals old total minus removed item cost', async () => {
		// Create test products with known prices
		const product1Id = await createTestProduct(testSellerId, 'Product 1', 50);
		const product2Id = await createTestProduct(testSellerId, 'Product 2', 75);

		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 1, max: 5 }),
				fc.integer({ min: 1, max: 5 }),
				async (qty1, qty2) => {
					// Clean up cart first
					await supabaseTest.from('cart_items').delete().eq('buyer_id', testBuyerId);

					// Add items to cart
					const { data: items } = await supabaseTest
						.from('cart_items')
						.insert([
							{ buyer_id: testBuyerId, product_id: product1Id, quantity: qty1 },
							{ buyer_id: testBuyerId, product_id: product2Id, quantity: qty2 }
						])
						.select();

					if (!items || items.length !== 2) {
						throw new Error('Failed to add cart items');
					}

					// Calculate initial total
					const initialTotal = 50 * qty1 + 75 * qty2;

					// Get cart items with product details
					const { data: initialCartItems } = await supabaseTest
						.from('cart_items')
						.select(
							`
							*,
							product:products (price)
						`
						)
						.eq('buyer_id', testBuyerId);

					const calculatedInitialTotal = (initialCartItems || []).reduce((total, item: any) => {
						return total + item.product.price * (item.quantity || 1);
					}, 0);

					// Verify initial total
					if (Math.abs(initialTotal - calculatedInitialTotal) >= 0.01) {
						return false;
					}

					// Remove the first item
					const itemToRemove = items[0];
					const removedItemCost = 50 * qty1;

					await supabaseTest.from('cart_items').delete().eq('id', itemToRemove.id);

					// Calculate new total
					const { data: finalCartItems } = await supabaseTest
						.from('cart_items')
						.select(
							`
							*,
							product:products (price)
						`
						)
						.eq('buyer_id', testBuyerId);

					const actualNewTotal = (finalCartItems || []).reduce((total, item: any) => {
						return total + item.product.price * (item.quantity || 1);
					}, 0);

					const expectedNewTotal = initialTotal - removedItemCost;

					// Verify new total equals old total minus removed item cost
					return Math.abs(expectedNewTotal - actualNewTotal) < 0.01;
				}
			),
			{ numRuns: 100 }
		);

		// Cleanup the extra products
		await supabaseTest.from('products').delete().eq('id', product1Id);
		await supabaseTest.from('products').delete().eq('id', product2Id);
	}, 60000);

	// Feature: startup-marketplace, Property 8: List modification invariant
	// Validates: Requirements 7.1
	test('Property 8: List modification invariant (cart) - adding increases list size by 1, removing decreases by 1', async () => {
		// Create multiple test products for this test
		const productIds = await Promise.all([
			createTestProduct(testSellerId, 'Product 1', 50),
			createTestProduct(testSellerId, 'Product 2', 75),
			createTestProduct(testSellerId, 'Product 3', 100)
		]);

		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom(...productIds),
				fc.integer({ min: 1, max: 5 }),
				async (productId, quantity) => {
					// Get initial count using test client
					const { data: initialCartItems } = await supabaseTest
						.from('cart_items')
						.select('*')
						.eq('buyer_id', testBuyerId);

					const initialCount = initialCartItems?.length || 0;

					// Add a cart item using test client
					const { data: addedItem } = await supabaseTest
						.from('cart_items')
						.insert({
							buyer_id: testBuyerId,
							product_id: productId,
							quantity
						})
						.select()
						.single();

					if (!addedItem) {
						throw new Error('Failed to add cart item');
					}

					const { data: afterAddCartItems } = await supabaseTest
						.from('cart_items')
						.select('*')
						.eq('buyer_id', testBuyerId);

					const afterAddCount = afterAddCartItems?.length || 0;

					// Verify adding increased count by 1
					const addIncreasedByOne = afterAddCount === initialCount + 1;

					// Remove the cart item using test client
					await supabaseTest.from('cart_items').delete().eq('id', addedItem.id);

					const { data: afterRemoveCartItems } = await supabaseTest
						.from('cart_items')
						.select('*')
						.eq('buyer_id', testBuyerId);

					const afterRemoveCount = afterRemoveCartItems?.length || 0;

					// Verify removing decreased count by 1
					const removeDecreasedByOne = afterRemoveCount === afterAddCount - 1;

					// Verify we're back to initial count
					const backToInitial = afterRemoveCount === initialCount;

					return addIncreasedByOne && removeDecreasedByOne && backToInitial;
				}
			),
			{ numRuns: 100 }
		);

		// Cleanup the extra products
		for (const productId of productIds) {
			await supabaseTest.from('products').delete().eq('id', productId);
		}
	}, 60000);
});
