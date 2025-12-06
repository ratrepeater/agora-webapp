import type { Order, OrderWithItems, OrderItemWithProduct, CartItemWithProduct, ProductWithRating } from '$lib/helpers/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * OrderService - Handles all order-related database operations
 * Implements create, getByBuyer, and getById methods for demo transactions
 */
export class OrderService {
	constructor(private supabase: SupabaseClient) {}
	/**
	 * Create a new order from cart items (demo transaction with zero charge)
	 * @param buyerId - Buyer's profile ID
	 * @param cartItems - Cart items to convert to order
	 * @returns Created order
	 */
	async create(buyerId: string, cartItems: CartItemWithProduct[]): Promise<Order> {
		if (!cartItems || cartItems.length === 0) {
			throw new Error('Cannot create order with empty cart');
		}

		// Calculate total from cart items (in cents)
		const totalCents = cartItems.reduce((sum, item) => {
			return sum + (item.unit_price_cents * item.quantity);
		}, 0);

		// Create order (demo transaction with zero charge)
		const { data: order, error: orderError } = await this.supabase
			.from('orders')
			.insert({
				buyer_id: buyerId,
				demo: true,
				demo_total_cents: totalCents,
				status: 'completed'
			})
			.select()
			.single();

		if (orderError) {
			throw new Error(`Failed to create order: ${orderError.message}`);
		}

		// Create order items
		const orderItems = cartItems.map(item => ({
			order_id: order.id,
			product_id: item.product_id,
			quantity: item.quantity,
			unit_price_cents: item.unit_price_cents,
			subtotal_cents: item.unit_price_cents * item.quantity
		}));

		const { error: itemsError } = await this.supabase
			.from('order_items')
			.insert(orderItems);

		if (itemsError) {
			// Rollback: delete the order if items creation fails
			await this.supabase.from('orders').delete().eq('id', order.id);
			throw new Error(`Failed to create order items: ${itemsError.message}`);
		}

		// Note: Cart clearing should be done by the caller
		// Track purchase events skipped for now (analytics service needs refactoring)

		return order;
	}

	/**
	 * Get all orders for a buyer with order items and product details
	 * @param buyerId - Buyer's profile ID
	 * @returns Array of orders with items
	 */
	async getByBuyer(buyerId: string): Promise<OrderWithItems[]> {
		const { data, error } = await this.supabase
			.from('orders')
			.select(`
				*,
				order_items (
					*,
					product:products (
						*,
						reviews (rating)
					)
				)
			`)
			.eq('buyer_id', buyerId)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch orders: ${error.message}`);
		}

		// Enrich products with ratings
		return (data || []).map(order => {
			const items = (order.order_items || []).map((item: any) => {
				const product = item.product as any;
				const reviews = product?.reviews || [];
				const ratings = reviews.map((r: any) => r.rating).filter((r: number) => r != null);

				const average_rating = ratings.length > 0
					? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
					: 0;

				const review_count = ratings.length;

				// Remove the reviews array and add calculated fields
				const { reviews: _, ...productData } = product;

				return {
					id: item.id,
					order_id: item.order_id,
					product_id: item.product_id,
					quantity: item.quantity,
					unit_price_cents: item.unit_price_cents,
					subtotal_cents: item.subtotal_cents,
					product: {
						...productData,
						average_rating,
						review_count
					} as ProductWithRating
				} as OrderItemWithProduct;
			});

			return {
				id: order.id,
				buyer_id: order.buyer_id,
				created_at: order.created_at,
				demo: order.demo,
				demo_total_cents: order.demo_total_cents,
				status: order.status,
				items
			} as OrderWithItems;
		});
	}

	/**
	 * Get a specific order by ID with order items and product details
	 * @param orderId - Order ID
	 * @returns Order with items or null if not found
	 */
	async getById(orderId: string): Promise<OrderWithItems | null> {
		const { data, error } = await this.supabase
			.from('orders')
			.select(`
				*,
				order_items (
					*,
					product:products (
						*,
						reviews (rating)
					)
				)
			`)
			.eq('id', orderId)
			.maybeSingle();

		if (error) {
			throw new Error(`Failed to fetch order: ${error.message}`);
		}

		if (!data) {
			return null;
		}

		// Enrich products with ratings
		const items = (data.order_items || []).map((item: any) => {
			const product = item.product as any;
			const reviews = product?.reviews || [];
			const ratings = reviews.map((r: any) => r.rating).filter((r: number) => r != null);

			const average_rating = ratings.length > 0
				? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
				: 0;

			const review_count = ratings.length;

			// Remove the reviews array and add calculated fields
			const { reviews: _, ...productData } = product;

			return {
				id: item.id,
				order_id: item.order_id,
				product_id: item.product_id,
				quantity: item.quantity,
				unit_price_cents: item.unit_price_cents,
				subtotal_cents: item.subtotal_cents,
				product: {
					...productData,
					average_rating,
					review_count
				} as ProductWithRating
			} as OrderItemWithProduct;
		});

		return {
			id: data.id,
			buyer_id: data.buyer_id,
			created_at: data.created_at,
			demo: data.demo,
			demo_total_cents: data.demo_total_cents,
			status: data.status,
			items
		} as OrderWithItems;
	}
}


