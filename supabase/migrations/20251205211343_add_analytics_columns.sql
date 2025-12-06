-- Add missing columns to product_analytics_daily table for comprehensive analytics

-- Add detail page views tracking
alter table public.product_analytics_daily 
add column if not exists detail_page_views integer not null default 0;

-- Add unique visitors tracking
alter table public.product_analytics_daily 
add column if not exists unique_visitors integer not null default 0;

-- Add comparison tracking
alter table public.product_analytics_daily 
add column if not exists comparison_adds integer not null default 0;

-- Add quote requests tracking
alter table public.product_analytics_daily 
add column if not exists quote_requests integer not null default 0;

-- Add revenue tracking
alter table public.product_analytics_daily 
add column if not exists revenue integer not null default 0;

-- Create an alias view for backward compatibility
create or replace view public.product_analytics as
select * from public.product_analytics_daily;

-- Grant access to the view
grant select on public.product_analytics to authenticated;
grant insert on public.product_analytics to authenticated;
grant update on public.product_analytics to authenticated;
grant delete on public.product_analytics to authenticated;

-- Add RLS policy for the view (inherits from base table)
alter view public.product_analytics set (security_invoker = on);
