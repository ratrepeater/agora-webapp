import type { PageServerLoad } from './$types';
import { BookmarkService } from '$lib/services/bookmarks';
import { CartService } from '$lib/services/cart';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Ensure user is authenticated
	if (!locals.session?.user) {
		throw redirect(303, `/auth/signin?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	console.log('Loading bookmarks for user:', locals.session.user.id);
	
	try {
		// Fetch bookmarked products
		const bookmarkService = new BookmarkService(locals.supabase);
		const bookmarks = await bookmarkService.getByBuyer(locals.session.user.id);
		
		console.log('Bookmarks fetched:', bookmarks.length, 'items');
		if (bookmarks.length > 0) {
			console.log('First bookmark:', JSON.stringify(bookmarks[0], null, 2));
		}
		
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
		console.error('Error details:', error);
		if (error instanceof Error) {
			console.error('Error message:', error.message);
			console.error('Error stack:', error.stack);
		}
		return {
			bookmarks: [],
			cartQuantities: {}
		};
	}
};
