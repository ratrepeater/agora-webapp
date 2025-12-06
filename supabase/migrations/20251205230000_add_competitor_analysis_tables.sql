-- Add tables for competitor analysis and other missing features

-- Create competitor_relationships table
create table if not exists public.competitor_relationships (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  competitor_product_id uuid not null references public.products(id) on delete cascade,
  similarity_score decimal(5,2), -- How similar are these products (0-100)
  market_overlap_score decimal(5,2), -- How much do they compete for same customers (0-100)
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(product_id, competitor_product_id),
  check (product_id != competitor_product_id)
);

-- Create indexes for competitor_relationships
create index if not exists idx_competitor_relationships_product on public.competitor_relationships(product_id);
create index if not exists idx_competitor_relationships_competitor on public.competitor_relationships(competitor_product_id);
create index if not exists idx_competitor_relationships_similarity on public.competitor_relationships(similarity_score desc);

-- Enable RLS
alter table public.competitor_relationships enable row level security;

-- RLS policies for competitor_relationships
-- Sellers can view competitor relationships for their own products
create policy "Sellers can view competitor relationships for their products"
  on public.competitor_relationships for select
  using (
    exists (
      select 1 from public.products
      where products.id = competitor_relationships.product_id
      and products.seller_id = auth.uid()
    )
  );

-- System can insert/update competitor relationships
create policy "System can manage competitor relationships"
  on public.competitor_relationships for all
  using (true)
  with check (true);

-- Grant access
grant select on public.competitor_relationships to authenticated;
grant insert on public.competitor_relationships to authenticated;
grant update on public.competitor_relationships to authenticated;
grant delete on public.competitor_relationships to authenticated;

-- Create product_features table if it doesn't exist
create table if not exists public.product_features (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  feature_name text not null,
  feature_description text,
  feature_category text, -- core, integration, support, analytics, etc.
  relevance_score integer check (relevance_score >= 0 and relevance_score <= 100),
  is_highlighted boolean default false,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for product_features
create index if not exists idx_product_features_product on public.product_features(product_id);
create index if not exists idx_product_features_relevance on public.product_features(relevance_score desc);

-- Enable RLS for product_features
alter table public.product_features enable row level security;

-- RLS policies for product_features
-- Everyone can view product features
create policy "Anyone can view product features"
  on public.product_features for select
  using (true);

-- Sellers can manage features for their own products
create policy "Sellers can manage their product features"
  on public.product_features for all
  using (
    exists (
      select 1 from public.products
      where products.id = product_features.product_id
      and products.seller_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.products
      where products.id = product_features.product_id
      and products.seller_id = auth.uid()
    )
  );

-- Grant access
grant select on public.product_features to authenticated;
grant insert on public.product_features to authenticated;
grant update on public.product_features to authenticated;
grant delete on public.product_features to authenticated;

-- Create product_scores table if it doesn't exist
create table if not exists public.product_scores (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  fit_score integer check (fit_score >= 0 and fit_score <= 100),
  feature_score integer check (feature_score >= 0 and feature_score <= 100),
  integration_score integer check (integration_score >= 0 and integration_score <= 100),
  review_score integer check (review_score >= 0 and review_score <= 100),
  overall_score integer check (overall_score >= 0 and overall_score <= 100),
  score_breakdown jsonb, -- Detailed breakdown of how each score was calculated
  calculated_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(product_id)
);

-- Create index for product_scores
create index if not exists idx_product_scores_product on public.product_scores(product_id);
create index if not exists idx_product_scores_overall on public.product_scores(overall_score desc);

-- Enable RLS for product_scores
alter table public.product_scores enable row level security;

-- RLS policies for product_scores
-- Everyone can view product scores
create policy "Anyone can view product scores"
  on public.product_scores for select
  using (true);

-- System can manage product scores
create policy "System can manage product scores"
  on public.product_scores for all
  using (true)
  with check (true);

-- Grant access
grant select on public.product_scores to authenticated;
grant insert on public.product_scores to authenticated;
grant update on public.product_scores to authenticated;
grant delete on public.product_scores to authenticated;
