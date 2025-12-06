import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analyticsService } from '$lib/services/analytics';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { event, productId } = await request.json();

		if (!productId) {
			return json({ error: 'Product ID is required' }, { status: 400 });
		}

		const buyerId = locals.session?.user?.id;

		switch (event) {
			case 'comparison_add':
				// Track comparison add - we don't have a specific method for this yet
				// For now, we'll skip this as it's not in the analytics service
				break;
			case 'bookmark':
				if (!buyerId) {
					return json({ error: 'Authentication required' }, { status: 401 });
				}
				await analyticsService.trackBookmark(productId, buyerId);
				break;
			case 'cart_add':
				if (!buyerId) {
					return json({ error: 'Authentication required' }, { status: 401 });
				}
				await analyticsService.trackCartAdd(productId, buyerId);
				break;
			case 'view':
				await analyticsService.trackProductView(productId, buyerId);
				break;
			default:
				return json({ error: 'Invalid event type' }, { status: 400 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Analytics tracking error:', error);
		return json({ error: 'Failed to track event' }, { status: 500 });
	}
};
