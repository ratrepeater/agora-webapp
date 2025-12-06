#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('Checking database status...\n');

  // Count products
  const { count: productCount, error: productError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (productError) {
    console.error('Error counting products:', productError);
    return;
  }

  console.log(`📦 Total products: ${productCount}`);

  // Count reviews
  const { count: reviewCount, error: reviewError } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true });

  if (reviewError) {
    console.error('Error counting reviews:', reviewError);
    return;
  }

  console.log(`⭐ Total reviews: ${reviewCount}`);

  // Get detailed product and review information
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, status');

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return;
  }

  // For each product, count its reviews
  const productReviewCounts = await Promise.all(
    products.map(async (product) => {
      const { count, error } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product.id);

      return {
        id: product.id,
        name: product.name,
        status: product.status,
        reviewCount: error ? 0 : count
      };
    })
  );

  const withReviews = productReviewCounts.filter(p => p.reviewCount > 0);
  const withoutReviews = productReviewCounts.filter(p => p.reviewCount === 0);

  console.log(`\n✅ Products WITH reviews: ${withReviews.length}`);
  if (withReviews.length > 0) {
    withReviews.forEach(p => {
      console.log(`   - ${p.name} (${p.reviewCount} reviews)`);
    });
  }

  console.log(`\n❌ Products WITHOUT reviews: ${withoutReviews.length}`);
  if (withoutReviews.length > 0) {
    withoutReviews.forEach(p => {
      console.log(`   - ${p.name} (status: ${p.status})`);
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Summary: ${withReviews.length}/${productCount} products have reviews`);
  console.log('='.repeat(50));
}

checkDatabase().catch(console.error);
