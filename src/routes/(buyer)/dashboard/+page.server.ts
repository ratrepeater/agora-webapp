import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { BuyerUsageService } from '$lib/services/buyer-usage';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session;

	if (!session) {
		throw redirect(303, `/auth/signin?redirectTo=${encodeURIComponent(url.pathname)}`);
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
