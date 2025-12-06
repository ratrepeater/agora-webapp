import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { OrderService } from '$lib/services/orders';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;

	if (!session) {
		throw redirect(303, '/auth/signin');
	}

	// Get all orders for the buyer
	const orderService = new OrderService(locals.supabase);
	const orders = await orderService.getByBuyer(session.user.id);

	return {
		orders
	};
};
