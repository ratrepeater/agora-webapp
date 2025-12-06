# URGENT: Fix Authentication NOW

## The Problem
The database trigger isn't firing, so profiles aren't being created automatically.

## The Solution - Do This NOW

### Step 1: Run SQL Script in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/sbfpxgsgabkgbutzhgwm/sql
2. Click "New Query"
3. Copy the ENTIRE contents of `supabase/RUN_THIS_NOW.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Ctrl+Enter)

This will:
- ✅ Recreate the trigger with proper permissions
- ✅ Create profiles for ALL existing users
- ✅ Show you a report of users vs profiles

### Step 2: Verify It Worked

After running the script, you should see output like:

```
total_users | total_profiles | missing_profiles
------------|----------------|------------------
     5      |       5        |        0
```

If `missing_profiles` is 0, you're good!

You should also see a table showing all users with "✅ HAS PROFILE" status.

### Step 3: Test Authentication

1. **Clear your browser completely:**
   - Close all tabs
   - Clear cookies and cache
   - Restart browser

2. **Go to:** http://localhost:5174/auth/signin

3. **Sign in with your existing account**

4. **Check:** http://localhost:5174/auth/test
   - You should see your session
   - You should see your profile
   - You should see role: buyer

5. **Try accessing buyer pages:**
   - http://localhost:5174/cart
   - http://localhost:5174/bookmarks
   - http://localhost:5174/dashboard

All should work now!

### Step 4: Test New Signup

1. Sign out
2. Go to: http://localhost:5174/auth/signup
3. Create a NEW account with a different email
4. You should be signed in immediately
5. Check http://localhost:5174/auth/test
6. Profile should exist with your name

## Why This Happened

The trigger wasn't properly created or didn't have the right permissions. The SQL script:

1. **Drops and recreates the trigger** with proper `SECURITY DEFINER`
2. **Grants necessary permissions** to the function
3. **Backfills all missing profiles** for existing users
4. **Verifies everything worked** with a report

## If It Still Doesn't Work

### Check Supabase Logs
1. Go to: https://supabase.com/dashboard/project/sbfpxgsgabkgbutzhgwm/logs/postgres-logs
2. Look for errors related to triggers or profiles
3. Share any errors you see

### Manually Create Your Profile
If you need immediate access, run this in SQL Editor (replace YOUR_USER_ID):

```sql
INSERT INTO public.profiles (id, full_name, role_buyer, role_seller)
VALUES (
  'YOUR_USER_ID',  -- Get this from Authentication > Users
  'Your Name',
  true,
  false
);
```

### Check Trigger Exists
Run this in SQL Editor:

```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

Should return 1 row. If it returns 0 rows, the trigger doesn't exist.

## After It's Fixed

Once authentication works:

1. ✅ Remove test page: `src/routes/auth/test/`
2. ✅ Test all buyer features (cart, bookmarks, orders)
3. ✅ Test "Become a Seller" flow
4. ✅ Configure OAuth providers (optional)

## Technical Details

The trigger function runs with `SECURITY DEFINER` which means it executes with the privileges of the function owner (postgres), bypassing RLS policies. This is necessary because:

1. User signs up → creates entry in `auth.users`
2. User is NOT authenticated yet (no session)
3. Trigger fires with elevated privileges
4. Profile is created in `public.profiles`
5. User gets session and can access app

Without `SECURITY DEFINER`, the trigger would fail due to RLS policies.
