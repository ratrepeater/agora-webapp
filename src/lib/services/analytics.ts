import { supabase } from '$lib/helpers/supabase.server';
import type {
	ProductAnalytics,
	SellerDashboard,
	TimeSeriesData,
	ConversionFunnel,
	RatingDistribution,
	ProductPerformanceSummary,
	ReviewWithBuyer,
	CustomerSegment,
	MarketPosition,
	CategoryRanking,
	ProductWithScores,
	CompetitorAnalysis
} from '$lib/helpers/types';

/**
 * AnalyticsService - Handles all analytics-related operations
 * Implements tracking methods and analytics retrieval for sellers and buyers
 */
export class AnalyticsService {
	/**
	 * Track a product view event
	 * @param productId - Product ID
	 * @param buyerId - Optional buyer ID for authenticated users
	 */
	async trackProductView(productId: string, buyerId?: string): Promise<void> {
		const today = new Date().toISOString().split('T')[0];

		// Get or create analytics record for today
		const { data: existing } = await supabase
			.from('product_analytics_daily')
			.select('*')
			.eq('product_id', productId)
			.eq('date', today)
			.maybeSingle();

		if (existing) {
			// Update existing record
			await supabase
				.from('product_analytics_daily')
				.update({
					views: existing.views + 1,
					unique_visitors: buyerId ? existing.unique_visitors + 1 : existing.unique_visitors
				})
				.eq('product_id', existing.product_id)
				.eq('date', existing.date);
		} else {
			// Create new record
			await supabase.from('product_analytics_daily').insert({
				product_id: productId,
				date: today,
				views: 1,
				unique_visitors: buyerId ? 1 : 0
			});
		}
	}

	/**
	 * Track a bookmark event
	 * @param productId - Product ID
	 * @param buyerId - Buyer ID
	 */
	async trackBookmark(productId: string, buyerId: string): Promise<void> {
		const today = new Date().toISOString().split('T')[0];

		const { data: existing } = await supabase
			.from('product_analytics_daily')
			.select('*')
			.eq('product_id', productId)
			.eq('date', today)
			.maybeSingle();

		if (existing) {
			await supabase
				.from('product_analytics_daily')
				.update({
					bookmarks: existing.bookmarks + 1
				})
				.eq('product_id', existing.product_id)
				.eq('date', existing.date);
		} else {
			await supabase.from('product_analytics_daily').insert({
				product_id: productId,
				date: today,
				bookmarks: 1
			});
		}
	}

	/**
	 * Track a cart add event
	 * @param productId - Product ID
	 * @param buyerId - Buyer ID
	 */
	async trackCartAdd(productId: string, buyerId: string): Promise<void> {
		const today = new Date().toISOString().split('T')[0];

		const { data: existing } = await supabase
			.from('product_analytics_daily')
			.select('*')
			.eq('product_id', productId)
			.eq('date', today)
			.maybeSingle();

		if (existing) {
			await supabase
				.from('product_analytics_daily')
				.update({
					cart_adds: existing.cart_adds + 1
				})
				.eq('product_id', existing.product_id)
				.eq('date', existing.date);
		} else {
			await supabase.from('product_analytics_daily').insert({
				product_id: productId,
				date: today,
				cart_adds: 1
			});
		}
	}

	/**
	 * Track a purchase event
	 * @param productId - Product ID
	 * @param buyerId - Buyer ID
	 * @param amount - Purchase amount in cents
	 */
	async trackPurchase(productId: string, buyerId: string, amount: number): Promise<void> {
		const today = new Date().toISOString().split('T')[0];

		const { data: existing } = await supabase
			.from('product_analytics_daily')
			.select('*')
			.eq('product_id', productId)
			.eq('date', today)
			.maybeSingle();

		if (existing) {
			await supabase
				.from('product_analytics_daily')
				.update({
					purchases: existing.purchases + 1,
					revenue: existing.revenue + amount
				})
				.eq('product_id', existing.product_id)
				.eq('date', existing.date);
		} else {
			await supabase.from('product_analytics_daily').insert({
				product_id: productId,
				date: today,
				purchases: 1,
				revenue: amount
			});
		}
	}

