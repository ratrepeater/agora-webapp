import * as fc from 'fast-check';
import type {
	ProductWithScores,
	ProductCategory,
	CloudClientType,
	ScoreBreakdown
} from '$lib/helpers/types';

// Product category generator
export const productCategoryArb = () =>
	fc.constantFrom<ProductCategory>('HR', 'Law', 'Office', 'DevTools');

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
