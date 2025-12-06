import * as fc from 'fast-check';
import type {
	ProductWithScores,
	ProductCategory,
	CloudClientType,
	ScoreBreakdown
} from '$lib/helpers/types';
import type { TablesInsert } from '$lib/helpers/database.types';
import { createTestProduct, getCategoryId } from './test-data-helpers';

// Product category generator (database keys)
export const productCategoryArb = () =>
	fc.constantFrom<ProductCategory>('hr', 'legal', 'marketing', 'devtools');

// Product category key generator (for database queries)
export const productCategoryKeyArb = () =>
	fc.constantFrom('hr', 'legal', 'marketing', 'devtools');

// Cloud client type generator
export const cloudClientTypeArb = () =>
	fc.constantFrom<CloudClientType>('cloud', 'client', 'hybrid');

// Score breakdown generator
export const scoreBreakdownArb = (): fc.Arbitrary<ScoreBreakdown> =>
	fc.record({
		fit: fc.record({
			score: fc.integer({ min: 0, max: 100 }),
			factors: fc.record({
				implementation_time: fc.integer({ min: 0, max: 100 }),
				deployment_model: fc.integer({ min: 0, max: 100 }),
				complexity: fc.integer({ min: 0, max: 100 }),
				buyer_match: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined })
			})
		}),
		feature: fc.record({
			score: fc.integer({ min: 0, max: 100 }),
			factors: fc.record({
				completeness: fc.integer({ min: 0, max: 100 }),
				description_quality: fc.integer({ min: 0, max: 100 }),
				feature_count: fc.integer({ min: 0, max: 100 }),
				high_value_features: fc.integer({ min: 0, max: 100 })
			})
		}),
		integration: fc.record({
			score: fc.integer({ min: 0, max: 100 }),
			factors: fc.record({
				deployment_type: fc.integer({ min: 0, max: 100 }),
				category_ecosystem: fc.integer({ min: 0, max: 100 }),
				api_availability: fc.integer({ min: 0, max: 100 }),
				buyer_compatibility: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined })
			})
		}),
		review: fc.record({
			score: fc.integer({ min: 0, max: 100 }),
			factors: fc.record({
				average_rating: fc.float({ min: Math.fround(0), max: Math.fround(5), noNaN: true }),
				review_count: fc.integer({ min: 0, max: 10000 }),
				confidence_adjustment: fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true })
			})
		})
	});

// Product with scores generator
export const productWithScoresArb = (): fc.Arbitrary<ProductWithScores> =>
	fc.record({
		id: fc.uuid(),
		name: fc.string({ minLength: 1, maxLength: 100 }),
		short_description: fc.string({ minLength: 10, maxLength: 200 }),
		long_description: fc.string({ minLength: 50, maxLength: 2000 }),
		price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
		category: productCategoryArb(),
		seller_id: fc.uuid(),
		logo_url: fc.option(fc.webUrl(), { nil: null }),
		demo_visual_url: fc.option(fc.webUrl(), { nil: null }),
		roi_percentage: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }), { nil: null }),
		retention_rate: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }), { nil: null }),
		quarter_over_quarter_change: fc.option(fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }), {
			nil: null
		}),
		cloud_client_classification: fc.option(cloudClientTypeArb(), { nil: null }),
		implementation_time_days: fc.option(fc.integer({ min: 1, max: 365 }), { nil: null }),
		access_depth: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
		is_featured: fc.option(fc.boolean(), { nil: null }),
		is_new: fc.option(fc.boolean(), { nil: null }),
		created_at: fc.option(fc.constant('2024-01-01T00:00:00.000Z'), { nil: null }),
		updated_at: fc.option(fc.constant('2024-01-01T00:00:00.000Z'), { nil: null }),
		average_rating: fc.float({ min: Math.fround(0), max: Math.fround(5), noNaN: true }),
		review_count: fc.integer({ min: 0, max: 10000 }),
		fit_score: fc.integer({ min: 0, max: 100 }),
		feature_score: fc.integer({ min: 0, max: 100 }),
		integration_score: fc.integer({ min: 0, max: 100 }),
		review_score: fc.integer({ min: 0, max: 100 }),
		overall_score: fc.integer({ min: 0, max: 100 }),
		score_breakdown: fc.option(scoreBreakdownArb(), { nil: undefined }),
		features: fc.option(fc.constant([]), { nil: undefined })
	});

