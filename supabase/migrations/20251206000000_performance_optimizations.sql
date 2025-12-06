-- ============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================================================
-- This migration adds indexes, materialized views, and other optimizations
-- for common query patterns in the Startup Marketplace application.

-- ============================================================================
-- ADDITIONAL INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Full-text search index for products (name and descriptions)
create index if not exists idx_products_search 
  on public.products using gin(
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(short_description, '') || ' ' || coalesce(long_description, ''))
  );

-- Composite index for filtering products by category and status
create index if not exists idx_products_category_status 
  on public.products(category_id, status) where status = 'published';

-- Composite index for featured products
create index if not exists idx_products_featured_created 
  on public.products(is_featured, created_at desc) where status = 'published' and is_featured = true;

-- Index for product price range queries
create index if not exists idx_products_price 
  on public.products(price_cents) where status = 'published';

-- Composite index for reviews with ratings
create index if not exists idx_reviews_product_rating 
  on public.reviews(product_id, rating);

-- Index for recent reviews
create index if not exists idx_reviews_created 
  on public.reviews(created_at desc);

-- Composite index for product events analytics
-- Using occurred_at directly since date casting isn't immutable
create index if not exists idx_product_events_date_type 
  on public.product_events(occurred_at, event_type, product_id);

-- Index for buyer's recent orders
create index if not exists idx_orders_buyer_created 
  on public.orders(buyer_id, created_at desc);

-- Composite index for cart items with product
create index if not exists idx_cart_items_cart_product 
  on public.cart_items(cart_id, product_id);

-- Index for product scores ordering
create index if not exists idx_product_scores_fit 
  on public.product_scores(fit_score desc) where fit_score is not null;

create index if not exists idx_product_scores_feature 
  on public.product_scores(feature_score desc) where feature_score is not null;

create index if not exists idx_product_scores_integration 
  on public.product_scores(integration_score desc) where integration_score is not null;

-- Index for product features ordering
create index if not exists idx_product_features_product_relevance 
  on public.product_features(product_id, relevance_score desc);

-- Index for quotes by status and date
create index if not exists idx_quotes_status_created 
  on public.quotes(status, created_at desc);

create index if not exists idx_quotes_valid_until 
  on public.quotes(valid_until) where status = 'pending' or status = 'sent';

-- Index for buyer product usage by status
create index if not exists idx_buyer_product_usage_buyer_status 
  on public.buyer_product_usage(buyer_id, implementation_status);

-- ============================================================================
-- MATERIALIZED VIEW: Products with Ratings
-- ============================================================================
-- This view pre-calculates average ratings and review counts for products
-- to avoid expensive aggregations on every query.

create materialized view if not exists public.products_with_ratings as
select 
  p.*,
  coalesce(avg(r.rating), 0) as average_rating,
  count(r.id) as review_count
from public.products p
left join public.reviews r on r.product_id = p.id
where p.status = 'published'
group by p.id;

-- Create indexes on the materialized view
create unique index if not exists idx_products_with_ratings_id 
  on public.products_with_ratings(id);

create index if not exists idx_products_with_ratings_category 
  on public.products_with_ratings(category_id);

create index if not exists idx_products_with_ratings_seller 
  on public.products_with_ratings(seller_id);

create index if not exists idx_products_with_ratings_featured 
  on public.products_with_ratings(is_featured) where is_featured = true;

create index if not exists idx_products_with_ratings_created 
  on public.products_with_ratings(created_at desc);

create index if not exists idx_products_with_ratings_rating 
  on public.products_with_ratings(average_rating desc);

-- Grant select permission on the materialized view
grant select on public.products_with_ratings to authenticated;
grant select on public.products_with_ratings to anon;

-- ============================================================================
-- FUNCTION: Refresh Products with Ratings
-- ============================================================================
-- This function refreshes the materialized view. It should be called:
-- - After a new review is added
-- - After a review is updated or deleted
-- - Periodically (e.g., every hour via cron job)

create or replace function public.refresh_products_with_ratings()
returns void as $$
begin
  refresh materialized view concurrently public.products_with_ratings;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- TRIGGERS: Auto-refresh Materialized View
-- ============================================================================
-- Automatically refresh the materialized view when reviews change

create or replace function public.trigger_refresh_products_with_ratings()
returns trigger as $$
begin
  -- Use pg_notify to trigger async refresh
  -- This prevents blocking the review insert/update/delete operation
  perform pg_notify('refresh_products_ratings', '');
  return null;
end;
$$ language plpgsql;

-- Create triggers for review changes
drop trigger if exists refresh_ratings_on_review_insert on public.reviews;
create trigger refresh_ratings_on_review_insert
  after insert on public.reviews
  for each statement
  execute function public.trigger_refresh_products_with_ratings();

