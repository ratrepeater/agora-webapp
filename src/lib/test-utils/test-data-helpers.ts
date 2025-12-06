import { supabaseTest } from './supabase-test';
import type { TablesInsert } from '$lib/helpers/database.types';

/**
 * Test data setup utilities for property-based tests
 * These helpers create and clean up test data with proper foreign key relationships
 * All operations use the service role key to bypass RLS
 */

// Track created test data for cleanup
const testDataRegistry = {
	users: new Set<string>(),
	products: new Set<string>(),
	categories: new Map<string, string>() // key -> id mapping
};

/**
 * Create a test buyer profile with proper auth user
 * @param name Optional name for the buyer (default: 'Test Buyer')
 * @returns The buyer's user ID
 */
export async function createTestBuyer(name: string = 'Test Buyer'): Promise<string> {
	const testEmail = `testbuyer-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
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

	// Register for cleanup
	testDataRegistry.users.add(authData.user.id);

	return authData.user.id;
}

/**
 * Create a test seller profile with proper auth user
 * @param name Optional name for the seller (default: 'Test Seller')
 * @returns The seller's user ID
 */
export async function createTestSeller(name: string = 'Test Seller'): Promise<string> {
	const testEmail = `testseller-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
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
		throw new Error(`Failed to create test seller: ${authError?.message}`);
	}

	// Update the profile to be a seller
	await supabaseTest
		.from('profiles')
		.update({ role_seller: true, role_buyer: false, full_name: name })
		.eq('id', authData.user.id);

	// Register for cleanup
	testDataRegistry.users.add(authData.user.id);

	return authData.user.id;
}

/**
 * Get or cache a category ID by key
 * @param categoryKey The category key (e.g., 'hr', 'legal', 'marketing', 'devtools')
 * @returns The category ID
 */
export async function getCategoryId(categoryKey: string): Promise<string> {
	// Check cache first
	if (testDataRegistry.categories.has(categoryKey)) {
		return testDataRegistry.categories.get(categoryKey)!;
	}

	// Fetch from database
	const { data, error } = await supabaseTest
		.from('categories')
		.select('id')
		.eq('key', categoryKey)
		.single();

	if (error || !data) {
		throw new Error(`Failed to get category ID for ${categoryKey}: ${error?.message}`);
	}

	// Cache for future use
	testDataRegistry.categories.set(categoryKey, data.id);

	return data.id;
}

/**
 * Create a test product with valid seller reference
 * @param sellerId The seller's user ID
 * @param overrides Optional product data overrides
 * @returns The created product ID
 */
export async function createTestProduct(
	sellerId: string,
	overrides: Partial<TablesInsert<'products'>> = {}
): Promise<string> {
	// Get default category if not provided
	const categoryId = overrides.category_id || (await getCategoryId('hr'));

	const productData: TablesInsert<'products'> = {
		name: `Test Product ${Date.now()}`,
		short_description: 'Test product description for testing purposes',
		long_description: 'Extended test product description with more details for comprehensive testing',
		price_cents: 10000, // $100.00
		seller_id: sellerId,
		category_id: categoryId,
		status: 'published',
		is_featured: false,
		is_bundle: false,
		bundle_pricing_mode: 'fixed',
		...overrides
	};

	const { data, error } = await supabaseTest
		.from('products')
		.insert(productData)
		.select()
		.single();

	if (error || !data) {
		throw new Error(`Failed to create test product: ${error?.message}`);
	}

	// Register for cleanup
	testDataRegistry.products.add(data.id);

	return data.id;
}

/**
 * Create multiple test products at once
 * @param sellerId The seller's user ID
 * @param count Number of products to create
 * @param overrides Optional product data overrides (applied to all products)
 * @returns Array of created product IDs
 */
export async function createTestProducts(
	sellerId: string,
	count: number,
	overrides: Partial<TablesInsert<'products'>> = {}
): Promise<string[]> {
	const productIds: string[] = [];

	for (let i = 0; i < count; i++) {
		const productId = await createTestProduct(sellerId, {
			...overrides,
			name: `Test Product ${i + 1} ${Date.now()}`
		});
		productIds.push(productId);
	}

	return productIds;
}

/**
 * Clean up a specific test user and all their related data
 * @param userId The user ID to clean up
 */
