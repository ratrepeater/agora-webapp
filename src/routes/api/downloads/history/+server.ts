import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    if (!locals.session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const buyerId = locals.session.user.id;

    try {
        const { data, error } = await locals.supabase
            .from('product_downloads')
            .select('*')
            .eq('buyer_id', buyerId)
            .order('downloaded_at', { ascending: false });

        if (error) {
            return json({ error: `Failed to fetch download history: ${error.message}` }, { status: 500 });
        }

        return json({ downloads: data || [] });

    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
};