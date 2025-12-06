-- Create profiles for any existing users who don't have one
insert into public.profiles (id, full_name, role_buyer, role_seller)
select 
  au.id,
  coalesce(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1),
    'User'
  ) as full_name,
  true as role_buyer,
  false as role_seller
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null
on conflict (id) do nothing;
