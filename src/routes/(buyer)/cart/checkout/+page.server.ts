import type { PageServerLoad, Actions } from './$types';
import { CartService } from '$lib/services/cart';
import { OrderService } from '$lib/services/orders';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Ensure user is authenticated
	if (!locals.session?.user) {
		throw redirect(303, '/auth/signin');
	}

	try {
		// Load cart items for checkout
		const cartService = new CartService(locals.supabase);
		const items = await cartService.getItems(locals.session.user.id);
		const total = await cartService.getTotal(locals.session.user.id);

		// If cart is empty, redirect to cart page
		if (!items || items.length === 0) {
			throw redirect(303, '/cart');
		}

		return {
			items,
			total
		};
	} catch (error) {
		console.error('Error loading checkout:', error);
		throw redirect(303, '/cart');
	}
};

export const actions: Actions = {
	default: async ({ locals }) => {
		// Ensure user is authenticated
		if (!locals.session?.user) {
			console.error('Checkout: User not authenticated');
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			// Get cart items
			const cartService = new CartService(locals.supabase);
			const orderService = new OrderService(locals.supabase);
			
			console.log('Checkout: Fetching cart items for user:', locals.session.user.id);
			const items = await cartService.getItems(locals.session.user.id);

			if (!items || items.length === 0) {
				console.error('Checkout: Cart is empty');
				return fail(400, { error: 'Cart is empty' });
			}

			console.log('Checkout: Creating order with', items.length, 'items');
			// Create order (demo transaction with zero charge)
			const order = await orderService.create(locals.session.user.id, items);
			console.log('Checkout: Order created successfully:', order.id);

			// Clear the cart after successful order
			console.log('Checkout: Clearing cart');
			await cartService.clear(locals.session.user.id);

			// Redirect to orders page
			console.log('Checkout: Redirecting to /orders');
			throw redirect(303, '/orders');
		} catch (error) {
			// Check if it's a redirect (which is expected)
			if (error && typeof error === 'object' && 'status' in error && (error as any).status === 303) {
				console.log('Checkout: Redirect caught, re-throwing');
				throw error;
			}
			console.error('Error processing checkout:', error);
			console.error('Error details:', JSON.stringify(error, null, 2));
			return fail(500, { error: 'Failed to process checkout' });
		}
	}
};
