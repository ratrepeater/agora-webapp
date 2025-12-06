import type { Bookmark, BookmarkWithProduct, ProductWithRating } from '$lib/helpers/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * BookmarkService - Handles all bookmark-related database operations
 * Implements add, remove, toggle, and query methods for bookmarks
 */
export class BookmarkService {
	constructor(private supabase: SupabaseClient) {}

	/**
	 * Get all bookmarks for a buyer with product details
	 * @param buyerId - Buyer's profile ID
	 * @returns Array of bookmarks with product information
	 */
	async getByBuyer(buyerId: string): Promise<BookmarkWithProduct[]> {
		const { data, error } = await this.supabase
			.from('bookmarks')
			.select(
				`
				*,
				product:products (
					*,
					reviews (rating),
					category:categories!category_id (key)
				)
			`
			)
			.eq('buyer_id', buyerId)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch bookmarks: ${error.message}`);
		}

		// Return bookmarks with products and calculated ratings
		return (data || []).map((bookmark: any) => {
			const product = bookmark.product;
			const reviews = product?.reviews || [];
			const ratings = reviews.map((r: any) => r.rating).filter((r: number) => r != null);

			const average_rating =
				ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;

			const review_count = ratings.length;

			// Extract category key from category object
			const categoryKey = product?.category?.key || null;

			// Remove the reviews and category arrays and add calculated fields
			const { reviews: _, category: __, ...productData } = product;

			return {
				id: bookmark.buyer_id + bookmark.product_id, // Composite key for bookmark
				buyer_id: bookmark.buyer_id,
				product_id: bookmark.product_id,
				created_at: bookmark.created_at,
				product: {
					...productData,
					category: categoryKey,
					average_rating,
					review_count
				} as ProductWithRating
			};
		});
	}

	/**
	 * Check if a product is bookmarked by a buyer
	 * @param buyerId - Buyer's profile ID
	 * @param productId - Product ID
	 * @returns True if bookmarked, false otherwise
	 */
	async isBookmarked(buyerId: string, productId: string): Promise<boolean> {
		const { data, error } = await this.supabase
			.from('bookmarks')
			.select('buyer_id')
			.eq('buyer_id', buyerId)
			.eq('product_id', productId)
			.maybeSingle();

		if (error) {
			throw new Error(`Failed to check bookmark status: ${error.message}`);
		}

		return data !== null;
	}

	/**
	 * Add a bookmark for a buyer
	 * @param buyerId - Buyer's profile ID
	 * @param productId - Product ID to bookmark
	 * @returns Created bookmark
	 */
	async add(buyerId: string, productId: string): Promise<Bookmark> {
		const { data, error } = await this.supabase
			.from('bookmarks')
			.insert({
				buyer_id: buyerId,
				product_id: productId
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to add bookmark: ${error.message}`);
		}

		// Track bookmark event
		// TODO: Fix analyticsService to accept supabase client
		// await analyticsService.trackBookmark(productId, buyerId);

		return data;
	}

	/**
	 * Remove a bookmark for a buyer
	 * @param buyerId - Buyer's profile ID
	 * @param productId - Product ID to unbookmark
	 */
	async remove(buyerId: string, productId: string): Promise<void> {
		const { error } = await this.supabase
			.from('bookmarks')
			.delete()
			.eq('buyer_id', buyerId)
			.eq('product_id', productId);

		if (error) {
			throw new Error(`Failed to remove bookmark: ${error.message}`);
		}
	}

	/**
	 * Toggle a bookmark for a buyer (add if not exists, remove if exists)
	 * @param buyerId - Buyer's profile ID
	 * @param productId - Product ID to toggle
	 * @returns True if bookmark was added, false if removed
	 */
	async toggle(buyerId: string, productId: string): Promise<boolean> {
		const isCurrentlyBookmarked = await this.isBookmarked(buyerId, productId);

		if (isCurrentlyBookmarked) {
			await this.remove(buyerId, productId);
			return false;
		} else {
			await this.add(buyerId, productId);
			return true;
		}
	}
}