export async function cleanupTestUser(userId: string): Promise<void> {
	// Delete related data first (foreign key constraints)
	// Products (if seller)
	await supabaseTest.from('products').delete().eq('seller_id', userId);

	// Bookmarks (if buyer)
	await supabaseTest.from('bookmarks').delete().eq('buyer_id', userId);

	// Cart items (if buyer)
	await supabaseTest.from('cart_items').delete().eq('buyer_id', userId);

	// Reviews (if buyer)
	await supabaseTest.from('reviews').delete().eq('buyer_id', userId);

	// Orders (if buyer)
	await supabaseTest.from('orders').delete().eq('buyer_id', userId);

	// Buyer product usage (if buyer)
	await supabaseTest.from('buyer_product_usage').delete().eq('buyer_id', userId);

	// Quotes (as buyer or seller)
	await supabaseTest.from('quotes').delete().eq('buyer_id', userId);
	await supabaseTest.from('quotes').delete().eq('seller_id', userId);

	// Product downloads (if buyer)
	await supabaseTest.from('product_downloads').delete().eq('buyer_id', userId);

	// Delete the auth user (this will cascade to profile)
	await supabaseTest.auth.admin.deleteUser(userId);

	// Remove from registry
	testDataRegistry.users.delete(userId);
}

/**
 * Clean up a specific test product and all its related data
 * @param productId The product ID to clean up
 */
export async function cleanupTestProduct(productId: string): Promise<void> {
	// Delete related data first (foreign key constraints)
	await supabaseTest.from('bookmarks').delete().eq('product_id', productId);
	await supabaseTest.from('cart_items').delete().eq('product_id', productId);
	await supabaseTest.from('reviews').delete().eq('product_id', productId);
	await supabaseTest.from('order_items').delete().eq('product_id', productId);
	await supabaseTest.from('product_features').delete().eq('product_id', productId);
	await supabaseTest.from('product_scores').delete().eq('product_id', productId);
	await supabaseTest.from('product_analytics').delete().eq('product_id', productId);
	await supabaseTest.from('buyer_product_usage').delete().eq('product_id', productId);
	await supabaseTest.from('product_downloads').delete().eq('product_id', productId);
	await supabaseTest.from('competitor_relationships').delete().eq('product_id', productId);
	await supabaseTest.from('competitor_relationships').delete().eq('competitor_product_id', productId);
	await supabaseTest.from('bundle_products').delete().eq('product_id', productId);

	// Delete the product
	await supabaseTest.from('products').delete().eq('id', productId);

	// Remove from registry
	testDataRegistry.products.delete(productId);
}

/**
 * Clean up all test data created during the test session
 * This should be called in afterAll or afterEach hooks
 */
export async function cleanupAllTestData(): Promise<void> {
	// Clean up products first (they reference users)
	for (const productId of testDataRegistry.products) {
		await cleanupTestProduct(productId);
	}
	testDataRegistry.products.clear();

	// Clean up users
	for (const userId of testDataRegistry.users) {
		await cleanupTestUser(userId);
	}
	testDataRegistry.users.clear();

	// Clear category cache
	testDataRegistry.categories.clear();
}

/**
 * Clean up test data for a specific buyer
 * Removes bookmarks, cart items, orders, reviews, etc.
 * Does NOT delete the buyer profile itself
 * @param buyerId The buyer's user ID
 */
export async function cleanupBuyerData(buyerId: string): Promise<void> {
	await supabaseTest.from('bookmarks').delete().eq('buyer_id', buyerId);
	await supabaseTest.from('reviews').delete().eq('buyer_id', buyerId);
	await supabaseTest.from('buyer_product_usage').delete().eq('buyer_id', buyerId);
	await supabaseTest.from('quotes').delete().eq('buyer_id', buyerId);
	await supabaseTest.from('product_downloads').delete().eq('buyer_id', buyerId);

	// Delete carts and their items
	const { data: carts } = await supabaseTest
		.from('carts')
		.select('id')
		.eq('buyer_id', buyerId);

	if (carts && carts.length > 0) {
		const cartIds = carts.map(c => c.id);
		await supabaseTest.from('cart_items').delete().in('cart_id', cartIds);
	}

	await supabaseTest.from('carts').delete().eq('buyer_id', buyerId);

	// Delete orders and their items
	const { data: orders } = await supabaseTest
		.from('orders')
		.select('id')
		.eq('buyer_id', buyerId);

	if (orders && orders.length > 0) {
		const orderIds = orders.map(o => o.id);
		await supabaseTest.from('order_items').delete().in('order_id', orderIds);
	}

	await supabaseTest.from('orders').delete().eq('buyer_id', buyerId);
}

