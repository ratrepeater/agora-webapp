import type { PageServerLoad } from './$types';
import { productFeatureService } from '$lib/services/product-features';
import { ReviewService } from '$lib/services/reviews';
import { recommendationService } from '$lib/services/recommendations';
import { BookmarkService } from '$lib/services/bookmarks';
import { CartService } from '$lib/services/cart';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		const productId = params.id;
		console.log('Loading product detail for ID:', productId);

		// Fetch product base data first (without joins that could cause multiple rows)
		const { data: productData, error: productError } = await locals.supabase
			.from('products')
			.select('*')
			.eq('id', productId)
			.single();

		if (productError) {
			console.error('Product fetch error:', productError);
			throw error(404, `Product not found: ${productError.message}`);
		}

		if (!productData) {
			console.error('No product data returned for ID:', productId);
			throw error(404, 'Product not found');
		}

		// Fetch category separately (cast to any to avoid type issues)
		const { data: categoryData } = await (locals.supabase as any)
			.from('categories')
			.select('key')
			.eq('id', productData.category_id)
			.maybeSingle();

		// Fetch reviews separately
		const { data: reviewsData } = await locals.supabase
			.from('reviews')
			.select('rating')
			.eq('product_id', productId);

		// Fetch scores separately (cast to any to avoid type issues)
		const { data: scoresData } = await (locals.supabase as any)
			.from('product_scores')
			.select('*')
			.eq('product_id', productId)
			.maybeSingle();

		console.log('Product loaded successfully:', productData.name);

		// Enrich product with ratings and scores
		const productReviews = reviewsData || [];
		const calculatedAverageRating =
			productReviews.length > 0
				? productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / productReviews.length
				: 0;

		const scores = scoresData || {};
		const category = categoryData?.key || null;

		const product = {
			...productData,
			category,
			average_rating: calculatedAverageRating,
			review_count: productReviews.length,
			fit_score: scores?.fit_score || 0,
			feature_score: scores?.feature_score || 0,
			integration_score: scores?.integration_score || 0,
			review_score: scores?.review_score || 0,
			overall_score: scores?.overall_score || 0,
			score_breakdown: scores?.score_breakdown
		};

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

		let cartQuantity = 0;
		try {
			if (locals.session?.user?.id) {
				const cartItems = await cartService.getItems(locals.session.user.id);
				const cartItem = cartItems.find((item) => item.product_id === productId);
				isInCart = !!cartItem;
				cartQuantity = cartItem?.quantity || 0;
			}
		} catch (err) {
			console.error('Error checking cart:', err);
		}

		// Fetch category-specific metrics (cast to any to avoid type issues)
		let categoryMetrics: any = { metricDefinitions: [], metrics: {} };
		if (product.category) {
			try {
				// Get category ID
				const { data: categoryData } = await (locals.supabase as any)
					.from('categories')
					.select('id')
					.eq('key', product.category)
					.maybeSingle();

				if (categoryData) {
					// Get metric definitions for this category
					const { data: metricDefinitions } = await (locals.supabase as any)
						.from('metric_definitions')
						.select('*')
						.eq('category_id', categoryData.id)
						.order('sort_order', { ascending: true });

					if (metricDefinitions && metricDefinitions.length > 0) {
						const metricIds = metricDefinitions.map((m: any) => m.id);

						// Get product metric values
						const { data: productMetricValues } = await (locals.supabase as any)
							.from('product_metric_values')
							.select('*')
							.eq('product_id', productId)
							.in('metric_id', metricIds);

						// Organize metrics
						const metrics: Record<string, any> = {};
						for (const metricDef of metricDefinitions) {
							const metricValue = productMetricValues?.find(
								(mv: any) => mv.metric_id === metricDef.id
							);

							if (metricValue) {
								let value = null;
								if (metricDef.data_type === 'number') {
									value = metricValue.numeric_value;
								} else if (metricDef.data_type === 'boolean') {
									value = metricValue.boolean_value;
								} else if (metricDef.data_type === 'string') {
									value = metricValue.string_value;
								}

								metrics[metricDef.code] = {
									value,
									label: metricDef.label,
									unit: metricDef.unit,
									dataType: metricDef.data_type,
									description: metricDef.description
								};
							}
						}

						categoryMetrics = {
							metricDefinitions,
							metrics
						};
					}
				}
			} catch (err) {
				console.error('Error loading category metrics:', err);
			}
		}

		return {
			product,
			features,
			reviews,
			similarProducts,
			categoryMetrics,
			averageRating: product.average_rating,
			isBookmarked,
			isInCart,
			cartQuantity,
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