	/**
	 * Get comprehensive analytics for a specific product
	 * @param productId - Product ID
	 * @returns Product analytics with traffic, engagement, and conversion metrics
	 */
	async getProductAnalytics(productId: string): Promise<ProductAnalytics> {
		// Get all analytics records for this product
		const { data: analyticsData, error } = await supabase
			.from('product_analytics_daily')
			.select('*')
			.eq('product_id', productId)
			.order('date', { ascending: true });

		if (error) {
			throw new Error(`Failed to fetch product analytics: ${error.message}`);
		}

		const records = analyticsData || [];

		// Calculate aggregate metrics
		const total_views = records.reduce((sum, r) => sum + (r.views || 0), 0);
		const unique_visitors = records.reduce((sum, r) => sum + (r.unique_visitors || 0), 0);
		const detail_page_views = records.reduce((sum, r) => sum + (r.detail_page_views || 0), 0);
		const comparison_adds = records.reduce((sum, r) => sum + (r.comparison_adds || 0), 0);
		const total_bookmarks = records.reduce((sum, r) => sum + (r.bookmarks || 0), 0);
		const total_cart_adds = records.reduce((sum, r) => sum + (r.cart_adds || 0), 0);
		const quote_requests = records.reduce((sum, r) => sum + (r.quote_requests || 0), 0);
		const total_purchases = records.reduce((sum, r) => sum + (r.purchases || 0), 0);
		const total_revenue = records.reduce((sum, r) => sum + (r.revenue || 0), 0);

		// Calculate rates
		const bookmark_rate = total_views > 0 ? total_bookmarks / total_views : 0;
		const cart_add_rate = total_views > 0 ? total_cart_adds / total_views : 0;
		const conversion_rate = total_views > 0 ? total_purchases / total_views : 0;
		const average_order_value = total_purchases > 0 ? total_revenue / total_purchases : 0;

		// Build time series data
		const traffic_trend: TimeSeriesData[] = records.map((r) => ({
			date: r.date,
			value: r.views || 0
		}));

		const engagement_trend: TimeSeriesData[] = records.map((r) => ({
			date: r.date,
			value: (r.bookmarks || 0) + (r.cart_adds || 0)
		}));

		const revenue_trend: TimeSeriesData[] = records.map((r) => ({
			date: r.date,
			value: r.revenue || 0
		}));

		// Build conversion funnel
		const conversion_funnel: ConversionFunnel = {
			views: total_views,
			detail_views: detail_page_views,
			cart_adds: total_cart_adds,
			purchases: total_purchases,
			conversion_rates: {
				view_to_detail: total_views > 0 ? detail_page_views / total_views : 0,
				detail_to_cart: detail_page_views > 0 ? total_cart_adds / detail_page_views : 0,
				cart_to_purchase: total_cart_adds > 0 ? total_purchases / total_cart_adds : 0,
				overall: conversion_rate
			}
		};

		// Get review metrics
		const { data: reviews } = await supabase
			.from('reviews')
			.select('rating')
			.eq('product_id', productId);

		const ratings = (reviews || []).map((r) => r.rating).filter((r) => r != null);
		const average_rating =
			ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
		const review_count = ratings.length;

		// Build rating distribution
		const rating_distribution: RatingDistribution = {
			five_star: ratings.filter((r) => r === 5).length,
			four_star: ratings.filter((r) => r === 4).length,
			three_star: ratings.filter((r) => r === 3).length,
			two_star: ratings.filter((r) => r === 2).length,
			one_star: ratings.filter((r) => r === 1).length
		};

		const review_trend: TimeSeriesData[] = [];

		return {
			product_id: productId,
			total_views,
			unique_visitors,
			detail_page_views,
			comparison_adds,
			traffic_trend,
			total_bookmarks,
			bookmark_rate,
			total_cart_adds,
			cart_add_rate,
			quote_requests,
			average_time_on_page: 0, // Not tracked yet
			bounce_rate: 0, // Not tracked yet
			return_visitor_rate: 0, // Not tracked yet
			engagement_trend,
			total_purchases,
			conversion_rate,
			total_revenue,
			average_order_value,
			conversion_funnel,
			revenue_trend,
			market_share_percentage: 0, // Requires category-wide calculation
			category_rank: 0, // Requires category-wide calculation
			average_rating,
			review_count,
			rating_distribution,
			review_trend
		};
	}

