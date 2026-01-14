import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { productService } from '$lib/services/products';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.session || locals.userRole !== 'seller') {
        return {
            products: []
        };
    }

    try {
        // Fetch all products for this seller
        const products = await productService.getBySeller(locals.session.user.id);

        return {
            products
        };
    } catch (error) {
        console.error('Failed to fetch seller products:', error);
        return {
            products: []
        };
    }
};

export const actions: Actions = {
    delete: async ({ request, locals }) => {
        console.log('=== DELETE ACTION STARTED ===');
        console.log('Session exists:', !!locals.session);
        console.log('User role:', locals.userRole);
        
        if (!locals.session || locals.userRole !== 'seller') {
            console.log('❌ Unauthorized: No session or not a seller');
            return fail(401, { error: 'Unauthorized' });
        }

        const formData = await request.formData();
        const productId = formData.get('productId')?.toString();

        console.log('Product ID from form:', productId);

        if (!productId) {
            console.log('❌ No product ID provided');
            return fail(400, { error: 'Product ID is required' });
        }

        console.log('🔍 Verifying product ownership...');

        try {
            // Verify the product belongs to this seller using authenticated client
            const { data: product, error: fetchError } = await locals.supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();
            
            console.log('Product found:', !!product);
            console.log('Product seller_id:', product?.seller_id);
            console.log('Current user id:', locals.session.user.id);
            
            if (fetchError || !product || product.seller_id !== locals.session.user.id) {
                console.log('❌ Permission denied: Product does not belong to seller');
                return fail(403, { error: 'You do not have permission to delete this product' });
            }

            console.log('✅ Ownership verified, proceeding with deletion...');

            // Delete the product using authenticated client (hard delete)
            const { data: deletedData, error: deleteError } = await locals.supabase
                .from('products')
                .delete()
                .eq('id', productId)
                .select();

            console.log('Delete operation result:', {
                deletedRows: deletedData?.length || 0,
                data: deletedData,
                error: deleteError
            });

            if (deleteError) {
                console.error('❌ Supabase delete error:', {
                    message: deleteError.message,
                    details: deleteError.details,
                    hint: deleteError.hint,
                    code: deleteError.code
                });
                throw new Error(`Failed to delete product: ${deleteError.message}`);
            }

            if (!deletedData || deletedData.length === 0) {
                console.warn('⚠️  No rows were deleted. Product may not exist or RLS policy blocked deletion.');
                return fail(500, { error: 'Failed to delete product - no rows affected' });
            }

            console.log('✅ Product deleted successfully from database:', deletedData[0]);
            console.log('=== DELETE ACTION COMPLETED ===');

            return { success: true, message: 'Product deleted successfully' };
        } catch (error) {
            console.error('❌ Product deletion error:', error);
            console.error('Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            console.log('=== DELETE ACTION FAILED ===');
            
            return fail(500, {
                error: error instanceof Error ? error.message : 'Failed to delete product'
            });
        }
    }
};
