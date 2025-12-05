import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { orderService } from './orders';
import { cartService } from './cart';
import { supabaseTest } from '$lib/test-utils/supabase-test';

describe('OrderService Property Tests', () => {
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

		// Update buyer profile
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

		// Update seller profile
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

	// Feature: startup-marketplace, Property 12: Checkout creates order
	// For any cart at checkout, completing the checkout should create an order containing all cart items with matching product IDs, quantities, and prices.
	it('Property 12: Checkout creates order - order contains all cart items with matching data', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.array(
					fc.record({
						name: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
						short_description: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10),
						price_cents: fc.integer({ min: 100, max: 100000 }),
						quantity: fc.integer({ min: 1, max: 10 })
					}),
					{ minLength: 1, maxLength: 5 }
				),
				async (cartItemsData) => {
					// Create products for cart items
					const productsToCreate = cartItemsData.map((item) => ({
						name: item.name,
						short_description: item.short_description,
						price_cents: item.price_cents,
						seller_id: testSellerId
					}));

					const { data: products, error: productsError} = await supabaseTest
						.from('products')
						.insert(productsToCreate)
						.select();

					if (productsError) {
						console.error('Failed to create products:', productsError);
						throw productsError;
					}
					testProductIds.push(...products.map((p) => p.id));

					// Add items to cart
					for (let i = 0; i < products.length; i++) {
						try {
							await cartService.addItem(testBuyerId, products[i].id, cartItemsData[i].quantity);
						} catch (error) {
							console.error('Failed to add item to cart:', error);
							throw error;
						}
					}

					// Get cart items
					const cartItems = await cartService.getItems(testBuyerId);

					// Create order from cart
					let order;
					try {
						order = await orderService.create(testBuyerId, cartItems);
					} catch (error) {
						console.error('Failed to create order:', error);
						console.error('Cart items:', cartItems);
						throw error;
					}

					// Verify order was created
					expect(order).toBeDefined();
					expect(order.buyer_id).toBe(testBuyerId);
					expect(order.demo).toBe(true);
					expect(order.status).toBe('completed');

					// Get order with items
					const orderWithItems = await orderService.getById(order.id);
					expect(orderWithItems).not.toBeNull();

					if (!orderWithItems) return false;

					// Verify all cart items are in the order
					expect(orderWithItems.items.length).toBe(cartItems.length);

					// Verify each cart item matches corresponding order item
					for (const cartItem of cartItems) {
						const orderItem = orderWithItems.items.find(
							(oi) => oi.product_id === cartItem.product_id
						);

						expect(orderItem).toBeDefined();
						if (!orderItem) return false;

						// Verify product ID matches
						expect(orderItem.product_id).toBe(cartItem.product_id);

						// Verify quantity matches
						expect(orderItem.quantity).toBe(cartItem.quantity);

						// Verify unit price matches
						expect(orderItem.unit_price_cents).toBe(cartItem.unit_price_cents);

						// Verify subtotal is correct
						expect(orderItem.subtotal_cents).toBe(
							cartItem.unit_price_cents * cartItem.quantity
						);
					}

					// Verify total is correct
					const expectedTotal = cartItems.reduce(
						(sum, item) => sum + item.unit_price_cents * item.quantity,
						0
					);
					expect(orderWithItems.demo_total_cents).toBe(expectedTotal);

					// Verify cart was cleared
					const cartAfterCheckout = await cartService.getItems(testBuyerId);
					expect(cartAfterCheckout.length).toBe(0);

					return true;
				}
			),
			{ numRuns: 100 }
		);
	});
});
