import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabase } from '$lib/helpers/supabase.server';
import { productService } from '$lib/services/products';

export const load: PageServerLoad = async () => {
	// Fetch categories for the dropdown
	const { data: categories, error } = await supabase
		.from('categories')
		.select('id, key, name, description')
		.order('name');

	if (error) {
		console.error('Failed to fetch categories:', error);
		return {
			categories: []
		};
	}

	return {
		categories: categories || []
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		// Ensure user is authenticated and is a seller
		if (!locals.session || locals.userRole !== 'seller') {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const errors: Record<string, string> = {};

		// Extract and validate required fields
		const name = formData.get('name')?.toString().trim();
		const short_description = formData.get('short_description')?.toString().trim();
		const long_description = formData.get('long_description')?.toString().trim();
		const category_id = formData.get('category_id')?.toString();
		const priceStr = formData.get('price')?.toString();

		// Validate required fields
		if (!name || name.length === 0) {
			errors.name = 'Product name is required';
		} else if (name.length > 100) {
			errors.name = 'Product name must be 100 characters or less';
		}

		if (!short_description || short_description.length === 0) {
			errors.short_description = 'Short description is required';
		} else if (short_description.length > 200) {
			errors.short_description = 'Short description must be 200 characters or less';
		}

		if (!long_description || long_description.length === 0) {
			errors.long_description = 'Long description is required';
		}

		if (!category_id) {
			errors.category_id = 'Category is required';
		}

		if (!priceStr) {
			errors.price = 'Price is required';
		}

		const price = priceStr ? parseFloat(priceStr) : 0;
		if (isNaN(price) || price < 0) {
			errors.price = 'Price must be a valid positive number';
		}

		// Extract optional metric fields
		const roi_percentage = formData.get('roi_percentage')?.toString();
		const retention_rate = formData.get('retention_rate')?.toString();
		const implementation_time_days = formData.get('implementation_time_days')?.toString();
		const quarter_over_quarter_change = formData.get('quarter_over_quarter_change')?.toString();
		const cloud_client_classification = formData.get('cloud_client_classification')?.toString();
		const access_depth = formData.get('access_depth')?.toString();
		const is_featured = formData.get('is_featured') === 'on';

		// Handle file uploads
		const logoFile = formData.get('logo') as File | null;
		const demoVisualFile = formData.get('demo_visual') as File | null;

		// Validate logo file if provided
		if (logoFile && logoFile.size > 0) {
			const validLogoTypes = ['image/png', 'image/jpeg', 'image/webp'];
			const maxLogoSize = 2 * 1024 * 1024; // 2MB

			if (!validLogoTypes.includes(logoFile.type)) {
				errors.logo = 'Logo must be PNG, JPG, or WebP format';
			} else if (logoFile.size > maxLogoSize) {
				errors.logo = 'Logo file size must be less than 2MB';
			}
		}

		// Validate demo visual file if provided
		if (demoVisualFile && demoVisualFile.size > 0) {
			const validVisualTypes = ['image/png', 'image/jpeg', 'image/webp'];
			const maxVisualSize = 5 * 1024 * 1024; // 5MB

			if (!validVisualTypes.includes(demoVisualFile.type)) {
				errors.demo_visual = 'Demo visual must be PNG, JPG, or WebP format';
			} else if (demoVisualFile.size > maxVisualSize) {
				errors.demo_visual = 'Demo visual file size must be less than 5MB';
			}
		}

		// Return validation errors if any
		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		try {
			// Upload logo if provided
			let logo_url: string | null = null;
			if (logoFile && logoFile.size > 0) {
				const fileExt = logoFile.name.split('.').pop();
				const fileName = `${crypto.randomUUID()}.${fileExt}`;
				const filePath = `logos/${fileName}`;

				const { error: uploadError } = await supabase.storage
					.from('product-images')
					.upload(filePath, logoFile, {
						contentType: logoFile.type,
						upsert: false
					});

				if (uploadError) {
					console.error('Logo upload error:', uploadError);
					return fail(500, { error: 'Failed to upload logo' });
				}

				// Get public URL
				const { data: urlData } = supabase.storage
					.from('product-images')
					.getPublicUrl(filePath);

				logo_url = urlData.publicUrl;
			}

			// Upload demo visual if provided
			let demo_visual_url: string | null = null;
			if (demoVisualFile && demoVisualFile.size > 0) {
				const fileExt = demoVisualFile.name.split('.').pop();
				const fileName = `${crypto.randomUUID()}.${fileExt}`;
				const filePath = `demo-visuals/${fileName}`;

				const { error: uploadError } = await supabase.storage
					.from('product-images')
					.upload(filePath, demoVisualFile, {
						contentType: demoVisualFile.type,
						upsert: false
					});

				if (uploadError) {
					console.error('Demo visual upload error:', uploadError);
					return fail(500, { error: 'Failed to upload demo visual' });
				}

				// Get public URL
				const { data: urlData } = supabase.storage
					.from('product-images')
					.getPublicUrl(filePath);

				demo_visual_url = urlData.publicUrl;
			}

			// Create product in database
			const product = await productService.create({
				seller_id: locals.session.user.id,
				name: name!,
				short_description: short_description!,
				long_description: long_description!,
				category_id: category_id!,
				price_cents: Math.round(price * 100),
				logo_url,
				demo_visual_url,
				is_featured,
				status: 'published'
			});

			// Store metrics in product_metric_values table if provided
			if (product.id) {
				const metricInserts = [];

				// Get metric definitions
				const { data: metrics } = await supabase
					.from('metric_definitions')
					.select('id, code')
					.in('code', [
						'roi_percentage',
						'retention_rate',
						'implementation_time_days',
						'quarter_over_quarter_change',
						'cloud_client_classification',
						'access_depth'
					]);

				const metricMap = new Map(metrics?.map((m) => [m.code, m.id]) || []);

				if (roi_percentage && metricMap.has('roi_percentage')) {
					metricInserts.push({
						product_id: product.id,
						metric_id: metricMap.get('roi_percentage')!,
						numeric_value: parseFloat(roi_percentage)
					});
				}

				if (retention_rate && metricMap.has('retention_rate')) {
					metricInserts.push({
						product_id: product.id,
						metric_id: metricMap.get('retention_rate')!,
						numeric_value: parseFloat(retention_rate)
					});
				}

				if (implementation_time_days && metricMap.has('implementation_time_days')) {
					metricInserts.push({
						product_id: product.id,
						metric_id: metricMap.get('implementation_time_days')!,
						numeric_value: parseInt(implementation_time_days)
					});
				}

				if (quarter_over_quarter_change && metricMap.has('quarter_over_quarter_change')) {
					metricInserts.push({
						product_id: product.id,
						metric_id: metricMap.get('quarter_over_quarter_change')!,
						numeric_value: parseFloat(quarter_over_quarter_change)
					});
				}

				if (cloud_client_classification && metricMap.has('cloud_client_classification')) {
					metricInserts.push({
						product_id: product.id,
						metric_id: metricMap.get('cloud_client_classification')!,
						string_value: cloud_client_classification
					});
				}

				if (access_depth && metricMap.has('access_depth')) {
					metricInserts.push({
						product_id: product.id,
						metric_id: metricMap.get('access_depth')!,
						string_value: access_depth
					});
				}

				if (metricInserts.length > 0) {
					const { error: metricsError } = await supabase
						.from('product_metric_values')
						.insert(metricInserts);

					if (metricsError) {
						console.error('Failed to insert metrics:', metricsError);
						// Don't fail the whole operation, just log the error
					}
				}
			}

			// Redirect to products list on success
			throw redirect(303, '/seller/products');
		} catch (error) {
			// If it's a redirect, re-throw it
			if (error instanceof Response && error.status === 303) {
				throw error;
			}

			console.error('Product creation error:', error);
			return fail(500, {
				error: error instanceof Error ? error.message : 'Failed to create product'
			});
		}
	}
};
