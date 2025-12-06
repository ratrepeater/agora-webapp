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
		if (!locals.session || locals.userRole !== 'seller') {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const productId = formData.get('productId')?.toString();

		if (!productId) {
			return fail(400, { error: 'Product ID is required' });
		}

		try {
			// Verify the product belongs to this seller
			const product = await productService.getById(productId);
			if (!product || product.seller_id !== locals.session.user.id) {
				return fail(403, { error: 'You do not have permission to delete this product' });
			}

			// Delete the product (soft delete - sets status to 'deleted')
			await productService.delete(productId);

			return { success: true, message: 'Product deleted successfully' };
		} catch (error) {
			console.error('Product deletion error:', error);
			return fail(500, {
				error: error instanceof Error ? error.message : 'Failed to delete product'
			});
		}
	}
};
