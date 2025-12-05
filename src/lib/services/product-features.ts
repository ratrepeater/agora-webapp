import { supabase } from '$lib/helpers/supabase';
import type { ProductFeature } from '$lib/helpers/types';

/**
 * ProductFeatureService - Handles all product feature-related database operations
 * Manages CRUD operations for product features with relevance scoring
 */
export class ProductFeatureService {
	/**
	 * Get all features for a specific product, sorted by relevance score (descending)
	 * @param productId - Product ID
	 * @returns Array of product features sorted by relevance
	 */
	async getByProduct(productId: string): Promise<ProductFeature[]> {
		const { data, error } = await supabase
			.from('product_features')
			.select('*')
			.eq('product_id', productId)
			.order('relevance_score', { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch product features: ${error.message}`);
		}

		return data || [];
	}

	/**
	 * Create a new product feature
	 * @param feature - Feature data to insert
	 * @returns Created product feature
	 */
	async create(feature: {
		product_id: string;
		feature_name: string;
		feature_description?: string;
		feature_category?: string;
		relevance_score?: number;
	}): Promise<ProductFeature> {
		const { data, error } = await supabase
			.from('product_features')
			.insert({
				product_id: feature.product_id,
				feature_name: feature.feature_name,
				feature_description: feature.feature_description || null,
				feature_category: feature.feature_category || null,
				relevance_score: feature.relevance_score || 50
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create product feature: ${error.message}`);
		}

		return data;
	}

	/**
	 * Update an existing product feature
	 * @param id - Feature ID
	 * @param updates - Feature data to update
	 * @returns Updated product feature
	 */
	async update(
		id: string,
		updates: {
			feature_name?: string;
			feature_description?: string;
			feature_category?: string;
			relevance_score?: number;
		}
	): Promise<ProductFeature> {
		const { data, error } = await supabase
			.from('product_features')
			.update(updates)
			.eq('id', id)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to update product feature: ${error.message}`);
		}

		return data;
	}

	/**
	 * Delete a product feature
	 * @param id - Feature ID
	 */
	async delete(id: string): Promise<void> {
		const { error } = await supabase.from('product_features').delete().eq('id', id);

		if (error) {
			throw new Error(`Failed to delete product feature: ${error.message}`);
		}
	}

	/**
	 * Categorize a feature based on its name and description
	 * Uses simple keyword matching to assign a category
	 * @param featureName - Name of the feature
	 * @param featureDescription - Description of the feature
	 * @returns Suggested category
	 */
	categorizeFeature(featureName: string, featureDescription?: string): string {
		const text = `${featureName} ${featureDescription || ''}`.toLowerCase();

		// Core functionality keywords
		if (
			text.includes('core') ||
			text.includes('essential') ||
			text.includes('basic') ||
			text.includes('fundamental') ||
			text.includes('primary')
		) {
			return 'core';
		}

		// Integration keywords
		if (
			text.includes('integration') ||
			text.includes('api') ||
			text.includes('webhook') ||
			text.includes('connect') ||
			text.includes('sync')
		) {
			return 'integration';
		}

		// Analytics keywords
		if (
			text.includes('analytics') ||
			text.includes('reporting') ||
			text.includes('dashboard') ||
			text.includes('metrics') ||
			text.includes('insights')
		) {
			return 'analytics';
		}

		// Support keywords
		if (
			text.includes('support') ||
			text.includes('help') ||
			text.includes('documentation') ||
			text.includes('training') ||
			text.includes('onboarding')
		) {
			return 'support';
		}

		// Security keywords
		if (
			text.includes('security') ||
			text.includes('encryption') ||
			text.includes('authentication') ||
			text.includes('authorization') ||
			text.includes('compliance')
		) {
			return 'security';
		}

		// Automation keywords
		if (
			text.includes('automation') ||
			text.includes('workflow') ||
			text.includes('trigger') ||
			text.includes('scheduled')
		) {
			return 'automation';
		}

		// Collaboration keywords
		if (
			text.includes('collaboration') ||
			text.includes('team') ||
			text.includes('sharing') ||
			text.includes('permission')
		) {
			return 'collaboration';
		}

		// Default category
		return 'general';
	}

	/**
	 * Create multiple features for a product with automatic categorization
	 * @param productId - Product ID
	 * @param features - Array of feature data
	 * @returns Array of created product features
	 */
	async createBulk(
		productId: string,
		features: Array<{
			feature_name: string;
			feature_description?: string;
			relevance_score?: number;
		}>
	): Promise<ProductFeature[]> {
		const featuresToInsert = features.map((feature) => ({
			product_id: productId,
			feature_name: feature.feature_name,
			feature_description: feature.feature_description || null,
			feature_category: this.categorizeFeature(feature.feature_name, feature.feature_description),
			relevance_score: feature.relevance_score || 50
		}));

		const { data, error } = await supabase
			.from('product_features')
			.insert(featuresToInsert)
			.select();

		if (error) {
			throw new Error(`Failed to create product features: ${error.message}`);
		}

		return data || [];
	}
}

// Export a singleton instance
export const productFeatureService = new ProductFeatureService();
