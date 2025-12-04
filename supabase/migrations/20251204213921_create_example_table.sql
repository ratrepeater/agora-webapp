-- Create a simple example table for testing
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  completed boolean default false,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.todos enable row level security;

-- Create a policy that allows anyone to read todos
create policy "Anyone can read todos"
  on public.todos
  for select
  using (true);
