import { supabase } from '$lib/helpers/supabase.server';
import type {
	Product,
	ProductWithRating,
	ProductWithScores,
	ProductFilters,
	ProductCategory
} from '$lib/helpers/types';
import type { TablesInsert, TablesUpdate } from '$lib/helpers/database.types';
import { handleDatabaseError, logError } from '$lib/helpers/error-handler';
import { cache, CACHE_KEYS, CACHE_TTL } from '$lib/helpers/cache';

/**
 * Pagination options for product queries
 */
export interface PaginationOptions {
	page?: number; // Page number (1-indexed)
	pageSize?: number; // Number of items per page
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		page: number;
		pageSize: number;
		totalCount: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}

/**
 * ProductService - Handles all product-related database operations
 * Implements CRUD operations and query methods for products
 */
export class ProductService {
	/**
	 * Get all products with optional filters and pagination
	 * @param filters - Optional filters to apply (category, price range, rating, featured, new)
	 * @param pagination - Optional pagination options (page, pageSize)
	 * @returns Array of products with ratings or paginated response
	 */
	async getAll(
		filters?: ProductFilters,
		pagination?: PaginationOptions
	): Promise<ProductWithRating[] | PaginatedResponse<ProductWithRating>> {
		try {
			// Default pagination values
			const page = pagination?.page || 1;
			const pageSize = pagination?.pageSize || 20;
			const offset = (page - 1) * pageSize;

			let query = supabase
				.from('products')
				.select(
					`
					*,
					category:categories!category_id (key),
					reviews (rating),
					product_scores (
						fit_score,
						feature_score,
						integration_score,
						review_score,
						overall_score,
						score_breakdown
					)
				`,
					{ count: 'exact' }
				)
				.eq('status', 'published');

			// Apply filters
			if (filters?.category) {
				// Get category ID from category key (case-insensitive)
				const { data: categoryData } = await supabase
					.from('categories')
					.select('id')
					.ilike('key', filters.category)
					.single();

				if (categoryData) {
					query = query.eq('category_id', categoryData.id);
				}
			}

			if (filters?.minPrice !== undefined) {
				query = query.gte('price_cents', filters.minPrice * 100);
			}

			if (filters?.maxPrice !== undefined) {
				query = query.lte('price_cents', filters.maxPrice * 100);
			}

			if (filters?.featured !== undefined) {
				query = query.eq('is_featured', filters.featured);
			}

			// For "new" filter, get products created in last 30 days
			if (filters?.new) {
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
				query = query.gte('created_at', thirtyDaysAgo.toISOString());
			}

			// Apply pagination if requested
			if (pagination) {
				query = query.range(offset, offset + pageSize - 1);
			}

			const { data, error, count } = await query.order('created_at', { ascending: false });

			if (error) {
				throw handleDatabaseError(error, 'getAll products');
			}

			// Enrich with ratings first
			let products = this.enrichWithRatings(data || []);

			// Apply rating filter after enrichment (since ratings are calculated from reviews)
			if (filters?.minRating !== undefined) {
				products = products.filter(p => (p.average_rating || 0) >= filters.minRating!);
			}

			// Return paginated response if pagination was requested
			if (pagination && count !== null) {
				const totalCount = count;
				const totalPages = Math.ceil(totalCount / pageSize);

				return {
					data: products,
					pagination: {
						page,
						pageSize,
						totalCount,
						totalPages,
						hasNextPage: page < totalPages,
						hasPreviousPage: page > 1
					}
				};
			}

			return products;
		} catch (error) {
			logError(error, 'ProductService.getAll');
			throw error;
		}
	}

