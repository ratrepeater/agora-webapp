import type { PageServerLoad } from './$types';
import { analyticsService } from '$lib/services/analytics';
import { productService } from '$lib/services/products';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Ensure user is authenticated and is a seller
	if (!locals.session?.user || locals.userRole !== 'seller') {
		throw redirect(303, '/auth/signin');
	}

	try {
		// Get product ID from query parameter (optional)
		const productId = url.searchParams.get('productId');

		// Get seller's products
		const sellerProducts = await productService.getBySeller(locals.session.user.id);

		// If no product ID specified, use the first product
		const selectedProductId = productId || sellerProducts[0]?.id;

		if (!selectedProductId) {
			return {
				sellerProducts: [],
				selectedProduct: null,
				competitorAnalysis: null
			};
		}

		// Get competitor analysis for the selected product
		const competitorAnalysis = await analyticsService.getCompetitorAnalysis(selectedProductId);

		// Get the selected product details
		const selectedProduct = sellerProducts.find((p) => p.id === selectedProductId);

		return {
			sellerProducts,
			selectedProduct,
			competitorAnalysis
		};
	} catch (error) {
		console.error('Error loading competitor analysis:', error);
		return {
			sellerProducts: [],
			selectedProduct: null,
			competitorAnalysis: null
		};
	}
};
