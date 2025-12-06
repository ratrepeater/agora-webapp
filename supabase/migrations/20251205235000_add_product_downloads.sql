-- ============================================================================
-- ADD PRODUCT DOWNLOADS TABLE
-- ============================================================================

-- Create product_downloads table for tracking download events
create table public.product_downloads (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null,
  buyer_id uuid not null,
  order_id uuid not null,
  file_name text not null,
  file_size_bytes bigint,
  downloaded_at timestamptz not null default now(),
  constraint product_downloads_pkey primary key (id),
  constraint product_downloads_product_id_fkey foreign key (product_id) 
    references public.products(id) on delete cascade,
  constraint product_downloads_buyer_id_fkey foreign key (buyer_id) 
    references public.profiles(id) on delete cascade,
  constraint product_downloads_order_id_fkey foreign key (order_id) 
    references public.orders(id) on delete cascade
);

-- Create indexes for efficient queries
create index idx_product_downloads_product on public.product_downloads(product_id);
create index idx_product_downloads_buyer on public.product_downloads(buyer_id);
create index idx_product_downloads_order on public.product_downloads(order_id);
create index idx_product_downloads_downloaded_at on public.product_downloads(downloaded_at desc);

-- Enable RLS
alter table public.product_downloads enable row level security;

-- RLS policies
create policy "Buyers can view own downloads"
  on public.product_downloads for select using (auth.uid() = buyer_id);

create policy "Buyers can create own downloads"
  on public.product_downloads for insert with check (auth.uid() = buyer_id);

create policy "Sellers can view downloads of their products"
  on public.product_downloads for select using (
    exists (
      select 1 from public.products
      where products.id = product_downloads.product_id
      and products.seller_id = auth.uid()
    )
  );
