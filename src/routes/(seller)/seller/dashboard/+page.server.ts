import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { analyticsService } from '$lib/services/analytics';

export const load: PageServerLoad = async ({ locals }) => {
    const session = locals.session;

    if (!session) {
        throw redirect(303, '/auth/signin');
    }

    console.log('Loading dashboard for seller:', session.user.id);

    // Get seller dashboard data
    const dashboard = await analyticsService.getSellerDashboard(session.user.id);

    console.log('Dashboard data loaded:', {
        total_products: dashboard.total_products,
        total_revenue: dashboard.total_revenue,
        total_orders: dashboard.total_orders,
        average_rating: dashboard.average_rating
    });

    return {
        dashboard
    };
};
