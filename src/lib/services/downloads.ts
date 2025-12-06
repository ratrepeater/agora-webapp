import { supabase } from '$lib/helpers/supabase.server';
import type { ProductDownload } from '$lib/helpers/types';

/**
 * DownloadService - Handles product download operations
 * Implements getDownloadUrl, trackDownload, and uploadProductFile methods
 */
export class DownloadService {
	/**
	 * Get download URL for a product with authentication verification
	 * @param productId - Product ID
	 * @param buyerId - Buyer's profile ID
	 * @param orderId - Order ID
	 * @returns Signed download URL
	 */
	async getDownloadUrl(productId: string, buyerId: string, orderId: string): Promise<string> {
		// Verify that the buyer has purchased this product in this order
		const { data: orderItem, error: verifyError } = await supabase
			.from('order_items')
			.select('id, order:orders!inner(buyer_id)')
			.eq('order_id', orderId)
			.eq('product_id', productId)
			.maybeSingle();

		if (verifyError) {
			throw new Error(`Failed to verify purchase: ${verifyError.message}`);
		}

		if (!orderItem) {
			throw new Error('Product not found in order');
		}

		// Verify buyer owns the order
		const order = orderItem.order as any;
		if (order.buyer_id !== buyerId) {
			throw new Error('Unauthorized: Order does not belong to buyer');
		}

		// Get product file information
		const { data: productFile, error: fileError } = await supabase
			.from('product_files')
			.select('storage_path, file_name')
			.eq('product_id', productId)
			.eq('is_primary', true)
			.maybeSingle();

		if (fileError) {
			throw new Error(`Failed to fetch product file: ${fileError.message}`);
		}

		if (!productFile) {
			throw new Error('No downloadable file found for this product');
		}

		// Generate signed URL (valid for 1 hour)
		const { data: signedUrl, error: urlError } = await supabase
			.storage
			.from('product-files')
			.createSignedUrl(productFile.storage_path, 3600);

		if (urlError) {
			throw new Error(`Failed to generate download URL: ${urlError.message}`);
		}

		if (!signedUrl) {
			throw new Error('Failed to generate download URL');
		}

		return signedUrl.signedUrl;
	}

	/**
	 * Track a download event and update usage metrics
	 * @param productId - Product ID
	 * @param buyerId - Buyer's profile ID
	 * @param orderId - Order ID
	 * @returns Created download record
	 */
	async trackDownload(productId: string, buyerId: string, orderId: string): Promise<ProductDownload> {
		// Get product file information for tracking
		const { data: productFile, error: fileError } = await supabase
			.from('product_files')
			.select('file_name, file_size_bytes')
			.eq('product_id', productId)
			.eq('is_primary', true)
			.maybeSingle();

		if (fileError) {
			throw new Error(`Failed to fetch product file: ${fileError.message}`);
		}

		const fileName = productFile?.file_name || 'unknown';
		const fileSize = productFile?.file_size_bytes || null;

		// Create download record
		const { data: download, error: downloadError } = await supabase
			.from('product_downloads')
			.insert({
				product_id: productId,
				buyer_id: buyerId,
				order_id: orderId,
				file_name: fileName,
				file_size_bytes: fileSize,
				downloaded_at: new Date().toISOString()
			})
			.select()
			.single();

		if (downloadError) {
			throw new Error(`Failed to track download: ${downloadError.message}`);
		}

		// Update product analytics - increment download count
		const today = new Date().toISOString().split('T')[0];
		
		// Try to update existing analytics record
		const { error: updateError } = await supabase
			.from('product_analytics_daily')
			.update({ 
				downloads: supabase.rpc('increment', { x: 1 }) as any
			})
			.eq('product_id', productId)
			.eq('date', today);

		// If no record exists, create one
		if (updateError) {
			await supabase
				.from('product_analytics_daily')
				.insert({
					product_id: productId,
					date: today,
					downloads: 1
				});
		}

		// Track download event
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
					metadata: { order_id: orderId, file_name: fileName }
				});
		}

		return download as ProductDownload;
	}

	/**
	 * Upload a product file for sellers
	 * @param productId - Product ID
	 * @param file - File to upload
	 * @param sellerId - Seller's profile ID
	 * @returns Storage path of uploaded file
	 */
	async uploadProductFile(productId: string, file: File, sellerId: string): Promise<string> {
		// Verify seller owns the product
		const { data: product, error: verifyError } = await supabase
			.from('products')
			.select('seller_id')
			.eq('id', productId)
			.single();

		if (verifyError) {
			throw new Error(`Failed to verify product ownership: ${verifyError.message}`);
		}

		if (product.seller_id !== sellerId) {
			throw new Error('Unauthorized: Product does not belong to seller');
		}

		// Generate unique file path
		const timestamp = Date.now();
		const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
		const storagePath = `${sellerId}/${productId}/${timestamp}_${sanitizedFileName}`;

		// Upload file to Supabase Storage
		const { error: uploadError } = await supabase
			.storage
			.from('product-files')
			.upload(storagePath, file, {
				cacheControl: '3600',
				upsert: false
			});

		if (uploadError) {
			throw new Error(`Failed to upload file: ${uploadError.message}`);
		}

		// Create product_files record
		const { error: recordError } = await supabase
			.from('product_files')
			.insert({
				product_id: productId,
				storage_path: storagePath,
				file_name: file.name,
				file_type: file.type,
				file_size_bytes: file.size,
				is_primary: true
			});

		if (recordError) {
			// Rollback: delete uploaded file
			await supabase.storage.from('product-files').remove([storagePath]);
			throw new Error(`Failed to create file record: ${recordError.message}`);
		}

		return storagePath;
	}

	/**
	 * Get download history for a buyer
	 * @param buyerId - Buyer's profile ID
	 * @returns Array of download records
	 */
	async getDownloadHistory(buyerId: string): Promise<ProductDownload[]> {
		const { data, error } = await supabase
			.from('product_downloads')
			.select('*')
			.eq('buyer_id', buyerId)
			.order('downloaded_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch download history: ${error.message}`);
		}

		return (data || []) as ProductDownload[];
	}

	/**
	 * Get downloads for a specific order
	 * @param orderId - Order ID
	 * @returns Array of download records
	 */
	async getDownloadsByOrder(orderId: string): Promise<ProductDownload[]> {
		const { data, error } = await supabase
			.from('product_downloads')
			.select('*')
			.eq('order_id', orderId)
			.order('downloaded_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch order downloads: ${error.message}`);
		}

		return (data || []) as ProductDownload[];
	}

	/**
	 * Check if a buyer has access to download a product
	 * @param buyerId - Buyer's profile ID
	 * @param productId - Product ID
	 * @returns True if buyer has purchased the product
	 */
	async hasDownloadAccess(buyerId: string, productId: string): Promise<boolean> {
		const { data, error } = await supabase
			.from('order_items')
			.select('id, order:orders!inner(buyer_id)')
			.eq('product_id', productId)
			.limit(1);

		if (error) {
			return false;
		}

		if (!data || data.length === 0) {
			return false;
		}

		// Check if any order belongs to the buyer
		return data.some((item: any) => {
			const order = item.order as any;
			return order.buyer_id === buyerId;
		});
	}
}

// Export a singleton instance
export const downloadService = new DownloadService();
