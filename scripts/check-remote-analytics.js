#!/usr/bin/env node

import { supabase } from './config.js';

async function checkAnalytics() {
  console.log('Checking REMOTE product_analytics_daily table...\n');

  // Count total rows
  const { count, error } = await supabase
    .from('product_analytics_daily')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting rows:', error);
    return;
  }

  console.log(`📊 Total rows in product_analytics_daily: ${count}`);

  // Get all data
  const { data: allData, error: dataError } = await supabase
    .from('product_analytics_daily')
    .select('*')
    .order('product_id');

  if (dataError) {
    console.error('Error fetching data:', dataError);
    return;
  }

  if (allData && allData.length > 0) {
    console.log('\n📋 All analytics data:');
    
    // Group by product
    const byProduct = {};
    allData.forEach(row => {
      if (!byProduct[row.product_id]) {
        byProduct[row.product_id] = {
          views: 0,
          purchases: 0,
          downloads: 0,
          bookmarks: 0,
          cart_adds: 0
        };
      }
      byProduct[row.product_id].views += row.views || 0;
      byProduct[row.product_id].purchases += row.purchases || 0;
      byProduct[row.product_id].downloads += row.downloads || 0;
      byProduct[row.product_id].bookmarks += row.bookmarks || 0;
      byProduct[row.product_id].cart_adds += row.cart_adds || 0;
    });

    console.log('\nAggregated by product:');
    Object.entries(byProduct).forEach(([productId, stats]) => {
      console.log(`\nProduct ${productId}:`);
      console.log(`  Views: ${stats.views}`);
      console.log(`  Purchases: ${stats.purchases}`);
      console.log(`  Downloads: ${stats.downloads}`);
      console.log(`  Bookmarks: ${stats.bookmarks}`);
      console.log(`  Cart Adds: ${stats.cart_adds}`);
    });

    // Calculate totals
    const totals = Object.values(byProduct).reduce((acc, stats) => ({
      views: acc.views + stats.views,
      purchases: acc.purchases + stats.purchases,
      downloads: acc.downloads + stats.downloads,
      bookmarks: acc.bookmarks + stats.bookmarks,
      cart_adds: acc.cart_adds + stats.cart_adds
    }), { views: 0, purchases: 0, downloads: 0, bookmarks: 0, cart_adds: 0 });

    console.log('\n📈 TOTALS:');
    console.log(`  Total Views: ${totals.views}`);
    console.log(`  Total Purchases: ${totals.purchases}`);
    console.log(`  Total Downloads: ${totals.downloads}`);
    console.log(`  Total Bookmarks: ${totals.bookmarks}`);
    console.log(`  Total Cart Adds: ${totals.cart_adds}`);
  } else {
    console.log('\n⚠️  No data in product_analytics_daily table');
  }
}

checkAnalytics().catch(console.error);
