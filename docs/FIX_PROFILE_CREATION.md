# Fix Profile Creation Issue

## Problem
Profiles are not being created automatically when users sign up, preventing access to buyer/seller dashboards.

## Solution
Run the SQL script to add the missing RLS policy and automatic profile creation trigger.

## Steps

### 1. Apply the SQL Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/sbfpxgsgabkgbutzhgwm
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/APPLY_THIS_IN_DASHBOARD.sql`
5. Click **Run** (or press Ctrl+Enter)

This will:
- ✅ Add RLS policy to allow users to create their own profile
- ✅ Create a trigger to automatically create profiles for new signups
- ✅ Create profiles for any existing users who don't have one

### 2. Test the Fix

1. Sign out if you're currently signed in
2. Try signing up with a new account or signing in with OAuth
3. You should now be able to access the dashboard

## What Changed

### Auth Flow Updates

**Before:**
- Signup required selecting buyer/seller role
- OAuth users couldn't select a role
- Profiles weren't created automatically

**After:**
- All users start as buyers by default
- Profiles are created automatically via database trigger
- Users can become sellers later via the "Become a Seller" page
- OAuth users get profiles created automatically

### New Features

1. **Automatic Profile Creation**: Database trigger creates profiles for all new users
2. **Become a Seller Page**: `/become-seller` - Allows buyers to upgrade to seller accounts
3. **Simplified Signup**: No role selection needed during signup
4. **Better OAuth Support**: OAuth users get profiles created automatically

### Navigation Updates

- Buyers now see a "Become a Seller" button in the navigation
- Sellers continue to see their seller-specific navigation

## Troubleshooting

### Still can't access dashboard after applying migration?

1. Sign out completely
2. Clear browser cookies/cache
3. Sign in again
4. Check the browser console for errors

### Profile still not created?

1. Go to Supabase Dashboard > Authentication > Users
2. Find your user
3. Check if there's a corresponding entry in Database > profiles table
4. If not, manually run:
   ```sql
   insert into public.profiles (id, full_name, role_buyer, role_seller)
   values ('YOUR_USER_ID', 'Your Name', true, false);
   ```

### Can't become a seller?

Make sure you're signed in and have a profile. The "Become a Seller" page will:
1. Check if you're authenticated
2. Enable the `role_seller` flag on your profile
3. Redirect you to the seller dashboard
