import type { CartItem, CartItemWithProduct, ProductWithRating } from '$lib/helpers/types';
import { analyticsService } from './analytics';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * CartService - Handles all cart-related database operations
 * Implements addItem, updateQuantity, removeItem, clear, getItems, and getTotal methods
 */
export class CartService {
	constructor(private supabase: SupabaseClient) {}

	/**
	 * Get or create a cart for a buyer
	 * @param buyerId - Buyer's profile ID
	 * @returns Cart ID
	 */
	private async getOrCreateCart(buyerId: string): Promise<string> {
		// Try to find an open cart
		const { data: existingCart, error: findError } = await this.supabase
			.from('carts')
			.select('id')
			.eq('buyer_id', buyerId)
			.eq('status', 'open')
			.maybeSingle();

		if (findError) {
			throw new Error(`Failed to find cart: ${findError.message}`);
		}

		if (existingCart) {
			return existingCart.id;
		}

		// Create a new cart if none exists
		const { data: newCart, error: createError } = await this.supabase
			.from('carts')
			.insert({ buyer_id: buyerId, status: 'open' })
			.select('id')
			.single();

		if (createError) {
			throw new Error(`Failed to create cart: ${createError.message}`);
		}

		return newCart.id;
	}

	/**
	 * Get all cart items for a buyer with product details
	 * @param buyerId - Buyer's profile ID
	 * @returns Array of cart items with product information
	 */
	async getItems(buyerId: string): Promise<CartItemWithProduct[]> {
		const cartId = await this.getOrCreateCart(buyerId);

		const { data, error } = await this.supabase
			.from('cart_items')
			.select(
				`
				*,
				product:products (
					*,
					reviews (rating)
				)
			`
			)
			.eq('cart_id', cartId)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch cart items: ${error.message}`);
		}

		// Enrich products with ratings
		return (data || []).map((item) => {
			const product = item.product as any;
			const reviews = product?.reviews || [];
			const ratings = reviews.map((r: any) => r.rating).filter((r: number) => r != null);

			const average_rating =
				ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;

			const review_count = ratings.length;

			// Remove the reviews array and add calculated fields
			const { reviews: _, ...productData } = product;

			return {
				id: item.id,
				cart_id: item.cart_id,
				product_id: item.product_id,
				quantity: item.quantity,
				unit_price_cents: item.unit_price_cents,
				created_at: item.created_at,
				product: {
					...productData,
					average_rating,
					review_count
				} as ProductWithRating
			} as CartItemWithProduct;
		});
	}

	/**
	 * Get the total cost of all items in a buyer's cart (in cents)
	 * @param buyerId - Buyer's profile ID
	 * @returns Total cost in cents
	 */
	async getTotal(buyerId: string): Promise<number> {
		const items = await this.getItems(buyerId);
		return items.reduce((total, item) => {
			return total + item.product.price_cents * item.quantity;
		}, 0);
	}

	/**
	 * Add an item to the cart or update quantity if it already exists
	 * @param buyerId - Buyer's profile ID
	 * @param productId - Product ID to add
	 * @param quantity - Quantity to add (default: 1)
	 * @returns Created or updated cart item
	 */
	async addItem(buyerId: string, productId: string, quantity: number = 1): Promise<CartItem> {
		const cartId = await this.getOrCreateCart(buyerId);

		// Get product price
		const { data: product, error: productError } = await this.supabase
			.from('products')
			.select('price_cents')
			.eq('id', productId)
			.single();

		if (productError) {
			throw new Error(`Failed to fetch product: ${productError.message}`);
		}

		// Check if item already exists in cart
		const { data: existingItem, error: checkError } = await this.supabase
			.from('cart_items')
			.select('*')
			.eq('cart_id', cartId)
			.eq('product_id', productId)
			.maybeSingle();

		if (checkError) {
			throw new Error(`Failed to check existing cart item: ${checkError.message}`);
		}

		// If item exists, update quantity
		if (existingItem) {
			const newQuantity = existingItem.quantity + quantity;
			const { data, error } = await this.supabase
				.from('cart_items')
				.update({ quantity: newQuantity })
				.eq('id', existingItem.id)
				.select()
				.single();

			if (error) {
				throw new Error(`Failed to update cart item quantity: ${error.message}`);
			}

			return data;
		}

		// Otherwise, create new cart item
		const { data, error } = await this.supabase
			.from('cart_items')
			.insert({
				cart_id: cartId,
				product_id: productId,
				quantity: quantity,
				unit_price_cents: product.price_cents
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to add cart item: ${error.message}`);
		}

		// Track cart add event
		await analyticsService.trackCartAdd(productId, buyerId);

		return data;
	}

	/**
	 * Update the quantity of a cart item
	 * @param itemId - Cart item ID
	 * @param quantity - New quantity
	 * @returns Updated cart item
	 */
	async updateQuantity(itemId: string, quantity: number): Promise<CartItem> {
		if (quantity <= 0) {
			throw new Error('Quantity must be greater than 0');
		}

		const { data, error } = await this.supabase
			.from('cart_items')
			.update({ quantity })
			.eq('id', itemId)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to update cart item quantity: ${error.message}`);
		}

		return data;
	}

	/**
	 * Remove an item from the cart
	 * @param itemId - Cart item ID to remove
	 */
	async removeItem(itemId: string): Promise<void> {
		const { error } = await this.supabase.from('cart_items').delete().eq('id', itemId);

		if (error) {
			throw new Error(`Failed to remove cart item: ${error.message}`);
		}
	}

	/**
	 * Clear all items from a buyer's cart
	 * @param buyerId - Buyer's profile ID
	 */
	async clear(buyerId: string): Promise<void> {
		const cartId = await this.getOrCreateCart(buyerId);

		const { error } = await this.supabase.from('cart_items').delete().eq('cart_id', cartId);

		if (error) {
			throw new Error(`Failed to clear cart: ${error.message}`);
		}
	}
}
