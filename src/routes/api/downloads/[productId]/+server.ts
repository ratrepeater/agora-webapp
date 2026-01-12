import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, locals }) => {
    const { productId } = params;
    const orderId = url.searchParams.get('orderId');
    
    if (!locals.session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!orderId) {
        return json({ error: 'Order ID required' }, { status: 400 });
    }

    const buyerId = locals.session.user.id;

    try {
        // Verify that the buyer has purchased this product in this order
        const { data: orderItem, error: verifyError } = await locals.supabase
            .from('order_items')
            .select('id, order:orders!inner(buyer_id)')
            .eq('order_id', orderId)
            .eq('product_id', productId)
            .maybeSingle();

        if (verifyError) {
            return json({ error: `Failed to verify purchase: ${verifyError.message}` }, { status: 500 });
        }

        if (!orderItem) {
            return json({ error: 'Product not found in order' }, { status: 404 });
        }

        // Verify buyer owns the order
        const order = orderItem.order as any;
        if (order.buyer_id !== buyerId) {
            return json({ error: 'Unauthorized: Order does not belong to buyer' }, { status: 403 });
        }

        // Get product file information
        const { data: productFile, error: fileError } = await locals.supabase
            .from('product_files')
            .select('storage_path, file_name')
            .eq('product_id', productId)
            .eq('is_primary', true)
            .maybeSingle();

        if (fileError) {
            return json({ error: `Failed to fetch product file: ${fileError.message}` }, { status: 500 });
        }

        if (!productFile) {
            return json({ error: 'No downloadable file found for this product' }, { status: 404 });
        }

        // Generate signed URL (valid for 1 hour)
        const { data: signedUrl, error: urlError } = await locals.supabase
            .storage
            .from('product-files')
            .createSignedUrl(productFile.storage_path, 3600);

        if (urlError) {
            return json({ error: `Failed to generate download URL: ${urlError.message}` }, { status: 500 });
        }

        if (!signedUrl) {
            return json({ error: 'Failed to generate download URL' }, { status: 500 });
        }

        // Track download
        await trackDownload(locals.supabase, productId, buyerId, orderId, productFile);

        return json({ 
            downloadUrl: signedUrl.signedUrl,
            fileName: productFile.file_name 
        });

    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
};

async function trackDownload(supabase: any, productId: string, buyerId: string, orderId: string, productFile: any) {
    // Get file size for tracking
    const { data: fileData } = await supabase
        .from('product_files')
        .select('file_size_bytes')
        .eq('product_id', productId)
        .eq('is_primary', true)
        .maybeSingle();

    const fileSize = fileData?.file_size_bytes || null;

    // Create download record
    await supabase
        .from('product_downloads')
        .insert({
            product_id: productId,
            buyer_id: buyerId,
            order_id: orderId,
            file_name: productFile.file_name,
            file_size_bytes: fileSize,
            downloaded_at: new Date().toISOString()
        });

    // Update analytics
    const today = new Date().toISOString().split('T')[0];
    
    const { error: updateError } = await supabase
        .from('product_analytics_daily')
        .update({ 
            downloads: supabase.rpc('increment', { x: 1 }) as any
        })
        .eq('product_id', productId)
        .eq('date', today);

    if (updateError) {
        await supabase
            .from('product_analytics_daily')
            .insert({
                product_id: productId,
                date: today,
                downloads: 1
            });
    }

    // Track event
    const { data: product } = await supabase
        .from('products')
        .select('seller_id')
        .eq('id', productId)
        .single();

    if (product) {
        await supabase
            .from('product_events')
            .insert({
                product_id: productId,
                seller_id: product.seller_id,
                buyer_id: buyerId,
                event_type: 'download',
                metadata: { order_id: orderId, file_name: productFile.file_name }
            });
    }
}