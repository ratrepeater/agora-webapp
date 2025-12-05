-- Add new enum types
create type implementation_status as enum ('not_started', 'in_progress', 'completed', 'paused');
create type quote_status as enum ('pending', 'accepted', 'rejected', 'expired');

-- Product Scores table
create table public.product_scores (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade unique,
  fit_score decimal(5,2) not null check (fit_score >= 0 and fit_score <= 100),
  feature_score decimal(5,2) not null check (feature_score >= 0 and feature_score <= 100),
  integration_score decimal(5,2) not null check (integration_score >= 0 and integration_score <= 100),
  review_score decimal(5,2) not null check (review_score >= 0 and review_score <= 100),
  overall_score decimal(5,2) not null check (overall_score >= 0 and overall_score <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Product Analytics table
create table public.product_analytics (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  date date not null,
  views integer default 0,
  unique_visitors integer default 0,
  detail_page_views integer default 0,
  bookmark_count integer default 0,
  cart_additions integer default 0,
  purchases integer default 0,
  revenue decimal(10,2) default 0,
  created_at timestamptz default now(),
  
  -- Prevent duplicate analytics for same product and date
  unique(product_id, date)
);

-- Buyer Product Usage table
create table public.buyer_product_usage (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  implementation_status implementation_status default 'not_started',
  usage_count integer default 0,
  last_used_at timestamptz,
  roi_actual decimal(5,2),
  satisfaction_score integer check (satisfaction_score >= 1 and satisfaction_score <= 5),
  feedback_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Prevent duplicate usage tracking for same buyer and product
  unique(buyer_id, product_id, order_id)
);

-- Quotes table
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  company_size integer,
  requirements_text text,
  quoted_price decimal(10,2) not null check (quoted_price >= 0),
  pricing_breakdown jsonb,
  status quote_status default 'pending',
  valid_until timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Product Downloads table
create table public.product_downloads (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  download_url text not null,
  downloaded_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Bundles table
create table public.bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  discount_percentage decimal(5,2) default 0 check (discount_percentage >= 0 and discount_percentage <= 100),
  is_curated boolean default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bundle Products junction table
create table public.bundle_products (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.bundles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  
  -- Prevent duplicate products in same bundle
  unique(bundle_id, product_id)
);

-- Buyer Onboarding table
create table public.buyer_onboarding (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade unique,
  company_name text,
  company_size integer,
  industry text,
  interests text[],
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Seller Onboarding table
create table public.seller_onboarding (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade unique,
  company_name text not null,
  business_registration text,
  verification_status text default 'pending',
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Product Features table
create table public.product_features (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  feature_name text not null,
  feature_description text,
  feature_category text,
  relevance_score decimal(5,2) default 50 check (relevance_score >= 0 and relevance_score <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Competitor Relationships table
create table public.competitor_relationships (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  competitor_product_id uuid not null references public.products(id) on delete cascade,
  similarity_score decimal(5,2) check (similarity_score >= 0 and similarity_score <= 100),
  market_overlap_score decimal(5,2) check (market_overlap_score >= 0 and market_overlap_score <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Prevent duplicate competitor relationships
  unique(product_id, competitor_product_id),
  -- Prevent self-referencing
  check (product_id != competitor_product_id)
);

-- Create indexes for better query performance
create index idx_product_scores_product on public.product_scores(product_id);
create index idx_product_analytics_product on public.product_analytics(product_id);
create index idx_product_analytics_date on public.product_analytics(date desc);
create index idx_buyer_product_usage_buyer on public.buyer_product_usage(buyer_id);
create index idx_buyer_product_usage_product on public.buyer_product_usage(product_id);
create index idx_quotes_buyer on public.quotes(buyer_id);
create index idx_quotes_product on public.quotes(product_id);
create index idx_quotes_status on public.quotes(status);
create index idx_product_downloads_buyer on public.product_downloads(buyer_id);
create index idx_product_downloads_product on public.product_downloads(product_id);
create index idx_product_downloads_order on public.product_downloads(order_id);
create index idx_bundle_products_bundle on public.bundle_products(bundle_id);
create index idx_bundle_products_product on public.bundle_products(product_id);
create index idx_product_features_product on public.product_features(product_id);
create index idx_product_features_relevance on public.product_features(relevance_score desc);
create index idx_competitor_relationships_product on public.competitor_relationships(product_id);

-- Enable Row Level Security on all new tables
alter table public.product_scores enable row level security;
alter table public.product_analytics enable row level security;
alter table public.buyer_product_usage enable row level security;
alter table public.quotes enable row level security;
alter table public.product_downloads enable row level security;
alter table public.bundles enable row level security;
alter table public.bundle_products enable row level security;
alter table public.buyer_onboarding enable row level security;
alter table public.seller_onboarding enable row level security;
alter table public.product_features enable row level security;
alter table public.competitor_relationships enable row level security;

-- RLS Policies for product_scores
create policy "Anyone can view product scores"
  on public.product_scores for select
  using (true);

create policy "System can manage product scores"
  on public.product_scores for all
  using (true);

-- RLS Policies for product_analytics
create policy "Sellers can view own product analytics"
  on public.product_analytics for select
  using (
    exists (
      select 1 from public.products
      where products.id = product_analytics.product_id
      and products.seller_id = auth.uid()
    )
  );

create policy "System can manage product analytics"
  on public.product_analytics for all
  using (true);

-- RLS Policies for buyer_product_usage
create policy "Buyers can view own product usage"
  on public.buyer_product_usage for select
  using (auth.uid() = buyer_id);

create policy "Buyers can update own product usage"
  on public.buyer_product_usage for update
  using (auth.uid() = buyer_id);

create policy "Buyers can insert own product usage"
  on public.buyer_product_usage for insert
  with check (auth.uid() = buyer_id);

create policy "Sellers can view usage of their products"
  on public.buyer_product_usage for select
  using (
    exists (
      select 1 from public.products
      where products.id = buyer_product_usage.product_id
      and products.seller_id = auth.uid()
    )
  );

-- RLS Policies for quotes
create policy "Buyers can view own quotes"
  on public.quotes for select
  using (auth.uid() = buyer_id);

create policy "Buyers can insert own quotes"
  on public.quotes for insert
  with check (auth.uid() = buyer_id);

create policy "Buyers can update own quotes"
  on public.quotes for update
  using (auth.uid() = buyer_id);

create policy "Sellers can view quotes for their products"
  on public.quotes for select
  using (
    exists (
      select 1 from public.products
      where products.id = quotes.product_id
      and products.seller_id = auth.uid()
    )
  );

-- RLS Policies for product_downloads
create policy "Buyers can view own downloads"
  on public.product_downloads for select
  using (auth.uid() = buyer_id);

create policy "Buyers can insert own downloads"
  on public.product_downloads for insert
  with check (auth.uid() = buyer_id);

create policy "Sellers can view downloads of their products"
  on public.product_downloads for select
  using (
    exists (
      select 1 from public.products
      where products.id = product_downloads.product_id
      and products.seller_id = auth.uid()
    )
  );

-- RLS Policies for bundles
create policy "Anyone can view bundles"
  on public.bundles for select
  using (true);

create policy "Authenticated users can create bundles"
  on public.bundles for insert
  with check (auth.uid() = created_by);

create policy "Users can update own bundles"
  on public.bundles for update
  using (auth.uid() = created_by);

create policy "Users can delete own bundles"
  on public.bundles for delete
  using (auth.uid() = created_by);

-- RLS Policies for bundle_products
create policy "Anyone can view bundle products"
  on public.bundle_products for select
  using (true);

create policy "Bundle creators can manage bundle products"
  on public.bundle_products for all
  using (
    exists (
      select 1 from public.bundles
      where bundles.id = bundle_products.bundle_id
      and bundles.created_by = auth.uid()
    )
  );

-- RLS Policies for buyer_onboarding
create policy "Buyers can view own onboarding"
  on public.buyer_onboarding for select
  using (auth.uid() = buyer_id);

create policy "Buyers can insert own onboarding"
  on public.buyer_onboarding for insert
  with check (auth.uid() = buyer_id);

create policy "Buyers can update own onboarding"
  on public.buyer_onboarding for update
  using (auth.uid() = buyer_id);

-- RLS Policies for seller_onboarding
create policy "Sellers can view own onboarding"
  on public.seller_onboarding for select
  using (auth.uid() = seller_id);

create policy "Sellers can insert own onboarding"
  on public.seller_onboarding for insert
  with check (auth.uid() = seller_id);

create policy "Sellers can update own onboarding"
  on public.seller_onboarding for update
  using (auth.uid() = seller_id);

-- RLS Policies for product_features
create policy "Anyone can view product features"
  on public.product_features for select
  using (true);

create policy "Sellers can manage own product features"
  on public.product_features for all
  using (
    exists (
      select 1 from public.products
      where products.id = product_features.product_id
      and products.seller_id = auth.uid()
    )
  );

-- RLS Policies for competitor_relationships
create policy "Sellers can view competitor relationships for own products"
  on public.competitor_relationships for select
  using (
    exists (
      select 1 from public.products
      where products.id = competitor_relationships.product_id
      and products.seller_id = auth.uid()
    )
  );

create policy "System can manage competitor relationships"
  on public.competitor_relationships for all
  using (true);

-- Triggers for updated_at
create trigger set_updated_at
  before update on public.product_scores
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.buyer_product_usage
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.quotes
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.bundles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.buyer_onboarding
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.seller_onboarding
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.product_features
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.competitor_relationships
  for each row execute function public.handle_updated_at();

-- Create view for products with scores
create view public.products_with_scores as
select 
  p.*,
  coalesce(avg(r.rating), 0) as average_rating,
  count(r.id) as review_count,
  ps.fit_score,
  ps.feature_score,
  ps.integration_score,
  ps.review_score,
  ps.overall_score
from public.products p
left join public.reviews r on p.id = r.product_id
left join public.product_scores ps on p.id = ps.product_id
group by p.id, ps.fit_score, ps.feature_score, ps.integration_score, ps.review_score, ps.overall_score;
