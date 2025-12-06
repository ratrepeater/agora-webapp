import type { PageServerLoad } from './$types';
import { CartService } from '$lib/services/cart';

export const load: PageServerLoad = async ({ url, locals }) => {
	const category = url.searchParams.get('category');
	
	// Fetch cart quantities if user is authenticated
	let cartQuantities: Record<string, number> = {};
	if (locals.session?.user) {
		try {
			const cartService = new CartService(locals.supabase);
			const cartItems = await cartService.getItems(locals.session.user.id);
			// Build a map of product_id -> quantity
			cartQuantities = cartItems.reduce((acc, item) => {
				acc[item.product_id] = item.quantity || 1;
				return acc;
			}, {} as Record<string, number>);
		} catch (error) {
			console.error('Error loading cart:', error);
		}
	}
	
	if (!category) {
		return {
			metricDefinitions: [],
			productMetrics: {},
			cartQuantities
		};
	}

	// Get category ID
	const { data: categoryData } = await locals.supabase
		.from('categories')
		.select('id')
		.eq('key', category)
		.single();

	if (!categoryData) {
		return {
			metricDefinitions: [],
			productMetrics: {},
			cartQuantities
		};
	}

	// Get metric definitions for this category
	const { data: metricDefinitions } = await locals.supabase
		.from('metric_definitions')
		.select('*')
		.eq('category_id', categoryData.id)
		.order('sort_order', { ascending: true });

	return {
		metricDefinitions: metricDefinitions || [],
		productMetrics: {}, // Will be populated client-side
		cartQuantities
	};
};
