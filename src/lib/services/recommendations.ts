import { supabase } from '$lib/helpers/supabase.server';
import type { ProductWithRating, ProductBundle } from '$lib/helpers/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * RecommendationService - Handles product recommendation algorithms
 * Implements various recommendation strategies for product discovery
 */
export class RecommendationService {
	private client: SupabaseClient;

	constructor(client?: SupabaseClient) {
		this.client = client || supabase;
	}
	/**
	 * Get new and notable products based on created_at and featured status
	 * Prioritizes featured products and recently added products
	 * @param limit - Maximum number of products to return
	 * @returns Array of products sorted by recency and featured status
	 */
	async getNewAndNotable(limit: number = 20): Promise<ProductWithRating[]> {
		// Get products created in the last 60 days or featured products
		const sixtyDaysAgo = new Date();
		sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

		const { data, error } = await this.client
			.from('products')
			.select(
				`
				*,
				reviews (rating),
				product_scores (
					fit_score,
					feature_score,
					integration_score,
					review_score,
					overall_score,
					score_breakdown
				)
			`
			)
			.eq('status', 'published')
			.or(`is_featured.eq.true,created_at.gte.${sixtyDaysAgo.toISOString()}`)
			.order('is_featured', { ascending: false })
			.order('created_at', { ascending: false })
			.limit(limit);

		if (error) {
			throw new Error(`Failed to fetch new and notable products: ${error.message}`);
		}

		return this.enrichWithRatings(data || []);
	}

	/**
	 * Get personalized recommendations based on buyer profile and behavior
	 * Uses browsing history, bookmarks, and buyer preferences
	 * @param buyerId - Buyer's profile ID
	 * @param limit - Maximum number of products to return
	 * @returns Array of personalized product recommendations
	 */
	async getPersonalized(buyerId: string, limit: number = 20): Promise<ProductWithRating[]> {
		// Get buyer's bookmarked products to understand preferences
		const { data: bookmarks } = await this.client
			.from('bookmarks')
			.select('product_id')
			.eq('buyer_id', buyerId);

		const bookmarkedProductIds = bookmarks?.map((b) => b.product_id) || [];

		// Get buyer's purchase history to understand preferences
		const { data: orders } = await this.client
			.from('orders')
			.select('order_items(product_id)')
			.eq('buyer_id', buyerId);

		const purchasedProductIds =
			orders?.flatMap((o: any) => o.order_items?.map((item: any) => item.product_id) || []) || [];

		// Get buyer's onboarding preferences if available
		const { data: onboarding } = await this.client
			.from('buyer_onboarding')
			.select('interests')
			.eq('buyer_id', buyerId)
			.single();

		const interestedCategories = onboarding?.interests || [];

		// Build recommendation query
		let query = this.client
			.from('products')
			.select(
				`
				*,
				reviews (rating),
				product_scores (
					fit_score,
					feature_score,
					integration_score,
					review_score,
					overall_score,
					score_breakdown
				),
				categories!inner(key)
			`
			)
			.eq('status', 'published');

		// Filter by interested categories if available
		if (interestedCategories.length > 0) {
			query = query.in('categories.key', interestedCategories);
		}

		// Exclude already bookmarked and purchased products
		const excludedIds = [...bookmarkedProductIds, ...purchasedProductIds];
		if (excludedIds.length > 0) {
			query = query.not('id', 'in', `(${excludedIds.join(',')})`);
		}

		// Order by featured status, rating, and recency
		query = query
			.order('is_featured', { ascending: false })
			.order('created_at', { ascending: false })
			.limit(limit);

		const { data, error } = await query;

		if (error) {
			throw new Error(`Failed to fetch personalized recommendations: ${error.message}`);
		}

		// Remove the categories field from the response
		const cleanedData = (data || []).map((product: any) => {
			const { categories, ...rest } = product;
			return rest;
		});

		return this.enrichWithRatings(cleanedData);
	}

