import type { PageServerLoad } from './$types';
import { recommendationService } from '$lib/services/recommendations';
import { productService } from '$lib/services/products';

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

		return {
			newProducts,
			featuredProducts,
			recommendedProducts,
			isAuthenticated: !!locals.session
		};
	} catch (error) {
		console.error('Error loading homepage data:', error);
		return {
			newProducts: [],
			featuredProducts: [],
			recommendedProducts: [],
			isAuthenticated: false
		};
	}
};
