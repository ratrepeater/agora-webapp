#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sbfpxgsgabkgbutzhgwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZnB4Z3NnYWJrZ2J1dHpoZ3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ4MywiZXhwIjoyMDc3NzY0NDgzfQ.FGeTitHzEIeHKkSkvfvincnoRRHFTwYLb156uoPXP9I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSellerProducts() {
  console.log('Checking seller products and analytics...\n');

  // Get all products with their seller info
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, seller_id')
    .order('name');

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return;
  }

  console.log(`📦 Total products: ${products?.length || 0}\n`);

  // Group by seller
  const bySeller = {};
  products?.forEach(p => {
    if (!bySeller[p.seller_id]) {
      bySeller[p.seller_id] = [];
    }
    bySeller[p.seller_id].push(p);
  });

  console.log(`👥 Number of sellers: ${Object.keys(bySeller).length}\n`);

  // Get all analytics product IDs
  const { data: analytics } = await supabase
    .from('product_analytics_daily')
    .select('product_id')
    .limit(1000);

  const analyticsProductIds = new Set(analytics?.map(a => a.product_id) || []);

  console.log(`📊 Products with analytics data: ${analyticsProductIds.size}\n`);

  // Show each seller's products
  for (const [sellerId, sellerProducts] of Object.entries(bySeller)) {
    console.log(`\nSeller: ${sellerId}`);
    console.log(`Products: ${sellerProducts.length}`);
    
    sellerProducts.forEach(p => {
      const hasAnalytics = analyticsProductIds.has(p.id);
      console.log(`  ${hasAnalytics ? '✅' : '❌'} ${p.name} (${p.id})`);
    });
  }

  // Show which product IDs have analytics but no product
  console.log('\n\n🔍 Analytics product IDs that might not have matching products:');
  for (const analyticsId of analyticsProductIds) {
    const hasProduct = products?.some(p => p.id === analyticsId);
    if (!hasProduct) {
      console.log(`  ⚠️  ${analyticsId} - has analytics but no product found`);
    }
  }
}

checkSellerProducts().catch(console.error);
