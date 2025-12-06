import { supabase } from '$lib/helpers/supabase.server';
import type { ProductBundle, ProductWithRating, CartItemWithProduct } from '$lib/helpers/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * BundleService - Handles all bundle-related operations
 * Implements getSuggestedBundles, getFrequentlyBoughtTogether, and calculateBundlePrice methods
 */
export class BundleService {
	constructor(private supabase: SupabaseClient) {}
	/**
	 * Get suggested bundles based on cart contents
	 * Analyzes cart items and suggests complementary products that are frequently bought together
	 * @param cartItems - Current cart items
	 * @param limit - Maximum number of bundles to return (default: 3)
	 * @returns Array of suggested product bundles
	 */
	async getSuggestedBundles(
		cartItems: CartItemWithProduct[],
		limit: number = 3
	): Promise<ProductBundle[]> {
		if (!cartItems || cartItems.length === 0) {
			return [];
		}

		// Get product IDs from cart
		const cartProductIds = cartItems.map((item) => item.product_id);

		// Find products that are frequently bought together with cart items
		// Query order_items to find products that appear in orders with cart products
		const { data: frequentlyBoughtData, error } = await this.supabase
			.from('order_items')
			.select('product_id, order_id')
			.in('order_id', 
				supabase
					.from('order_items')
					.select('order_id')
					.in('product_id', cartProductIds)
			);

		if (error) {
			console.error('Failed to fetch frequently bought together data:', error);
			return [];
		}

		// Count product occurrences (excluding products already in cart)
		const productCounts = new Map<string, number>();
		(frequentlyBoughtData || []).forEach((item) => {
			if (!cartProductIds.includes(item.product_id)) {
				productCounts.set(item.product_id, (productCounts.get(item.product_id) || 0) + 1);
			}
		});

		// Sort by frequency and take top products
		const topProductIds = Array.from(productCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, limit * 2) // Get more products than needed for bundle creation
			.map(([productId]) => productId);

		if (topProductIds.length === 0) {
			return [];
		}

		// Fetch product details
		const { data: products, error: productsError } = await this.supabase
			.from('products')
			.select(
				`
				*,
				reviews (rating)
			`
			)
			.in('id', topProductIds);

		if (productsError) {
			console.error('Failed to fetch products:', productsError);
			return [];
		}

		// Enrich products with ratings
		const enrichedProducts: ProductWithRating[] = (products || []).map((product: any) => {
			const reviews = product?.reviews || [];
			const ratings = reviews.map((r: any) => r.rating).filter((r: number) => r != null);

			const average_rating =
				ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;

			const review_count = ratings.length;

			const { reviews: _, ...productData } = product;

			return {
				...productData,
				average_rating,
				review_count
			} as ProductWithRating;
		});

		// Create bundles by combining cart items with suggested products
		const bundles: ProductBundle[] = [];
		const cartProducts = cartItems.map((item) => item.product);

		// Create bundles with 1-2 suggested products each
		for (let i = 0; i < Math.min(enrichedProducts.length, limit); i++) {
			const suggestedProduct = enrichedProducts[i];
			const bundleProducts = [...cartProducts, suggestedProduct];

			const totalPrice = bundleProducts.reduce((sum, p) => sum + p.price_cents, 0);
			const discountPercentage = this.calculateDiscountPercentage(bundleProducts.length);
			const discountedPrice = totalPrice * (1 - discountPercentage / 100);

			bundles.push({
				id: `suggested-${i}`,
				name: `Bundle with ${suggestedProduct.name}`,
				description: `Save ${discountPercentage}% when you add ${suggestedProduct.name} to your cart`,
				products: bundleProducts,
				total_price: totalPrice,
				discounted_price: Math.round(discountedPrice),
				discount_percentage: discountPercentage
			});
		}

		return bundles;
	}

