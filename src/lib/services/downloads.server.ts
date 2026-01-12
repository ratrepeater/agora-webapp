// Server-side download service - use this instead of downloads.ts for secure operations
import type { ProductDownload } from '$lib/helpers/types';

/**
 * Server-side DownloadService - All operations go through secure API endpoints
 */
export class DownloadService {
    /**
     * Get download URL for a product with authentication verification
     * @param productId - Product ID
     * @param orderId - Order ID
     * @returns Download URL and filename
     */
    async getDownloadUrl(productId: string, orderId: string): Promise<{ downloadUrl: string; fileName: string }> {
        const response = await fetch(`/api/downloads/${productId}?orderId=${orderId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get download URL');
        }

        return await response.json();
    }

    /**
     * Get download history for the current user
     * @returns Array of download records
     */
    async getDownloadHistory(): Promise<ProductDownload[]> {
        const response = await fetch('/api/downloads/history', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch download history');
        }

        const data = await response.json();
        return data.downloads;
    }

    /**
     * Check if the current user has access to download a product
     * @param productId - Product ID
     * @returns True if user has purchased the product
     */
    async hasDownloadAccess(productId: string): Promise<boolean> {
        const response = await fetch(`/api/downloads/access/${productId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.hasAccess;
    }
}

// Export a singleton instance
export const downloadService = new DownloadService();