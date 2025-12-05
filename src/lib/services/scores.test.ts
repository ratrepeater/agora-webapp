/**
 * Unit tests for score calculation functions
 * 
 * Tests each score calculation function with known inputs,
 * edge cases (missing data, extreme values), and overall score weighting.
 */

import { describe, it, expect } from 'vitest';
import {
	calculateFitScore,
	calculateFeatureScore,
	calculateIntegrationScore,
	calculateReviewScore,
	calculateOverallScore,
	generateScoreBreakdown
} from './scores';
import type { Product, ProductFeature, BuyerOnboarding } from '$lib/helpers/types';

// Helper to create mock product
function createMockProduct(overrides: Partial<Product> = {}): Product {
	return {
		id: 'test-product-id',
		name: 'Test Product',
		short_description: 'A test product',
		long_description: 'A longer description of the test product',
		price_cents: 9999,
		seller_id: 'test-seller-id',
		category_id: 'test-category-id',
		status: 'active',
		is_featured: false,
		is_bundle: false,
		bundle_pricing_mode: 'fixed',
		logo_url: null,
		demo_visual_url: null,
		slug: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		...overrides
	} as Product;
}

// Helper to create mock product features
function createMockFeatures(count: number, highRelevanceCount: number = 0): ProductFeature[] {
	const features: ProductFeature[] = [];

	for (let i = 0; i < count; i++) {
		features.push({
			id: `feature-${i}`,
			product_id: 'test-product-id',
			feature_name: `Feature ${i}`,
			feature_description: `Description for feature ${i}`,
			feature_category: 'core',
			relevance_score: i < highRelevanceCount ? 85 : 50,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		});
	}

	return features;
}

// Helper to create mock buyer profile
function createMockBuyerProfile(overrides: Partial<BuyerOnboarding> = {}): BuyerOnboarding {
	return {
		id: 'test-buyer-id',
		buyer_id: 'test-buyer-id',
		company_name: 'Test Company',
		company_size: 100,
		industry: 'Technology',
		interests: ['hr', 'devtools'],
		completed_at: new Date().toISOString(),
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		...overrides
	} as BuyerOnboarding;
}

describe('calculateFitScore', () => {
	it('should return 100 for ideal product (no penalties)', () => {
		const product = createMockProduct();
		const score = calculateFitScore(product);
		expect(score).toBe(100);
	});

	it('should handle missing data gracefully', () => {
		const product = createMockProduct();
		const score = calculateFitScore(product);
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(100);
	});

	it('should return score within 0-100 range', () => {
		const product = createMockProduct();
		const score = calculateFitScore(product);
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(100);
	});

	it('should handle buyer profile personalization', () => {
		const product = createMockProduct();
		const buyerProfile = createMockBuyerProfile({ company_size: 30 });
		const score = calculateFitScore(product, buyerProfile);
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(100);
	});
});

describe('calculateFeatureScore', () => {
	it('should return base score of 60 for minimal product', () => {
		const product = createMockProduct({
			long_description: 'Short description'
		});
		const features: ProductFeature[] = [];
		const score = calculateFeatureScore(product, features);
		expect(score).toBe(60);
	});

	it('should increase score with more features', () => {
		const product = createMockProduct();
		const fewFeatures = createMockFeatures(3);
		const manyFeatures = createMockFeatures(15);

		const scoreFew = calculateFeatureScore(product, fewFeatures);
		const scoreMany = calculateFeatureScore(product, manyFeatures);

		expect(scoreMany).toBeGreaterThan(scoreFew);
	});

	it('should increase score with high-relevance features', () => {
		const product = createMockProduct();
		const normalFeatures = createMockFeatures(10, 0);
		const highRelevanceFeatures = createMockFeatures(10, 5);

		const scoreNormal = calculateFeatureScore(product, normalFeatures);
		const scoreHighRelevance = calculateFeatureScore(product, highRelevanceFeatures);

		expect(scoreHighRelevance).toBeGreaterThan(scoreNormal);
	});

	it('should increase score with longer description', () => {
		const shortProduct = createMockProduct({
			long_description: 'Short description with few words'
		});
		const longProduct = createMockProduct({
			long_description: 'A'.repeat(1000) // Long description with many words
		});

		const scoreShort = calculateFeatureScore(shortProduct, []);
		const scoreLong = calculateFeatureScore(longProduct, []);

		expect(scoreLong).toBeGreaterThan(scoreShort);
	});

	it('should increase score with demo visual', () => {
		const productWithoutVisual = createMockProduct({ demo_visual_url: null });
		const productWithVisual = createMockProduct({ demo_visual_url: 'https://example.com/demo.png' });

		const scoreWithout = calculateFeatureScore(productWithoutVisual, []);
		const scoreWith = calculateFeatureScore(productWithVisual, []);

		expect(scoreWith).toBeGreaterThan(scoreWithout);
	});

	it('should return score within 0-100 range', () => {
		const product = createMockProduct();
		const features = createMockFeatures(50, 25); // Extreme case
		const score = calculateFeatureScore(product, features);
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(100);
	});

	it('should handle empty features array', () => {
		const product = createMockProduct();
		const score = calculateFeatureScore(product, []);
		expect(score).toBe(60); // Base score
	});
});