	/**
	 * Get frequently bought together bundles for a specific product
	 * @param productId - Product ID to find bundles for
	 * @param limit - Maximum number of bundles to return (default: 3)
	 * @returns Array of product bundles
	 */
	async getFrequentlyBoughtTogether(
		productId: string,
		limit: number = 3
	): Promise<ProductBundle[]> {
		// Find orders that contain this product
		const { data: orderIds, error: orderError } = await this.supabase
			.from('order_items')
			.select('order_id')
			.eq('product_id', productId);

		if (orderError) {
			console.error('Failed to fetch orders:', orderError);
			return [];
		}

		if (!orderIds || orderIds.length === 0) {
			return [];
		}

		const uniqueOrderIds = [...new Set(orderIds.map((o) => o.order_id))];

		// Find other products in those orders
		const { data: otherProducts, error: productsError } = await this.supabase
			.from('order_items')
			.select('product_id')
			.in('order_id', uniqueOrderIds)
			.neq('product_id', productId);

		if (productsError) {
			console.error('Failed to fetch other products:', productsError);
			return [];
		}

		// Count product occurrences
		const productCounts = new Map<string, number>();
		(otherProducts || []).forEach((item) => {
			productCounts.set(item.product_id, (productCounts.get(item.product_id) || 0) + 1);
		});

		// Sort by frequency and take top products
		const topProductIds = Array.from(productCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, limit * 2)
			.map(([pid]) => pid);

		if (topProductIds.length === 0) {
			return [];
		}

		// Fetch the main product
		const { data: mainProduct, error: mainProductError } = await this.supabase
			.from('products')
			.select(
				`
				*,
				reviews (rating)
			`
			)
			.eq('id', productId)
			.single();

		if (mainProductError) {
			console.error('Failed to fetch main product:', mainProductError);
			return [];
		}

		// Fetch companion products
		const { data: companionProducts, error: companionError } = await this.supabase
			.from('products')
			.select(
				`
				*,
				reviews (rating)
			`
			)
			.in('id', topProductIds);

		if (companionError) {
			console.error('Failed to fetch companion products:', companionError);
			return [];
		}

		// Enrich main product with ratings
		const mainReviews = mainProduct?.reviews || [];
		const mainRatings = mainReviews.map((r: any) => r.rating).filter((r: number) => r != null);
		const mainAvgRating =
			mainRatings.length > 0
				? mainRatings.reduce((sum: number, r: number) => sum + r, 0) / mainRatings.length
				: 0;
		const { reviews: _, ...mainProductData } = mainProduct;
		const enrichedMainProduct: ProductWithRating = {
			...mainProductData,
			average_rating: mainAvgRating,
			review_count: mainRatings.length
		};

		// Enrich companion products with ratings
		const enrichedCompanions: ProductWithRating[] = (companionProducts || []).map(
			(product: any) => {
				const reviews = product?.reviews || [];
				const ratings = reviews.map((r: any) => r.rating).filter((r: number) => r != null);

				const average_rating =
					ratings.length > 0
						? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
						: 0;

				const review_count = ratings.length;

				const { reviews: __, ...productData } = product;

				return {
					...productData,
					average_rating,
					review_count
				} as ProductWithRating;
			}
		);

		// Create bundles
		const bundles: ProductBundle[] = [];

		for (let i = 0; i < Math.min(enrichedCompanions.length, limit); i++) {
			const companion = enrichedCompanions[i];
			const bundleProducts = [enrichedMainProduct, companion];

			const totalPrice = bundleProducts.reduce((sum, p) => sum + p.price_cents, 0);
			const discountPercentage = this.calculateDiscountPercentage(bundleProducts.length);
			const discountedPrice = totalPrice * (1 - discountPercentage / 100);

			bundles.push({
				id: `fbt-${productId}-${companion.id}`,
				name: `${enrichedMainProduct.name} + ${companion.name}`,
				description: `Frequently bought together - Save ${discountPercentage}%`,
				products: bundleProducts,
				total_price: totalPrice,
				discounted_price: Math.round(discountedPrice),
				discount_percentage: discountPercentage
			});
		}

		return bundles;
	}

	/**
	 * Calculate bundle price with discount tiers
	 * Discount rules:
	 * - 2 products: 5% discount
	 * - 3 products: 10% discount
	 * - 4+ products: 15% discount
	 * @param productIds - Array of product IDs in the bundle
	 * @returns Object with total_price, discounted_price, and discount_percentage
	 */
	async calculateBundlePrice(
		productIds: string[]
	): Promise<{ total_price: number; discounted_price: number; discount_percentage: number }> {
		if (!productIds || productIds.length === 0) {
			return { total_price: 0, discounted_price: 0, discount_percentage: 0 };
		}

		// Fetch product prices
		const { data: products, error } = await this.supabase
			.from('products')
			.select('id, price_cents')
			.in('id', productIds);

		if (error) {
			throw new Error(`Failed to fetch product prices: ${error.message}`);
		}

		// Calculate total price
		const totalPrice = (products || []).reduce((sum, product) => sum + product.price_cents, 0);

		// Calculate discount percentage based on number of products
		const discountPercentage = this.calculateDiscountPercentage(productIds.length);

		// Calculate discounted price
		const discountedPrice = Math.round(totalPrice * (1 - discountPercentage / 100));

		return {
			total_price: totalPrice,
			discounted_price: discountedPrice,
			discount_percentage: discountPercentage
		};
	}

	/**
	 * Calculate discount percentage based on number of products
	 * @param productCount - Number of products in bundle
	 * @returns Discount percentage
	 */
	private calculateDiscountPercentage(productCount: number): number {
		if (productCount >= 4) {
			return 15;
		} else if (productCount === 3) {
			return 10;
		} else if (productCount === 2) {
			return 5;
		}
		return 0;
	}

