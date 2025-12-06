import { supabase } from '$lib/helpers/supabase.server';
import type { Review, ReviewWithBuyer, ReviewWithProduct, ProductWithRating } from '$lib/helpers/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * ReviewService - Handles all review-related database operations
 * Implements create, update, delete, and query methods for product reviews
 */
export class ReviewService {
	private client: SupabaseClient;

	constructor(client?: SupabaseClient) {
		this.client = client || supabase;
	}

	/**
	 * Get all reviews for a product with buyer information
	 * @param productId - Product ID
	 * @returns Array of reviews with buyer details
	 */
	async getByProduct(productId: string): Promise<ReviewWithBuyer[]> {
		console.log(`ReviewService: Fetching reviews for product ${productId}`);
		const { data, error } = await this.client
			.from('reviews')
			.select(
				`
				*,
				buyer:profiles!reviews_buyer_id_fkey (
					full_name
				)
			`
			)
			.eq('product_id', productId)
			.order('created_at', { ascending: false });

		if (error) {
			console.error(`ReviewService: Error fetching reviews:`, error);
			throw new Error(`Failed to fetch reviews for product: ${error.message}`);
		}

		console.log(`ReviewService: Found ${data?.length || 0} reviews`);
		console.log(`ReviewService: Raw data:`, JSON.stringify(data, null, 2));

		return (data || []).map((review) => ({
			id: review.id,
			product_id: review.product_id,
			buyer_id: review.buyer_id,
			rating: review.rating,
			title: review.title,
			body: review.body,
			created_at: review.created_at,
			buyer: {
				full_name: review.buyer?.full_name || null
			}
		})) as ReviewWithBuyer[];
	}

	/**
	 * Get all reviews by a buyer with product information
	 * @param buyerId - Buyer's profile ID
	 * @returns Array of reviews with product details
	 */
	async getByBuyer(buyerId: string): Promise<ReviewWithProduct[]> {
		const { data, error } = await this.client
			.from('reviews')
			.select(
				`
				*,
				product:products (
					*,
					reviews (rating)
				)
			`
			)
			.eq('buyer_id', buyerId)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch reviews for buyer: ${error.message}`);
		}

		// Enrich products with ratings
		return (data || []).map((review) => {
			const product = review.product as any;
			const reviews = product?.reviews || [];
			const ratings = reviews.map((r: any) => r.rating).filter((r: number) => r != null);

			const average_rating =
				ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;

			const review_count = ratings.length;

			// Remove the reviews array and add calculated fields
			const { reviews: _, ...productData } = product;

			return {
				id: review.id,
				product_id: review.product_id,
				buyer_id: review.buyer_id,
				rating: review.rating,
				title: review.title,
				body: review.body,
				created_at: review.created_at,
				product: {
					...productData,
					average_rating,
					review_count
				} as ProductWithRating
			} as ReviewWithProduct;
		});
	}

	/**
	 * Calculate average rating for a product
	 * @param productId - Product ID
	 * @returns Average rating (0 if no reviews)
	 */
	async getAverageRating(productId: string): Promise<number> {
		const { data, error } = await this.client
			.from('reviews')
			.select('rating')
			.eq('product_id', productId);

		if (error) {
			throw new Error(`Failed to calculate average rating: ${error.message}`);
		}

		if (!data || data.length === 0) {
			return 0;
		}

		const sum = data.reduce((acc, review) => acc + review.rating, 0);
		return sum / data.length;
	}

	/**
	 * Create a new review
	 * @param review - Review data (without id and created_at)
	 * @returns Created review
	 */
	async create(review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
		const { data, error } = await this.client
			.from('reviews')
			.insert({
				product_id: review.product_id,
				buyer_id: review.buyer_id,
				rating: review.rating,
				title: review.title,
				body: review.body
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create review: ${error.message}`);
		}

		return data;
	}

	/**
	 * Update an existing review
	 * @param id - Review ID
	 * @param review - Partial review data to update
	 * @returns Updated review
	 */
	async update(id: string, review: Partial<Omit<Review, 'id' | 'created_at' | 'product_id' | 'buyer_id'>>): Promise<Review> {
		const { data, error } = await this.client
			.from('reviews')
			.update({
				rating: review.rating,
				title: review.title,
				body: review.body
			})
			.eq('id', id)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to update review: ${error.message}`);
		}

		return data;
	}

	/**
	 * Delete a review
	 * @param id - Review ID
	 */
	async delete(id: string): Promise<void> {
		const { error } = await this.client
			.from('reviews')
			.delete()
			.eq('id', id);

		if (error) {
			throw new Error(`Failed to delete review: ${error.message}`);
		}
	}
}

// Export a singleton instance
export const reviewService = new ReviewService();
