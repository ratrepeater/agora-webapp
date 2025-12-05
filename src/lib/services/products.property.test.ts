import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { productService } from './products';
import { supabaseTest } from '$lib/test-utils/supabase-test';
import { seedCategories } from '$lib/test-utils/seed-categories';
import type { TablesInsert } from '$lib/helpers/database.types';

/**
 * Property-based tests for ProductService
 * These tests verify universal properties that should hold across all inputs
 */

// Test data generators
const productCategoryGenerator = () => fc.constantFrom('hr', 'legal', 'marketing', 'devtools');

const productGenerator = (sellerId: string): fc.Arbitrary<TablesInsert<'products'>> => {
	return fc.record({
		name: fc.string({ minLength: 1, maxLength: 100 }),
		short_description: fc.string({ minLength: 10, maxLength: 200 }),
		long_description: fc.oneof(
			fc.string({ minLength: 50, maxLength: 2000 }),
			fc.constant(null)
		),
		price_cents: fc.integer({ min: 1, max: 1000000 }),
		seller_id: fc.constant(sellerId), // Use the actual test seller ID
		category_id: fc.constant(null), // Will be set based on category
		logo_url: fc.oneof(
			fc.webUrl(),
			fc.constant(null)
		),
		demo_visual_url: fc.oneof(
			fc.webUrl(),
			fc.constant(null)
		),
		is_featured: fc.boolean(),
		is_bundle: fc.constant(false),
		status: fc.constant('published'), // Always use published for round-trip tests
		bundle_pricing_mode: fc.constant('fixed')
	});
};

// Helper to create a test seller profile via Supabase Auth
async function ensureTestSeller() {
	const testEmail = 'testseller@test.com';
	const testPassword = 'TestPassword123!';
	
	// Check if test seller profile exists
	const { data: profiles } = await supabaseTest
		.from('profiles')
		.select('id')
		.eq('full_name', 'Test Seller')
		.limit(1);
	
	if (profiles && profiles.length > 0) {
		// Seller already exists, return the ID
		return profiles[0].id;
	}
	
	// Create auth user using admin API (bypasses email confirmation)
	const { data: authData, error: authError } = await supabaseTest.auth.admin.createUser({
		email: testEmail,
		password: testPassword,
		email_confirm: true, // Auto-confirm email
		user_metadata: {
			full_name: 'Test Seller'
		}
	});
	
	if (authError) {
		// User might already exist, try to get their ID from auth.users
		const { data: existingUser, error: getUserError } = await supabaseTest.auth.admin.listUsers();
		
		if (existingUser && existingUser.users) {
			const testUser = existingUser.users.find(u => u.email === testEmail);
			if (testUser) {
				// Update the profile to be a seller
				await supabaseTest
					.from('profiles')
					.update({ role_seller: true, role_buyer: false, full_name: 'Test Seller' })
					.eq('id', testUser.id);
				
				return testUser.id;
			}
		}
		
		throw new Error(`Failed to create test seller: ${authError.message}`);
	}
	
	if (!authData.user) {
		throw new Error('Failed to create test user - no user returned');
	}
	
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
	await supabaseTest
		.from('products')
		.delete()
		.eq('seller_id', sellerId);
}

