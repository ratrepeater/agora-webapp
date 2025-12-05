/**
 * Score Calculation Service
 * 
 * Implements rule-based score calculation algorithms for products.
 * All scores are calculated on a 0-100 scale.
 * 
 * Future versions will support ML-based scoring models.
 */

import type {
	Product,
	ProductFeature,
	BuyerOnboarding,
	ScoreBreakdown
} from '$lib/helpers/types';
import { supabase } from '$lib/helpers/supabase';

/**
 * Calculate fit score based on implementation complexity and deployment model
 * 
 * Factors:
 * - Implementation time (0-40 points penalty)
 * - Cloud/client classification (0-15 points bonus)
 * - Access depth complexity (0-20 points penalty)
 * - Buyer-specific adjustments (0-10 points bonus)
 * 
 * @param product - Product to calculate score for
 * @param buyerProfile - Optional buyer profile for personalization
 * @returns Fit score (0-100)
 */
export function calculateFitScore(
	product: Product,
	buyerProfile?: BuyerOnboarding
): number {
	let score = 100;

	// Get implementation time from product metrics
	const implementationTime = getMetricValue(product, 'implementation_time_days');

	// Implementation time penalty (0-40 points)
	if (implementationTime !== null) {
		if (implementationTime > 90) score -= 40;
		else if (implementationTime > 30) score -= 20;
		else if (implementationTime > 7) score -= 10;
	}

	// Cloud/client bonus (0-15 points)
	const cloudClient = getMetricValue(product, 'cloud_client_classification');
	if (cloudClient === 'cloud') score += 10;
	else if (cloudClient === 'hybrid') score += 5;

	// Access depth consideration (deeper = more complex, 0-20 points penalty)
	const accessDepth = getMetricValue(product, 'access_depth');
	if (accessDepth && typeof accessDepth === 'string') {
		const depthLevels = accessDepth.split(',').length;
		const depthPenalty = depthLevels * 2;
		score -= Math.min(depthPenalty, 20);
	}

	// Buyer-specific adjustments (if profile available)
	if (buyerProfile && buyerProfile.company_size && implementationTime !== null) {
		// Smaller companies prefer faster implementation
		if (buyerProfile.company_size < 50 && implementationTime < 14) score += 10;
		// Larger companies can handle longer implementation
		if (buyerProfile.company_size > 500 && implementationTime > 30) score += 5;
	}

	return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate feature score based on product completeness and capability richness
 * 
 * Factors:
 * - Completeness (0-20 points)
 * - Description quality (0-10 points)
 * - Feature count (0-20 points)
 * - High-relevance features (0-10 points)
 * 
 * @param product - Product to calculate score for
 * @param features - Product features list
 * @returns Feature score (0-100)
 */
export function calculateFeatureScore(
	product: Product,
	features: ProductFeature[]
): number {
	let score = 60; // Base score

	// Completeness bonus (0-20 points)
	const roi = getMetricValue(product, 'roi_percentage');
	const retention = getMetricValue(product, 'retention_rate');
	const qoq = getMetricValue(product, 'quarter_over_quarter_change');

	if (roi !== null) score += 4;
	if (retention !== null) score += 4;
	if (qoq !== null) score += 3;
	if (product.demo_visual_url) score += 3;
	if (product.long_description && product.long_description.length > 500) score += 6;

	// Description quality (0-10 points)
	if (product.long_description) {
		const descriptionWords = product.long_description.split(/\s+/).length;
		if (descriptionWords > 200) score += 10;
		else if (descriptionWords > 100) score += 5;
	}

	// Feature count and quality (0-20 points)
	const featureCount = features.length;
	if (featureCount > 20) score += 20;
	else if (featureCount > 10) score += 15;
	else if (featureCount > 5) score += 10;
	else score += featureCount * 2;

	// High-relevance features bonus (0-10 points)
	const highRelevanceFeatures = features.filter((f) => f.relevance_score > 80).length;
	score += Math.min(highRelevanceFeatures * 2, 10);

	return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate integration score based on ease of integration and compatibility
 * 
 * Factors:
 * - Cloud/client classification (0-15 points)
 * - Category ecosystem (0-10 points)
 * - API availability (0-15 points)
 * - Buyer compatibility (0-10 points)
 * 
 * @param product - Product to calculate score for
 * @param buyerProfile - Optional buyer profile for personalization
 * @returns Integration score (0-100)
 */
export function calculateIntegrationScore(
	product: Product,
	buyerProfile?: BuyerOnboarding
): number {
	let score = 70; // Neutral baseline

	// Cloud products generally integrate better (0-15 points)
	const cloudClient = getMetricValue(product, 'cloud_client_classification');
	if (cloudClient === 'cloud') score += 10;
	else if (cloudClient === 'hybrid') score += 5;
	else score -= 10; // Client-only products are harder to integrate

	// Category-based adjustments (0-10 points)
	// Some categories have better integration ecosystems
	const categoryKey = getCategoryKey(product);
	if (categoryKey === 'devtools') score += 10;
	else if (categoryKey === 'hr') score += 5;

	// API and integration features (0-15 points)
	const accessDepth = getMetricValue(product, 'access_depth');
	if (accessDepth && typeof accessDepth === 'string' && accessDepth.toLowerCase().includes('api')) {
		score += 15;
	}

	// Buyer-specific adjustments (if profile available)
	if (buyerProfile?.interests) {
		const productCategory = getCategoryKey(product);
		if (buyerProfile.interests.includes(productCategory)) {
			score += 10; // Likely to integrate well with buyer's existing stack
		}
	}

	return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate review score from buyer reviews
 * 
 * Converts 1-5 star rating to 0-100 scale with confidence adjustment
 * 
 * @param averageRating - Average rating (1-5 scale)
 * @param reviewCount - Number of reviews
 * @returns Review score (0-100)
 */
export function calculateReviewScore(averageRating: number, reviewCount: number): number {
	// Convert 1-5 star rating to 0-100 scale
	let score = ((averageRating - 1) / 4) * 100;

	// Apply confidence penalty for low review counts
	// Products with few reviews get a slight penalty
	if (reviewCount < 5) score *= 0.8;
	else if (reviewCount < 10) score *= 0.9;
	else if (reviewCount < 20) score *= 0.95;

	return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate overall score as weighted average of component scores
 * 
 * Weights:
 * - Fit: 30%
 * - Feature: 25%
 * - Integration: 25%
 * - Review: 20%
 * 
 * @param scores - Component scores
 * @returns Overall score (0-100)
 */
export function calculateOverallScore(scores: {
	fit_score: number;
	feature_score: number;
	integration_score: number;
	review_score: number;
}): number {
	// Weights can be adjusted based on ML model insights
	const weights = {
		fit: 0.3,
		feature: 0.25,
		integration: 0.25,
		review: 0.2
	};

	const overall =
		scores.fit_score * weights.fit +
		scores.feature_score * weights.feature +
		scores.integration_score * weights.integration +
		scores.review_score * weights.review;

	return Math.round(overall);
}

/**
 * Generate detailed score breakdown showing how each score was calculated
 * 
 * @param product - Product to calculate breakdown for
 * @param features - Product features
 * @param averageRating - Average review rating
 * @param reviewCount - Number of reviews
 * @param buyerProfile - Optional buyer profile
 * @returns Detailed score breakdown
 */
export function generateScoreBreakdown(
	product: Product,
	features: ProductFeature[],
	averageRating: number,
	reviewCount: number,
	buyerProfile?: BuyerOnboarding
): ScoreBreakdown {
	// Calculate individual factor contributions for fit score
	const implementationTime = getMetricValue(product, 'implementation_time_days');
	let fitImplementationFactor = 100;
	if (implementationTime !== null) {
		if (implementationTime > 90) fitImplementationFactor = 60;
		else if (implementationTime > 30) fitImplementationFactor = 80;
		else if (implementationTime > 7) fitImplementationFactor = 90;
	}

	const cloudClient = getMetricValue(product, 'cloud_client_classification');
	let fitDeploymentFactor = 100;
	if (cloudClient === 'cloud') fitDeploymentFactor = 110;
	else if (cloudClient === 'hybrid') fitDeploymentFactor = 105;

	const accessDepth = getMetricValue(product, 'access_depth');
	let fitComplexityFactor = 100;
	if (accessDepth && typeof accessDepth === 'string') {
		const depthLevels = accessDepth.split(',').length;
		fitComplexityFactor = Math.max(80, 100 - depthLevels * 2);
	}

	let fitBuyerMatch: number | undefined;
	if (buyerProfile && buyerProfile.company_size && implementationTime !== null) {
		if (buyerProfile.company_size < 50 && implementationTime < 14) fitBuyerMatch = 110;
		else if (buyerProfile.company_size > 500 && implementationTime > 30) fitBuyerMatch = 105;
		else fitBuyerMatch = 100;
	}

	// Calculate individual factor contributions for feature score
	const roi = getMetricValue(product, 'roi_percentage');
	const retention = getMetricValue(product, 'retention_rate');
	const qoq = getMetricValue(product, 'quarter_over_quarter_change');

	let featureCompletenessFactor = 60;
	if (roi !== null) featureCompletenessFactor += 4;
	if (retention !== null) featureCompletenessFactor += 4;
	if (qoq !== null) featureCompletenessFactor += 3;
	if (product.demo_visual_url) featureCompletenessFactor += 3;
	if (product.long_description && product.long_description.length > 500)
		featureCompletenessFactor += 6;

	let featureDescriptionQuality = 0;
	if (product.long_description) {
		const descriptionWords = product.long_description.split(/\s+/).length;
		if (descriptionWords > 200) featureDescriptionQuality = 10;
		else if (descriptionWords > 100) featureDescriptionQuality = 5;
	}

	const featureCount = features.length;
	let featureCountFactor = 0;
	if (featureCount > 20) featureCountFactor = 20;
	else if (featureCount > 10) featureCountFactor = 15;
	else if (featureCount > 5) featureCountFactor = 10;
	else featureCountFactor = featureCount * 2;

	const highRelevanceFeatures = features.filter((f) => f.relevance_score > 80).length;
	const featureHighValueFactor = Math.min(highRelevanceFeatures * 2, 10);

	// Calculate individual factor contributions for integration score
	let integrationDeploymentFactor = 70;
	if (cloudClient === 'cloud') integrationDeploymentFactor = 80;
	else if (cloudClient === 'hybrid') integrationDeploymentFactor = 75;
	else integrationDeploymentFactor = 60;

	const categoryKey = getCategoryKey(product);
	let integrationCategoryFactor = 0;
	if (categoryKey === 'devtools') integrationCategoryFactor = 10;
	else if (categoryKey === 'hr') integrationCategoryFactor = 5;

	let integrationApiFactor = 0;
	if (accessDepth && typeof accessDepth === 'string' && accessDepth.toLowerCase().includes('api')) {
		integrationApiFactor = 15;
	}

	let integrationBuyerCompatibility: number | undefined;
	if (buyerProfile?.interests) {
		const productCategory = getCategoryKey(product);
		if (buyerProfile.interests.includes(productCategory)) {
			integrationBuyerCompatibility = 10;
		} else {
			integrationBuyerCompatibility = 0;
		}
	}

	// Calculate review score factors
	const reviewRatingFactor = ((averageRating - 1) / 4) * 100;
	let reviewConfidenceAdjustment = 1.0;
	if (reviewCount < 5) reviewConfidenceAdjustment = 0.8;
	else if (reviewCount < 10) reviewConfidenceAdjustment = 0.9;
	else if (reviewCount < 20) reviewConfidenceAdjustment = 0.95;

	// Calculate final scores
	const fitScore = calculateFitScore(product, buyerProfile);
	const featureScore = calculateFeatureScore(product, features);
	const integrationScore = calculateIntegrationScore(product, buyerProfile);
	const reviewScore = calculateReviewScore(averageRating, reviewCount);

	return {
		fit: {
			score: fitScore,
			factors: {
				implementation_time: fitImplementationFactor,
				deployment_model: fitDeploymentFactor,
				complexity: fitComplexityFactor,
				...(fitBuyerMatch !== undefined && { buyer_match: fitBuyerMatch })
			}
		},
		feature: {
			score: featureScore,
			factors: {
				completeness: featureCompletenessFactor,
				description_quality: featureDescriptionQuality,
				feature_count: featureCountFactor,
				high_value_features: featureHighValueFactor
			}
		},
		integration: {
			score: integrationScore,
			factors: {
				deployment_type: integrationDeploymentFactor,
				category_ecosystem: integrationCategoryFactor,
				api_availability: integrationApiFactor,
				...(integrationBuyerCompatibility !== undefined && {
					buyer_compatibility: integrationBuyerCompatibility
				})
			}
		},
		review: {
			score: reviewScore,
			factors: {
				average_rating: reviewRatingFactor,
				review_count: reviewCount,
				confidence_adjustment: reviewConfidenceAdjustment
			}
		}
	};
}

/**
 * Helper function to get metric value from product
 * Fetches metric value from product_metric_values table
 */
async function getMetricValueAsync(
	productId: string,
	metricCode: string
): Promise<number | string | boolean | null> {
	const { data, error } = await supabase
		.from('product_metric_values')
		.select('numeric_value, string_value, boolean_value, metric_id')
		.eq('product_id', productId)
		.eq('metric_id', metricCode)
		.single();

	if (error || !data) return null;

	// Return the appropriate value based on which field is populated
	if (data.numeric_value !== null) return data.numeric_value;
	if (data.string_value !== null) return data.string_value;
	if (data.boolean_value !== null) return data.boolean_value;

	return null;
}

/**
 * Synchronous helper to get metric value from cached product data
 * This is a temporary solution until we have metrics cached on the product object
 */
function getMetricValue(product: Product, metricCode: string): any {
	// For now, return null as metrics aren't directly on the product object
	// In production, we'd either:
	// 1. Pre-fetch and cache metrics on the product object
	// 2. Use async functions throughout
	// 3. Store commonly used metrics directly on products table
	return null;
}

/**
 * Helper function to get category key from product
 */
async function getCategoryKeyAsync(productId: string, categoryId: string | null): Promise<string> {
	if (!categoryId) return '';

	const { data, error } = await supabase
		.from('categories')
		.select('key')
		.eq('id', categoryId)
		.single();

	if (error || !data) return '';

	return data.key;
}

/**
 * Synchronous helper to get category key
 */
function getCategoryKey(product: Product): string {
	// For now, return empty string
	// In production, we'd cache the category key on the product object
	return '';
}


/**
 * ProductScoreService
 * 
 * Service for calculating and persisting product scores
 */
export class ProductScoreService {
	/**
	 * Calculate all scores for a product and persist to database
	 * 
	 * @param productId - Product ID to calculate scores for
	 * @param buyerProfile - Optional buyer profile for personalization
	 * @returns Calculated scores with breakdown
	 */
	static async calculateScores(
		productId: string,
		buyerProfile?: BuyerOnboarding
	): Promise<{
		fit_score: number;
		feature_score: number;
		integration_score: number;
		review_score: number;
		overall_score: number;
		score_breakdown: ScoreBreakdown;
	}> {
		// Fetch product data
		const { data: product, error: productError } = await supabase
			.from('products')
			.select('*')
			.eq('id', productId)
			.single();

		if (productError || !product) {
			throw new Error(`Failed to fetch product: ${productError?.message}`);
		}

		// Fetch product features
		const { data: features, error: featuresError } = await supabase
			.from('product_features')
			.select('*')
			.eq('product_id', productId)
			.order('relevance_score', { ascending: false });

		const productFeatures: ProductFeature[] = features || [];

		// Fetch review statistics
		const { data: reviewStats, error: reviewError } = await supabase
			.from('reviews')
			.select('rating')
			.eq('product_id', productId);

		let averageRating = 0;
		let reviewCount = 0;

		if (reviewStats && reviewStats.length > 0) {
			reviewCount = reviewStats.length;
			const totalRating = reviewStats.reduce(
				(sum: number, review: { rating: number }) => sum + review.rating,
				0
			);
			averageRating = totalRating / reviewCount;
		}

		// Calculate individual scores
		const fitScore = calculateFitScore(product as Product, buyerProfile);
		const featureScore = calculateFeatureScore(product as Product, productFeatures);
		const integrationScore = calculateIntegrationScore(product as Product, buyerProfile);
		const reviewScore = calculateReviewScore(averageRating, reviewCount);

		// Calculate overall score
		const overallScore = calculateOverallScore({
			fit_score: fitScore,
			feature_score: featureScore,
			integration_score: integrationScore,
			review_score: reviewScore
		});

		// Generate detailed breakdown
		const scoreBreakdown = generateScoreBreakdown(
			product as Product,
			productFeatures,
			averageRating,
			reviewCount,
			buyerProfile
		);

		// Persist scores to database
		const { error: upsertError } = await supabase
			.from('product_scores')
			.upsert(
				{
					product_id: productId,
					fit_score: fitScore,
					feature_score: featureScore,
					integration_score: integrationScore,
					review_score: reviewScore,
					overall_score: overallScore,
					score_breakdown: scoreBreakdown as any,
					updated_at: new Date().toISOString()
				},
				{
					onConflict: 'product_id'
				}
			);

		if (upsertError) {
			throw new Error(`Failed to persist scores: ${upsertError.message}`);
		}

		return {
			fit_score: fitScore,
			feature_score: featureScore,
			integration_score: integrationScore,
			review_score: reviewScore,
			overall_score: overallScore,
			score_breakdown: scoreBreakdown
		};
	}

	/**
	 * Recalculate scores for all products
	 * Useful for batch updates when scoring algorithm changes
	 * 
	 * @param batchSize - Number of products to process at once
	 * @returns Number of products processed
	 */
	static async recalculateAllScores(batchSize: number = 50): Promise<number> {
		// Fetch all product IDs
		const { data: products, error: productsError } = await supabase
			.from('products')
			.select('id')
			.eq('status', 'active');

		if (productsError || !products) {
			throw new Error(`Failed to fetch products: ${productsError?.message}`);
		}

		let processedCount = 0;

		// Process in batches
		for (let i = 0; i < products.length; i += batchSize) {
			const batch = products.slice(i, i + batchSize);

			// Calculate scores for each product in batch
			const promises = batch.map((product: { id: string }) =>
				this.calculateScores(product.id).catch((error: Error) => {
					console.error(`Failed to calculate scores for product ${product.id}:`, error);
					return null;
				})
			);

			await Promise.all(promises);
			processedCount += batch.length;

			console.log(`Processed ${processedCount} of ${products.length} products`);
		}

		return processedCount;
	}

	/**
	 * Get scores for a product
	 * 
	 * @param productId - Product ID
	 * @returns Product scores or null if not found
	 */
	static async getScores(productId: string): Promise<{
		fit_score: number;
		feature_score: number;
		integration_score: number;
		review_score: number;
		overall_score: number;
		score_breakdown: ScoreBreakdown;
	} | null> {
		const { data, error } = await supabase
			.from('product_scores')
			.select('*')
			.eq('product_id', productId)
			.single();

		if (error || !data) {
			return null;
		}

		return {
			fit_score: data.fit_score,
			feature_score: data.feature_score,
			integration_score: data.integration_score,
			review_score: data.review_score,
			overall_score: data.overall_score,
			score_breakdown: data.score_breakdown as ScoreBreakdown
		};
	}
}