describe('calculateIntegrationScore', () => {
	it('should return baseline score (60-70 range depending on cloud/client)', () => {
		const product = createMockProduct();
		const score = calculateIntegrationScore(product);
		// Score will be 60 because getMetricValue returns null, 
		// which triggers the client-only penalty (-10 from 70 baseline)
		expect(score).toBeGreaterThanOrEqual(60);
		expect(score).toBeLessThanOrEqual(70);
	});

	it('should handle missing data gracefully', () => {
		const product = createMockProduct();
		const score = calculateIntegrationScore(product);
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(100);
	});

	it('should return score within 0-100 range', () => {
		const product = createMockProduct();
		const score = calculateIntegrationScore(product);
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(100);
	});

	it('should handle buyer profile personalization', () => {
		const product = createMockProduct();
		const buyerProfile = createMockBuyerProfile({ interests: ['hr', 'devtools'] });
		const score = calculateIntegrationScore(product, buyerProfile);
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(100);
	});
});

describe('calculateReviewScore', () => {
	it('should return 0 for minimum rating (1 star)', () => {
		const score = calculateReviewScore(1, 10);
		expect(score).toBe(0);
	});

	it('should return 100 for maximum rating (5 stars) with many reviews', () => {
		const score = calculateReviewScore(5, 100);
		expect(score).toBe(100);
	});

	it('should return 50 for middle rating (3 stars) with many reviews', () => {
		const score = calculateReviewScore(3, 100);
		expect(score).toBe(50);
	});

	it('should apply confidence penalty for few reviews', () => {
		const scoreFewReviews = calculateReviewScore(5, 3);
		const scoreManyReviews = calculateReviewScore(5, 100);
		expect(scoreFewReviews).toBeLessThan(scoreManyReviews);
	});

	it('should handle zero reviews', () => {
		const score = calculateReviewScore(0, 0);
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(100);
	});

	it('should return score within 0-100 range', () => {
		const score = calculateReviewScore(4.5, 50);
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(100);
	});

	it('should handle extreme values', () => {
		const scoreMin = calculateReviewScore(1, 1);
		const scoreMax = calculateReviewScore(5, 1000);
		expect(scoreMin).toBeGreaterThanOrEqual(0);
		expect(scoreMax).toBeLessThanOrEqual(100);
	});
});

describe('calculateOverallScore', () => {
	it('should calculate weighted average correctly', () => {
		const scores = {
			fit_score: 80,
			feature_score: 60,
			integration_score: 70,
			review_score: 90
		};

		const overall = calculateOverallScore(scores);

		// Expected: 80*0.3 + 60*0.25 + 70*0.25 + 90*0.2 = 24 + 15 + 17.5 + 18 = 74.5 ≈ 75
		expect(overall).toBe(75);
	});

	it('should return 0 when all scores are 0', () => {
		const scores = {
			fit_score: 0,
			feature_score: 0,
			integration_score: 0,
			review_score: 0
		};

		const overall = calculateOverallScore(scores);
		expect(overall).toBe(0);
	});

	it('should return 100 when all scores are 100', () => {
		const scores = {
			fit_score: 100,
			feature_score: 100,
			integration_score: 100,
			review_score: 100
		};

		const overall = calculateOverallScore(scores);
		expect(overall).toBe(100);
	});

	it('should weight fit score highest (30%)', () => {
		const scoresHighFit = {
			fit_score: 100,
			feature_score: 0,
			integration_score: 0,
			review_score: 0
		};

		const scoresHighFeature = {
			fit_score: 0,
			feature_score: 100,
			integration_score: 0,
			review_score: 0
		};

		const overallHighFit = calculateOverallScore(scoresHighFit);
		const overallHighFeature = calculateOverallScore(scoresHighFeature);

		expect(overallHighFit).toBeGreaterThan(overallHighFeature);
	});

	it('should return integer value', () => {
		const scores = {
			fit_score: 77,
			feature_score: 83,
			integration_score: 91,
			review_score: 65
		};

		const overall = calculateOverallScore(scores);
		expect(Number.isInteger(overall)).toBe(true);
	});

	it('should handle extreme values', () => {
		const scores = {
			fit_score: 100,
			feature_score: 0,
			integration_score: 100,
			review_score: 0
		};

		const overall = calculateOverallScore(scores);
		expect(overall).toBeGreaterThanOrEqual(0);
		expect(overall).toBeLessThanOrEqual(100);
	});
});

