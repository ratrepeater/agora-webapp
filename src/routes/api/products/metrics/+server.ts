import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const productIds = url.searchParams.get('productIds')?.split(',') || [];
	const category = url.searchParams.get('category');

	if (!productIds.length || !category) {
		return json({ metrics: {} });
	}

	// Get category ID
	const { data: categoryData } = await supabase
		.from('categories')
		.select('id')
		.eq('key', category)
		.single();

	if (!categoryData) {
		return json({ metrics: {} });
	}

	// Get metric definitions for this category
	const { data: metricDefinitions } = await supabase
		.from('metric_definitions')
		.select('*')
		.eq('category_id', categoryData.id)
		.order('sort_order', { ascending: true });

	if (!metricDefinitions || metricDefinitions.length === 0) {
		return json({ metricDefinitions: [], metrics: {} });
	}

	const metricIds = metricDefinitions.map((m) => m.id);

	// Get product metric values for these products and metrics
	const { data: productMetricValues } = await supabase
		.from('product_metric_values')
		.select('*')
		.in('product_id', productIds)
		.in('metric_id', metricIds);

	// Organize metrics by product
	const metricsByProduct: Record<string, Record<string, any>> = {};
	
	for (const productId of productIds) {
		metricsByProduct[productId] = {};
		
		for (const metricDef of metricDefinitions) {
			const metricValue = productMetricValues?.find(
				(mv) => mv.product_id === productId && mv.metric_id === metricDef.id
			);
			
			if (metricValue) {
				// Get the appropriate value based on data type
				let value = null;
				if (metricDef.data_type === 'number') {
					value = metricValue.numeric_value;
				} else if (metricDef.data_type === 'boolean') {
					value = metricValue.boolean_value;
				} else if (metricDef.data_type === 'string') {
					value = metricValue.string_value;
				}
				
				metricsByProduct[productId][metricDef.code] = {
					value,
					label: metricDef.label,
					unit: metricDef.unit,
					dataType: metricDef.data_type
				};
			}
		}
	}

	return json({
		metricDefinitions,
		metrics: metricsByProduct
	});
};
