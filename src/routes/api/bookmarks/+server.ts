import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BookmarkService } from '$lib/services/bookmarks';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	try {
		const bookmarkService = new BookmarkService(locals.supabase);
		const bookmarks = await bookmarkService.getByBuyer(locals.session.user.id);
		return json(bookmarks);
	} catch (err) {
		console.error('Error fetching bookmarks:', err);
		throw error(500, 'Failed to fetch bookmarks');
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	try {
		const { productId } = await request.json();
		
		if (!productId) {
			throw error(400, 'Product ID is required');
		}

		const bookmarkService = new BookmarkService(locals.supabase);
		
		// Check if bookmark exists
		const isBookmarked = await bookmarkService.isBookmarked(
			locals.session.user.id,
			productId
		);

		if (isBookmarked) {
			// Remove bookmark
			await bookmarkService.remove(locals.session.user.id, productId);
			return json({ bookmarked: false });
		} else {
			// Add bookmark
			await bookmarkService.add(locals.session.user.id, productId);
			return json({ bookmarked: true });
		}
	} catch (err) {
		console.error('Error toggling bookmark:', err);
		throw error(500, 'Failed to toggle bookmark');
	}
};

export const DELETE: RequestHandler = async ({ url, locals }) => {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	try {
		const productId = url.searchParams.get('productId');
		
		if (!productId) {
			throw error(400, 'Product ID is required');
		}

		const bookmarkService = new BookmarkService(locals.supabase);
		await bookmarkService.remove(locals.session.user.id, productId);
		
		return json({ success: true });
	} catch (err) {
		console.error('Error removing bookmark:', err);
		throw error(500, 'Failed to remove bookmark');
	}
};
