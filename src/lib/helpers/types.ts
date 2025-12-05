import type { Tables } from './database.types';

// Database table types from generated types
export type Product = Tables<'products'>;
export type Profile = Tables<'profiles'>;
export type Review = Tables<'reviews'>;
export type Bookmark = Tables<'bookmarks'>;
export type CartItem = Tables<'cart_items'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;

// Manual type definitions for new tables (until types are regenerated)
export interface ProductScore {
	id: string;
	product_id: string;
	fit_score: number;
	feature_score: number;
	integration_score: number;
	review_score: number;
	overall_score: number;
	created_at: string;
	updated_at: string;
}

export interface ProductAnalyticsDaily {
	id: string;
	product_id: string;
	date: string;
	views: number;
	unique_visitors: number;
	detail_page_views: number;
	bookmark_count: number;
	cart_additions: number;
	purchases: number;
	revenue: number;
	created_at: string;
}

export interface BuyerProductUsage {
	id: string;
	buyer_id: string;
	product_id: string;
	order_id: string;
	implementation_status: ImplementationStatus;
	usage_count: number;
	last_used_at: string | null;
	roi_actual: number | null;
	satisfaction_score: number | null;
	feedback_text: string | null;
	created_at: string;
	updated_at: string;
}

export interface Quote {
	id: string;
	product_id: string;
	buyer_id: string;
	company_size: number | null;
	requirements_text: string | null;
	quoted_price: number;
	pricing_breakdown: Record<string, any> | null;
	status: QuoteStatus;
	valid_until: string;
	created_at: string;
	updated_at: string;
}

export interface ProductDownload {
	id: string;
	product_id: string;
	buyer_id: string;
	order_id: string;
	download_url: string;
	downloaded_at: string;
	created_at: string;
}

