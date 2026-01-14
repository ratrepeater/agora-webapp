import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { productService } from '$lib/services/products';

export const DELETE: RequestHandler = async ({ params, locals }) => {
    const { id } = params;

    console.log('=== API DELETE STARTED ===');
    console.log('Product ID:', id);
    console.log('Session exists:', !!locals.session);
    console.log('User role:', locals.userRole);

    if (!locals.session || locals.userRole !== 'seller') {
        console.log('❌ Unauthorized');
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
        console.log('❌ No product ID');
        return json({ error: 'Product ID is required' }, { status: 400 });
    }

    try {
        // Verify the product belongs to this seller using authenticated client
        const { data: product, error: fetchError } = await locals.supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        console.log('Product found:', !!product);
        console.log('Product seller_id:', product?.seller_id);
        console.log('Current user id:', locals.session.user.id);

        if (fetchError || !product || product.seller_id !== locals.session.user.id) {
            console.log('❌ Permission denied');
            return json({ error: 'You do not have permission to delete this product' }, { status: 403 });
        }

        console.log('✅ Ownership verified, deleting...');

        // Delete the product using authenticated client
        const { data: deletedData, error: deleteError } = await locals.supabase
            .from('products')
            .delete()
            .eq('id', id)
            .select();

        console.log('Delete result:', {
            deletedRows: deletedData?.length || 0,
            error: deleteError
        });

        if (deleteError) {
            console.error('❌ Delete error:', deleteError);
            return json({ error: `Failed to delete product: ${deleteError.message}` }, { status: 500 });
        }

        if (!deletedData || deletedData.length === 0) {
            console.warn('⚠️  No rows deleted');
            return json({ error: 'Failed to delete product - no rows affected' }, { status: 500 });
        }

        console.log('✅ Product deleted successfully');
        console.log('=== API DELETE COMPLETED ===');

        return json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('❌ API deletion error:', error);
        return json({
            error: error instanceof Error ? error.message : 'Failed to delete product'
        }, { status: 500 });
    }
};