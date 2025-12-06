-- ============================================================================
-- BUYER PRODUCT USAGE TABLE
-- ============================================================================

create table public.buyer_product_usage (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  
  -- Implementation tracking
  implementation_status text default 'not_started' 
    check (implementation_status in ('not_started', 'in_progress', 'completed', 'paused')),
  implementation_started_at timestamptz,
  implementation_completed_at timestamptz,
  
  -- Usage metrics
  usage_count integer default 0,
  last_used_at timestamptz,
  active_users integer default 0,
  usage_frequency text, -- daily, weekly, monthly, rarely
  
  -- Performance metrics
  roi_actual decimal(5,2),
  roi_expected decimal(5,2),
  satisfaction_score integer check (satisfaction_score >= 1 and satisfaction_score <= 5),
  time_saved_hours decimal(10,2),
  cost_saved decimal(10,2),
  
  -- Feedback
  feedback_text text,
  feature_requests jsonb,
  issues_reported jsonb,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(buyer_id, product_id, order_id)
);

-- Indexes
create index idx_buyer_product_usage_buyer on public.buyer_product_usage(buyer_id);
create index idx_buyer_product_usage_product on public.buyer_product_usage(product_id);
create index idx_buyer_product_usage_order on public.buyer_product_usage(order_id);
create index idx_buyer_product_usage_status on public.buyer_product_usage(implementation_status);

-- Row Level Security
alter table public.buyer_product_usage enable row level security;

-- Buyers can view and manage their own usage data
create policy "Buyers can view own product usage"
  on public.buyer_product_usage for select 
  using (auth.uid() = buyer_id);

create policy "Buyers can manage own product usage"
  on public.buyer_product_usage for all 
  using (auth.uid() = buyer_id);

-- Sellers can view usage data for their products
create policy "Sellers can view usage for their products"
  on public.buyer_product_usage for select using (
    exists (
      select 1 from public.products
      where products.id = buyer_product_usage.product_id
      and products.seller_id = auth.uid()
    )
  );

-- Trigger for updated_at
create trigger set_updated_at
  before update on public.buyer_product_usage
  for each row execute function public.handle_updated_at();