/**
 * Generator for product insert data with valid seller reference
 * This generator creates data suitable for inserting into the database
 * @param sellerId The seller's user ID (must exist in database)
 * @returns Arbitrary for product insert data
 */
export const productInsertArb = (sellerId: string): fc.Arbitrary<TablesInsert<'products'>> =>
	fc.record({
		name: fc.string({ minLength: 1, maxLength: 100 }),
		short_description: fc.string({ minLength: 10, maxLength: 200 }),
		long_description: fc.oneof(fc.string({ minLength: 50, maxLength: 2000 }), fc.constant(null)),
		price_cents: fc.integer({ min: 1, max: 1000000 }),
		seller_id: fc.constant(sellerId),
		category_id: fc.constant(null), // Will be set based on category
		logo_url: fc.oneof(fc.webUrl(), fc.constant(null)),
		demo_visual_url: fc.oneof(fc.webUrl(), fc.constant(null)),
		is_featured: fc.boolean(),
		is_bundle: fc.constant(false),
		status: fc.constant('published'),
		bundle_pricing_mode: fc.constant('fixed')
	});

/**
 * Generator that creates actual products in the database
 * Use this when you need real product IDs for testing
 * @param sellerId The seller's user ID (must exist in database)
 * @returns Arbitrary that generates product IDs
 */
export const productIdArb = (sellerId: string): fc.Arbitrary<Promise<string>> =>
	fc
		.record({
			name: fc.string({ minLength: 1, maxLength: 100 }),
			short_description: fc.string({ minLength: 10, maxLength: 200 }),
			price_cents: fc.integer({ min: 1, max: 100000 }),
			category_key: productCategoryKeyArb()
		})
		.map(async (data) => {
			const categoryId = await getCategoryId(data.category_key);
			return createTestProduct(sellerId, {
				name: data.name,
				short_description: data.short_description,
				price_cents: data.price_cents,
				category_id: categoryId
			});
		});

/**
 * Generator for bookmark insert data
 * @param buyerId The buyer's user ID (must exist in database)
 * @param productId The product ID (must exist in database)
 * @returns Arbitrary for bookmark insert data
 */
export const bookmarkInsertArb = (
	buyerId: string,
	productId: string
): fc.Arbitrary<TablesInsert<'bookmarks'>> =>
	fc.record({
		buyer_id: fc.constant(buyerId),
		product_id: fc.constant(productId)
	});

/**
 * Generator for cart item insert data
 * @param buyerId The buyer's user ID (must exist in database)
 * @param productId The product ID (must exist in database)
 * @returns Arbitrary for cart item insert data
 */
export const cartItemInsertArb = (
	buyerId: string,
	productId: string
): fc.Arbitrary<TablesInsert<'cart_items'>> =>
	fc.record({
		buyer_id: fc.constant(buyerId),
		product_id: fc.constant(productId),
		quantity: fc.integer({ min: 1, max: 10 })
	});

/**
 * Generator for review insert data
 * @param buyerId The buyer's user ID (must exist in database)
 * @param productId The product ID (must exist in database)
 * @returns Arbitrary for review insert data
 */
export const reviewInsertArb = (
	buyerId: string,
	productId: string
): fc.Arbitrary<TablesInsert<'reviews'>> =>
	fc.record({
		buyer_id: fc.constant(buyerId),
		product_id: fc.constant(productId),
		rating: fc.integer({ min: 1, max: 5 }),
		review_text: fc.oneof(fc.string({ minLength: 10, maxLength: 500 }), fc.constant(null))
	});

/**
 * Generator for order insert data
 * @param buyerId The buyer's user ID (must exist in database)
 * @returns Arbitrary for order insert data
 */
export const orderInsertArb = (buyerId: string): fc.Arbitrary<TablesInsert<'orders'>> =>
	fc.record({
		buyer_id: fc.constant(buyerId),
		total_cents: fc.integer({ min: 1, max: 1000000 }),
		status: fc.constantFrom('pending', 'completed', 'cancelled')
	});
