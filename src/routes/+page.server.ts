import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		// Fetch products directly from database - simple and straightforward
		const { data: allProducts, error: productsError } = await locals.supabase
			.from('products')
			.select(`
				*,
				categories(key),
				reviews(rating)
			`)
			.eq('status', 'published')
			.order('created_at', { ascending: false });

		if (productsError) {
			console.error('Error fetching products:', productsError);
			throw productsError;
		}

		// Get product IDs for fetching scores
		const productIds = allProducts?.map(p => p.id) || [];

		// Fetch scores
		const { data: scores } = await locals.supabase
			.from('product_scores')
			.select('*')
			.in('product_id', productIds);

		const scoresMap = new Map(scores?.map(s => [s.product_id, s]) || []);

		// Enrich products with ratings and scores
		const enrichedProducts = (allProducts || []).map((product: any) => {
			const reviews = product.reviews || [];
			const averageRating = reviews.length > 0
				? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
				: 0;
			
			const productScores = scoresMap.get(product.id);
			const category = product.categories?.key || null;

			return {
				...product,
				category,
				average_rating: averageRating,
				review_count: reviews.length,
				fit_score: productScores?.fit_score || 0,
				feature_score: productScores?.feature_score || 0,
				integration_score: productScores?.integration_score || 0,
				review_score: productScores?.review_score || 0,
				overall_score: productScores?.overall_score || 0,
				score_breakdown: productScores?.score_breakdown
			};
		});

		// Split into categories
		const newProducts = enrichedProducts.slice(0, 20); // Most recent 20
		const featuredProducts = enrichedProducts.filter((p: any) => p.is_featured);
		const recommendedProducts = enrichedProducts.slice(0, 20); // For now, same as new

		console.log('Homepage - Sample product IDs:', {
			firstProduct: newProducts[0]?.id,
			firstProductName: newProducts[0]?.name
		});

		// Fetch cart quantities if user is authenticated
		let cartQuantities: Record<string, number> = {};
		if (locals.session?.user?.id) {
			try {
				const { data: cartItems } = await locals.supabase
					.from('cart_items')
					.select('product_id, quantity')
					.eq('buyer_id', locals.session.user.id);

				cartQuantities = (cartItems || []).reduce((acc, item) => {
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