	/**
	 * Identify competitors for a product based on category and similarity
	 * @param productId - Product ID to find competitors for
	 * @returns Array of competitor relationships with scores
	 */
	async identifyCompetitors(productId: string): Promise<void> {
		// Get the product
		const { data: product, error: productError } = await supabase
			.from('products')
			.select('*')
			.eq('id', productId)
			.maybeSingle();

		if (productError) {
			throw new Error(`Failed to fetch product: ${productError.message}`);
		}

		if (!product) {
			throw new Error(`Product not found: ${productId}`);
		}

		// Get all products in the same category (excluding the product itself)
		const { data: categoryProducts, error: categoryError } = await supabase
			.from('products')
			.select('*')
			.eq('category_id', product.category_id)
			.neq('id', productId);

		if (categoryError) {
			throw new Error(`Failed to fetch category products: ${categoryError.message}`);
		}

		const competitors = categoryProducts || [];

		// Calculate similarity and market overlap scores for each competitor
		for (const competitor of competitors) {
			// Calculate similarity score (0-100) based on:
			// - Price similarity (30%)
			// - Description similarity (40%)
			// - Metrics similarity (30%)
			
			const priceSimilarity = this.calculatePriceSimilarity(
				product.price_cents,
				competitor.price_cents
			);
			
			const descriptionSimilarity = this.calculateDescriptionSimilarity(
				product.short_description || '',
				competitor.short_description || ''
			);
			
			const metricsSimilarity = this.calculateMetricsSimilarity(product, competitor);
			
			const similarity_score = 
				priceSimilarity * 0.3 + 
				descriptionSimilarity * 0.4 + 
				metricsSimilarity * 0.3;

			// Calculate market overlap score (0-100) based on:
			// - Same category (base 50 points)
			// - Similar price range (25 points)
			// - Similar target market (25 points)
			let market_overlap_score = 50; // Base for same category
			
			// Similar price range (within 50%)
			const priceRatio = Math.min(product.price_cents, competitor.price_cents) / 
				Math.max(product.price_cents, competitor.price_cents);
			if (priceRatio > 0.5) {
				market_overlap_score += 25 * priceRatio;
			}
			
			// Similar target market (based on description overlap)
			market_overlap_score += descriptionSimilarity * 0.25;

			// Store or update the competitor relationship
			const { error: upsertError } = await supabase
				.from('competitor_relationships')
				.upsert({
					product_id: productId,
					competitor_product_id: competitor.id,
					similarity_score: Math.round(similarity_score * 100) / 100,
					market_overlap_score: Math.round(market_overlap_score * 100) / 100
				}, {
					onConflict: 'product_id,competitor_product_id'
				});

			if (upsertError) {
				console.error(`Failed to store competitor relationship: ${upsertError.message}`);
			}
		}
	}

	/**
	 * Calculate price similarity between two products (0-1)
	 */
	private calculatePriceSimilarity(price1: number, price2: number): number {
		if (price1 === 0 || price2 === 0) return 0;
		const ratio = Math.min(price1, price2) / Math.max(price1, price2);
		return ratio;
	}

