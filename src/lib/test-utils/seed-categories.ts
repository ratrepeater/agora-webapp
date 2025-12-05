import { supabaseTest } from './supabase-test';

/**
 * Seed categories for testing
 * This ensures the categories table has the required data
 */
export async function seedCategories() {
	const categories = [
		{ key: 'hr', name: 'HR', description: 'Human Resources tools and services' },
		{ key: 'law', name: 'Law', description: 'Legal services and tools' },
		{ key: 'office', name: 'Office', description: 'Office space and facilities' },
		{ key: 'devtools', name: 'DevTools', description: 'Development tools and services' }
	];

	// Check if categories already exist
	const { data: existing } = await supabaseTest.from('categories').select('key');

	if (existing && existing.length > 0) {
		// Categories already seeded
		return;
	}

	// Insert categories
	const { error } = await supabaseTest.from('categories').insert(categories);

	if (error) {
		console.error('Failed to seed categories:', error);
		throw new Error(`Failed to seed categories: ${error.message}`);
	}
}