	/**
	 * Get a single product by ID
	 * @param id - Product ID
	 * @returns Product with ratings or null if not found
	 */
	async getById(id: string): Promise<ProductWithRating | null> {
		try {
			const { data, error } = await supabase
				.from('products')
				.select(
					`
					*,
					category:categories!category_id (key),
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
				.eq('id', id)
				.eq('status', 'published')
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					// Not found
					return null;
				}
				throw handleDatabaseError(error, 'getById product');
			}

			const enriched = this.enrichWithRatings([data]);
			return enriched[0] || null;
		} catch (error) {
			logError(error, 'ProductService.getById');
			throw error;
		}
	}

	/**
	 * Get all products by a specific seller
	 * @param sellerId - Seller's profile ID
	 * @returns Array of products with ratings
	 */
	async getBySeller(sellerId: string): Promise<ProductWithRating[]> {
		const { data, error } = await supabase
			.from('products')
			.select(
				`
				*,
				category:categories!category_id (key),
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
			.eq('seller_id', sellerId)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch seller products: ${error.message}`);
		}

		return this.enrichWithRatings(data || []);
	}

	/**
	 * Get products by category
	 * @param category - Product category key
	 * @returns Array of products with ratings
	 */
	async getByCategory(category: ProductCategory): Promise<ProductWithRating[]> {
		// Get category ID from category key (case-insensitive)
		const { data: categoryData, error: categoryError } = await supabase
			.from('categories')
			.select('id')
			.ilike('key', category)
			.single();

		if (categoryError) {
			throw new Error(`Failed to fetch category: ${categoryError.message}`);
		}

		const { data, error } = await supabase
			.from('products')
			.select(
				`
				*,
				category:categories!category_id (key),
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
			.eq('category_id', categoryData.id)
			.eq('status', 'published')
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch products by category: ${error.message}`);
		}

		return this.enrichWithRatings(data || []);
	}

	/**
	 * Get featured products (with caching)
	 * Results are cached for 15 minutes to improve performance
	 * @returns Array of featured products with ratings
	 */
	async getFeatured(): Promise<ProductWithRating[]> {
		return cache.getOrSet(
			CACHE_KEYS.FEATURED_PRODUCTS,
			async () => {
				const { data, error } = await supabase
					.from('products')
					.select(
						`
						*,
						category:categories!category_id (key),
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
					.eq('is_featured', true)
					.eq('status', 'published')
					.order('created_at', { ascending: false })
					.limit(20);

				if (error) {
					throw new Error(`Failed to fetch featured products: ${error.message}`);
				}

				return this.enrichWithRatings(data || []);
			},
			CACHE_TTL.LONG
		);
	}

