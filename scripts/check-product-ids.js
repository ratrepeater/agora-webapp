#!/usr/bin/env node

import { supabase } from './config.js';

async function checkProductIds() {
	console.log('Fetching all product IDs and names...\n');

	const { data: products, error } = await supabase
		.from('products')
		.select('id, name, category_id')
		.eq('status', 'published')
		.order('name');

	if (error) {
		console.error('Error fetching products:', error);
		return;
	}

	console.log(`Found ${products.length} products:\n`);
	products.forEach(p => {
		console.log(`${p.name}: ${p.id}`);
	});
}

checkProductIds();
