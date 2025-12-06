import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	BuyerProductUsage,
	ProductPerformance,
	PurchasedProductSummary,
	BuyerDashboard,
	TimeSeriesData,
	CategorySpending,
	ImplementationTimeline,
	ProductWithRating
} from '$lib/helpers/types';

/**
 * Service for managing buyer product usage tracking
 */
export class BuyerUsageService {
	constructor(private supabase: SupabaseClient) {}

	/**
	 * Initialize usage tracking for a purchased product
	 */
	async initializeUsage(
		buyerId: string,
		productId: string,
		orderId: string
	): Promise<BuyerProductUsage | null> {
		const { data, error } = await this.supabase
			.from('buyer_product_usage')
			.insert({
				buyer_id: buyerId,
				product_id: productId,
				order_id: orderId,
				implementation_status: 'not_started',
				usage_count: 0
			})
			.select()
			.single();

		if (error) {
			console.error('Error initializing usage:', error);
			return null;
		}

		return data as BuyerProductUsage;
	}

	/**
	 * Update implementation status
	 */
	async updateImplementationStatus(
		usageId: string,
		status: 'not_started' | 'in_progress' | 'completed' | 'paused'
	): Promise<BuyerProductUsage | null> {
		const updates: any = {
			implementation_status: status
		};

		// Set timestamps based on status
		if (status === 'in_progress') {
			updates.implementation_started_at = new Date().toISOString();
		} else if (status === 'completed') {
			updates.implementation_completed_at = new Date().toISOString();
		}

		const { data, error } = await this.supabase
			.from('buyer_product_usage')
			.update(updates)
			.eq('id', usageId)
			.select()
			.single();

		if (error) {
			console.error('Error updating implementation status:', error);
			return null;
		}

		return data as BuyerProductUsage;
	}

	/**
	 * Track product usage
	 */
	async trackUsage(usageId: string): Promise<BuyerProductUsage | null> {
		const { data, error } = await this.supabase
			.from('buyer_product_usage')
			.update({
				usage_count: this.supabase.rpc('increment', { x: 1 }),
				last_used_at: new Date().toISOString()
			})
			.eq('id', usageId)
			.select()
			.single();

		if (error) {
			console.error('Error tracking usage:', error);
			return null;
		}

		return data as BuyerProductUsage;
	}

	/**
	 * Update ROI metrics
	 */
	async updateROI(
		usageId: string,
		roiActual: number,
		roiExpected?: number
	): Promise<BuyerProductUsage | null> {
		const updates: any = {
			roi_actual: roiActual
		};

		if (roiExpected !== undefined) {
			updates.roi_expected = roiExpected;
		}

		const { data, error } = await this.supabase
			.from('buyer_product_usage')
			.update(updates)
			.eq('id', usageId)
			.select()
			.single();

		if (error) {
			console.error('Error updating ROI:', error);
			return null;
		}

		return data as BuyerProductUsage;
	}

	/**
	 * Update satisfaction score
	 */
	async updateSatisfaction(
		usageId: string,
		satisfactionScore: number
	): Promise<BuyerProductUsage | null> {
		if (satisfactionScore < 1 || satisfactionScore > 5) {
			console.error('Satisfaction score must be between 1 and 5');
			return null;
		}

		const { data, error } = await this.supabase
			.from('buyer_product_usage')
			.update({
				satisfaction_score: satisfactionScore
			})
			.eq('id', usageId)
			.select()
			.single();

		if (error) {
			console.error('Error updating satisfaction:', error);
			return null;
		}

		return data as BuyerProductUsage;
	}

	/**
	 * Submit feedback for a product
	 */
	async submitFeedback(
		usageId: string,
		feedbackText: string,
		featureRequests?: any[],
		issuesReported?: any[]
	): Promise<BuyerProductUsage | null> {
		const updates: any = {
			feedback_text: feedbackText
		};

		if (featureRequests) {
			updates.feature_requests = featureRequests;
		}

		if (issuesReported) {
			updates.issues_reported = issuesReported;
		}

		const { data, error } = await this.supabase
			.from('buyer_product_usage')
			.update(updates)
			.eq('id', usageId)
			.select()
			.single();

		if (error) {
			console.error('Error submitting feedback:', error);
			return null;
		}

		return data as BuyerProductUsage;
	}

