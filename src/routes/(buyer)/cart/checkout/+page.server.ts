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
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			// Get cart items
			const cartService = new CartService(locals.supabase);
			const orderService = new OrderService(locals.supabase);
			
			const items = await cartService.getItems(locals.session.user.id);

			if (!items || items.length === 0) {
				return fail(400, { error: 'Cart is empty' });
			}

			// Create order (demo transaction with zero charge)
			const order = await orderService.create(locals.session.user.id, items);

			// Clear the cart after successful order
			await cartService.clear(locals.session.user.id);

			// Redirect to order confirmation page
			throw redirect(303, `/orders/${order.id}`);
		} catch (error) {
			console.error('Error processing checkout:', error);
			return fail(500, { error: 'Failed to process checkout' });
		}
	}
};
