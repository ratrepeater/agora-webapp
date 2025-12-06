// Example: Using Supabase with TypeScript types
import { supabase } from '$lib/helpers/supabase.server';
import type { Database } from '$lib/helpers/database.types';
import type { Product } from '$lib/helpers/types';

// Type-safe database operations
type ProductRow = Database['public']['Tables']['products']['Row'];

// Example 1: Fetch all products
export async function getAllProducts() {
	const { data, error } = await supabase.from('products').select('*');

	if (error) {
		console.error('Error fetching products:', error);
		return [];
	}

	return data as Product[];
}

// Example 2: Fetch products by category
export async function getProductsByCategory(category: string) {
	const { data, error } = await supabase
		.from('products')
		.select('*')
		.eq('category', category);

	if (error) {
		console.error('Error fetching products:', error);
		return [];
	}

	return data as Product[];
}

// Example 3: Fetch a single product with reviews
export async function getProductWithReviews(productId: string) {
	const { data, error } = await supabase
		.from('products')
		.select(
			`
      *,
      reviews (
        id,
        rating,
        review_text,
        created_at,
        buyer:profiles (
          full_name,
          email
        )
      )
    `
		)
		.eq('id', productId)
		.single();

	if (error) {
		console.error('Error fetching product:', error);
		return null;
	}

	return data;
}
