import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { BuyerUsageService } from '$lib/services/buyer-usage';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;

	if (!session) {
		throw redirect(303, '/auth/signin');
	}

	const buyerUsageService = new BuyerUsageService(locals.supabase);
	const dashboard = await buyerUsageService.getBuyerDashboard(session.user.id);

	if (!dashboard) {
		return {
			error: 'Failed to load dashboard data'
		};
	}

	return {
		dashboard
	};
};
