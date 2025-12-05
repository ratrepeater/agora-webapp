-- ============================================================================
-- STARTUP MARKETPLACE - COMPLETE SCHEMA
-- ============================================================================

-- Enable required extensions
create extension if not exists "pgcrypto";
-- Create sequence for product_events
create sequence if not exists product_events_id_seq;
-- ============================================================================
-- TABLE: profiles
-- ============================================================================
create table public.profiles (
  id uuid not null,
  full_name text,
  company_name text,
  role_buyer boolean not null default true,
  role_seller boolean not null default false,
  created_at timestamptz not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade
);
-- ============================================================================
-- TABLE: categories
-- ============================================================================
create table public.categories (
  id uuid not null default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  constraint categories_pkey primary key (id)
);
-- ============================================================================
-- TABLE: products
-- ============================================================================
create table public.products (
  id uuid not null default gen_random_uuid(),
  seller_id uuid not null,
  category_id uuid,
  name text not null,
  slug text unique,
  short_description text not null,
  long_description text,
  logo_url text,
  demo_visual_url text,
  price_cents integer not null default 0 check (price_cents >= 0),
  is_featured boolean not null default false,
  is_bundle boolean not null default false,
  bundle_pricing_mode text not null default 'fixed' 
    check (bundle_pricing_mode in ('fixed', 'derived')),
  status text not null default 'published' 
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_pkey primary key (id),
  constraint products_seller_id_fkey foreign key (seller_id) 
    references public.profiles(id) on delete cascade,
  constraint products_category_id_fkey foreign key (category_id) 
    references public.categories(id) on delete set null
);
-- ============================================================================
-- TABLE: metric_definitions
-- ============================================================================
create table public.metric_definitions (
  id uuid not null default gen_random_uuid(),
  category_id uuid,
  code text not null unique,
  label text not null,
  description text,
  data_type text not null 
    check (data_type in ('number', 'boolean', 'string')),
  unit text,
  is_filterable boolean not null default true,
  is_qualitative boolean not null default false,
  sort_order integer,
  constraint metric_definitions_pkey primary key (id),
  constraint metric_definitions_category_id_fkey foreign key (category_id) 
    references public.categories(id) on delete cascade
);
-- ============================================================================
-- TABLE: product_metric_values
-- ============================================================================
create table public.product_metric_values (
  product_id uuid not null,
  metric_id uuid not null,
  numeric_value numeric,
  boolean_value boolean,
  string_value text,
  last_updated timestamptz not null default now(),
  constraint product_metric_values_pkey primary key (product_id, metric_id),
  constraint product_metric_values_product_id_fkey foreign key (product_id) 
    references public.products(id) on delete cascade,
  constraint product_metric_values_metric_id_fkey foreign key (metric_id) 
    references public.metric_definitions(id) on delete cascade
);
-- ============================================================================
-- TABLE: bundle_items
-- ============================================================================
create table public.bundle_items (
  id uuid not null default gen_random_uuid(),
  bundle_product_id uuid not null,
  product_id uuid not null,
  quantity integer not null default 1 check (quantity >= 1),
  created_at timestamptz not null default now(),
  constraint bundle_items_pkey primary key (id),
  constraint bundle_items_bundle_product_id_fkey foreign key (bundle_product_id) 
    references public.products(id) on delete cascade,
  constraint bundle_items_product_id_fkey foreign key (product_id) 
    references public.products(id) on delete cascade
);
-- ============================================================================
-- TABLE: product_files
-- ============================================================================
create table public.product_files (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null,
  storage_path text not null,
  file_name text,
  file_type text,
  file_size_bytes integer,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  constraint product_files_pkey primary key (id),
  constraint product_files_product_id_fkey foreign key (product_id) 
    references public.products(id) on delete cascade
);
-- ============================================================================
-- TABLE: product_flags
-- ============================================================================
create table public.product_flags (
  product_id uuid not null,
  flag text not null,
  created_at timestamptz not null default now(),
  constraint product_flags_pkey primary key (product_id, flag),
  constraint product_flags_product_id_fkey foreign key (product_id) 
    references public.products(id) on delete cascade
);
-- ============================================================================
-- TABLE: bookmarks
-- ============================================================================
create table public.bookmarks (
  buyer_id uuid not null,
  product_id uuid not null,
  created_at timestamptz not null default now(),
  constraint bookmarks_pkey primary key (buyer_id, product_id),
  constraint bookmarks_buyer_id_fkey foreign key (buyer_id) 
    references public.profiles(id) on delete cascade,
  constraint bookmarks_product_id_fkey foreign key (product_id) 
    references public.products(id) on delete cascade
);
-- ============================================================================
-- TABLE: product_comparisons
-- ============================================================================
create table public.product_comparisons (
  buyer_id uuid not null,
  product_id uuid not null,
  created_at timestamptz not null default now(),
  constraint product_comparisons_pkey primary key (buyer_id, product_id),
  constraint product_comparisons_buyer_id_fkey foreign key (buyer_id) 
    references public.profiles(id) on delete cascade,
  constraint product_comparisons_product_id_fkey foreign key (product_id) 
    references public.products(id) on delete cascade
);
-- ============================================================================
-- TABLE: reviews
-- ============================================================================
create table public.reviews (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null,
  buyer_id uuid not null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  title text,
  body text,
  created_at timestamptz not null default now(),
  constraint reviews_pkey primary key (id),
  constraint reviews_product_id_fkey foreign key (product_id) 
    references public.products(id) on delete cascade,
  constraint reviews_buyer_id_fkey foreign key (buyer_id) 
    references public.profiles(id) on delete cascade
);
-- ============================================================================
-- TABLE: carts
-- ============================================================================
create table public.carts (
  id uuid not null default gen_random_uuid(),
  buyer_id uuid not null,
  status text not null default 'open' 
    check (status in ('open', 'checked_out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_pkey primary key (id),
  constraint carts_buyer_id_fkey foreign key (buyer_id) 
    references public.profiles(id) on delete cascade
);
-- ============================================================================
-- TABLE: cart_items
-- ============================================================================
create table public.cart_items (
  id uuid not null default gen_random_uuid(),
  cart_id uuid not null,
  product_id uuid not null,
  quantity integer not null default 1 check (quantity >= 1),
  unit_price_cents integer not null default 0 check (unit_price_cents >= 0),
  created_at timestamptz not null default now(),
  constraint cart_items_pkey primary key (id),
  constraint cart_items_cart_id_fkey foreign key (cart_id) 
    references public.carts(id) on delete cascade,
  constraint cart_items_product_id_fkey foreign key (product_id) 
    references public.products(id) on delete cascade
);
-- ============================================================================
-- TABLE: orders
-- ============================================================================
create table public.orders (
  id uuid not null default gen_random_uuid(),
  buyer_id uuid not null,
  created_at timestamptz not null default now(),
  demo_total_cents integer not null default 0 check (demo_total_cents >= 0),
  status text not null default 'completed' 
    check (status in ('completed', 'cancelled')),
  demo boolean not null default true,
  constraint orders_pkey primary key (id),
  constraint orders_buyer_id_fkey foreign key (buyer_id) 
    references public.profiles(id) on delete cascade
);
-- ============================================================================
-- TABLE: order_items
-- ============================================================================
create table public.order_items (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  product_id uuid not null,
  quantity integer not null default 1 check (quantity >= 1),
  unit_price_cents integer not null default 0 check (unit_price_cents >= 0),
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  constraint order_items_pkey primary key (id),
  constraint order_items_order_id_fkey foreign key (order_id) 
    references public.orders(id) on delete cascade,
  constraint order_items_product_id_fkey foreign key (product_id) 
    references public.products(id) on delete cascade
);
-- ============================================================================
-- TABLE: product_events
-- ============================================================================
create table public.product_events (
  id bigint not null default nextval('product_events_id_seq'),
  product_id uuid not null,
  seller_id uuid not null,
  buyer_id uuid,
  event_type text not null 
    check (event_type in ('view', 'download', 'purchase', 'bookmark', 'cart_add')),
  session_id uuid,
  occurred_at timestamptz not null default now(),
  metadata jsonb,
  constraint product_events_pkey primary key (id),
  constraint product_events_product_id_fkey foreign key (product_id) 
    references public.products(id) on delete cascade,
  constraint product_events_seller_id_fkey foreign key (seller_id) 
    references public.profiles(id) on delete cascade,
  constraint product_events_buyer_id_fkey foreign key (buyer_id) 
    references public.profiles(id) on delete set null
);
-- ============================================================================
-- TABLE: product_analytics_daily
-- ============================================================================
create table public.product_analytics_daily (
  product_id uuid not null,
  date date not null,
  views integer not null default 0,
  downloads integer not null default 0,
  purchases integer not null default 0,
  bookmarks integer not null default 0,
  cart_adds integer not null default 0,
  constraint product_analytics_daily_pkey primary key (product_id, date),
  constraint product_analytics_daily_product_id_fkey foreign key (product_id) 
    references public.products(id) on delete cascade
);
-- ============================================================================
-- INDEXES
-- ============================================================================

-- Products indexes
create index idx_products_seller on public.products(seller_id);
create index idx_products_category on public.products(category_id);
create index idx_products_status on public.products(status);
create index idx_products_is_featured on public.products(is_featured);
create index idx_products_created on public.products(created_at desc);
-- Metric definitions indexes
create index idx_metric_definitions_category on public.metric_definitions(category_id);
create index idx_metric_definitions_code on public.metric_definitions(code);
-- Product metric values indexes
create index idx_product_metric_values_product on public.product_metric_values(product_id);
create index idx_product_metric_values_metric on public.product_metric_values(metric_id);
-- Bundle items indexes
create index idx_bundle_items_bundle on public.bundle_items(bundle_product_id);
create index idx_bundle_items_product on public.bundle_items(product_id);
-- Product files indexes
create index idx_product_files_product on public.product_files(product_id);
-- Product flags indexes
create index idx_product_flags_flag on public.product_flags(flag);
-- Bookmarks indexes
create index idx_bookmarks_buyer on public.bookmarks(buyer_id);
create index idx_bookmarks_product on public.bookmarks(product_id);
-- Product comparisons indexes
create index idx_product_comparisons_buyer on public.product_comparisons(buyer_id);
create index idx_product_comparisons_product on public.product_comparisons(product_id);
-- Reviews indexes
create index idx_reviews_product on public.reviews(product_id);
create index idx_reviews_buyer on public.reviews(buyer_id);
-- Carts indexes
create index idx_carts_buyer on public.carts(buyer_id);
create index idx_carts_status on public.carts(status);
-- Cart items indexes
create index idx_cart_items_cart on public.cart_items(cart_id);
create index idx_cart_items_product on public.cart_items(product_id);
-- Orders indexes
create index idx_orders_buyer on public.orders(buyer_id);
create index idx_orders_created on public.orders(created_at desc);
-- Order items indexes
create index idx_order_items_order on public.order_items(order_id);
create index idx_order_items_product on public.order_items(product_id);
-- Product events indexes
create index idx_product_events_product_type_time 
  on public.product_events(product_id, event_type, occurred_at desc);
create index idx_product_events_seller_type_time 
  on public.product_events(seller_id, event_type, occurred_at desc);
create index idx_product_events_buyer on public.product_events(buyer_id);
-- Product analytics indexes
create index idx_product_analytics_daily_product 
  on public.product_analytics_daily(product_id);
-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.metric_definitions enable row level security;
alter table public.product_metric_values enable row level security;
alter table public.bundle_items enable row level security;
alter table public.product_files enable row level security;
alter table public.product_flags enable row level security;
alter table public.bookmarks enable row level security;
alter table public.product_comparisons enable row level security;
alter table public.reviews enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.product_events enable row level security;
alter table public.product_analytics_daily enable row level security;
-- Profiles policies
create policy "Users can view all profiles"
  on public.profiles for select using (true);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
-- Categories policies
create policy "Anyone can view categories"
  on public.categories for select using (true);
-- Products policies
create policy "Anyone can view published products"
  on public.products for select 
  using (status = 'published' or seller_id = auth.uid());
create policy "Sellers can insert own products"
  on public.products for insert 
  with check (auth.uid() = seller_id);
create policy "Sellers can update own products"
  on public.products for update 
  using (auth.uid() = seller_id);
create policy "Sellers can delete own products"
  on public.products for delete 
  using (auth.uid() = seller_id);
-- Metric definitions policies
create policy "Anyone can view metric definitions"
  on public.metric_definitions for select using (true);
-- Product metric values policies
create policy "Anyone can view product metrics"
  on public.product_metric_values for select using (true);
create policy "Sellers can manage own product metrics"
  on public.product_metric_values for all using (
    exists (
      select 1 from public.products
      where products.id = product_metric_values.product_id
      and products.seller_id = auth.uid()
    )
  );
-- Bundle items policies
create policy "Anyone can view bundle items"
  on public.bundle_items for select using (true);
create policy "Sellers can manage own bundle items"
  on public.bundle_items for all using (
    exists (
      select 1 from public.products
      where products.id = bundle_items.bundle_product_id
      and products.seller_id = auth.uid()
    )
  );
-- Product files policies
create policy "Anyone can view product files"
  on public.product_files for select using (true);
create policy "Sellers can manage own product files"
  on public.product_files for all using (
    exists (
      select 1 from public.products
      where products.id = product_files.product_id
      and products.seller_id = auth.uid()
    )
  );
-- Product flags policies
create policy "Anyone can view product flags"
  on public.product_flags for select using (true);
-- Bookmarks policies
create policy "Users can view own bookmarks"
  on public.bookmarks for select using (auth.uid() = buyer_id);
create policy "Users can manage own bookmarks"
  on public.bookmarks for all using (auth.uid() = buyer_id);
-- Product comparisons policies
create policy "Users can view own comparisons"
  on public.product_comparisons for select using (auth.uid() = buyer_id);
create policy "Users can manage own comparisons"
  on public.product_comparisons for all using (auth.uid() = buyer_id);
-- Reviews policies
create policy "Anyone can view reviews"
  on public.reviews for select using (true);
create policy "Buyers can insert own reviews"
  on public.reviews for insert with check (auth.uid() = buyer_id);
create policy "Buyers can update own reviews"
  on public.reviews for update using (auth.uid() = buyer_id);
create policy "Buyers can delete own reviews"
  on public.reviews for delete using (auth.uid() = buyer_id);
-- Carts policies
create policy "Users can view own carts"
  on public.carts for select using (auth.uid() = buyer_id);
create policy "Users can manage own carts"
  on public.carts for all using (auth.uid() = buyer_id);
-- Cart items policies
create policy "Users can view own cart items"
  on public.cart_items for select using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
      and carts.buyer_id = auth.uid()
    )
  );
create policy "Users can manage own cart items"
  on public.cart_items for all using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
      and carts.buyer_id = auth.uid()
    )
  );
-- Orders policies
create policy "Users can view own orders"
  on public.orders for select using (auth.uid() = buyer_id);
create policy "Users can create own orders"
  on public.orders for insert with check (auth.uid() = buyer_id);
-- Order items policies
create policy "Users can view own order items"
  on public.order_items for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.buyer_id = auth.uid()
    )
  );
create policy "Users can create own order items"
  on public.order_items for insert with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.buyer_id = auth.uid()
    )
  );
-- Product events policies
create policy "Anyone can create product events"
  on public.product_events for insert with check (true);
create policy "Sellers can view own product events"
  on public.product_events for select using (seller_id = auth.uid());
-- Product analytics policies
create policy "Sellers can view own product analytics"
  on public.product_analytics_daily for select using (
    exists (
      select 1 from public.products
      where products.id = product_analytics_daily.product_id
      and products.seller_id = auth.uid()
    )
  );
-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;
-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
-- Triggers for updated_at
create trigger set_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();
create trigger set_updated_at
  before update on public.carts
  for each row execute function public.handle_updated_at();