export interface Bundle {
	id: string;
	name: string;
	description: string | null;
	discount_percentage: number;
	is_curated: boolean;
	created_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface BundleProduct {
	id: string;
	bundle_id: string;
	product_id: string;
	created_at: string;
}

export interface BuyerOnboarding {
	id: string;
	buyer_id: string;
	company_name: string | null;
	company_size: number | null;
	industry: string | null;
	interests: string[] | null;
	completed_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface SellerOnboarding {
	id: string;
	seller_id: string;
	company_name: string;
	business_registration: string | null;
	verification_status: string;
	verified_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface ProductFeature {
	id: string;
	product_id: string;
	feature_name: string;
	feature_description: string | null;
	feature_category: string | null;
	relevance_score: number;
	created_at: string;
	updated_at: string;
}

export interface CompetitorRelationship {
	id: string;
	product_id: string;
	competitor_product_id: string;
	similarity_score: number | null;
	market_overlap_score: number | null;
	created_at: string;
	updated_at: string;
}

// Enum types
export type ProductCategory = 'HR' | 'Law' | 'Office' | 'DevTools';
export type UserRole = 'buyer' | 'seller';
export type CloudClientType = 'cloud' | 'client' | 'hybrid';
export type ImplementationStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';
export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

// Extended product type with ratings
export interface ProductWithRating extends Product {
	average_rating: number;
	review_count: number;
}

// Score breakdown structure
export interface ScoreBreakdown {
	fit: {
		score: number;
		factors: {
			implementation_time: number;
			deployment_model: number;
			complexity: number;
			buyer_match?: number;
		};
	};
	feature: {
		score: number;
		factors: {
			completeness: number;
			description_quality: number;
			feature_count: number;
			high_value_features: number;
		};
	};
	integration: {
		score: number;
		factors: {
			deployment_type: number;
			category_ecosystem: number;
			api_availability: number;
			buyer_compatibility?: number;
		};
	};
	review: {
		score: number;
		factors: {
			average_rating: number;
			review_count: number;
			confidence_adjustment: number;
		};
	};
}

// Extended product type with scores
export interface ProductWithScores extends ProductWithRating {
	fit_score: number; // 0-100
	feature_score: number; // 0-100
	integration_score: number; // 0-100
	review_score: number; // 0-100
	overall_score: number; // 0-100
	score_breakdown?: ScoreBreakdown;
	features?: ProductFeature[];
}

// Cart item with product details
export interface CartItemWithProduct extends CartItem {
	product: ProductWithRating;
}

// Order with items
export interface OrderWithItems extends Order {
	items: OrderItemWithProduct[];
}

export interface OrderItemWithProduct extends OrderItem {
	product: ProductWithRating;
}

// Bookmark with product
export interface BookmarkWithProduct extends Bookmark {
	product: ProductWithRating;
}

// Review with buyer info
export interface ReviewWithBuyer extends Review {
	buyer: {
		full_name: string | null;
		email: string;
	};
}

// Review with product info
export interface ReviewWithProduct extends Review {
	product: ProductWithRating;
}

// Analytics types
export interface TimeSeriesData {
	date: string;
	value: number;
	label?: string;
}

export interface ConversionFunnel {
	views: number;
	detail_views: number;
	cart_adds: number;
	purchases: number;
	conversion_rates: {
		view_to_detail: number;
		detail_to_cart: number;
		cart_to_purchase: number;
		overall: number;
	};
}

export interface RatingDistribution {
	five_star: number;
	four_star: number;
	three_star: number;
	two_star: number;
	one_star: number;
}

export interface ProductAnalytics {
	product_id: string;

	// Traffic metrics
	total_views: number;
	unique_visitors: number;
	detail_page_views: number;
	comparison_adds: number;
	traffic_trend: TimeSeriesData[];

	// Engagement metrics
	total_bookmarks: number;
	bookmark_rate: number;
	total_cart_adds: number;
	cart_add_rate: number;
	quote_requests: number;
	average_time_on_page: number;
	bounce_rate: number;
	return_visitor_rate: number;
	engagement_trend: TimeSeriesData[];

	// Conversion metrics
	total_purchases: number;
	conversion_rate: number;
	total_revenue: number;
	average_order_value: number;
	conversion_funnel: ConversionFunnel;
	revenue_trend: TimeSeriesData[];

	// Competitive metrics
	market_share_percentage: number;
	category_rank: number;

	// Review metrics
	average_rating: number;
	review_count: number;
	rating_distribution: RatingDistribution;
	review_trend: TimeSeriesData[];
}

export interface CustomerSegment {
	segment_name: string;
	customer_count: number;
	average_order_value: number;
	repeat_purchase_rate: number;
}

export interface MarketPosition {
	category: string;
	rank: number;
	total_competitors: number;
	market_share: number;
	position: 'leader' | 'challenger' | 'follower';
}

export interface CategoryRanking {
	category: string;
	rank: number;
	score: number;
	trend: 'up' | 'down' | 'stable';
}

export interface ProductPerformanceSummary {
	product: ProductWithScores;
	views: number;
	conversion_rate: number;
	revenue: number;
	growth_rate: number;
	trend: 'up' | 'down' | 'stable';
}

export interface SellerDashboard {
	// Overview metrics
	total_products: number;
	total_revenue: number;
	total_orders: number;
	average_rating: number;

	// Performance charts
	revenue_trend: TimeSeriesData[];
	order_trend: TimeSeriesData[];
	conversion_trend: TimeSeriesData[];

	// Product performance
	top_products: ProductPerformanceSummary[];
	underperforming_products: ProductPerformanceSummary[];

	// Customer insights
	recent_reviews: ReviewWithBuyer[];
	customer_segments: CustomerSegment[];
	repeat_customer_rate: number;

	// Competitive position
	market_position: MarketPosition;
	category_rankings: CategoryRanking[];
}

// Competitor analysis types
export interface PriceComparison {
	your_price: number;
	competitor_average: number;
	market_low: number;
	market_high: number;
	position: 'premium' | 'competitive' | 'budget';
}

export interface FeatureComparison {
	feature_name: string;
	your_product: boolean;
	competitors_with_feature: number;
	total_competitors: number;
	importance_score: number;
}

export interface MetricComparison {
	roi: { yours: number; competitor_avg: number };
	retention: { yours: number; competitor_avg: number };
	implementation_time: { yours: number; competitor_avg: number };
}

export interface ScoreComparison {
	your_scores: {
		fit_score: number;
		feature_score: number;
		integration_score: number;
		review_score: number;
		overall_score: number;
	};
	competitor_average: {
		fit_score: number;
		feature_score: number;
		integration_score: number;
		review_score: number;
		overall_score: number;
	};
	market_leader: {
		fit_score: number;
		feature_score: number;
		integration_score: number;
		review_score: number;
		overall_score: number;
	};
}

export interface ImprovementSuggestion {
	category: string; // pricing, features, marketing, support
	priority: 'high' | 'medium' | 'low';
	suggestion: string;
	expected_impact: string;
	based_on_metrics: string[];
	estimated_effort: string;
}

export interface CompetitorProduct extends ProductWithScores {
	similarity_score: number;
	market_overlap_score: number;
	price_difference: number;
	price_difference_percentage: number;
	rating_difference: number;
	score_differences: {
		fit: number;
		feature: number;
		integration: number;
		review: number;
		overall: number;
	};
}

export interface CompetitorAnalysis {
	product: ProductWithScores;
	competitors: CompetitorProduct[];
	market_position: 'leader' | 'challenger' | 'follower';

	// Detailed comparisons
	price_comparison: PriceComparison;
	feature_comparison: FeatureComparison[];
	metric_comparison: MetricComparison;
	score_comparison: ScoreComparison;

	// Improvement suggestions
	improvement_suggestions: ImprovementSuggestion[];
	is_premium_unlocked: boolean;
}

// Buyer dashboard types
export interface CategorySpending {
	category: string;
	amount: number;
	product_count: number;
}

export interface ImplementationTimeline {
	product_name: string;
	start_date: string;
	expected_completion: string;
	actual_completion?: string;
	status: string;
}

export interface PurchasedProductSummary {
	product: ProductWithRating;
	purchase_date: string;
	implementation_status: string;
	usage_count: number;
	roi_actual: number | null;
	roi_expected: number | null;
	satisfaction_score: number | null;
}

export interface ProductPerformance {
	product: ProductWithRating;
	usage_metrics: {
		usage_count: number;
		last_used_at: string | null;
		active_users: number;
		usage_frequency: string | null;
	};
	performance_metrics: {
		roi_actual: number | null;
		roi_expected: number | null;
		satisfaction_score: number | null;
		time_saved_hours: number | null;
		cost_saved: number | null;
	};
	implementation: {
		status: string;
		started_at: string | null;
		completed_at: string | null;
	};
	feedback: {
		feedback_text: string | null;
		feature_requests: any;
		issues_reported: any;
	};
}

export interface BuyerDashboard {
	// Overview
	purchased_products: PurchasedProductSummary[];
	total_spent: number;
	active_products: number;
	average_roi: number;

	// Performance tracking
	roi_trend: TimeSeriesData[];
	usage_trend: TimeSeriesData[];
	satisfaction_trend: TimeSeriesData[];

	// Product health
	well_performing_products: PurchasedProductSummary[];
	underutilized_products: PurchasedProductSummary[];

	// Recommendations
	recommended_products: ProductWithScores[];
	recommended_bundles: ProductBundle[];

	// Charts and visualizations
	spending_by_category: CategorySpending[];
	implementation_timeline: ImplementationTimeline[];
}

// Quote types
export interface QuoteRequest {
	product_id: string;
	buyer_id: string;
	company_size: number;
	requirements: Record<string, any>;
	buyer_company_info: Record<string, any>;
	additional_notes?: string;
}

// Bundle types
export interface ProductBundle {
	id: string;
	name: string;
	description: string;
	products: ProductWithRating[];
	total_price: number;
	discounted_price: number;
	discount_percentage: number;
}

// Filter types
export interface ProductFilters {
	category?: ProductCategory;
	minPrice?: number;
	maxPrice?: number;
	minRating?: number;
	featured?: boolean;
	new?: boolean;
}

// Legacy type for existing components (to be removed)
export type ListingInfo = {
	uid: string;
	created_at: string;
	creator_id: string;
	title: string;
	description: string;
	tags: string[];
	public: true;
};