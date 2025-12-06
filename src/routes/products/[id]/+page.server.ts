import type { PageServerLoad } from './$types';
import { productService } from '$lib/services/products';
import { productFeatureService } from '$lib/services/product-features';
import { ReviewService } from '$lib/services/reviews';
import { recommendationService } from '$lib/services/recommendations';
import { BookmarkService } from '$lib/services/bookmarks';
import { CartService } from '$lib/services/cart';
import { analyticsService } from '$lib/services/analytics';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		const productId = params.id;

		// Fetch product details
		const product = await productService.getById(productId);

		if (!product) {
			throw error(404, 'Product not found');
		}

		// Initialize services with supabase client
		const bookmarkService = new BookmarkService(locals.supabase);
		const cartService = new CartService(locals.supabase);
		const reviewServiceInstance = new ReviewService(locals.supabase);

		// Fetch related data with error handling for each
		let features: any[] = [];
		let reviews: any[] = [];
		let similarProducts: any[] = [];
		let isBookmarked = false;
		let isInCart = false;
		let averageRating = 0;

		try {
			features = await productFeatureService.getByProduct(productId);
		} catch (err) {
			console.error('Error loading features:', err);
		}

		try {
			reviews = await reviewServiceInstance.getByProduct(productId);
			console.log(`Loaded ${reviews.length} reviews for product ${productId}`);
		} catch (err) {
			console.error('Error loading reviews:', err);
			console.error('Full error details:', JSON.stringify(err, null, 2));
		}

		try {
			similarProducts = await recommendationService.getSimilarProducts(productId, 6);
		} catch (err) {
			console.error('Error loading similar products:', err);
		}

		try {
			if (locals.session?.user?.id) {
				isBookmarked = await bookmarkService.isBookmarked(locals.session.user.id, productId);
			}
		} catch (err) {
			console.error('Error checking bookmark:', err);
		}

		try {
			if (locals.session?.user?.id) {
				const cartItems = await cartService.getItems(locals.session.user.id);
				isInCart = cartItems.some((item) => item.product_id === productId);
			}
		} catch (err) {
			console.error('Error checking cart:', err);
		}

		try {
			averageRating = await reviewServiceInstance.getAverageRating(productId);
		} catch (err) {
			console.error('Error calculating average rating:', err);
		}

		return {
			product,
			features,
			reviews,
			similarProducts,
			averageRating,
			isBookmarked,
			isInCart,
			isAuthenticated: !!locals.session
		};
	} catch (err) {
		console.error('Error loading product detail:', err);
		if ((err as any).status === 404) {
			throw err;
		}
		throw error(500, 'Failed to load product details');
	}
};
