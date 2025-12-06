import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { analyticsService } from '$lib/services/analytics';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;

	if (!session) {
		throw redirect(303, '/auth/signin');
	}

	// Get seller dashboard data
	const dashboard = await analyticsService.getSellerDashboard(session.user.id);

	return {
		dashboard
	};
};
