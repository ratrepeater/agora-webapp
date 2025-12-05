import { supabase } from '$lib/helpers/supabase';

/**
 * Seed categories for testing
 * This ensures the categories table has the required data
 * Note: Categories already exist in the database, this is a no-op
 */
export async function seedCategories() {
	// Categories already exist in the database
	// This function is kept for compatibility but does nothing
	return;
}
