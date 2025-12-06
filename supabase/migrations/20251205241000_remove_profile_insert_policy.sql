-- Remove the insert policy since profiles are created by trigger only
-- The trigger runs with security definer and bypasses RLS
drop policy if exists "Users can insert own profile" on public.profiles;

-- Verify the trigger function has the correct settings
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
