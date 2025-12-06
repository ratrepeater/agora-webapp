import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.session || locals.userRole !== 'seller') {
		throw error(401, 'Unauthorized');
	}

	const productId = params.id;

	// Fetch product details
	const { data: product, error: productError } = await locals.supabase
		.from('products')
		.select('*')
		.eq('id', productId)
		.eq('seller_id', locals.session.user.id)
		.single();

	if (productError || !product) {
		throw error(404, 'Product not found or you do not have permission to view its analytics');
	}

	// Fetch analytics data from product_analytics_daily
	const { data: analyticsData, error: analyticsError } = await locals.supabase
		.from('product_analytics_daily')
		.select('*')
		.eq('product_id', productId)
		.order('date', { ascending: false });

	if (analyticsError) {
		console.error('Error fetching analytics:', analyticsError);
	}

	// Calculate totals and aggregates
	const analytics = analyticsData || [];
	
	const totals = analytics.reduce(
		(acc, day) => ({
			views: acc.views + (day.views || 0),
			downloads: acc.downloads + (day.downloads || 0),
			purchases: acc.purchases + (day.purchases || 0),
			bookmarks: acc.bookmarks + (day.bookmarks || 0),
			cart_adds: acc.cart_adds + (day.cart_adds || 0)
		}),
		{ views: 0, downloads: 0, purchases: 0, bookmarks: 0, cart_adds: 0 }
	);

	// Get last 30 days for chart
	const last30Days = analytics.slice(0, 30).reverse();

	// Calculate conversion rates
	const conversionRate = totals.views > 0 ? (totals.purchases / totals.views) * 100 : 0;
	const cartAddRate = totals.views > 0 ? (totals.cart_adds / totals.views) * 100 : 0;
	const bookmarkRate = totals.views > 0 ? (totals.bookmarks / totals.views) * 100 : 0;

	// Get recent activity (last 7 days)
	const last7Days = analytics.slice(0, 7);
	const recentViews = last7Days.reduce((sum, day) => sum + (day.views || 0), 0);
	const recentPurchases = last7Days.reduce((sum, day) => sum + (day.purchases || 0), 0);

	// Calculate trends (compare last 7 days to previous 7 days)
	const previous7Days = analytics.slice(7, 14);
	const previousViews = previous7Days.reduce((sum, day) => sum + (day.views || 0), 0);
	const previousPurchases = previous7Days.reduce((sum, day) => sum + (day.purchases || 0), 0);

	const viewsTrend = previousViews > 0 ? ((recentViews - previousViews) / previousViews) * 100 : 0;
	const purchasesTrend = previousPurchases > 0 ? ((recentPurchases - previousPurchases) / previousPurchases) * 100 : 0;

	return {
		product,
		totals,
		last30Days,
		conversionRate,
		cartAddRate,
		bookmarkRate,
		recentViews,
		recentPurchases,
		viewsTrend,
		purchasesTrend
	};
};
