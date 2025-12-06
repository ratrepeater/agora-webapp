# Authentication Fixed! 🎉

## What Was Fixed

### 1. Profile Creation
- ✅ Added RLS policy to allow users to create their own profiles
- ✅ Created database trigger to automatically create profiles for new signups
- ✅ Created profiles for all existing users who didn't have one
- ✅ Fixed hooks.server.ts to correctly read role_buyer/role_seller fields

### 2. Auth Flow Simplified
- ✅ Removed role selection from signup (all users start as buyers)
- ✅ Created "Become a Seller" page for users to upgrade later
- ✅ OAuth users now get profiles created automatically
- ✅ Added "Become a Seller" button in navigation for buyers

### 3. Database Migrations Applied
All migrations have been pushed to the remote database:
- Profile creation trigger
- Missing profiles backfill
- Updated types generated

## Test Your Auth

### Option 1: Debug Page
Visit http://localhost:5174/auth/test to see:
- Your session status
- Your user role
- Your profile data

### Option 2: Try the Flow
1. Sign out if you're signed in
2. Go to http://localhost:5174/auth/signup
3. Create a new account (or use OAuth)
4. You should be signed in and see your email in the nav
5. You should be able to access buyer pages (bookmarks, orders, dashboard)
6. Click "Become a Seller" to upgrade to seller role

## How It Works Now

### New User Signup
1. User signs up with email/password or OAuth
2. Database trigger automatically creates profile with:
   - `role_buyer = true`
   - `role_seller = false`
3. User is redirected to home page
4. User can browse, bookmark, and purchase products

### Becoming a Seller
1. Buyer clicks "Become a Seller" in navigation
2. Optionally enters company name
3. System updates profile: `role_seller = true`
4. User is redirected to seller dashboard
5. User can now create and manage products

### Session Handling
- `hooks.server.ts` checks for session on every request
- If session exists, loads profile and determines role
- Role is available in `event.locals.userRole`
- Session and user info available in all pages

## Troubleshooting

### Still can't sign in?
1. Clear browser cookies and cache
2. Sign out completely
3. Try signing in again
4. Check http://localhost:5174/auth/test for debug info

### Profile not showing?
1. Go to http://localhost:5174/auth/test
2. If "No profile found" appears, the trigger didn't fire
3. Sign out and sign up with a new account to test
4. Or manually create profile in Supabase Dashboard

### Can't access buyer/seller pages?
1. Check http://localhost:5174/auth/test
2. Verify you have a profile with role_buyer or role_seller = true
3. Make sure you're signed in (session should show)
4. Check browser console for errors

## Next Steps

1. Test the auth flow thoroughly
2. Remove the test page when done: `src/routes/auth/test/`
3. Configure OAuth providers in Supabase Dashboard (see docs/ENABLE_OAUTH.md)
4. Customize the "Become a Seller" page as needed

## Technical Details

### Database Trigger
```sql
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
```

This trigger runs automatically whenever a new user is created in `auth.users`.

### RLS Policy
```sql
create policy "Users can insert own profile"
  on public.profiles for insert 
  with check (auth.uid() = id);
```

This allows users to create their own profile during signup.

### Role Determination
In `hooks.server.ts`:
- If `role_seller = true` → user is a seller
- Else if `role_buyer = true` → user is a buyer
- Else → no role (shouldn't happen with trigger)

Sellers can also be buyers (both flags can be true).
