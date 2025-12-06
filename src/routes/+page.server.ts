import type { PageServerLoad } from './$types';
import { recommendationService } from '$lib/services/recommendations';
import { productService } from '$lib/services/products';
import { CartService } from '$lib/services/cart';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		// Load different product categories for the homepage
		const [newProducts, featuredProducts, recommendedProducts] = await Promise.all([
			recommendationService.getNewAndNotable(20),
			productService.getFeatured(),
			locals.session?.user?.id
				? recommendationService.getPersonalized(locals.session.user.id, 20)
				: recommendationService.getTrending(20)
		]);

		// Fetch cart quantities if user is authenticated
		let cartQuantities: Record<string, number> = {};
		if (locals.session?.user?.id) {
			try {
				const cartService = new CartService(locals.supabase);
				const cartItems = await cartService.getItems(locals.session.user.id);
				cartQuantities = cartItems.reduce((acc, item) => {
					acc[item.product_id] = item.quantity || 1;
					return acc;
				}, {} as Record<string, number>);
			} catch (error) {
				console.error('Error loading cart:', error);
			}
		}

		return {
			newProducts,
			featuredProducts,
			recommendedProducts,
			isAuthenticated: !!locals.session,
			cartQuantities
		};
	} catch (error) {
		console.error('Error loading homepage data:', error);
		return {
			newProducts: [],
			featuredProducts: [],
			recommendedProducts: [],
			isAuthenticated: false,
			cartQuantities: {}
		};
	}
};
