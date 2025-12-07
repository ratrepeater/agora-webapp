import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const productIds = url.searchParams.get('productIds')?.split(',') || [];

	if (!productIds.length) {
		return json({ products: [] });
	}

	try {
		// Fetch products base data
		const { data: productsData, error: productsError } = await supabase
			.from('products')
			.select('*')
			.in('id', productIds);

		if (productsError || !productsData) {
			console.error('Error fetching products:', productsError);
			return json({ products: [] });
		}

		// Enrich each product with category, reviews, and scores
		const enrichedProducts = await Promise.all(
			productsData.map(async (product: any) => {
				// Fetch category (cast to any to avoid type issues)
				const { data: categoryData } = await (supabase as any)
					.from('categories')
					.select('key')
					.eq('id', product.category_id)
					.maybeSingle();

				// Fetch reviews
				const { data: reviewsData } = await supabase
					.from('reviews')
					.select('rating')
					.eq('product_id', product.id);

				// Fetch scores (cast to any to avoid type issues)
				const { data: scoresData } = await (supabase as any)
					.from('product_scores')
					.select('*')
					.eq('product_id', product.id)
					.maybeSingle();

				const reviews = reviewsData || [];
				const averageRating =
					reviews.length > 0
						? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
						: 0;

				const scores = scoresData || {};
				const category = categoryData?.key || null;

				return {
					...product,
					category,
					average_rating: averageRating,
					review_count: reviews.length,
					fit_score: scores?.fit_score || 0,
					feature_score: scores?.feature_score || 0,
					integration_score: scores?.integration_score || 0,
					review_score: scores?.review_score || 0,
					overall_score: scores?.overall_score || 0,
					score_breakdown: scores?.score_breakdown
				};
			})
		);

		return json({ products: enrichedProducts });
	} catch (err) {
		console.error('Error in with-scores API:', err);
		return json({ products: [] });
	}
};
