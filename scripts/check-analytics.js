#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnalytics() {
  console.log('Checking product_analytics_daily table...\n');

  // Count total rows
  const { count, error } = await supabase
    .from('product_analytics_daily')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting rows:', error);
    return;
  }

  console.log(`📊 Total rows in product_analytics_daily: ${count}`);

  // Get sample data
  const { data: sampleData, error: sampleError } = await supabase
    .from('product_analytics_daily')
    .select('*')
    .limit(5);

  if (sampleError) {
    console.error('Error fetching sample data:', sampleError);
    return;
  }

  if (sampleData && sampleData.length > 0) {
    console.log('\n📋 Sample data:');
    sampleData.forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`);
      console.log(`  Product ID: ${row.product_id}`);
      console.log(`  Date: ${row.date}`);
      console.log(`  Views: ${row.views || 0}`);
      console.log(`  Purchases: ${row.purchases || 0}`);
      console.log(`  Revenue: ${row.revenue || 0}`);
      console.log(`  Cart Adds: ${row.cart_adds || 0}`);
      console.log(`  Bookmarks: ${row.bookmarks || 0}`);
    });
  } else {
    console.log('\n⚠️  No data in product_analytics_daily table');
  }
}

checkAnalytics().catch(console.error);