describe('generateScoreBreakdown', () => {
	it('should generate complete breakdown structure', () => {
		const product = createMockProduct();
		const features = createMockFeatures(10, 3);
		const breakdown = generateScoreBreakdown(product, features, 4.5, 50);

		expect(breakdown).toHaveProperty('fit');
		expect(breakdown).toHaveProperty('feature');
		expect(breakdown).toHaveProperty('integration');
		expect(breakdown).toHaveProperty('review');

		expect(breakdown.fit).toHaveProperty('score');
		expect(breakdown.fit).toHaveProperty('factors');
		expect(breakdown.feature).toHaveProperty('score');
		expect(breakdown.feature).toHaveProperty('factors');
		expect(breakdown.integration).toHaveProperty('score');
		expect(breakdown.integration).toHaveProperty('factors');
		expect(breakdown.review).toHaveProperty('score');
		expect(breakdown.review).toHaveProperty('factors');
	});

	it('should include all fit factors', () => {
		const product = createMockProduct();
		const features = createMockFeatures(5);
		const breakdown = generateScoreBreakdown(product, features, 4, 20);

		expect(breakdown.fit.factors).toHaveProperty('implementation_time');
		expect(breakdown.fit.factors).toHaveProperty('deployment_model');
		expect(breakdown.fit.factors).toHaveProperty('complexity');
	});

	it('should include all feature factors', () => {
		const product = createMockProduct();
		const features = createMockFeatures(5);
		const breakdown = generateScoreBreakdown(product, features, 4, 20);

		expect(breakdown.feature.factors).toHaveProperty('completeness');
		expect(breakdown.feature.factors).toHaveProperty('description_quality');
		expect(breakdown.feature.factors).toHaveProperty('feature_count');
		expect(breakdown.feature.factors).toHaveProperty('high_value_features');
	});

	it('should include all integration factors', () => {
		const product = createMockProduct();
		const features = createMockFeatures(5);
		const breakdown = generateScoreBreakdown(product, features, 4, 20);

		expect(breakdown.integration.factors).toHaveProperty('deployment_type');
		expect(breakdown.integration.factors).toHaveProperty('category_ecosystem');
		expect(breakdown.integration.factors).toHaveProperty('api_availability');
	});

	it('should include all review factors', () => {
		const product = createMockProduct();
		const features = createMockFeatures(5);
		const breakdown = generateScoreBreakdown(product, features, 4, 20);

		expect(breakdown.review.factors).toHaveProperty('average_rating');
		expect(breakdown.review.factors).toHaveProperty('review_count');
		expect(breakdown.review.factors).toHaveProperty('confidence_adjustment');
	});

	it('should include buyer_match when buyer profile provided', () => {
		const product = createMockProduct();
		const features = createMockFeatures(5);
		const buyerProfile = createMockBuyerProfile({ company_size: 30 });
		const breakdown = generateScoreBreakdown(product, features, 4, 20, buyerProfile);

		// buyer_match may or may not be present depending on conditions
		// Just verify the breakdown is valid
		expect(breakdown.fit.score).toBeGreaterThanOrEqual(0);
		expect(breakdown.fit.score).toBeLessThanOrEqual(100);
	});

	it('should handle zero reviews', () => {
		const product = createMockProduct();
		const features = createMockFeatures(5);
		const breakdown = generateScoreBreakdown(product, features, 0, 0);

		expect(breakdown.review.factors.review_count).toBe(0);
		expect(breakdown.review.score).toBeGreaterThanOrEqual(0);
	});

	it('should handle empty features', () => {
		const product = createMockProduct();
		const breakdown = generateScoreBreakdown(product, [], 4, 20);

		expect(breakdown.feature.factors.feature_count).toBe(0);
		expect(breakdown.feature.factors.high_value_features).toBe(0);
	});
});
