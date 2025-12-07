import type { PageServerLoad } from './$types';
import type { ProductCategory } from '$lib/helpers/types';

export const load: PageServerLoad = async ({ url, locals }) => {
	try {
		// Extract query parameters
		const searchQuery = url.searchParams.get('q') || '';
		const categoryParam = url.searchParams.get('category');
		const minPrice = url.searchParams.get('minPrice');
		const maxPrice = url.searchParams.get('maxPrice');
		const minRating = url.searchParams.get('minRating');
		const featured = url.searchParams.get('filter') === 'featured';
		const isNew = url.searchParams.get('filter') === 'new';

		// Build query directly - simple and straightforward
		let query = locals.supabase
			.from('products')
			.select(`
				*,
				categories(key),
				reviews(rating)
			`)
			.eq('status', 'published');

		// Apply filters
		if (categoryParam && categoryParam !== 'All') {
			// Get category ID first
			const { data: categoryData } = await locals.supabase
				.from('categories')
				.select('id')
				.eq('key', categoryParam)
				.single();
			
			if (categoryData) {
				query = query.eq('category_id', categoryData.id);
			}
		}

		if (minPrice) {
			query = query.gte('price_cents', parseFloat(minPrice) * 100);
		}

		if (maxPrice) {
			query = query.lte('price_cents', parseFloat(maxPrice) * 100);
		}

		if (featured) {
			query = query.eq('is_featured', true);
		}

		if (isNew) {
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
			query = query.gte('created_at', thirtyDaysAgo.toISOString());
		}

		// Search by name if query provided
		if (searchQuery) {
			query = query.ilike('name', `%${searchQuery}%`);
		}

		const { data: productsData, error: productsError } = await query.order('created_at', { ascending: false });

		if (productsError) {
			console.error('Error fetching products:', productsError);
			throw productsError;
		}

		// Get product IDs for fetching scores
		const productIds = productsData?.map(p => p.id) || [];

		// Fetch scores
		const { data: scores } = await locals.supabase
			.from('product_scores')
			.select('*')
			.in('product_id', productIds);

		const scoresMap = new Map(scores?.map(s => [s.product_id, s]) || []);

		// Enrich products
		const products = (productsData || []).map((product: any) => {
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

		console.log('Marketplace - Sample product IDs:', {
			firstProduct: products[0]?.id,
			firstProductName: products[0]?.name
		});

		// Fetch user's bookmarks and cart if authenticated
		let bookmarkedProductIds: string[] = [];
		let cartQuantities: Record<string, number> = {};
		
		if (locals.session?.user) {
			try {
				const { data: bookmarks } = await locals.supabase
					.from('bookmarks')
					.select('product_id')
					.eq('buyer_id', locals.session.user.id);
				
				bookmarkedProductIds = (bookmarks || []).map(b => b.product_id);
			} catch (error) {
				console.error('Error loading bookmarks:', error);
			}

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
			products,
			searchQuery,
			bookmarkedProductIds,
			cartQuantities,
			filters: {
				category: categoryParam || 'All',
				minPrice: minPrice ? parseFloat(minPrice) : undefined,
				maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
				minRating: minRating ? parseFloat(minRating) : undefined,
				featured,
				new: isNew
			}
		};
	} catch (error) {
		console.error('Error loading marketplace data:', error);
		return {
			products: [],
			searchQuery: '',
			bookmarkedProductIds: [],
			cartQuantities: {},
			filters: {
				category: 'All'
			}
		};
	}
};
