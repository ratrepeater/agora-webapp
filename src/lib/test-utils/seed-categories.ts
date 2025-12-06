import { supabaseTest } from './supabase-test';

/**
 * Seed categories for testing
 * This ensures the categories table has the required data
 */
export async function seedCategories() {
	const categories = [
		{ key: 'hr', name: 'HR Tools', description: 'Human Resources tools and services' },
		{ key: 'legal', name: 'Legal Tools', description: 'Legal services and tools' },
		{ key: 'marketing', name: 'Marketing Tools', description: 'Marketing automation and analytics platforms' },
		{ key: 'devtools', name: 'Developer Tools', description: 'Development tools and services' }
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
