#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sbfpxgsgabkgbutzhgwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZnB4Z3NnYWJrZ2J1dHpoZ3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ4MywiZXhwIjoyMDc3NzY0NDgzfQ.FGeTitHzEIeHKkSkvfvincnoRRHFTwYLb156uoPXP9I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupRemoteProducts() {
  console.log('🔍 Finding products without reviews in REMOTE database...\n');

  // Get all products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, status');

  if (productsError) {
    console.error('❌ Error fetching products:', productsError);
    return;
  }

  console.log(`Found ${products.length} total products`);

  // Find products without reviews
  const productsToDelete = [];
  
  for (const product of products) {
    const { count, error } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', product.id);

    if (!error && count === 0) {
      productsToDelete.push(product);
    }
  }

  console.log(`\n📋 Found ${productsToDelete.length} products WITHOUT reviews:\n`);
  
  if (productsToDelete.length === 0) {
    console.log('✅ No products to delete!');
    return;
  }

  // Show first 10 products that will be deleted
  const displayCount = Math.min(10, productsToDelete.length);
  productsToDelete.slice(0, displayCount).forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name} (${p.id})`);
  });
  
  if (productsToDelete.length > displayCount) {
    console.log(`   ... and ${productsToDelete.length - displayCount} more`);
  }

  console.log(`\n⚠️  About to DELETE ${productsToDelete.length} products from REMOTE database!`);
  console.log('This will also delete related data (bookmarks, cart items, etc.)');
  console.log('\nDeleting in 3 seconds... Press Ctrl+C to cancel\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('🗑️  Deleting products...\n');

  let deletedCount = 0;
  let errorCount = 0;

  for (const product of productsToDelete) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      console.error(`   ❌ Failed to delete: ${product.name} - ${error.message}`);
      errorCount++;
    } else {
      deletedCount++;
      if (deletedCount % 5 === 0) {
        console.log(`   ✓ Deleted ${deletedCount}/${productsToDelete.length} products...`);
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Successfully deleted: ${deletedCount} products`);
  if (errorCount > 0) {
    console.log(`❌ Failed to delete: ${errorCount} products`);
  }
  console.log(`${'='.repeat(50)}\n`);

  // Verify final count
  const { count: finalCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  console.log(`📦 Remaining products in database: ${finalCount}`);
}

cleanupRemoteProducts().catch(console.error);
