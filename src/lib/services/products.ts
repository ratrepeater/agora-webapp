import { supabase } from '$lib/helpers/supabase';
import type {
	Product,
	ProductWithRating,
	ProductWithScores,
	ProductFilters,
	ProductCategory
} from '$lib/helpers/types';
import type { TablesInsert, TablesUpdate } from '$lib/helpers/database.types';

/**
 * ProductService - Handles all product-related database operations
 * Implements CRUD operations and query methods for products
 */
export class ProductService {
	/**
	 * Get all products with optional filters
	 * @param filters - Optional filters to apply (category, price range, rating, featured, new)
	 * @returns Array of products with ratings
	 */
	async getAll(filters?: ProductFilters): Promise<ProductWithRating[]> {
		let query = supabase
			.from('products')
			.select(
				`
				*,
				reviews (rating)
			`
			)
			.eq('status', 'published');

		// Apply filters
		if (filters?.category) {
			// Get category ID from category key
			const { data: categoryData } = await supabase
				.from('categories')
				.select('id')
				.eq('key', filters.category)
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

		const { data, error } = await query.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch products: ${error.message}`);
		}

		return this.enrichWithRatings(data || []);
	}

	/**
	 * Get a single product by ID
	 * @param id - Product ID
	 * @returns Product with ratings or null if not found
	 */
	async getById(id: string): Promise<ProductWithRating | null> {
		const { data, error } = await supabase
			.from('products')
			.select(
				`
				*,
				reviews (rating)
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
			throw new Error(`Failed to fetch product: ${error.message}`);
		}

		const enriched = this.enrichWithRatings([data]);
		return enriched[0] || null;
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
				reviews (rating)
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
		// Get category ID from category key
		const { data: categoryData, error: categoryError } = await supabase
			.from('categories')
			.select('id')
			.eq('key', category)
			.single();

		if (categoryError) {
			throw new Error(`Failed to fetch category: ${categoryError.message}`);
		}

		const { data, error } = await supabase
			.from('products')
			.select(
				`
				*,
				reviews (rating)
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
	 * Get featured products
	 * @returns Array of featured products with ratings
	 */
	async getFeatured(): Promise<ProductWithRating[]> {
		const { data, error } = await supabase
			.from('products')
			.select(
				`
				*,
				reviews (rating)
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
	}

	/**
	 * Get new products (created in last 30 days)
	 * @returns Array of new products with ratings
	 */
	async getNew(): Promise<ProductWithRating[]> {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const { data, error } = await supabase
			.from('products')
			.select(
				`
				*,
				reviews (rating)
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
	}

	/**
	 * Search products by query string
	 * @param query - Search query string
	 * @param filters - Optional additional filters
	 * @returns Array of matching products with ratings
	 */
	async search(query: string, filters?: ProductFilters): Promise<ProductWithRating[]> {
		// Build the search query
		let dbQuery = supabase
			.from('products')
			.select(
				`
				*,
				reviews (rating)
			`
			)
			.eq('status', 'published');

		// Search across name, short_description, and long_description
		// Using ilike for case-insensitive partial matching
		const searchPattern = `%${query}%`;
		dbQuery = dbQuery.or(
			`name.ilike.${searchPattern},short_description.ilike.${searchPattern},long_description.ilike.${searchPattern}`
		);

		// Apply additional filters if provided
		if (filters?.category) {
			const { data: categoryData } = await supabase
				.from('categories')
				.select('id')
				.eq('key', filters.category)
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

		const { data, error } = await dbQuery.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to search products: ${error.message}`);
		}

		return this.enrichWithRatings(data || []);
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
	 * Sets status to 'deleted' instead of hard delete to preserve order history
	 * @param id - Product ID
	 */
	async delete(id: string): Promise<void> {
		const { error } = await supabase
			.from('products')
			.update({ status: 'deleted' })
			.eq('id', id);

		if (error) {
			throw new Error(`Failed to delete product: ${error.message}`);
		}
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

			// Remove the reviews array and add calculated fields
			const { reviews: _, ...productData } = product;

			return {
				...productData,
				average_rating,
				review_count
			} as ProductWithRating;
		});
	}
}

// Export a singleton instance
export const productService = new ProductService();