drop trigger if exists refresh_ratings_on_review_update on public.reviews;
create trigger refresh_ratings_on_review_update
  after update on public.reviews
  for each statement
  execute function public.trigger_refresh_products_with_ratings();

drop trigger if exists refresh_ratings_on_review_delete on public.reviews;
create trigger refresh_ratings_on_review_delete
  after delete on public.reviews
  for each statement
  execute function public.trigger_refresh_products_with_ratings();

-- ============================================================================
-- FUNCTION: Get Featured Products (Cached)
-- ============================================================================
-- This function returns featured products with caching hints for the application

create or replace function public.get_featured_products(limit_count integer default 10)
returns setof public.products_with_ratings as $$
begin
  return query
  select *
  from public.products_with_ratings
  where is_featured = true
  order by created_at desc
  limit limit_count;
end;
$$ language plpgsql stable;

-- ============================================================================
-- FUNCTION: Search Products with Full-Text Search
-- ============================================================================
-- This function provides efficient full-text search across product fields

create or replace function public.search_products(
  search_query text,
  category_filter uuid default null,
  min_price integer default null,
  max_price integer default null,
  min_rating numeric default null,
  limit_count integer default 20,
  offset_count integer default 0
)
returns setof public.products_with_ratings as $$
begin
  return query
  select *
  from public.products_with_ratings p
  where 
    -- Full-text search
    (search_query is null or search_query = '' or
     to_tsvector('english', coalesce(p.name, '') || ' ' || coalesce(p.short_description, '') || ' ' || coalesce(p.long_description, ''))
     @@ plainto_tsquery('english', search_query))
    -- Category filter
    and (category_filter is null or p.category_id = category_filter)
    -- Price range filter
    and (min_price is null or p.price_cents >= min_price)
    and (max_price is null or p.price_cents <= max_price)
    -- Rating filter
    and (min_rating is null or p.average_rating >= min_rating)
  order by 
    -- Relevance ranking for search
    case when search_query is not null and search_query != '' then
      ts_rank(
        to_tsvector('english', coalesce(p.name, '') || ' ' || coalesce(p.short_description, '') || ' ' || coalesce(p.long_description, '')),
        plainto_tsquery('english', search_query)
      )
    else 0
    end desc,
    -- Then by featured status
    p.is_featured desc,
    -- Then by rating
    p.average_rating desc,
    -- Then by recency
    p.created_at desc
  limit limit_count
  offset offset_count;
end;
$$ language plpgsql stable;

-- ============================================================================
-- FUNCTION: Get Products by Category (Optimized)
-- ============================================================================

create or replace function public.get_products_by_category(
  category_filter uuid,
  limit_count integer default 20,
  offset_count integer default 0
)
returns setof public.products_with_ratings as $$
begin
  return query
  select *
  from public.products_with_ratings
  where category_id = category_filter
  order by 
    is_featured desc,
    average_rating desc,
    created_at desc
  limit limit_count
  offset offset_count;
end;
$$ language plpgsql stable;

-- ============================================================================
-- FUNCTION: Get New Products (Optimized)
-- ============================================================================

create or replace function public.get_new_products(
  limit_count integer default 10
)
returns setof public.products_with_ratings as $$
begin
  return query
  select *
  from public.products_with_ratings
  where created_at >= now() - interval '30 days'
  order by created_at desc
  limit limit_count;
end;
$$ language plpgsql stable;

-- ============================================================================
-- FUNCTION: Get Similar Products (Optimized)
-- ============================================================================

create or replace function public.get_similar_products(
  product_uuid uuid,
  limit_count integer default 5
)
returns setof public.products_with_ratings as $$
declare
  product_category uuid;
begin
  -- Get the category of the source product
  select category_id into product_category
  from public.products
  where id = product_uuid;
  
  -- Return products in the same category, excluding the source product
  return query
  select *
  from public.products_with_ratings
  where 
    category_id = product_category
    and id != product_uuid
  order by 
    average_rating desc,
    review_count desc,
    created_at desc
  limit limit_count;
end;
$$ language plpgsql stable;

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================
-- Update statistics for the query planner
-- Note: VACUUM must be run separately outside of transactions

analyze public.products;
analyze public.reviews;
analyze public.product_events;
analyze public.orders;
analyze public.cart_items;
analyze public.bookmarks;

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on materialized view public.products_with_ratings is 
  'Materialized view that pre-calculates product ratings and review counts for performance. Refresh after review changes.';

comment on function public.refresh_products_with_ratings() is 
  'Refreshes the products_with_ratings materialized view. Call after review changes or periodically.';

comment on function public.search_products is 
  'Full-text search across products with filtering and pagination support.';

comment on function public.get_featured_products is 
  'Returns featured products with caching hints. Results can be cached by the application.';

