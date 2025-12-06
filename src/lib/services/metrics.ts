import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductCategory } from '$lib/helpers/types';

export interface MetricDefinition {
	id: string;
	category_id: string | null;
	code: string;
	label: string;
	description: string | null;
	data_type: 'number' | 'boolean' | 'string';
	unit: string | null;
	is_filterable: boolean;
	is_qualitative: boolean;
	sort_order: number | null;
}

export interface ProductMetricValue {
	product_id: string;
	metric_id: string;
	numeric_value: number | null;
	boolean_value: boolean | null;
	text_value: string | null;
}

export class MetricsService {
	constructor(private supabase: SupabaseClient) {}

	/**
	 * Get metric definitions for a specific category
	 */
	async getMetricsByCategory(categoryKey: ProductCategory): Promise<MetricDefinition[]> {
		try {
			// First get the category ID
			const { data: categoryData, error: categoryError } = await this.supabase
				.from('categories' as any)
				.select('id')
				.eq('key', categoryKey)
				.single();

			if (categoryError) {
				console.error('Error fetching category:', categoryError);
				return [];
			}

			// Then get metrics for that category
			const { data, error } = await this.supabase
				.from('metric_definitions' as any)
				.select('*')
				.eq('category_id', categoryData.id)
				.order('sort_order', { ascending: true, nullsFirst: false });

			if (error) {
				console.error('Error fetching metrics:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error in getMetricsByCategory:', error);
			return [];
		}
	}

	/**
	 * Get metric values for a specific product
	 */
	async getProductMetricValues(productId: string): Promise<Record<string, any>> {
		try {
			const { data, error } = await this.supabase
				.from('product_metric_values' as any)
				.select(`
					*,
					metric:metric_definitions!metric_id (
						code,
						data_type
					)
				`)
				.eq('product_id', productId);

			if (error) {
				console.error('Error fetching product metric values:', error);
				return {};
			}

			// Transform to a map of metric_code -> value
			const values: Record<string, any> = {};
			for (const item of data || []) {
				const metricCode = item.metric?.code;
				if (!metricCode) continue;

				const dataType = item.metric?.data_type;
				if (dataType === 'number') {
					values[metricCode] = item.numeric_value;
				} else if (dataType === 'boolean') {
					values[metricCode] = item.boolean_value;
				} else if (dataType === 'string') {
					values[metricCode] = item.text_value;
				}
			}

			return values;
		} catch (error) {
			console.error('Error in getProductMetricValues:', error);
			return {};
		}
	}

	/**
	 * Get metric values for multiple products
	 */
	async getProductsMetricValues(productIds: string[]): Promise<Record<string, Record<string, any>>> {
		if (productIds.length === 0) return {};

		try {
			const { data, error } = await this.supabase
				.from('product_metric_values' as any)
				.select(`
					*,
					metric:metric_definitions!metric_id (
						code,
						data_type
					)
				`)
				.in('product_id', productIds);

			if (error) {
				console.error('Error fetching products metric values:', error);
				return {};
			}

			// Transform to a map of product_id -> { metric_code -> value }
			const result: Record<string, Record<string, any>> = {};
			
			for (const item of data || []) {
				const productId = item.product_id;
				const metricCode = item.metric?.code;
				if (!productId || !metricCode) continue;

				if (!result[productId]) {
					result[productId] = {};
				}

				const dataType = item.metric?.data_type;
				if (dataType === 'number') {
					result[productId][metricCode] = item.numeric_value;
				} else if (dataType === 'boolean') {
					result[productId][metricCode] = item.boolean_value;
				} else if (dataType === 'string') {
					result[productId][metricCode] = item.text_value;
				}
			}

			return result;
		} catch (error) {
			console.error('Error in getProductsMetricValues:', error);
			return {};
		}
	}
}