	/**
	 * Get frequently bought together products based on order history
	 * Analyzes which products are commonly purchased with the given product
	 * @param productId - Product ID to find related purchases
	 * @param limit - Maximum number of products to return
	 * @returns Array of products frequently bought together
	 */
	async getFrequentlyBoughtTogether(
		productId: string,
		limit: number = 5
	): Promise<ProductWithRating[]> {
		// Find orders that contain the given product
		const { data: orderItems } = await this.client
			.from('order_items')
			.select('order_id')
			.eq('product_id', productId);

		const orderIds = orderItems?.map((item) => item.order_id) || [];

		if (orderIds.length === 0) {
			return [];
		}

		// Find other products in those orders
		const { data: relatedItems } = await this.client
			.from('order_items')
			.select('product_id')
			.in('order_id', orderIds)
			.neq('product_id', productId);

		if (!relatedItems || relatedItems.length === 0) {
			return [];
		}

		// Count frequency of each product
		const productFrequency = new Map<string, number>();
		relatedItems.forEach((item) => {
			const count = productFrequency.get(item.product_id) || 0;
			productFrequency.set(item.product_id, count + 1);
		});

		// Sort by frequency and get top products
		const sortedProductIds = Array.from(productFrequency.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, limit)
			.map(([id]) => id);

		if (sortedProductIds.length === 0) {
			return [];
		}

		// Fetch the actual products
		const { data, error } = await this.client
			.from('products')
			.select(
				`
				*,
				reviews (rating),
				product_scores (
					fit_score,
					feature_score,
					integration_score,
					review_score,
					overall_score,
					score_breakdown
				)
			`
			)
			.in('id', sortedProductIds)
			.eq('status', 'published');

		if (error) {
			throw new Error(`Failed to fetch frequently bought together products: ${error.message}`);
		}

		// Sort by the frequency order
		const sortedData = sortedProductIds
			.map((id) => data?.find((p) => p.id === id))
			.filter((p) => p != null);

		return this.enrichWithRatings(sortedData);
	}

	/**
	 * Get similar products based on category and features
	 * Finds products in the same category with similar characteristics
	 * @param productId - Product ID to find similar products for
	 * @param limit - Maximum number of products to return
	 * @returns Array of similar products
	 */
	async getSimilarProducts(productId: string, limit: number = 6): Promise<ProductWithRating[]> {
		// Get the source product
		const { data: sourceProduct, error: sourceError } = await this.client
			.from('products')
			.select('category_id, price_cents')
			.eq('id', productId)
			.single();

		if (sourceError || !sourceProduct) {
			throw new Error(`Failed to fetch source product: ${sourceError?.message}`);
		}

		// Find products in the same category with similar price range
		const priceMin = sourceProduct.price_cents * 0.5; // 50% lower
		const priceMax = sourceProduct.price_cents * 1.5; // 50% higher

		const { data, error } = await this.client
			.from('products')
			.select(
				`
				*,
				reviews (rating),
				product_scores (
					fit_score,
					feature_score,
					integration_score,
					review_score,
					overall_score,
					score_breakdown
				)
			`
			)
			.eq('category_id', sourceProduct.category_id)
			.eq('status', 'published')
			.neq('id', productId)
			.gte('price_cents', priceMin)
			.lte('price_cents', priceMax)
			.order('is_featured', { ascending: false })
			.order('created_at', { ascending: false })
			.limit(limit);

		if (error) {
			throw new Error(`Failed to fetch similar products: ${error.message}`);
		}

		return this.enrichWithRatings(data || []);
	}

	/**
	 * Get trending products based on recent engagement
	 * Analyzes recent views, bookmarks, and purchases to identify trending products
	 * @param limit - Maximum number of products to return
	 * @returns Array of trending products
	 */
	async getTrending(limit: number = 20): Promise<ProductWithRating[]> {
		// Get products with recent engagement (last 7 days)
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		// Get recent bookmarks
		const { data: recentBookmarks } = await this.client
			.from('bookmarks')
			.select('product_id')
			.gte('created_at', sevenDaysAgo.toISOString());

		// Get recent cart additions
		const { data: recentCartItems } = await this.client
			.from('cart_items')
			.select('product_id')
			.gte('created_at', sevenDaysAgo.toISOString());

		// Get recent purchases
		const { data: recentOrders } = await this.client
			.from('orders')
			.select('order_items(product_id)')
			.gte('created_at', sevenDaysAgo.toISOString());

		// Count engagement for each product
		const engagementScore = new Map<string, number>();

		// Bookmarks count as 1 point
		recentBookmarks?.forEach((b) => {
			const score = engagementScore.get(b.product_id) || 0;
			engagementScore.set(b.product_id, score + 1);
		});

		// Cart additions count as 2 points
		recentCartItems?.forEach((c) => {
			const score = engagementScore.get(c.product_id) || 0;
			engagementScore.set(c.product_id, score + 2);
		});

		// Purchases count as 3 points
		recentOrders?.forEach((o: any) => {
			o.order_items?.forEach((item: any) => {
				const score = engagementScore.get(item.product_id) || 0;
				engagementScore.set(item.product_id, score + 3);
			});
		});

		// Get top trending product IDs
		const trendingProductIds = Array.from(engagementScore.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, limit)
			.map(([id]) => id);

		if (trendingProductIds.length === 0) {
			// If no trending products, return featured products
			return this.getNewAndNotable(limit);
		}

		// Fetch the actual products
		const { data, error } = await this.client
			.from('products')
			.select(
				`
				*,
				reviews (rating),
				product_scores (
					fit_score,
					feature_score,
					integration_score,
					review_score,
					overall_score,
					score_breakdown
				)
			`
			)
			.in('id', trendingProductIds)
			.eq('status', 'published');

		if (error) {
			throw new Error(`Failed to fetch trending products: ${error.message}`);
		}

		// Sort by the engagement score order
		const sortedData = trendingProductIds
			.map((id) => data?.find((p) => p.id === id))
			.filter((p) => p != null);

		return this.enrichWithRatings(sortedData);
	}

