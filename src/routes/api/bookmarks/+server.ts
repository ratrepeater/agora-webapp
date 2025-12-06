import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BookmarkService } from '$lib/services/bookmarks';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { productId } = await request.json();
		const bookmarkService = new BookmarkService(locals.supabase);
		
		const result = await bookmarkService.toggle(locals.session.user.id, productId);
		
		return json({ bookmarked: result });
	} catch (error) {
		console.error('Bookmark toggle error:', error);
		return json({ error: 'Failed to toggle bookmark' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { productId } = await request.json();
		const bookmarkService = new BookmarkService(locals.supabase);
		
		await bookmarkService.remove(locals.session.user.id, productId);
		
		return json({ success: true });
	} catch (error) {
		console.error('Bookmark remove error:', error);
		return json({ error: 'Failed to remove bookmark' }, { status: 500 });
	}
};
