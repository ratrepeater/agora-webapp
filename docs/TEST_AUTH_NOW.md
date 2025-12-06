# Test Authentication Now

## What Changed

✅ **Removed manual profile creation** - The database trigger now handles ALL profile creation
✅ **Removed RLS insert policy** - No longer needed since trigger runs with `security definer`
✅ **Simplified auth flow** - Just create the user, trigger does the rest

## How to Test

### Step 1: Clear Everything
1. Sign out if you're signed in
2. Clear browser cookies/cache
3. Close and reopen the browser

### Step 2: Test Email Signup
1. Go to http://localhost:5174/auth/signup
2. Enter:
   - Full Name: Test User
   - Email: test@example.com (use a unique email)
   - Password: password123
3. Click "Sign Up"
4. You should be redirected to the home page
5. Check if you're signed in (email should show in nav)

### Step 3: Verify Profile Created
1. Go to http://localhost:5174/auth/test
2. You should see:
   - ✅ Session with your user ID and email
   - ✅ User Role: buyer
   - ✅ Profile with your full name and role_buyer = true

### Step 4: Test OAuth (if configured)
1. Sign out
2. Go to http://localhost:5174/auth/signin
3. Click "Continue with Google" or "Continue with GitHub"
4. Complete OAuth flow
5. You should be signed in
6. Check http://localhost:5174/auth/test to verify profile

### Step 5: Test Buyer Access
1. While signed in, try accessing:
   - http://localhost:5174/bookmarks
   - http://localhost:5174/cart
   - http://localhost:5174/dashboard
2. All should work without errors

### Step 6: Test Become Seller
1. Click "Become a Seller" in the navigation
2. Optionally enter a company name
3. Click "Become a Seller"
4. You should be redirected to seller dashboard
5. Check http://localhost:5174/auth/test
6. You should see role_seller = true

## How the Trigger Works

When a new user is created in `auth.users`:

1. **Trigger fires automatically** (`on_auth_user_created`)
2. **Function runs with elevated privileges** (`security definer`)
3. **Profile is inserted** with:
   - `id` = user's auth ID
   - `full_name` = from user metadata or empty string
   - `role_buyer` = true
   - `role_seller` = false
4. **RLS is bypassed** because of `security definer`
5. **No manual code needed** - it just works!

## Troubleshooting

### Error: "Failed to create profile"
This error should NOT appear anymore. If it does:
1. Check if the trigger exists in Supabase Dashboard > Database > Functions
2. Verify the trigger is attached to `auth.users` table
3. Check Supabase logs for trigger errors

### Profile not created
1. Go to Supabase Dashboard > Authentication > Users
2. Find your user
3. Go to Database > profiles table
4. Check if a row exists with your user ID
5. If not, the trigger didn't fire - check Supabase logs

### Can't sign in
1. Make sure you're using the correct email/password
2. Check if email confirmation is required (should be disabled for dev)
3. Go to Supabase Dashboard > Authentication > Settings
4. Ensure "Enable email confirmations" is OFF for development

### Still getting RLS errors
1. The insert policy has been removed
2. The trigger should bypass RLS with `security definer`
3. If you still get errors, check Supabase logs
4. Verify the migration was applied: `npx supabase migration list --linked`

## Expected Behavior

### ✅ Email Signup
- User created in `auth.users`
- Trigger fires automatically
- Profile created in `public.profiles`
- User signed in
- Can access buyer pages

### ✅ OAuth Signup
- User created in `auth.users` via OAuth
- Trigger fires automatically
- Profile created with name from OAuth provider
- User signed in
- Can access buyer pages

### ✅ Become Seller
- Updates existing profile
- Sets `role_seller = true`
- User can access seller pages
- User still has buyer access (both roles)

## Next Steps

1. Test the signup flow thoroughly
2. If it works, remove the test page: `src/routes/auth/test/`
3. Configure OAuth providers (see docs/ENABLE_OAUTH.md)
4. Deploy to production

## Database Trigger Code

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

The `security definer` clause is KEY - it makes the function run with the privileges of the function owner (postgres), bypassing RLS policies.