	/**
	 * Get suggested bundles for a buyer
	 * Analyzes buyer's cart and purchase history to suggest complementary product bundles
	 * @param buyerId - Buyer's profile ID
	 * @returns Array of suggested product bundles
	 */
	async getSuggestedBundles(buyerId: string): Promise<ProductBundle[]> {
		// Get buyer's current cart items
		const { data: cartItems } = await this.client
			.from('cart_items')
			.select('product_id')
			.eq('buyer_id', buyerId);

		const cartProductIds = cartItems?.map((item) => item.product_id) || [];

		if (cartProductIds.length === 0) {
			return [];
		}

		// For each product in cart, find frequently bought together products
		const bundleSuggestions: ProductBundle[] = [];

		for (const productId of cartProductIds) {
			const relatedProducts = await this.getFrequentlyBoughtTogether(productId, 3);

			if (relatedProducts.length > 0) {
				// Get the source product
				const { data: sourceProduct } = await this.client
					.from('products')
					.select(
						`
						*,
						reviews (rating),
						product_scores (
							fit_score,
							feature_score,
							integration_score,
							review_score,
							overall_score,
							score_breakdown
						)
					`
					)
					.eq('id', productId)
					.single();

				if (sourceProduct) {
					const enrichedSource = this.enrichWithRatings([sourceProduct])[0];
					const allProducts = [enrichedSource, ...relatedProducts];

					// Calculate bundle pricing
					const totalPrice = allProducts.reduce((sum, p) => sum + (p as any).price_cents, 0) / 100;
					const discountPercentage = allProducts.length >= 3 ? 10 : 5;
					const discountedPrice = totalPrice * (1 - discountPercentage / 100);

					bundleSuggestions.push({
						id: `bundle-${productId}`,
						name: `${enrichedSource.name} Bundle`,
						description: `Frequently bought together with ${enrichedSource.name}`,
						products: allProducts,
						total_price: totalPrice,
						discounted_price: discountedPrice,
						discount_percentage: discountPercentage
					});
				}
			}
		}

		return bundleSuggestions;
	}

	/**
	 * Helper method to enrich products with calculated rating data
	 * @param products - Array of products with reviews
	 * @returns Array of products with average_rating and review_count
	 */
	private enrichWithRatings(products: any[]): ProductWithRating[] {
		return products.map((product) => {
			const reviews = product.reviews || [];
			const ratings = reviews.map((r: any) => r.rating).filter((r: number) => r != null);

			const average_rating =
				ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;

			const review_count = ratings.length;

			// Extract scores from product_scores array (should be single item or empty)
			const scores = product.product_scores?.[0] || {};

			// Remove the reviews and product_scores arrays and add calculated fields
			const { reviews: _, product_scores: __, ...productData } = product;

			return {
				...productData,
				average_rating,
				review_count,
				fit_score: scores.fit_score || 0,
				feature_score: scores.feature_score || 0,
				integration_score: scores.integration_score || 0,
				review_score: scores.review_score || 0,
				overall_score: scores.overall_score || 0,
				score_breakdown: scores.score_breakdown
			} as ProductWithRating;
		});
	}
}

// Export a singleton instance
export const recommendationService = new RecommendationService();
