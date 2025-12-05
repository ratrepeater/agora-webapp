-- Marketing Tools Metrics Table
create table public.marketing_metrics (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade unique,
  
  -- Marketing-specific metrics
  conversion_lift_percentage decimal(5,2),
  lead_cost_usd decimal(10,2),
  attribution_accuracy_error_percentage decimal(5,2),
  email_deliverability_percentage decimal(5,2),
  audience_match_rate_percentage decimal(5,2),
  engagement_rate_percentage decimal(5,2),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- HR Tools Metrics Table
create table public.hr_metrics (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade unique,
  
  -- HR-specific metrics
  payroll_error_rate_percentage decimal(5,2),
  onboarding_time_days integer,
  time_to_fill_days integer,
  compliance_tasks_automated_count integer,
  employee_record_completeness_percentage decimal(5,2),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Legal Tools Metrics Table
create table public.legal_metrics (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade unique,
  
  -- Legal-specific metrics
  contract_cycle_time_days integer,
  redlines_per_contract_avg decimal(5,2),
  template_reuse_rate_percentage decimal(5,2),
  risk_flag_detection_rate_percentage decimal(5,2),
  version_count_avg integer,
  workflow_automation_steps_count integer,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for performance
create index idx_marketing_metrics_product on public.marketing_metrics(product_id);
create index idx_hr_metrics_product on public.hr_metrics(product_id);
create index idx_legal_metrics_product on public.legal_metrics(product_id);

-- Enable Row Level Security
alter table public.marketing_metrics enable row level security;
alter table public.hr_metrics enable row level security;
alter table public.legal_metrics enable row level security;

-- RLS Policies - Anyone can view metrics
create policy "Anyone can view marketing metrics"
  on public.marketing_metrics for select
  using (true);

create policy "Anyone can view hr metrics"
  on public.hr_metrics for select
  using (true);

create policy "Anyone can view legal metrics"
  on public.legal_metrics for select
  using (true);

-- Sellers can manage their product metrics
create policy "Sellers can insert marketing metrics for own products"
  on public.marketing_metrics for insert
  with check (
    exists (
      select 1 from public.products
      where products.id = product_id
      and products.seller_id = auth.uid()
    )
  );

create policy "Sellers can update marketing metrics for own products"
  on public.marketing_metrics for update
  using (
    exists (
      select 1 from public.products
      where products.id = product_id
      and products.seller_id = auth.uid()
    )
  );

create policy "Sellers can delete marketing metrics for own products"
  on public.marketing_metrics for delete
  using (
    exists (
      select 1 from public.products
      where products.id = product_id
      and products.seller_id = auth.uid()
    )
  );

create policy "Sellers can insert hr metrics for own products"
  on public.hr_metrics for insert
  with check (
    exists (
      select 1 from public.products
      where products.id = product_id
      and products.seller_id = auth.uid()
    )
  );

create policy "Sellers can update hr metrics for own products"
  on public.hr_metrics for update
  using (
    exists (
      select 1 from public.products
      where products.id = product_id
      and products.seller_id = auth.uid()
    )
  );

create policy "Sellers can delete hr metrics for own products"
  on public.hr_metrics for delete
  using (
    exists (
      select 1 from public.products
      where products.id = product_id
      and products.seller_id = auth.uid()
    )
  );

create policy "Sellers can insert legal metrics for own products"
  on public.legal_metrics for insert
  with check (
    exists (
      select 1 from public.products
      where products.id = product_id
      and products.seller_id = auth.uid()
    )
  );

create policy "Sellers can update legal metrics for own products"
  on public.legal_metrics for update
  using (
    exists (
      select 1 from public.products
      where products.id = product_id
      and products.seller_id = auth.uid()
    )
  );

create policy "Sellers can delete legal metrics for own products"
  on public.legal_metrics for delete
  using (
    exists (
      select 1 from public.products
      where products.id = product_id
      and products.seller_id = auth.uid()
    )
  );

-- Triggers for updated_at
create trigger set_updated_at
  before update on public.marketing_metrics
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.hr_metrics
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.legal_metrics
  for each row execute function public.handle_updated_at();

-- Create views that join products with their category-specific metrics

create view public.marketing_products_full as
select 
  p.*,
  m.conversion_lift_percentage,
  m.lead_cost_usd,
  m.attribution_accuracy_error_percentage,
  m.email_deliverability_percentage,
  m.audience_match_rate_percentage,
  m.engagement_rate_percentage,
  coalesce(avg(r.rating), 0) as average_rating,
  count(r.id) as review_count
from public.products p
left join public.marketing_metrics m on p.id = m.product_id
left join public.reviews r on p.id = r.product_id
where p.category = 'Marketing'
group by p.id, m.id;

create view public.hr_products_full as
select 
  p.*,
  h.payroll_error_rate_percentage,
  h.onboarding_time_days,
  h.time_to_fill_days,
  h.compliance_tasks_automated_count,
  h.employee_record_completeness_percentage,
  coalesce(avg(r.rating), 0) as average_rating,
  count(r.id) as review_count
from public.products p
left join public.hr_metrics h on p.id = h.product_id
left join public.reviews r on p.id = r.product_id
where p.category = 'HR'
group by p.id, h.id;

create view public.legal_products_full as
select 
  p.*,
  l.contract_cycle_time_days,
  l.redlines_per_contract_avg,
  l.template_reuse_rate_percentage,
  l.risk_flag_detection_rate_percentage,
  l.version_count_avg,
  l.workflow_automation_steps_count,
  coalesce(avg(r.rating), 0) as average_rating,
  count(r.id) as review_count
from public.products p
left join public.legal_metrics l on p.id = l.product_id
left join public.reviews r on p.id = r.product_id
where p.category = 'Law'
group by p.id, l.id;
