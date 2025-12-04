-- Create enum types
create type user_role as enum ('buyer', 'seller');
create type product_category as enum ('HR', 'Law', 'Office');
create type cloud_client_type as enum ('cloud', 'client', 'hybrid');

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  email text not null,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  short_description text not null,
  long_description text not null,
  price decimal(10,2) not null check (price >= 0),
  category product_category not null,
  
  -- Media
  logo_url text,
  demo_visual_url text,
  
  -- Business metrics
  roi_percentage decimal(5,2),
  retention_rate decimal(5,2),
  quarter_over_quarter_change decimal(5,2),
  cloud_client_classification cloud_client_type,
  implementation_time_days integer,
  access_depth text,
  
  -- Metadata
  is_featured boolean default false,
  is_new boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Reviews table
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  review_text text,
  created_at timestamptz default now(),
  
  -- Prevent duplicate reviews from same buyer
  unique(product_id, buyer_id)
);

-- Bookmarks table
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  
  -- Prevent duplicate bookmarks
  unique(buyer_id, product_id)
);

-- Cart items table
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer default 1 check (quantity > 0),
  created_at timestamptz default now(),
  
  -- Prevent duplicate items in cart
  unique(buyer_id, product_id)
);

-- Orders table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  total_cost decimal(10,2) not null check (total_cost >= 0),
  status text default 'completed',
  created_at timestamptz default now()
);

-- Order items table
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete set null,
  product_name text not null,
  product_price decimal(10,2) not null,
  quantity integer default 1 check (quantity > 0),
  created_at timestamptz default now()
);

-- Comparison list table (temporary storage for product comparison)
create table public.comparison_items (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  
  -- Prevent duplicate items in comparison
  unique(buyer_id, product_id)
);

-- Create indexes for better query performance
create index idx_products_seller on public.products(seller_id);
create index idx_products_category on public.products(category);
create index idx_products_featured on public.products(is_featured);
create index idx_products_new on public.products(is_new);
create index idx_products_created on public.products(created_at desc);
create index idx_reviews_product on public.reviews(product_id);
create index idx_reviews_buyer on public.reviews(buyer_id);
create index idx_bookmarks_buyer on public.bookmarks(buyer_id);
create index idx_cart_buyer on public.cart_items(buyer_id);
create index idx_orders_buyer on public.orders(buyer_id);
create index idx_order_items_order on public.order_items(order_id);
create index idx_comparison_buyer on public.comparison_items(buyer_id);

-- Create a view for products with average ratings
create view public.products_with_ratings as
select 
  p.*,
  coalesce(avg(r.rating), 0) as average_rating,
  count(r.id) as review_count
from public.products p
left join public.reviews r on p.id = r.product_id
group by p.id;

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.bookmarks enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.comparison_items enable row level security;

-- RLS Policies for profiles
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- RLS Policies for products
create policy "Anyone can view products"
  on public.products for select
  using (true);

create policy "Sellers can insert own products"
  on public.products for insert
  with check (auth.uid() = seller_id);

create policy "Sellers can update own products"
  on public.products for update
  using (auth.uid() = seller_id);

create policy "Sellers can delete own products"
  on public.products for delete
  using (auth.uid() = seller_id);

-- RLS Policies for reviews
create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

create policy "Buyers can insert own reviews"
  on public.reviews for insert
  with check (auth.uid() = buyer_id);

create policy "Buyers can update own reviews"
  on public.reviews for update
  using (auth.uid() = buyer_id);

create policy "Buyers can delete own reviews"
  on public.reviews for delete
  using (auth.uid() = buyer_id);

-- RLS Policies for bookmarks
create policy "Buyers can view own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = buyer_id);

create policy "Buyers can insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = buyer_id);

create policy "Buyers can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = buyer_id);

-- RLS Policies for cart_items
create policy "Buyers can view own cart"
  on public.cart_items for select
  using (auth.uid() = buyer_id);

create policy "Buyers can insert own cart items"
  on public.cart_items for insert
  with check (auth.uid() = buyer_id);

create policy "Buyers can update own cart items"
  on public.cart_items for update
  using (auth.uid() = buyer_id);

create policy "Buyers can delete own cart items"
  on public.cart_items for delete
  using (auth.uid() = buyer_id);

-- RLS Policies for orders
create policy "Buyers can view own orders"
  on public.orders for select
  using (auth.uid() = buyer_id);

create policy "Buyers can insert own orders"
  on public.orders for insert
  with check (auth.uid() = buyer_id);

-- RLS Policies for order_items
create policy "Buyers can view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.buyer_id = auth.uid()
    )
  );

create policy "Buyers can insert own order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.buyer_id = auth.uid()
    )
  );

-- RLS Policies for comparison_items
create policy "Buyers can view own comparison items"
  on public.comparison_items for select
  using (auth.uid() = buyer_id);

create policy "Buyers can insert own comparison items"
  on public.comparison_items for insert
  with check (auth.uid() = buyer_id);

create policy "Buyers can delete own comparison items"
  on public.comparison_items for delete
  using (auth.uid() = buyer_id);

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'buyer');
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
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();
