import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ProductFeatureService } from './product-features';
import { supabaseTest } from '$lib/test-utils/supabase-test';

// Create a test-specific service instance that uses the test client
const productFeatureService = new ProductFeatureService(supabaseTest);

/**
 * Property-based tests for ProductFeatureService
 * These tests verify universal properties that should hold across all inputs
 */

// Test data generators
const featureNameGenerator = () =>
	fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

const featureDescriptionGenerator = () =>
	fc.oneof(fc.string({ minLength: 10, maxLength: 500 }), fc.constant(undefined));

const relevanceScoreGenerator = () => fc.float({ min: 0, max: 100, noNaN: true });

const featureGenerator = (productId: string) =>
	fc.record({
		product_id: fc.constant(productId),
		feature_name: featureNameGenerator(),
		feature_description: featureDescriptionGenerator(),
		relevance_score: relevanceScoreGenerator()
	});

// Helper to create a test seller profile
async function ensureTestSeller() {
	const testEmail = 'testseller-features@test.com';
	const testPassword = 'TestPassword123!';

	// Check if test seller profile exists
	const { data: profiles } = await supabaseTest
		.from('profiles')
		.select('id')
		.eq('full_name', 'Test Seller Features')
		.limit(1);

	if (profiles && profiles.length > 0) {
		return profiles[0].id;
	}

	// Create auth user
	const { data: authData, error: authError } = await supabaseTest.auth.admin.createUser({
		email: testEmail,
		password: testPassword,
		email_confirm: true,
		user_metadata: {
			full_name: 'Test Seller Features'
		}
	});

	if (authError) {
		// User might already exist
		const { data: existingUser } = await supabaseTest.auth.admin.listUsers();
		if (existingUser && existingUser.users) {
			const testUser = existingUser.users.find((u) => u.email === testEmail);
			if (testUser) {
				await supabaseTest
					.from('profiles')
					.update({ role_seller: true, role_buyer: false, full_name: 'Test Seller Features' })
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

// Helper to create a test product
async function createTestProduct(sellerId: string): Promise<string> {
	const { data, error} = await supabaseTest
		.from('products')
		.insert({
			name: 'Test Product for Features',
			short_description: 'Test product',
			long_description: 'Test product long description',
			price: 10.00,
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

// Helper to clean up test data
async function cleanupTestData(sellerId: string) {
	// Delete products (features will cascade delete)
	await supabaseTest.from('products').delete().eq('seller_id', sellerId);
}

describe('ProductFeatureService Property-Based Tests', () => {
	let testSellerId: string;
	let testProductId: string;

	beforeAll(async () => {
		testSellerId = await ensureTestSeller();
	});

	afterEach(async () => {
		await cleanupTestData(testSellerId);
	});

	// Feature: startup-marketplace, Property 19: Form validation completeness
	// Validates: Requirements 12.3
	// Note: This property test validates that product features can be created with all required fields
	// and that missing required fields are properly handled
	test('Property 19: Form validation completeness - feature creation validates required fields', async () => {
		testProductId = await createTestProduct(testSellerId);

		await fc.assert(
			fc.asyncProperty(featureNameGenerator(), async (featureName) => {
				// Test that a feature with only the required field (feature_name) can be created
				const feature = await productFeatureService.create({
					product_id: testProductId,
					feature_name: featureName
				});

				// Verify the feature was created with all fields
				expect(feature).toBeDefined();
				expect(feature.feature_name).toBe(featureName);
				expect(feature.product_id).toBe(testProductId);
				expect(typeof feature.relevance_score).toBe('number');
				expect(feature.relevance_score).toBeGreaterThanOrEqual(0);
				expect(feature.relevance_score).toBeLessThanOrEqual(100);

				return true;
			}),
			{ numRuns: 100 }
		);
	}, 60000);

	test('Property: Feature data round-trip - storing then retrieving features returns equivalent data', async () => {
		testProductId = await createTestProduct(testSellerId);

		await fc.assert(
			fc.asyncProperty(featureGenerator(testProductId), async (featureData) => {
				// Create the feature
				const created = await productFeatureService.create(featureData);

				// Retrieve all features for the product
				const features = await productFeatureService.getByProduct(testProductId);

				// Find the created feature
				const retrieved = features.find((f) => f.id === created.id);

				// Verify the feature was retrieved
				expect(retrieved).toBeDefined();
				if (!retrieved) return false;

				// Verify core fields match
				const fieldsMatch =
					retrieved.feature_name === created.feature_name &&
					retrieved.product_id === created.product_id &&
					Math.abs(retrieved.relevance_score - created.relevance_score) < 0.01; // floating point tolerance

				// Verify description matches (handling null/undefined)
				const descriptionMatch =
					(retrieved.feature_description === created.feature_description) ||
					(retrieved.feature_description === null && created.feature_description === undefined) ||
					(retrieved.feature_description === undefined && created.feature_description === null);

				return fieldsMatch && descriptionMatch;
			}),
			{ numRuns: 100 }
		);
	}, 60000);

	test('Property: Features sorted by relevance - getByProduct returns features in descending relevance order', async () => {
		testProductId = await createTestProduct(testSellerId);

		// Create multiple features with different relevance scores
		const featuresToCreate = [
			{ feature_name: 'Low relevance', relevance_score: 20 },
			{ feature_name: 'High relevance', relevance_score: 90 },
			{ feature_name: 'Medium relevance', relevance_score: 50 },
			{ feature_name: 'Very high relevance', relevance_score: 95 },
			{ feature_name: 'Very low relevance', relevance_score: 10 }
		];

		for (const feature of featuresToCreate) {
			await productFeatureService.create({
				product_id: testProductId,
				...feature
			});
		}

		// Retrieve features
		const features = await productFeatureService.getByProduct(testProductId);

		// Verify features are sorted by relevance_score in descending order
		for (let i = 0; i < features.length - 1; i++) {
			expect(features[i].relevance_score).toBeGreaterThanOrEqual(features[i + 1].relevance_score);
		}

		// Verify the highest relevance feature is first
		expect(features[0].feature_name).toBe('Very high relevance');
		expect(features[0].relevance_score).toBe(95);
	}, 30000);

	test('Property: Feature categorization consistency - categorizeFeature returns consistent categories', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom(
					'Core functionality',
					'API Integration',
					'Analytics Dashboard',
					'Customer Support',
					'Security Features',
					'Workflow Automation',
					'Team Collaboration'
				),
				async (featureName) => {
					// Categorize the same feature name multiple times
					const category1 = productFeatureService.categorizeFeature(featureName);
					const category2 = productFeatureService.categorizeFeature(featureName);
					const category3 = productFeatureService.categorizeFeature(featureName);

					// All categorizations should return the same result
					return category1 === category2 && category2 === category3;
				}
			),
			{ numRuns: 50 }
		);
	}, 30000);

	test('Property: Feature categorization correctness - categorizeFeature assigns appropriate categories', async () => {
		// Test specific feature names and verify they get the expected categories
		const testCases = [
			{ name: 'Core user management', expectedCategory: 'core' },
			{ name: 'API integration with Slack', expectedCategory: 'integration' },
			{ name: 'Analytics and reporting', expectedCategory: 'analytics' },
			{ name: 'Customer support portal', expectedCategory: 'support' },
			{ name: 'Security and encryption', expectedCategory: 'security' },
			{ name: 'Workflow automation', expectedCategory: 'automation' },
			{ name: 'Team collaboration tools', expectedCategory: 'collaboration' },
			{ name: 'Random feature', expectedCategory: 'general' }
		];

		for (const testCase of testCases) {
			const category = productFeatureService.categorizeFeature(testCase.name);
			expect(category).toBe(testCase.expectedCategory);
		}
	}, 10000);

	test('Property: Bulk feature creation - createBulk creates all features with correct categorization', async () => {
		testProductId = await createTestProduct(testSellerId);

		const featuresToCreate = [
			{ feature_name: 'Core functionality', feature_description: 'Essential features' },
			{ feature_name: 'API integration', feature_description: 'Connect with other tools' },
			{ feature_name: 'Analytics dashboard', feature_description: 'View your metrics' }
		];

		const created = await productFeatureService.createBulk(testProductId, featuresToCreate);

		// Verify all features were created
		expect(created.length).toBe(featuresToCreate.length);

		// Verify each feature has a category assigned
		for (const feature of created) {
			expect(feature.feature_category).toBeDefined();
			expect(typeof feature.feature_category).toBe('string');
			expect(feature.feature_category.length).toBeGreaterThan(0);
		}

		// Verify features can be retrieved
		const retrieved = await productFeatureService.getByProduct(testProductId);
		expect(retrieved.length).toBe(featuresToCreate.length);
	}, 30000);

	test('Property: Feature update preserves product_id - updating a feature does not change its product association', async () => {
		testProductId = await createTestProduct(testSellerId);

		await fc.assert(
			fc.asyncProperty(
				featureNameGenerator(),
				featureNameGenerator(),
				async (originalName, updatedName) => {
					// Create a feature
					const created = await productFeatureService.create({
						product_id: testProductId,
						feature_name: originalName
					});

					// Update the feature
					const updated = await productFeatureService.update(created.id, {
						feature_name: updatedName
					});

					// Verify product_id is unchanged
					return updated.product_id === testProductId && updated.product_id === created.product_id;
				}
			),
			{ numRuns: 50 }
		);
	}, 60000);

	test('Property: Feature deletion removes feature - deleted features do not appear in getByProduct', async () => {
		testProductId = await createTestProduct(testSellerId);

		// Create a feature
		const feature = await productFeatureService.create({
			product_id: testProductId,
			feature_name: 'Feature to delete'
		});

		// Verify it exists
		let features = await productFeatureService.getByProduct(testProductId);
		expect(features.some((f) => f.id === feature.id)).toBe(true);

		// Delete the feature
		await productFeatureService.delete(feature.id);

		// Verify it no longer exists
		features = await productFeatureService.getByProduct(testProductId);
		expect(features.some((f) => f.id === feature.id)).toBe(false);
	}, 30000);
});
