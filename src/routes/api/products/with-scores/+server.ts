import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const productIds = url.searchParams.get('productIds')?.split(',') || [];

	if (!productIds.length) {
		return json({ products: [] });
	}

	// Fetch products with scores
	const { data: productsData, error } = await supabase
		.from('products')
		.select(`
			*,
			categories(key),
			reviews (rating),
			product_scores (
				fit_score,
				feature_score,
				integration_score,
				review_score,
				overall_score,
				score_breakdown
			)
		`)
		.in('id', productIds);

	if (error || !productsData) {
		console.error('Error fetching products with scores:', error);
		return json({ products: [] });
	}

	// Enrich products with ratings and scores
	const enrichedProducts = productsData.map((product: any) => {
		const reviews = product.reviews || [];
		const averageRating =
			reviews.length > 0
				? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
				: 0;

		const scores = Array.isArray(product.product_scores) 
			? product.product_scores[0] 
			: product.product_scores;

		const category = product.categories?.key || null;

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
	});

	return json({ products: enrichedProducts });
};
