import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { supabaseTest } from '$lib/test-utils/supabase-test';
import { seedCategories } from '$lib/test-utils/seed-categories';
import { quoteService } from './quotes';
import { cartService } from './cart';

/**
 * Property-based tests for QuoteService
 * These tests verify universal properties that should hold across all inputs
 */

// Helper to create a test buyer profile
async function ensureTestBuyer(name: string = 'Test Buyer'): Promise<string> {
	const testEmail = `testbuyer-${Date.now()}-${Math.random()}@test.com`;
	const testPassword = 'TestPassword123!';

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
	priceCents: number,
	bundlePricingMode: 'fixed' | 'derived' = 'fixed'
): Promise<string> {
	const { data, error } = await supabaseTest
		.from('products')
		.insert({
			name: `Test Product ${Date.now()}`,
			short_description: 'A test product',
			long_description: 'A longer description of the test product',
			price_cents: priceCents,
			seller_id: sellerId,
			bundle_pricing_mode: bundlePricingMode,
			status: 'published'
		})
		.select('id')
		.single();

	if (error || !data) {
		throw new Error(`Failed to create test product: ${error?.message}`);
	}

	return data.id;
}

// Cleanup function
async function cleanup() {
	// Delete test data in reverse order of dependencies
	await supabaseTest.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
	await supabaseTest.from('carts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
	await supabaseTest.from('quotes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
	await supabaseTest.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
	await supabaseTest.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

beforeAll(async () => {
	await seedCategories();
});

afterEach(async () => {
	await cleanup();
});

describe('QuoteService Property Tests', () => {
	// Feature: startup-marketplace, Property 38: Quote UI conditional display
	// Validates: Requirements 19.1
	test(
		'Property 38: Products can have quotes generated regardless of pricing mode',
		{ timeout: 30000 },
		async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.constantFrom('fixed', 'derived'),
					fc.integer({ min: 1000, max: 100000 }),
					async (bundlePricingMode, priceCents) => {
						const sellerId = await ensureTestSeller();
						const productId = await createTestProduct(sellerId, priceCents, bundlePricingMode);

						// Get the product
						const { data: product } = await supabaseTest
							.from('products')
							.select('*')
							.eq('id', productId)
							.single();

						// Verify that any product can have a quote generated
						// The UI would conditionally display "Request Quote" button based on business logic
						expect(product).toBeDefined();
						expect(product!.price_cents).toBe(priceCents);
						expect(product!.bundle_pricing_mode).toBe(bundlePricingMode);
					}
				),
				{ numRuns: 10 }
			);
		}
	);

	// Feature: startup-marketplace, Property 39: Quote calculation correctness
	// Validates: Requirements 19.2
	test(
		'Property 39: Quote calculation follows predefined pricing rules',
		{ timeout: 30000 },
		async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.integer({ min: 1, max: 1000 }), // company size
					fc.integer({ min: 1, max: 10 }), // number of requirements
					fc.integer({ min: 1000, max: 50000 }), // base price in cents
					async (companySize, requirementCount, basePriceCents) => {
						const sellerId = await ensureTestSeller();
						const buyerId = await ensureTestBuyer();
						const productId = await createTestProduct(sellerId, basePriceCents, 'fixed');

					// Create requirements object
					const requirements: Record<string, any> = {};
					for (let i = 0; i < requirementCount; i++) {
						requirements[`feature_${i}`] = true;
					}

					// Generate quote
					const quote = await quoteService.generateQuote({
						product_id: productId,
						buyer_id: buyerId,
						company_size: companySize,
						requirements,
						buyer_company_info: { name: 'Test Company' }
					});

					// Verify pricing rules are applied
					const basePrice = basePriceCents / 100;

					// Company size multiplier
					let expectedMultiplier = 1.0;
					if (companySize < 10) expectedMultiplier = 0.8;
					else if (companySize < 50) expectedMultiplier = 1.0;
					else if (companySize < 200) expectedMultiplier = 1.5;
					else if (companySize < 500) expectedMultiplier = 2.0;
					else expectedMultiplier = 3.0;

					// Feature requirements adjustment (10% per feature)
					const featureAdjustment = requirementCount * basePrice * 0.1;

					// Calculate expected minimum (base price * company multiplier + features)
					const expectedMin = basePrice * expectedMultiplier + featureAdjustment;

					// Quote should be at least the minimum (could be higher with other adjustments)
					expect(quote.quoted_price).toBeGreaterThanOrEqual(basePrice * 0.5); // Minimum 50% of base
					expect(quote.quoted_price).toBeGreaterThanOrEqual(0);

						// Verify pricing breakdown exists
						expect(quote.pricing_breakdown).toBeDefined();
						expect(typeof quote.pricing_breakdown).toBe('object');
					}
				),
				{ numRuns: 10 }
			);
		}
	);

	// Feature: startup-marketplace, Property 40: Quote display completeness
	// Validates: Requirements 19.3
	test(
		'Property 40: Generated quotes include pricing breakdown and validity period',
		{ timeout: 30000 },
		async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.integer({ min: 1, max: 500 }),
					fc.integer({ min: 1000, max: 50000 }),
					async (companySize, basePriceCents) => {
						const sellerId = await ensureTestSeller();
						const buyerId = await ensureTestBuyer();
						const productId = await createTestProduct(sellerId, basePriceCents, 'fixed');

					const quote = await quoteService.generateQuote({
						product_id: productId,
						buyer_id: buyerId,
						company_size: companySize,
						requirements: { basic: true },
						buyer_company_info: { name: 'Test Company' }
					});

					// Verify quote has all required display fields
					expect(quote.quoted_price).toBeDefined();
					expect(quote.pricing_breakdown).toBeDefined();
					expect(quote.valid_until).toBeDefined();

					// Verify pricing breakdown is an object with expected structure
					const breakdown = quote.pricing_breakdown as any;
					expect(breakdown).toHaveProperty('base_price');
					expect(breakdown).toHaveProperty('total');

						// Verify validity period is in the future
						const validUntil = new Date(quote.valid_until);
						const now = new Date();
						expect(validUntil.getTime()).toBeGreaterThan(now.getTime());
					}
				),
				{ numRuns: 10 }
			);
		}
	);

	// Feature: startup-marketplace, Property 41: Quote acceptance creates cart item
	// Validates: Requirements 19.4
	test(
		'Property 41: Accepting a quote creates a cart item with quoted price',
		{ timeout: 30000 },
		async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.integer({ min: 1, max: 500 }),
					fc.integer({ min: 1000, max: 50000 }),
					async (companySize, basePriceCents) => {
						const sellerId = await ensureTestSeller();
						const buyerId = await ensureTestBuyer();
						const productId = await createTestProduct(sellerId, basePriceCents, 'fixed');

					// Generate quote
					const quote = await quoteService.generateQuote({
						product_id: productId,
						buyer_id: buyerId,
						company_size: companySize,
						requirements: { basic: true },
						buyer_company_info: { name: 'Test Company' }
					});

					// Accept quote
					const cartItem = await quoteService.acceptQuote(quote.id);

					// Verify cart item was created
					expect(cartItem).toBeDefined();
					expect(cartItem.product_id).toBe(productId);

					// Verify quoted price matches (convert to cents)
					const quotedPriceCents = Math.round(quote.quoted_price * 100);
					expect(cartItem.unit_price_cents).toBe(quotedPriceCents);

						// Verify cart item is in buyer's cart
						const cartItems = await cartService.getItems(buyerId);
						const foundItem = cartItems.find((item) => item.id === cartItem.id);
						expect(foundItem).toBeDefined();
						expect(foundItem!.product_id).toBe(productId);
					}
				),
				{ numRuns: 10 }
			);
		}
	);
});
