#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sbfpxgsgabkgbutzhgwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZnB4Z3NnYWJrZ2J1dHpoZ3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ4MywiZXhwIjoyMDc3NzY0NDgzfQ.FGeTitHzEIeHKkSkvfvincnoRRHFTwYLb156uoPXP9I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRemoteDatabase() {
  console.log('Checking REMOTE database status...\n');

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
  if (withReviews.length > 0 && withReviews.length <= 20) {
    withReviews.forEach(p => {
      console.log(`   - ${p.name} (${p.reviewCount} reviews)`);
    });
  } else if (withReviews.length > 20) {
    console.log(`   (Showing first 20 of ${withReviews.length})`);
    withReviews.slice(0, 20).forEach(p => {
      console.log(`   - ${p.name} (${p.reviewCount} reviews)`);
    });
  }

  console.log(`\n❌ Products WITHOUT reviews: ${withoutReviews.length}`);
  if (withoutReviews.length > 0 && withoutReviews.length <= 20) {
    withoutReviews.forEach(p => {
      console.log(`   - ${p.name} (status: ${p.status})`);
    });
  } else if (withoutReviews.length > 20) {
    console.log(`   (Showing first 20 of ${withoutReviews.length})`);
    withoutReviews.slice(0, 20).forEach(p => {
      console.log(`   - ${p.name} (status: ${p.status})`);
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Summary: ${withReviews.length}/${productCount} products have reviews`);
  console.log('='.repeat(50));
}

checkRemoteDatabase().catch(console.error);
