import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CartService } from '$lib/services/cart';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { productId, quantity = 1 } = await request.json();
		const cartService = new CartService(locals.supabase);
		
		await cartService.addItem(locals.session.user.id, productId, quantity);
		
		return json({ success: true });
	} catch (error) {
		console.error('Cart add error:', error);
		return json({ error: 'Failed to add to cart' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { itemId, quantity } = await request.json();
		const cartService = new CartService(locals.supabase);
		
		await cartService.updateQuantity(itemId, quantity);
		
		return json({ success: true });
	} catch (error) {
		console.error('Cart update error:', error);
		return json({ error: 'Failed to update cart item' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const cartService = new CartService(locals.supabase);
		
		// If itemId is provided, remove single item; otherwise clear entire cart
		if (body.itemId) {
			await cartService.removeItem(body.itemId);
		} else if (body.clearAll) {
			await cartService.clear(locals.session.user.id);
		} else {
			return json({ error: 'Missing itemId or clearAll parameter' }, { status: 400 });
		}
		
		return json({ success: true });
	} catch (error) {
		console.error('Cart remove error:', error);
		return json({ error: 'Failed to remove cart item' }, { status: 500 });
	}
};
