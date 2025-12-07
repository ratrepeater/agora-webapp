#!/usr/bin/env node

import { supabase } from './config.js';

async function verifyDatabaseIds() {
	console.log('Checking what IDs are actually in the database...\n');

	// Check Visual Studio Code specifically
	const { data: vscode, error: vscodeError } = await supabase
		.from('products')
		.select('id, name')
		.eq('name', 'Visual Studio Code')
		.single();

	if (vscodeError) {
		console.error('Error fetching VS Code:', vscodeError);
	} else {
		console.log('Visual Studio Code ID in database:', vscode.id);
	}

	// Check what the app is trying to use
	console.log('App is trying to use ID: 10f93a38-5c6a-4699-9e0d-73f4dc61a3d2');
	
	// Try to fetch with the wrong ID
	const { data: wrongProduct, error: wrongError } = await supabase
		.from('products')
		.select('id, name')
		.eq('id', '10f93a38-5c6a-4699-9e0d-73f4dc61a3d2')
		.maybeSingle();

	if (wrongProduct) {
		console.log('\n⚠️  OLD ID EXISTS IN DATABASE:', wrongProduct.name);
	} else {
		console.log('\n✓ Old ID does NOT exist in database (expected)');
	}

	// Check all products
	const { data: allProducts } = await supabase
		.from('products')
		.select('id, name')
		.order('name')
		.limit(5);

	console.log('\nFirst 5 products in database:');
	allProducts?.forEach(p => console.log(`  ${p.name}: ${p.id}`));
}

verifyDatabaseIds();
