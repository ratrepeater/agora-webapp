-- ============================================================================
-- FIX PROFILE CREATION
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. Allow users to create their own profile during signup
create policy "Users can insert own profile"
  on public.profiles for insert 
  with check (auth.uid() = id);

-- 2. Create a trigger to automatically create profiles for new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role_buyer, role_seller)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    true,
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Create profiles for existing users who don't have one
insert into public.profiles (id, full_name, role_buyer, role_seller)
select 
  au.id,
  coalesce(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', au.email, ''),
  true,
  false
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null
on conflict (id) do nothing;
