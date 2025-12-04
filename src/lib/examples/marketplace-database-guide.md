# Marketplace Database Schema Guide

## Overview
Your Supabase database now supports all requirements from the startup marketplace specification.

## Tables

### 1. **profiles**
Extends Supabase auth with user roles and metadata.
- `id` - UUID (references auth.users)
- `role` - 'buyer' or 'seller'
- `email` - User email
- `full_name` - Optional display name
- Auto-created when users sign up

### 2. **products**
Core product listings with all business metrics.
- `id` - UUID
- `seller_id` - References profiles
- `name` - Product name
- `short_description` - For cards
- `long_description` - For detail page
- `price` - Decimal
- `category` - 'HR', 'Law', or 'Office'
- `logo_url` - Product logo
- `demo_visual_url` - Demo image/video
- **Business Metrics:**
  - `roi_percentage`
  - `retention_rate`
  - `quarter_over_quarter_change`
  - `cloud_client_classification` - 'cloud', 'client', or 'hybrid'
  - `implementation_time_days`
  - `access_depth`
- `is_featured` - For featured sections
- `is_new` - For "new and notable"

### 3. **reviews**
Product reviews with ratings.
- `id` - UUID
- `product_id` - References products
- `buyer_id` - References profiles
- `rating` - 1-5 stars
- `review_text` - Optional review content
- Unique constraint: one review per buyer per product

### 4. **bookmarks**
Saved products for buyers.
- `id` - UUID
- `buyer_id` - References profiles
- `product_id` - References products
- Unique constraint: prevents duplicate bookmarks

### 5. **cart_items**
Shopping cart items.
- `id` - UUID
- `buyer_id` - References profiles
- `product_id` - References products
- `quantity` - Number of items
- Unique constraint: one entry per product per buyer

### 6. **orders**
Completed purchases.
- `id` - UUID
- `buyer_id` - References profiles
- `total_cost` - Order total
- `status` - Order status (default: 'completed')

### 7. **order_items**
Individual items in an order.
- `id` - UUID
- `order_id` - References orders
- `product_id` - References products (nullable)
- `product_name` - Snapshot of product name
- `product_price` - Snapshot of price at purchase
- `quantity` - Number purchased

### 8. **comparison_items**
Products selected for comparison (max 3).
- `id` - UUID
- `buyer_id` - References profiles
- `product_id` - References products
- Unique constraint: prevents duplicates

## Views

### **products_with_ratings**
Combines products with their average rating and review count.
- All product fields
- `average_rating` - Calculated average
- `review_count` - Number of reviews

## Security (RLS)

All tables have Row Level Security enabled:

- **Products**: Public read, sellers can manage their own
- **Reviews**: Public read, buyers can manage their own
- **Bookmarks**: Private to buyer
- **Cart**: Private to buyer
- **Orders**: Private to buyer
- **Comparison**: Private to buyer

## Auto-Generated Features

1. **Profile Creation**: Automatically creates a buyer profile when users sign up
2. **Timestamps**: Auto-updates `updated_at` on profiles and products
3. **Indexes**: Optimized for common queries (category, featured, new, etc.)

## Example Queries

```typescript
// Get all products with ratings
const { data } = await supabase
  .from('products_with_ratings')
  .select('*')
  .order('created_at', { ascending: false });

// Get products by category
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('category', 'HR');

// Get featured products
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('is_featured', true);

// Get buyer's bookmarks with product details
const { data } = await supabase
  .from('bookmarks')
  .select('*, products(*)')
  .eq('buyer_id', userId);

// Get buyer's cart with product details
const { data } = await supabase
  .from('cart_items')
  .select('*, products(*)')
  .eq('buyer_id', userId);

// Get order history with items
const { data } = await supabase
  .from('orders')
  .select('*, order_items(*)')
  .eq('buyer_id', userId)
  .order('created_at', { ascending: false });
```