	/**
	 * Calculate description similarity using simple word overlap (0-1)
	 */
	private calculateDescriptionSimilarity(desc1: string, desc2: string): number {
		const words1 = new Set(desc1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
		const words2 = new Set(desc2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
		
		if (words1.size === 0 || words2.size === 0) return 0;
		
		const intersection = new Set([...words1].filter(w => words2.has(w)));
		const union = new Set([...words1, ...words2]);
		
		return intersection.size / union.size;
	}

	/**
	 * Calculate metrics similarity between two products (0-1)
	 */
	private calculateMetricsSimilarity(product1: any, product2: any): number {
		// Compare key metrics if they exist
		let similarities: number[] = [];
		
		// Implementation time similarity
		if (product1.implementation_time_days && product2.implementation_time_days) {
			const ratio = Math.min(product1.implementation_time_days, product2.implementation_time_days) /
				Math.max(product1.implementation_time_days, product2.implementation_time_days);
			similarities.push(ratio);
		}
		
		// ROI similarity
		if (product1.roi_percentage && product2.roi_percentage) {
			const ratio = Math.min(product1.roi_percentage, product2.roi_percentage) /
				Math.max(product1.roi_percentage, product2.roi_percentage);
			similarities.push(ratio);
		}
		
		// Retention similarity
		if (product1.retention_rate && product2.retention_rate) {
			const ratio = Math.min(product1.retention_rate, product2.retention_rate) /
				Math.max(product1.retention_rate, product2.retention_rate);
			similarities.push(ratio);
		}
		
		return similarities.length > 0 
			? similarities.reduce((sum, s) => sum + s, 0) / similarities.length 
			: 0.5; // Default to 0.5 if no metrics to compare
	}

	/**
	 * Get comprehensive competitor analysis for a product
	 * @param productId - Product ID to analyze
	 * @returns Competitor analysis with comparisons and improvement suggestions
	 */
	async getCompetitorAnalysis(productId: string): Promise<CompetitorAnalysis> {
		// Get the product with scores and features
		const { data: product, error: productError } = await supabase
			.from('products')
			.select(`
				*,
				reviews (rating),
				product_scores (*),
				product_features (*)
			`)
			.eq('id', productId)
			.single();

		if (productError || !product) {
			throw new Error(`Failed to fetch product: ${productError?.message}`);
		}

		// Calculate average rating
		const reviews = product.reviews || [];
		const ratings = reviews.map((r: any) => r.rating).filter((r: number) => r != null);
		const average_rating = ratings.length > 0 
			? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length 
			: 0;

		// Get product scores
		const scores = product.product_scores?.[0] || {
			fit_score: 0,
			feature_score: 0,
			integration_score: 0,
			review_score: 0,
			overall_score: 0
		};

		// Build ProductWithScores
		const productWithScores: import('$lib/helpers/types').ProductWithScores = {
			...product,
			average_rating,
			review_count: ratings.length,
			fit_score: scores.fit_score || 0,
			feature_score: scores.feature_score || 0,
			integration_score: scores.integration_score || 0,
			review_score: scores.review_score || 0,
			overall_score: scores.overall_score || 0,
			score_breakdown: scores.score_breakdown,
			features: product.product_features || []
		};

		// Get competitor relationships
		const { data: relationships, error: relationshipsError } = await supabase
			.from('competitor_relationships')
			.select('*')
			.eq('product_id', productId)
			.order('similarity_score', { ascending: false })
			.limit(5); // Top 5 competitors

		if (relationshipsError) {
			throw new Error(`Failed to fetch competitor relationships: ${relationshipsError.message}`);
		}

		// Fetch competitor products with details
		const competitorIds = (relationships || []).map(r => r.competitor_product_id);
		const { data: competitorProducts, error: competitorsError } = await supabase
			.from('products')
			.select(`
				*,
				reviews (rating),
				product_scores (*),
				product_features (*)
			`)
			.in('id', competitorIds);

		if (competitorsError) {
			throw new Error(`Failed to fetch competitor products: ${competitorsError.message}`);
		}

		// Build CompetitorProduct array
		const competitors: import('$lib/helpers/types').CompetitorProduct[] = (competitorProducts || []).map((comp: any) => {
			const relationship = relationships?.find(r => r.competitor_product_id === comp.id);
			const compReviews = comp.reviews || [];
			const compRatings = compReviews.map((r: any) => r.rating).filter((r: number) => r != null);
			const compAvgRating = compRatings.length > 0 
				? compRatings.reduce((sum: number, r: number) => sum + r, 0) / compRatings.length 
				: 0;

			const compScores = comp.product_scores?.[0] || {
				fit_score: 0,
				feature_score: 0,
				integration_score: 0,
				review_score: 0,
				overall_score: 0
			};

			const price_difference = comp.price_cents - product.price_cents;
			const price_difference_percentage = product.price_cents > 0 
				? (price_difference / product.price_cents) * 100 
				: 0;

			return {
				...comp,
				average_rating: compAvgRating,
				review_count: compRatings.length,
				fit_score: compScores.fit_score || 0,
				feature_score: compScores.feature_score || 0,
				integration_score: compScores.integration_score || 0,
				review_score: compScores.review_score || 0,
				overall_score: compScores.overall_score || 0,
				score_breakdown: compScores.score_breakdown,
				features: comp.product_features || [],
				similarity_score: relationship?.similarity_score || 0,
				market_overlap_score: relationship?.market_overlap_score || 0,
				price_difference,
				price_difference_percentage,
				rating_difference: compAvgRating - average_rating,
				score_differences: {
					fit: (compScores.fit_score || 0) - scores.fit_score,
					feature: (compScores.feature_score || 0) - scores.feature_score,
					integration: (compScores.integration_score || 0) - scores.integration_score,
					review: (compScores.review_score || 0) - scores.review_score,
					overall: (compScores.overall_score || 0) - scores.overall_score
				}
			};
		});

		// Calculate market position
		const allScores = [scores.overall_score, ...competitors.map(c => c.overall_score)];
		const sortedScores = [...allScores].sort((a, b) => b - a);
		const productRank = sortedScores.indexOf(scores.overall_score) + 1;
		const market_position: 'leader' | 'challenger' | 'follower' = 
			productRank === 1 ? 'leader' : 
			productRank <= 3 ? 'challenger' : 
			'follower';

		// Calculate price comparison
		const competitorPrices = competitors.map(c => c.price_cents);
		const price_comparison: import('$lib/helpers/types').PriceComparison = {
			your_price: product.price_cents,
			competitor_average: competitorPrices.length > 0 
				? competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length 
				: product.price_cents,
			market_low: competitorPrices.length > 0 ? Math.min(...competitorPrices) : product.price_cents,
			market_high: competitorPrices.length > 0 ? Math.max(...competitorPrices) : product.price_cents,
			position: this.determinePricePosition(product.price_cents, competitorPrices)
		};

		// Calculate feature comparison
		const yourFeatures = new Set((product.product_features || []).map((f: any) => f.feature_name));
		const allFeatureNames = new Set<string>();
		competitors.forEach(c => {
			(c.features || []).forEach((f: any) => allFeatureNames.add(f.feature_name));
		});

		const feature_comparison: import('$lib/helpers/types').FeatureComparison[] = Array.from(allFeatureNames).map(featureName => {
			const competitorsWithFeature = competitors.filter(c => 
				(c.features || []).some((f: any) => f.feature_name === featureName)
			).length;

			return {
				feature_name: featureName,
				your_product: yourFeatures.has(featureName),
				competitors_with_feature: competitorsWithFeature,
				total_competitors: competitors.length,
				importance_score: (competitorsWithFeature / competitors.length) * 100
			};
		}).sort((a, b) => b.importance_score - a.importance_score);

		// Calculate metric comparison
		const competitorAvgROI = competitors.length > 0 
			? competitors.reduce((sum, c) => sum + (c.roi_percentage || 0), 0) / competitors.length 
			: 0;
		const competitorAvgRetention = competitors.length > 0 
			? competitors.reduce((sum, c) => sum + (c.retention_rate || 0), 0) / competitors.length 
			: 0;
		const competitorAvgImplTime = competitors.length > 0 
			? competitors.reduce((sum, c) => sum + (c.implementation_time_days || 0), 0) / competitors.length 
			: 0;

		const metric_comparison: import('$lib/helpers/types').MetricComparison = {
			roi: { 
				yours: product.roi_percentage || 0, 
				competitor_avg: competitorAvgROI 
			},
			retention: { 
				yours: product.retention_rate || 0, 
				competitor_avg: competitorAvgRetention 
			},
			implementation_time: { 
				yours: product.implementation_time_days || 0, 
				competitor_avg: competitorAvgImplTime 
			}
		};

		// Calculate score comparison
		const competitorAvgScores = {
			fit_score: competitors.length > 0 
				? competitors.reduce((sum, c) => sum + c.fit_score, 0) / competitors.length 
				: 0,
			feature_score: competitors.length > 0 
				? competitors.reduce((sum, c) => sum + c.feature_score, 0) / competitors.length 
				: 0,
			integration_score: competitors.length > 0 
				? competitors.reduce((sum, c) => sum + c.integration_score, 0) / competitors.length 
				: 0,
			review_score: competitors.length > 0 
				? competitors.reduce((sum, c) => sum + c.review_score, 0) / competitors.length 
				: 0,
			overall_score: competitors.length > 0 
				? competitors.reduce((sum, c) => sum + c.overall_score, 0) / competitors.length 
				: 0
		};

		const marketLeader = competitors.length > 0 
			? competitors.reduce((leader, c) => c.overall_score > leader.overall_score ? c : leader, competitors[0])
			: null;

		const score_comparison: import('$lib/helpers/types').ScoreComparison = {
			your_scores: {
				fit_score: scores.fit_score || 0,
				feature_score: scores.feature_score || 0,
				integration_score: scores.integration_score || 0,
				review_score: scores.review_score || 0,
				overall_score: scores.overall_score || 0
			},
			competitor_average: competitorAvgScores,
			market_leader: marketLeader ? {
				fit_score: marketLeader.fit_score,
				feature_score: marketLeader.feature_score,
				integration_score: marketLeader.integration_score,
				review_score: marketLeader.review_score,
				overall_score: marketLeader.overall_score
			} : competitorAvgScores
		};

		// Generate improvement suggestions
		const improvement_suggestions = this.generateImprovementSuggestions(
			productWithScores,
			competitors,
			price_comparison,
			feature_comparison,
			metric_comparison,
			score_comparison
		);

		return {
			product: productWithScores,
			competitors,
			market_position,
			price_comparison,
			feature_comparison,
			metric_comparison,
			score_comparison,
			improvement_suggestions,
			is_premium_unlocked: false // For future premium feature
		};
	}

	/**
	 * Determine price position relative to competitors
	 */
	private determinePricePosition(
		yourPrice: number, 
		competitorPrices: number[]
	): 'premium' | 'competitive' | 'budget' {
		if (competitorPrices.length === 0) return 'competitive';
		
		const avgPrice = competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length;
		
		if (yourPrice > avgPrice * 1.2) return 'premium';
		if (yourPrice < avgPrice * 0.8) return 'budget';
		return 'competitive';
	}

	/**
	 * Generate improvement suggestions based on competitive analysis
	 */
	private generateImprovementSuggestions(
		product: import('$lib/helpers/types').ProductWithScores,
		competitors: import('$lib/helpers/types').CompetitorProduct[],
		priceComparison: import('$lib/helpers/types').PriceComparison,
		featureComparison: import('$lib/helpers/types').FeatureComparison[],
		metricComparison: import('$lib/helpers/types').MetricComparison,
		scoreComparison: import('$lib/helpers/types').ScoreComparison
	): import('$lib/helpers/types').ImprovementSuggestion[] {
		const suggestions: import('$lib/helpers/types').ImprovementSuggestion[] = [];

		// Pricing suggestions
		if (priceComparison.position === 'premium' && product.overall_score < scoreComparison.competitor_average.overall_score) {
			suggestions.push({
				category: 'pricing',
				priority: 'high',
				suggestion: 'Consider reducing price to be more competitive. Your premium pricing is not supported by higher scores.',
				expected_impact: 'Increase conversion rate by 15-25%',
				based_on_metrics: ['price_comparison', 'overall_score'],
				estimated_effort: 'Low - pricing adjustment'
			});
		}

		// Feature suggestions
		const missingImportantFeatures = featureComparison
			.filter(f => !f.your_product && f.importance_score > 60)
			.slice(0, 3);

		if (missingImportantFeatures.length > 0) {
			suggestions.push({
				category: 'features',
				priority: 'high',
				suggestion: `Add these commonly expected features: ${missingImportantFeatures.map(f => f.feature_name).join(', ')}`,
				expected_impact: 'Improve feature score by 10-20 points',
				based_on_metrics: ['feature_comparison'],
				estimated_effort: 'Medium - feature development required'
			});
		}

		// ROI improvement suggestions
		if (metricComparison.roi.yours < metricComparison.roi.competitor_avg * 0.8) {
			suggestions.push({
				category: 'marketing',
				priority: 'medium',
				suggestion: 'Improve ROI messaging and case studies to match competitor claims',
				expected_impact: 'Increase buyer confidence and conversion',
				based_on_metrics: ['roi_comparison'],
				estimated_effort: 'Low - marketing content update'
			});
		}

		// Review score suggestions
		if (scoreComparison.your_scores.review_score < scoreComparison.competitor_average.review_score - 10) {
			suggestions.push({
				category: 'support',
				priority: 'high',
				suggestion: 'Focus on improving customer satisfaction to boost review scores',
				expected_impact: 'Increase review score by 10-15 points',
				based_on_metrics: ['review_score'],
				estimated_effort: 'Medium - customer success initiatives'
			});
		}

		// Integration score suggestions
		if (scoreComparison.your_scores.integration_score < scoreComparison.competitor_average.integration_score - 10) {
			suggestions.push({
				category: 'features',
				priority: 'medium',
				suggestion: 'Improve integration capabilities and API documentation',
				expected_impact: 'Increase integration score by 10-15 points',
				based_on_metrics: ['integration_score'],
				estimated_effort: 'High - technical development required'
			});
		}

		return suggestions.sort((a, b) => {
			const priorityOrder = { high: 0, medium: 1, low: 2 };
			return priorityOrder[a.priority] - priorityOrder[b.priority];
		});
	}

	/**
	 * Get comprehensive dashboard data for a seller
	 * @param sellerId - Seller's profile ID
	 * @returns Seller dashboard with overview and performance data
	 */
	async getSellerDashboard(sellerId: string): Promise<SellerDashboard> {
		// Get all seller products
		const { data: products, error: productsError } = await supabase
			.from('products')
			.select(
				`
				*,
				reviews (rating)
			`
			)
			.eq('seller_id', sellerId);

		if (productsError) {
			throw new Error(`Failed to fetch seller products: ${productsError.message}`);
		}

		const productIds = (products || []).map((p) => p.id);

		console.log('Seller products:', products?.length, 'Product IDs:', productIds);

		// Get analytics for all products
		const { data: analyticsData } = await supabase
			.from('product_analytics_daily')
			.select('*')
			.in('product_id', productIds)
			.order('date', { ascending: true });

		const records = analyticsData || [];

		console.log('Analytics records fetched:', records.length);
		if (records.length > 0) {
			console.log('Sample record:', records[0]);
		}

		// Calculate overview metrics
		const total_products = products?.length || 0;
		
		// Calculate total revenue from analytics (sum of all purchases * product prices)
		// Get total purchases from analytics
		const total_purchases = records.reduce((sum, r) => sum + ((r as any).purchases || 0), 0);
		
		// Calculate revenue by summing up each product's (purchases * price)
		let total_revenue = 0;
		for (const product of products || []) {
			const productRecords = records.filter((r) => (r as any).product_id === product.id);
			const productPurchases = productRecords.reduce((sum, r) => sum + ((r as any).purchases || 0), 0);
			total_revenue += productPurchases * (product as any).price_cents;
		}

		// Get total orders from the orders table by counting distinct order IDs for this seller's products
		const { data: orderItems } = await supabase
			.from('order_items')
			.select('order_id')
			.in('product_id', productIds);

		const uniqueOrderIds = new Set((orderItems || []).map((o) => o.order_id));
		const total_orders = uniqueOrderIds.size;

		// Calculate average rating across all products
		const allRatings = (products || []).flatMap((p) =>
			(p.reviews || []).map((r: any) => r.rating).filter((r: number) => r != null)
		);
		const average_rating =
			allRatings.length > 0 ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length : 0;

		// Build time series data
		const dateMap = new Map<string, { revenue: number; orders: number; conversions: number }>();

		records.forEach((r: any) => {
			const existing = dateMap.get(r.date) || { revenue: 0, orders: 0, conversions: 0 };
			dateMap.set(r.date, {
				revenue: existing.revenue + (r.revenue || 0),
				orders: existing.orders + (r.purchases || 0),
				conversions: existing.conversions + (r.purchases || 0)
			});
		});

		const revenue_trend: TimeSeriesData[] = Array.from(dateMap.entries()).map(([date, data]) => ({
			date,
			value: data.revenue
		}));

		const order_trend: TimeSeriesData[] = Array.from(dateMap.entries()).map(([date, data]) => ({
			date,
			value: data.orders
		}));

		const conversion_trend: TimeSeriesData[] = Array.from(dateMap.entries()).map(
			([date, data]) => ({
				date,
				value: data.conversions
			})
		);

		// Calculate product performance summaries
		const productPerformances = await Promise.all(
			productIds.map(async (productId) => {
				const productRecords = records.filter((r: any) => r.product_id === productId);
				const views = productRecords.reduce((sum, r: any) => sum + (r.views || 0), 0);
				const purchases = productRecords.reduce((sum, r: any) => sum + (r.purchases || 0), 0);
				const revenue = productRecords.reduce((sum, r: any) => sum + (r.revenue || 0), 0);
				const conversion_rate = views > 0 ? purchases / views : 0;

				const product = products?.find((p) => p.id === productId);
				if (!product) return null;

				// Calculate growth rate (last 7 days vs previous 7 days)
				const last7Days = productRecords.slice(-7);
				const previous7Days = productRecords.slice(-14, -7);
				const recentRevenue = last7Days.reduce((sum, r: any) => sum + (r.revenue || 0), 0);
				const previousRevenue = previous7Days.reduce((sum, r: any) => sum + (r.revenue || 0), 0);
				const growth_rate =
					previousRevenue > 0 ? (recentRevenue - previousRevenue) / previousRevenue : 0;

				const trend: 'up' | 'down' | 'stable' =
					growth_rate > 0.05 ? 'up' : growth_rate < -0.05 ? 'down' : 'stable';

				// Enrich product with ratings
				const reviews = product.reviews || [];
				const ratings = reviews.map((r: any) => r.rating).filter((r: number) => r != null);
				const avg_rating =
					ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;

				const productWithScores: ProductWithScores = {
					...product,
					average_rating: avg_rating,
					review_count: ratings.length,
					fit_score: 0,
					feature_score: 0,
					integration_score: 0,
					review_score: 0,
					overall_score: 0
				};

				return {
					product: productWithScores,
					views,
					conversion_rate,
					revenue,
					growth_rate,
					trend
				} as ProductPerformanceSummary;
			})
		);

		const validPerformances = productPerformances.filter((p) => p !== null) as ProductPerformanceSummary[];

		// Sort by revenue to get top and underperforming
		const sortedByRevenue = [...validPerformances].sort((a, b) => b.revenue - a.revenue);
		const top_products = sortedByRevenue.slice(0, 5);
		const underperforming_products = sortedByRevenue.slice(-5).reverse();

		// Get recent reviews
		const { data: recentReviews } = await supabase
			.from('reviews')
			.select(
				`
				*,
				buyer:profiles!reviews_buyer_id_fkey (
					full_name,
					email
				)
			`
			)
			.in('product_id', productIds)
			.order('created_at', { ascending: false })
			.limit(10);

		const recent_reviews: ReviewWithBuyer[] = (recentReviews || []).map((r: any) => ({
			...r,
			buyer: {
				full_name: r.buyer?.full_name || null,
				email: r.buyer?.email || ''
			}
		}));

		// Customer segments (simplified)
		const customer_segments: CustomerSegment[] = [];

		// Market position (simplified)
		const market_position: MarketPosition = {
			category: 'All',
			rank: 0,
			total_competitors: 0,
			market_share: 0,
			position: 'follower'
		};

		// Category rankings (simplified)
		const category_rankings: CategoryRanking[] = [];

		return {
			total_products,
			total_revenue,
			total_orders,
			average_rating,
			revenue_trend,
			order_trend,
			conversion_trend,
			top_products,
			underperforming_products,
			recent_reviews,
			customer_segments,
			repeat_customer_rate: 0,
			market_position,
			category_rankings
		};
	}
}

// Export a singleton instance
export const analyticsService = new AnalyticsService();
