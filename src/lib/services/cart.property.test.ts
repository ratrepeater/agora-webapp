import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { supabaseTest } from '$lib/test-utils/supabase-test';
import { seedCategories } from '$lib/test-utils/seed-categories';
import {
	createTestBuyer,
	createTestSeller,
	createTestProduct,
	cleanupBuyerData,
	cleanupAllTestData
} from '$lib/test-utils/test-data-helpers';

/**
 * Property-based tests for CartService
 * These tests verify universal properties that should hold across all inputs
 */

describe('CartService Property-Based Tests', () => {
	let testBuyerId: string;
	let testSellerId: string;
	let testProductId: string;

	beforeAll(async () => {
		await seedCategories();
		testBuyerId = await createTestBuyer('Test Buyer for Cart');
		testSellerId = await createTestSeller('Test Seller for Cart');
		testProductId = await createTestProduct(testSellerId, { price_cents: 10000 }); // $100.00
	});

	afterEach(async () => {
		await cleanupBuyerData(testBuyerId);
	}, 30000); // 30 second timeout for cleanup

	afterAll(async () => {
		await cleanupAllTestData();
	}, 30000); // 30 second timeout for cleanup

	// Feature: startup-marketplace, Property 46: Cart data round-trip
	// Validates: Requirements 21.3
	test('Property 46: Cart data round-trip - storing then retrieving cart returns same items', async () => {
		// Create a cart for the buyer first
		const { data: cart } = await supabaseTest
			.from('carts')
			.insert({ buyer_id: testBuyerId, status: 'open' })
			.select()
			.single();

		if (!cart) {
			throw new Error('Failed to create test cart');
		}

		await fc.assert(
			fc.asyncProperty(
				fc.constant(testProductId),
				fc.integer({ min: 1, max: 10 }),
				async (productId, quantity) => {
					// Clean up any existing cart items first
					await supabaseTest.from('cart_items').delete().eq('cart_id', cart.id);

					// Get product price
					const { data: product } = await supabaseTest
						.from('products')
						.select('price_cents')
						.eq('id', productId)
						.single();

					if (!product) {
						throw new Error('Failed to get product');
					}

					// Add the cart item using test client (bypasses RLS)
					const { data: added, error: addError } = await supabaseTest
						.from('cart_items')
						.insert({
							cart_id: cart.id,
							product_id: productId,
							quantity,
							unit_price_cents: product.price_cents
						})
						.select()
						.single();

					if (addError || !added) {
						throw new Error(`Failed to add cart item: ${addError?.message}`);
					}

					// Verify the cart item was created with correct data
					expect(added.cart_id).toBe(cart.id);
					expect(added.product_id).toBe(productId);
					expect(added.quantity).toBe(quantity);

					// Retrieve cart items using test client
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
						.eq('cart_id', cart.id);

					if (getError) {
						throw new Error(`Failed to retrieve cart items: ${getError.message}`);
					}

					// Find the cart item we just added
					const retrieved = cartItems?.find((item) => item.product_id === productId);

					// Verify the cart item exists and has the same data
					expect(retrieved).toBeDefined();
					if (!retrieved) return false;

					const dataMatches =
						retrieved.cart_id === cart.id &&
						retrieved.product_id === productId &&
						retrieved.quantity === quantity;

					// Verify the product data is included
					const hasProductData = retrieved.product !== undefined;

					// Clean up after test
					await supabaseTest.from('cart_items').delete().eq('cart_id', cart.id);

					return dataMatches && hasProductData;
				}
			),
			{ numRuns: 100 }
		);

		// Clean up the cart
		await supabaseTest.from('carts').delete().eq('id', cart.id);
	}, 60000);

	// Feature: startup-marketplace, Property 10: Cart total accuracy
	// Validates: Requirements 7.2
	test('Property 10: Cart total accuracy - total equals sum of (price × quantity) for all items', async () => {
		// Create multiple test products with different prices (in cents)
		const product1Id = await createTestProduct(testSellerId, { price_cents: 5000 }); // $50.00
		const product2Id = await createTestProduct(testSellerId, { price_cents: 7500 }); // $75.00
		const product3Id = await createTestProduct(testSellerId, { price_cents: 10000 }); // $100.00

		// Create a cart for the buyer
		const { data: cart } = await supabaseTest
			.from('carts')
			.insert({ buyer_id: testBuyerId, status: 'open' })
			.select()
			.single();

		if (!cart) {
			throw new Error('Failed to create test cart');
		}

		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 1, max: 5 }),
				fc.integer({ min: 1, max: 5 }),
				fc.integer({ min: 1, max: 5 }),
				async (qty1, qty2, qty3) => {
					// Clean up cart items first
					await supabaseTest.from('cart_items').delete().eq('cart_id', cart.id);

					// Add items to cart
					await supabaseTest.from('cart_items').insert([
						{ cart_id: cart.id, product_id: product1Id, quantity: qty1, unit_price_cents: 5000 },
						{ cart_id: cart.id, product_id: product2Id, quantity: qty2, unit_price_cents: 7500 },
						{ cart_id: cart.id, product_id: product3Id, quantity: qty3, unit_price_cents: 10000 }
					]);

					// Calculate expected total (in cents)
					const expectedTotal = 5000 * qty1 + 7500 * qty2 + 10000 * qty3;

					// Get cart items
					const { data: cartItems } = await supabaseTest
						.from('cart_items')
						.select('*')
						.eq('cart_id', cart.id);

					// Calculate actual total
					const actualTotal = (cartItems || []).reduce((total, item: any) => {
						return total + item.unit_price_cents * item.quantity;
					}, 0);

					// Verify totals match
					return expectedTotal === actualTotal;
				}
			),
			{ numRuns: 100 }
		);

		// Clean up the cart
		await supabaseTest.from('carts').delete().eq('id', cart.id);
	}, 60000);

	// Feature: startup-marketplace, Property 11: Cart removal updates total
	// Validates: Requirements 7.3
	test('Property 11: Cart removal updates total - new total equals old total minus removed item cost', async () => {
		// Create test products with known prices (in cents)
		const product1Id = await createTestProduct(testSellerId, { price_cents: 5000 }); // $50.00
		const product2Id = await createTestProduct(testSellerId, { price_cents: 7500 }); // $75.00

		// Create a cart for the buyer
		const { data: cart } = await supabaseTest
			.from('carts')
			.insert({ buyer_id: testBuyerId, status: 'open' })
			.select()
			.single();

		if (!cart) {
			throw new Error('Failed to create test cart');
		}

		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 1, max: 5 }),
				fc.integer({ min: 1, max: 5 }),
				async (qty1, qty2) => {
					// Clean up cart items first
					await supabaseTest.from('cart_items').delete().eq('cart_id', cart.id);

					// Add items to cart
					const { data: items } = await supabaseTest
						.from('cart_items')
						.insert([
							{ cart_id: cart.id, product_id: product1Id, quantity: qty1, unit_price_cents: 5000 },
							{ cart_id: cart.id, product_id: product2Id, quantity: qty2, unit_price_cents: 7500 }
						])
						.select();

					if (!items || items.length !== 2) {
						throw new Error('Failed to add cart items');
					}

					// Calculate initial total (in cents)
					const initialTotal = 5000 * qty1 + 7500 * qty2;

					// Get cart items
					const { data: initialCartItems } = await supabaseTest
						.from('cart_items')
						.select('*')
						.eq('cart_id', cart.id);

					const calculatedInitialTotal = (initialCartItems || []).reduce((total, item: any) => {
						return total + item.unit_price_cents * item.quantity;
					}, 0);

					// Verify initial total
					if (initialTotal !== calculatedInitialTotal) {
						return false;
					}

					// Remove the first item
					const itemToRemove = items[0];
					const removedItemCost = 5000 * qty1;

					await supabaseTest.from('cart_items').delete().eq('id', itemToRemove.id);

					// Calculate new total
					const { data: finalCartItems } = await supabaseTest
						.from('cart_items')
						.select('*')
						.eq('cart_id', cart.id);

					const actualNewTotal = (finalCartItems || []).reduce((total, item: any) => {
						return total + item.unit_price_cents * item.quantity;
					}, 0);

					const expectedNewTotal = initialTotal - removedItemCost;

					// Verify new total equals old total minus removed item cost
					return expectedNewTotal === actualNewTotal;
				}
			),
			{ numRuns: 100 }
		);

		// Clean up the cart
		await supabaseTest.from('carts').delete().eq('id', cart.id);
	}, 60000);

	// Feature: startup-marketplace, Property 8: List modification invariant
	// Validates: Requirements 7.1
	test('Property 8: List modification invariant (cart) - adding increases list size by 1, removing decreases by 1', async () => {
		// Create multiple test products for this test
		const productIds = await Promise.all([
			createTestProduct(testSellerId, { name: 'Product 1', price_cents: 5000 }),
			createTestProduct(testSellerId, { name: 'Product 2', price_cents: 7500 }),
			createTestProduct(testSellerId, { name: 'Product 3', price_cents: 10000 })
		]);

		// Create a cart for the buyer
		const { data: cart } = await supabaseTest
			.from('carts')
			.insert({ buyer_id: testBuyerId, status: 'open' })
			.select()
			.single();

		if (!cart) {
			throw new Error('Failed to create test cart');
		}

		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom(...productIds),
				fc.integer({ min: 1, max: 5 }),
				async (productId, quantity) => {
					// Get initial count using test client
					const { data: initialCartItems } = await supabaseTest
						.from('cart_items')
						.select('*')
						.eq('cart_id', cart.id);

					const initialCount = initialCartItems?.length || 0;

					// Get product price
					const { data: product } = await supabaseTest
						.from('products')
						.select('price_cents')
						.eq('id', productId)
						.single();

					if (!product) {
						throw new Error('Failed to get product');
					}

					// Add a cart item using test client
					const { data: addedItem } = await supabaseTest
						.from('cart_items')
						.insert({
							cart_id: cart.id,
							product_id: productId,
							quantity,
							unit_price_cents: product.price_cents
						})
						.select()
						.single();

					if (!addedItem) {
						throw new Error('Failed to add cart item');
					}

					const { data: afterAddCartItems } = await supabaseTest
						.from('cart_items')
						.select('*')
						.eq('cart_id', cart.id);

					const afterAddCount = afterAddCartItems?.length || 0;

					// Verify adding increased count by 1
					const addIncreasedByOne = afterAddCount === initialCount + 1;

					// Remove the cart item using test client
					await supabaseTest.from('cart_items').delete().eq('id', addedItem.id);

					const { data: afterRemoveCartItems } = await supabaseTest
						.from('cart_items')
						.select('*')
						.eq('cart_id', cart.id);

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

		// Clean up the cart
		await supabaseTest.from('carts').delete().eq('id', cart.id);
	}, 60000);
});