/**
 * Clean up test data for a specific seller
 * Removes products and related data
 * Does NOT delete the seller profile itself
 * @param sellerId The seller's user ID
 */
export async function cleanupSellerData(sellerId: string): Promise<void> {
	// Get all products for this seller
	const { data: products } = await supabaseTest
		.from('products')
		.select('id')
		.eq('seller_id', sellerId);

	if (products && products.length > 0) {
		const productIds = products.map(p => p.id);
		
		// Batch delete related data for all products
		await supabaseTest.from('bookmarks').delete().in('product_id', productIds);
		await supabaseTest.from('cart_items').delete().in('product_id', productIds);
		await supabaseTest.from('reviews').delete().in('product_id', productIds);
		await supabaseTest.from('order_items').delete().in('product_id', productIds);
		await supabaseTest.from('product_features').delete().in('product_id', productIds);
		await supabaseTest.from('product_scores').delete().in('product_id', productIds);
		await supabaseTest.from('product_analytics').delete().in('product_id', productIds);
		await supabaseTest.from('buyer_product_usage').delete().in('product_id', productIds);
		await supabaseTest.from('product_downloads').delete().in('product_id', productIds);
		await supabaseTest.from('competitor_relationships').delete().in('product_id', productIds);
		await supabaseTest.from('competitor_relationships').delete().in('competitor_product_id', productIds);
		await supabaseTest.from('bundle_products').delete().in('product_id', productIds);
		
		// Delete all products at once
		await supabaseTest.from('products').delete().in('id', productIds);
		
		// Remove from registry
		productIds.forEach(id => testDataRegistry.products.delete(id));
	}

	// Clean up quotes where seller is involved
	await supabaseTest.from('quotes').delete().eq('seller_id', sellerId);
}

/**
 * Create a complete test scenario with buyer, seller, and products
 * Useful for tests that need a full setup
 * @param options Configuration options
 * @returns Object containing all created IDs
 */
export async function createTestScenario(options: {
	buyerName?: string;
	sellerName?: string;
	productCount?: number;
	productOverrides?: Partial<TablesInsert<'products'>>;
} = {}): Promise<{
	buyerId: string;
	sellerId: string;
	productIds: string[];
}> {
	const buyerId = await createTestBuyer(options.buyerName);
	const sellerId = await createTestSeller(options.sellerName);
	const productIds = await createTestProducts(
		sellerId,
		options.productCount || 1,
		options.productOverrides
	);

	return { buyerId, sellerId, productIds };
}

/**
 * Get the test data registry (for debugging)
 * @returns The current test data registry
 */
export function getTestDataRegistry() {
	return {
		users: Array.from(testDataRegistry.users),
		products: Array.from(testDataRegistry.products),
		categories: Object.fromEntries(testDataRegistry.categories)
	};
}


/**
 * Create a test cart for a buyer
 * @param buyerId The buyer's user ID
 * @returns The created cart ID
 */
export async function createTestCart(buyerId: string): Promise<string> {
	const { data, error } = await supabaseTest
		.from('carts')
		.insert({
			buyer_id: buyerId,
			status: 'open'
		})
		.select()
		.single();

	if (error || !data) {
		throw new Error(`Failed to create test cart: ${error?.message}`);
	}

	return data.id;
}

/**
 * Add an item to a test cart
 * @param cartId The cart ID
 * @param productId The product ID
 * @param quantity The quantity
 * @returns The created cart item ID
 */
export async function addTestCartItem(
	cartId: string,
	productId: string,
	quantity: number = 1
): Promise<string> {
	// Get product price
	const { data: product } = await supabaseTest
		.from('products')
		.select('price_cents')
		.eq('id', productId)
		.single();

	if (!product) {
		throw new Error('Failed to get product for cart item');
	}

	const { data, error } = await supabaseTest
		.from('cart_items')
		.insert({
			cart_id: cartId,
			product_id: productId,
			quantity,
			unit_price_cents: product.price_cents
		})
		.select()
		.single();

	if (error || !data) {
		throw new Error(`Failed to add cart item: ${error?.message}`);
	}

	return data.id;
}
