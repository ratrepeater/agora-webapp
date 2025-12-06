import type { PageServerLoad } from './$types';
import { CartService } from '$lib/services/cart';
import { BundleService } from '$lib/services/bundles';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		// If user is authenticated, load their cart
		if (locals.session?.user) {
			const cartService = new CartService(locals.supabase);
			const bundleService = new BundleService(locals.supabase);
			
			const items = await cartService.getItems(locals.session.user.id);
			const total = await cartService.getTotal(locals.session.user.id);

			// Get bundle suggestions based on cart items
			let suggestedBundles = [];
			if (items.length > 0) {
				try {
					suggestedBundles = await bundleService.getSuggestedBundles(items);
				} catch (bundleError) {
					console.error('Error loading bundle suggestions:', bundleError);
				}
			}

			return {
				items,
				total,
				suggestedBundles
			};
		}

		// Return empty cart for unauthenticated users
		return {
			items: [],
			total: 0,
			suggestedBundles: []
		};
	} catch (error) {
		console.error('Error loading cart:', error);
		return {
			items: [],
			total: 0,
			suggestedBundles: []
		};
	}
};
