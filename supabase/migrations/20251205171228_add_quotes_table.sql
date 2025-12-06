-- Create quotes table for automated quote generation
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  company_size integer,
  requirements jsonb,
  quoted_price decimal(10,2) not null,
  pricing_breakdown jsonb,
  status text default 'pending' check (status in ('pending', 'sent', 'accepted', 'expired', 'rejected')),
  valid_until timestamptz not null,
  estimated_response_date timestamptz,
  sent_to_seller_at timestamptz,
  seller_notified boolean default false,
  buyer_company_info jsonb,
  additional_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add RLS policies for quotes
alter table public.quotes enable row level security;

-- Buyers can view their own quotes
create policy "Buyers can view their own quotes"
  on public.quotes for select
  using (auth.uid() = buyer_id);

-- Sellers can view quotes for their products
create policy "Sellers can view quotes for their products"
  on public.quotes for select
  using (auth.uid() = seller_id);

-- Buyers can create quotes
create policy "Buyers can create quotes"
  on public.quotes for insert
  with check (auth.uid() = buyer_id);

-- Buyers can update their own quotes (accept/reject)
create policy "Buyers can update their own quotes"
  on public.quotes for update
  using (auth.uid() = buyer_id);

-- Sellers can update quotes for their products (status changes)
create policy "Sellers can update quotes for their products"
  on public.quotes for update
  using (auth.uid() = seller_id);

-- Create index for efficient queries
create index idx_quotes_buyer on public.quotes(buyer_id);
create index idx_quotes_seller on public.quotes(seller_id);
create index idx_quotes_product on public.quotes(product_id);
create index idx_quotes_status on public.quotes(status);
