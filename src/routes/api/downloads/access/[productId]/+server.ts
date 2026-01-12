import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
    const { productId } = params;
    
    if (!locals.session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const buyerId = locals.session.user.id;

    try {
        const { data, error } = await locals.supabase
            .from('order_items')
            .select('id, order:orders!inner(buyer_id)')
            .eq('product_id', productId)
            .limit(1);

        if (error) {
            return json({ hasAccess: false });
        }

        if (!data || data.length === 0) {
            return json({ hasAccess: false });
        }

        // Check if any order belongs to the buyer
        const hasAccess = data.some((item: any) => {
            const order = item.order as any;
            return order.buyer_id === buyerId;
        });

        return json({ hasAccess });

    } catch (error: any) {
        return json({ hasAccess: false });
    }
};