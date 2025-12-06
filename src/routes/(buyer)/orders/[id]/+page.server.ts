import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { OrderService } from '$lib/services/orders';

export const load: PageServerLoad = async ({ locals, params }) => {
	const session = locals.session;

	if (!session) {
		throw redirect(303, '/auth/signin');
	}

	// Get the specific order
	const orderService = new OrderService(locals.supabase);
	const order = await orderService.getById(params.id);

	if (!order) {
		throw error(404, 'Order not found');
	}

	// Verify the order belongs to the current user
	if (order.buyer_id !== session.user.id) {
		throw error(403, 'Unauthorized');
	}

	return {
		order
	};
};