	/**
	 * Get usage data for a specific product purchase
	 */
	async getUsageByOrderProduct(
		buyerId: string,
		productId: string,
		orderId: string
	): Promise<BuyerProductUsage | null> {
		const { data, error } = await this.supabase
			.from('buyer_product_usage')
			.select('*')
			.eq('buyer_id', buyerId)
			.eq('product_id', productId)
			.eq('order_id', orderId)
			.single();

		if (error) {
			console.error('Error getting usage:', error);
			return null;
		}

		return data as BuyerProductUsage;
	}

	/**
	 * Get all usage data for a buyer
	 */
	async getUsageByBuyer(buyerId: string): Promise<BuyerProductUsage[]> {
		const { data, error } = await this.supabase
			.from('buyer_product_usage')
			.select('*')
			.eq('buyer_id', buyerId)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error getting buyer usage:', error);
			return [];
		}

		return data as BuyerProductUsage[];
	}

	/**
	 * Get product performance details for a buyer
	 */
	async getProductPerformance(
		buyerId: string,
		productId: string
	): Promise<ProductPerformance | null> {
		// Get usage data
		const { data: usageData, error: usageError } = await this.supabase
			.from('buyer_product_usage')
			.select('*')
			.eq('buyer_id', buyerId)
			.eq('product_id', productId)
			.single();

		if (usageError || !usageData) {
			console.error('Error getting product performance:', usageError);
			return null;
		}

		// Get product data with rating
		const { data: productData, error: productError } = await this.supabase
			.from('products')
			.select(
				`
				*,
				reviews (rating)
			`
			)
			.eq('id', productId)
			.single();

		if (productError || !productData) {
			console.error('Error getting product:', productError);
			return null;
		}

		// Calculate average rating
		const reviews = (productData as any).reviews || [];
		const averageRating =
			reviews.length > 0
				? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
				: 0;

		const product: ProductWithRating = {
			...productData,
			average_rating: averageRating,
			review_count: reviews.length
		};

		return {
			product,
			usage_metrics: {
				usage_count: usageData.usage_count,
				last_used_at: usageData.last_used_at,
				active_users: usageData.active_users,
				usage_frequency: usageData.usage_frequency
			},
			performance_metrics: {
				roi_actual: usageData.roi_actual,
				roi_expected: usageData.roi_expected,
				satisfaction_score: usageData.satisfaction_score,
				time_saved_hours: usageData.time_saved_hours,
				cost_saved: usageData.cost_saved
			},
			implementation: {
				status: usageData.implementation_status,
				started_at: usageData.implementation_started_at,
				completed_at: usageData.implementation_completed_at
			},
			feedback: {
				feedback_text: usageData.feedback_text,
				feature_requests: usageData.feature_requests,
				issues_reported: usageData.issues_reported
			}
		};
	}

	/**
	 * Get buyer dashboard data
	 */
	async getBuyerDashboard(buyerId: string): Promise<BuyerDashboard | null> {
		// Get all orders for the buyer
		const { data: ordersData, error: ordersError } = await this.supabase
			.from('orders')
			.select('id, created_at')
			.eq('buyer_id', buyerId)
			.order('created_at', { ascending: false });

		if (ordersError || !ordersData) {
			console.error('Error getting orders:', ordersError);
			return null;
		}

		// Get order items for all orders
		const orderIds = ordersData.map((o) => o.id);
		if (orderIds.length === 0) {
			// No orders, return empty dashboard
			return {
				purchased_products: [],
				total_spent: 0,
				active_products: 0,
				average_roi: 0,
				roi_trend: [],
				usage_trend: [],
				satisfaction_trend: [],
				well_performing_products: [],
				underutilized_products: [],
				recommended_products: [],
				recommended_bundles: [],
				spending_by_category: [],
				implementation_timeline: []
			};
		}

		const { data: orderItemsData, error: orderItemsError } = await this.supabase
			.from('order_items')
			.select('order_id, product_id')
			.in('order_id', orderIds);

		if (orderItemsError || !orderItemsData) {
			console.error('Error getting order items:', orderItemsError);
			return null;
		}

		// Get products for all order items
		const productIds = [...new Set(orderItemsData.map((item) => item.product_id))];
		const { data: productsData, error: productsError } = await this.supabase
			.from('products')
			.select('*')
			.in('id', productIds);

		if (productsError || !productsData) {
			console.error('Error getting products:', productsError);
			return null;
		}

		// Get reviews for all products
		const { data: reviewsData } = await this.supabase
			.from('reviews')
			.select('product_id, rating')
			.in('product_id', productIds);

		// Build product map with ratings
		const productMap = new Map();
		for (const product of productsData) {
			const productReviews = (reviewsData || []).filter((r) => r.product_id === product.id);
			const averageRating =
				productReviews.length > 0
					? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
					: 0;

			productMap.set(product.id, {
				...product,
				average_rating: averageRating,
				review_count: productReviews.length
			});
		}

		// Get usage data for all products
		const usageData = await this.getUsageByBuyer(buyerId);
		const usageMap = new Map(
			usageData.map((u) => [`${u.product_id}-${u.order_id}`, u])
		);

		// Build purchased products summary
		const purchasedProducts: PurchasedProductSummary[] = [];
		let totalSpent = 0;

		// Create order map for quick lookup
		const orderMap = new Map(ordersData.map((o) => [o.id, o]));

		for (const orderItem of orderItemsData) {
			const product = productMap.get(orderItem.product_id);
			const order = orderMap.get(orderItem.order_id);
			if (!product || !order) continue;

			const usage = usageMap.get(`${product.id}-${order.id}`);

			purchasedProducts.push({
				product,
				purchase_date: order.created_at,
				implementation_status: usage?.implementation_status || 'not_started',
				usage_count: usage?.usage_count || 0,
				roi_actual: usage?.roi_actual || null,
				roi_expected: usage?.roi_expected || null,
				satisfaction_score: usage?.satisfaction_score || null
			});

			totalSpent += product.price_cents / 100;
		}

		// Calculate metrics
		const activeProducts = purchasedProducts.filter(
			(p) => p.implementation_status === 'completed' || p.implementation_status === 'in_progress'
		).length;

		const productsWithROI = purchasedProducts.filter((p) => p.roi_actual !== null);
		const averageROI =
			productsWithROI.length > 0
				? productsWithROI.reduce((sum, p) => sum + (p.roi_actual || 0), 0) / productsWithROI.length
				: 0;

		// Identify well-performing and underutilized products
		const wellPerforming = purchasedProducts
			.filter((p) => (p.roi_actual || 0) > 50 && p.usage_count > 10)
			.slice(0, 5);

		const underutilized = purchasedProducts
			.filter((p) => p.usage_count < 5 && p.implementation_status !== 'not_started')
			.slice(0, 5);

		// Calculate spending by category
		const categorySpendingMap = new Map<string, { amount: number; count: number }>();
		for (const p of purchasedProducts) {
			const categoryId = p.product.category_id || 'uncategorized';
			const current = categorySpendingMap.get(categoryId) || { amount: 0, count: 0 };
			categorySpendingMap.set(categoryId, {
				amount: current.amount + p.product.price_cents / 100,
				count: current.count + 1
			});
		}

		const spendingByCategory: CategorySpending[] = Array.from(
			categorySpendingMap.entries()
		).map(([category, data]) => ({
			category,
			amount: data.amount,
			product_count: data.count
		}));

		// Build implementation timeline
		const implementationTimeline: ImplementationTimeline[] = purchasedProducts
			.filter((p) => p.implementation_status !== 'not_started')
			.map((p) => {
				const usage = usageData.find(
					(u) => u.product_id === p.product.id && u.implementation_status !== 'not_started'
				);
				return {
					product_name: p.product.name,
					start_date: usage?.implementation_started_at || p.purchase_date,
					expected_completion: usage?.implementation_started_at
						? new Date(
								new Date(usage.implementation_started_at).getTime() + 90 * 24 * 60 * 60 * 1000
						  ).toISOString()
						: '',
					actual_completion: usage?.implementation_completed_at,
					status: p.implementation_status
				};
			});

		// Generate time series data (simplified - would need more complex queries for real data)
		const roiTrend: TimeSeriesData[] = [];
		const usageTrend: TimeSeriesData[] = [];
		const satisfactionTrend: TimeSeriesData[] = [];

		return {
			purchased_products: purchasedProducts,
			total_spent: totalSpent,
			active_products: activeProducts,
			average_roi: averageROI,
			roi_trend: roiTrend,
			usage_trend: usageTrend,
			satisfaction_trend: satisfactionTrend,
			well_performing_products: wellPerforming,
			underutilized_products: underutilized,
			recommended_products: [], // Would be populated by recommendation service
			recommended_bundles: [], // Would be populated by bundle service
			spending_by_category: spendingByCategory,
			implementation_timeline: implementationTimeline
		};
	}
}