	/**
	 * Get new products (created in last 30 days) with caching
	 * Results are cached for 5 minutes to improve performance
	 * @returns Array of new products with ratings
	 */
	async getNew(): Promise<ProductWithRating[]> {
		return cache.getOrSet(
			CACHE_KEYS.NEW_PRODUCTS,
			async () => {
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

				const { data, error } = await supabase
					.from('products')
					.select(
						`
						*,
						category:categories!category_id (key),
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
					.gte('created_at', thirtyDaysAgo.toISOString())
					.order('created_at', { ascending: false })
					.limit(20);

				if (error) {
					throw new Error(`Failed to fetch new products: ${error.message}`);
				}

				return this.enrichWithRatings(data || []);
			},
			CACHE_TTL.MEDIUM
		);
	}

	/**
	 * Search products by query string
	 * Implements full-text search across name, description fields
	 * Supports combined search and filter queries
	 * Returns empty array when no results found
	 * 
	 * @param query - Search query string
	 * @param filters - Optional additional filters
	 * @param pagination - Optional pagination options
	 * @returns Array of matching products with ratings (empty array if no results) or paginated response
	 */
	async search(
		query: string,
		filters?: ProductFilters,
		pagination?: PaginationOptions
	): Promise<ProductWithRating[] | PaginatedResponse<ProductWithRating>> {
		// If query is empty or only whitespace, return all products with filters
		if (!query || query.trim() === '') {
			return this.getAll(filters, pagination);
		}

		// Default pagination values
		const page = pagination?.page || 1;
		const pageSize = pagination?.pageSize || 20;
		const offset = (page - 1) * pageSize;

		// Build the search query
		let dbQuery = supabase
			.from('products')
			.select(
				`
				*,
				category:categories!category_id (key),
				reviews (rating),
				product_scores (
					fit_score,
					feature_score,
					integration_score,
					review_score,
					overall_score,
					score_breakdown
				)
			`,
				{ count: 'exact' }
			)
			.eq('status', 'published');

		// Search across name, short_description, and long_description
		// Using ilike for case-insensitive partial matching
		const searchPattern = `%${query.trim()}%`;
		dbQuery = dbQuery.or(
			`name.ilike.${searchPattern},short_description.ilike.${searchPattern},long_description.ilike.${searchPattern}`
		);

		// Apply additional filters if provided
		if (filters?.category) {
			const { data: categoryData } = await supabase
				.from('categories')
				.select('id')
				.ilike('key', filters.category)
				.single();

			if (categoryData) {
				dbQuery = dbQuery.eq('category_id', categoryData.id);
			}
		}

		if (filters?.minPrice !== undefined) {
			dbQuery = dbQuery.gte('price_cents', filters.minPrice * 100);
		}

		if (filters?.maxPrice !== undefined) {
			dbQuery = dbQuery.lte('price_cents', filters.maxPrice * 100);
		}

		if (filters?.featured !== undefined) {
			dbQuery = dbQuery.eq('is_featured', filters.featured);
		}

		if (filters?.new) {
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
			dbQuery = dbQuery.gte('created_at', thirtyDaysAgo.toISOString());
		}

		// Apply pagination if requested
		if (pagination) {
			dbQuery = dbQuery.range(offset, offset + pageSize - 1);
		}

		const { data, error, count } = await dbQuery.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to search products: ${error.message}`);
		}

		// Enrich with ratings first
		let products = this.enrichWithRatings(data || []);

		// Apply rating filter after enrichment (since ratings are calculated from reviews)
		if (filters?.minRating !== undefined) {
			products = products.filter(p => (p.average_rating || 0) >= filters.minRating!);
		}

		// Return paginated response if pagination was requested
		if (pagination && count !== null) {
			const totalCount = count;
			const totalPages = Math.ceil(totalCount / pageSize);

			return {
				data: products,
				pagination: {
					page,
					pageSize,
					totalCount,
					totalPages,
					hasNextPage: page < totalPages,
					hasPreviousPage: page > 1
				}
			};
		}

		// Return empty array if no results found
		return products;
	}

	/**
	 * Create a new product (seller only)
	 * @param product - Product data to insert
	 * @returns Created product
	 */
	async create(product: TablesInsert<'products'>): Promise<Product> {
		const { data, error } = await supabase
			.from('products')
			.insert(product)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create product: ${error.message}`);
		}

		return data;
	}

	/**
	 * Update an existing product (seller only)
	 * @param id - Product ID
	 * @param product - Product data to update
	 * @returns Updated product
	 */
	async update(id: string, product: TablesUpdate<'products'>): Promise<Product> {
		const { data, error } = await supabase
			.from('products')
			.update(product)
			.eq('id', id)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to update product: ${error.message}`);
		}

		return data;
	}

	/**
	 * Delete a product (seller only)
	 * Sets status to 'archived' instead of hard delete to preserve order history
	 * @param id - Product ID
	 */
	async delete(id: string): Promise<void> {
		const { error } = await supabase
			.from('products')
			.update({ status: 'archived' })
			.eq('id', id);

		if (error) {
			throw new Error(`Failed to delete product: ${error.message}`);
		}
	}

	/**
	 * Helper method to enrich products with calculated rating data and scores
	 * @param products - Array of products with reviews and product_scores
	 * @returns Array of products with average_rating, review_count, and scores
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

			// Extract category key from category object
			const categoryKey = product.category?.key || null;

			// Remove the reviews, product_scores, and category arrays and add calculated fields
			const { reviews: _, product_scores: __, category: ___, ...productData } = product;

			return {
				...productData,
				category: categoryKey,
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
export const productService = new ProductService();
