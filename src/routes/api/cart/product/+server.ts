import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CartService } from '$lib/services/cart';

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { productId, quantity } = await request.json();
		const cartService = new CartService(locals.supabase);
		
		// Get cart items to find the item with this product
		const cartItems = await cartService.getItems(locals.session.user.id);
		const cartItem = cartItems.find(item => item.product_id === productId);
		
		if (!cartItem) {
			return json({ error: 'Product not in cart' }, { status: 404 });
		}

		// Calculate new quantity
		const newQuantity = (cartItem.quantity || 1) - (quantity || 1);

		if (newQuantity <= 0) {
			// Remove the item entirely
			await cartService.removeItem(cartItem.id);
		} else {
			// Update the quantity
			await cartService.updateQuantity(cartItem.id, newQuantity);
		}
		
		return json({ success: true });
	} catch (error) {
		console.error('Cart product remove error:', error);
		return json({ error: 'Failed to remove product from cart' }, { status: 500 });
	}
};