describe('ProductService Property-Based Tests', () => {
	let testSellerId: string;

	beforeAll(async () => {
		await seedCategories();
		testSellerId = await ensureTestSeller();
	});

	afterEach(async () => {
		await cleanupTestProducts(testSellerId);
	});

	// Feature: startup-marketplace, Property 44: Product data round-trip
	// Validates: Requirements 21.1
	test('Property 44: Product data round-trip - storing then retrieving product returns equivalent data', async () => {
		await fc.assert(
			fc.asyncProperty(
				productGenerator(testSellerId),
				productCategoryGenerator(),
				async (productData, category) => {
					// Get category ID and set it on the product
					const categoryId = await getCategoryId(category);
					const productWithCategory = {
						...productData,
						category_id: categoryId
					};

					// Create the product using test client (bypasses RLS)
					const { data: created, error: createError } = await supabaseTest
						.from('products')
						.insert(productWithCategory)
						.select()
						.single();

					if (createError || !created) {
						throw new Error(`Failed to create product: ${createError?.message}`);
					}

					// Retrieve the product using the regular service
					const retrieved = await productService.getById(created.id);

					// Verify the product was retrieved
					expect(retrieved).not.toBeNull();
					if (!retrieved) return false;

					// Verify core fields match
					const fieldsMatch =
						retrieved.name === created.name &&
						retrieved.short_description === created.short_description &&
						retrieved.long_description === created.long_description &&
						retrieved.price_cents === created.price_cents &&
						retrieved.seller_id === created.seller_id &&
						retrieved.category_id === created.category_id &&
						retrieved.logo_url === created.logo_url &&
						retrieved.demo_visual_url === created.demo_visual_url &&
						retrieved.is_featured === created.is_featured &&
						retrieved.is_bundle === created.is_bundle &&
						retrieved.status === created.status;

					// Verify rating fields are present (even if 0)
					const hasRatingFields =
						typeof retrieved.average_rating === 'number' &&
						typeof retrieved.review_count === 'number';

					return fieldsMatch && hasRatingFields;
				}
			),
			{ numRuns: 100 }
		);
	}, 60000); // 60 second timeout for property test

	// Feature: startup-marketplace, Property 2: Category filtering correctness
	// Validates: Requirements 2.2
	test('Property 2: Category filtering correctness - all returned products match the selected category', async () => {
		// First, create some test products in different categories
		const categories = ['hr', 'legal', 'marketing', 'devtools'];
		const productsPerCategory = 3;
		
		for (const category of categories) {
			const categoryId = await getCategoryId(category);
			for (let i = 0; i < productsPerCategory; i++) {
				await supabaseTest.from('products').insert({
					name: `Test Product ${category} ${i}`,
					short_description: `Test description for ${category}`,
					price_cents: 1000,
					seller_id: testSellerId,
					category_id: categoryId,
					status: 'published'
				});
			}
		}

		// Test that filtering by each category returns only products from that category
		await fc.assert(
			fc.asyncProperty(
				productCategoryGenerator(),
				async (category) => {
					const products = await productService.getByCategory(category as any);
					const categoryId = await getCategoryId(category);
					
					// All products should have the correct category_id
					return products.every(p => p.category_id === categoryId);
				}
			),
			{ numRuns: 20 } // Fewer runs since we're testing with fixed data
		);
	}, 30000);

	// Feature: startup-marketplace, Property 3: Search result relevance
	// Validates: Requirements 3.1
	test('Property 3: Search result relevance - all search results match the query', async () => {
		// Create test products with known searchable content
		const testProducts = [
			{ name: 'HR Management System', short_description: 'Manage your human resources', keywords: ['hr', 'management', 'human'] },
			{ name: 'Legal Document Tool', short_description: 'Handle legal documents easily', keywords: ['legal', 'document', 'tool'] },
			{ name: 'Marketing Analytics', short_description: 'Track your marketing campaigns', keywords: ['marketing', 'analytics', 'campaigns'] }
		];

		const categoryId = await getCategoryId('hr');
		for (const product of testProducts) {
			await supabaseTest.from('products').insert({
				name: product.name,
				short_description: product.short_description,
				long_description: `Extended description with keywords: ${product.keywords.join(', ')}`,
				price_cents: 1000,
				seller_id: testSellerId,
				category_id: categoryId,
				status: 'published'
			});
		}

		// Test that search results contain the query term
		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom('HR', 'Legal', 'Marketing', 'management', 'document', 'analytics'),
				async (searchQuery) => {
					const results = await productService.search(searchQuery);
					
					// All results should contain the search query in name, short_description, or long_description
					return results.every(p => {
						const searchLower = searchQuery.toLowerCase();
						const nameLower = p.name.toLowerCase();
						const shortDescLower = p.short_description.toLowerCase();
						const longDescLower = (p.long_description || '').toLowerCase();
						
						return nameLower.includes(searchLower) || 
						       shortDescLower.includes(searchLower) || 
						       longDescLower.includes(searchLower);
					});
				}
			),
			{ numRuns: 20 }
		);
	}, 30000);

	// Feature: startup-marketplace, Property 4: Combined filter correctness
	// Validates: Requirements 3.2
	test('Property 4: Combined filter correctness - results satisfy both search and filter criteria', async () => {
		// Create test products with various attributes
		const hrCategoryId = await getCategoryId('hr');
		const legalCategoryId = await getCategoryId('legal');
		
		await supabaseTest.from('products').insert([
			{ name: 'HR Tool A', short_description: 'HR management', price_cents: 5000, seller_id: testSellerId, category_id: hrCategoryId, status: 'published', is_featured: true },
			{ name: 'HR Tool B', short_description: 'HR analytics', price_cents: 15000, seller_id: testSellerId, category_id: hrCategoryId, status: 'published', is_featured: false },
			{ name: 'Legal Tool A', short_description: 'Legal management', price_cents: 8000, seller_id: testSellerId, category_id: legalCategoryId, status: 'published', is_featured: true },
			{ name: 'Legal Tool B', short_description: 'Legal analytics', price_cents: 12000, seller_id: testSellerId, category_id: legalCategoryId, status: 'published', is_featured: false }
		]);

		// Test combined search + category filter
		const results = await productService.search('management', { category: 'hr' as any });
		
		// All results should match both the search query AND the category filter
		const allMatchSearch = results.every(p => 
			p.name.toLowerCase().includes('management') || 
			p.short_description.toLowerCase().includes('management')
		);
		const allMatchCategory = results.every(p => p.category_id === hrCategoryId);
		
		expect(allMatchSearch).toBe(true);
		expect(allMatchCategory).toBe(true);
	}, 30000);
});