	/**
	 * Create a custom bundle in the database
	 * Uses the existing products table with is_bundle=true and bundle_items table
	 * @param sellerId - Seller ID creating the bundle
	 * @param name - Bundle name
	 * @param description - Bundle description
	 * @param productIds - Array of product IDs to include in bundle
	 * @returns Created bundle with products
	 */
	async createBundle(
		sellerId: string,
		name: string,
		description: string,
		productIds: string[]
	): Promise<ProductBundle> {
		// Calculate pricing
		const pricing = await this.calculateBundlePrice(productIds);

		// Create bundle as a product with is_bundle=true
		const { data: bundleProduct, error: bundleError } = await this.supabase
			.from('products')
			.insert({
				seller_id: sellerId,
				name,
				short_description: description,
				long_description: description,
				price_cents: pricing.discounted_price,
				is_bundle: true,
				bundle_pricing_mode: 'derived',
				status: 'published'
			})
			.select()
			.single();

		if (bundleError) {
			throw new Error(`Failed to create bundle: ${bundleError.message}`);
		}

		// Create bundle_items records linking bundle to component products
		const bundleItems = productIds.map((productId) => ({
			bundle_product_id: bundleProduct.id,
			product_id: productId,
			quantity: 1
		}));

		const { error: itemsError } = await this.supabase.from('bundle_items').insert(bundleItems);

		if (itemsError) {
			// Rollback: delete the bundle product if items creation fails
			await this.supabase.from('products').delete().eq('id', bundleProduct.id);
			throw new Error(`Failed to add products to bundle: ${itemsError.message}`);
		}

		// Fetch component products with ratings
		const { data: products, error: fetchError } = await this.supabase
			.from('products')
			.select(
				`
				*,
				reviews (rating)
			`
			)
			.in('id', productIds);

		if (fetchError) {
			throw new Error(`Failed to fetch bundle products: ${fetchError.message}`);
		}

		// Enrich products with ratings
		const enrichedProducts: ProductWithRating[] = (products || []).map((product: any) => {
			const reviews = product?.reviews || [];
			const ratings = reviews.map((r: any) => r.rating).filter((r: number) => r != null);

			const average_rating =
				ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;

			const review_count = ratings.length;

			const { reviews: _, ...productData } = product;

			return {
				...productData,
				average_rating,
				review_count
			} as ProductWithRating;
		});

		return {
			id: bundleProduct.id,
			name: bundleProduct.name,
			description: bundleProduct.short_description || '',
			products: enrichedProducts,
			total_price: pricing.total_price,
			discounted_price: pricing.discounted_price,
			discount_percentage: pricing.discount_percentage
		};
	}

	/**
	 * Get a bundle by ID with all products
	 * @param bundleId - Bundle product ID
	 * @returns Bundle with products or null if not found
	 */
	async getById(bundleId: string): Promise<ProductBundle | null> {
		// Fetch bundle product
		const { data: bundleProduct, error: bundleError } = await this.supabase
			.from('products')
			.select('*')
			.eq('id', bundleId)
			.eq('is_bundle', true)
			.maybeSingle();

		if (bundleError) {
			throw new Error(`Failed to fetch bundle: ${bundleError.message}`);
		}

		if (!bundleProduct) {
			return null;
		}

		// Fetch bundle items (component products)
		const { data: bundleItems, error: itemsError } = await this.supabase
			.from('bundle_items')
			.select('product_id')
			.eq('bundle_product_id', bundleId);

		if (itemsError) {
			throw new Error(`Failed to fetch bundle items: ${itemsError.message}`);
		}

		const productIds = (bundleItems || []).map((item) => item.product_id);

		if (productIds.length === 0) {
			return null;
		}

		// Fetch component products with ratings
		const { data: products, error: fetchError } = await this.supabase
			.from('products')
			.select(
				`
				*,
				reviews (rating)
			`
			)
			.in('id', productIds);

		if (fetchError) {
			throw new Error(`Failed to fetch products: ${fetchError.message}`);
		}

		// Enrich products with ratings
		const enrichedProducts: ProductWithRating[] = (products || []).map((product: any) => {
			const reviews = product?.reviews || [];
			const ratings = reviews.map((r: any) => r.rating).filter((r: number) => r != null);

			const average_rating =
				ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;

			const review_count = ratings.length;

			const { reviews: _, ...productData } = product;

			return {
				...productData,
				average_rating,
				review_count
			} as ProductWithRating;
		});

		// Calculate pricing (recalculate to ensure accuracy)
		const pricing = await this.calculateBundlePrice(productIds);

		return {
			id: bundleProduct.id,
			name: bundleProduct.name,
			description: bundleProduct.short_description || '',
			products: enrichedProducts,
			total_price: pricing.total_price,
			discounted_price: bundleProduct.price_cents,
			discount_percentage: pricing.discount_percentage
		};
	}
}


