import type { PageServerLoad } from './$types';
import { BookmarkService } from '$lib/services/bookmarks';
import { CartService } from '$lib/services/cart';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Ensure user is authenticated
	if (!locals.session?.user) {
		throw redirect(303, '/auth/signin');
	}

	try {
		// Fetch bookmarked products
		const bookmarkService = new BookmarkService(locals.supabase);
		const bookmarks = await bookmarkService.getByBuyer(locals.session.user.id);
		
		// Fetch cart quantities
		let cartQuantities: Record<string, number> = {};
		try {
			const cartService = new CartService(locals.supabase);
			const cartItems = await cartService.getItems(locals.session.user.id);
			// Build a map of product_id -> quantity
			cartQuantities = cartItems.reduce((acc, item) => {
				acc[item.product_id] = item.quantity || 1;
				return acc;
			}, {} as Record<string, number>);
		} catch (error) {
			console.error('Error loading cart:', error);
		}
		
		return {
			bookmarks,
			cartQuantities
		};
	} catch (error) {
		console.error('Error loading bookmarks:', error);
		return {
			bookmarks: [],
			cartQuantities: {}
		};
	}
};
