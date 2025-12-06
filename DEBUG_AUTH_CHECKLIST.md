# Debug Authentication - Checklist

## Step 1: Use the Debug Tool

1. Go to: http://localhost:5174/auth/debug

2. Enter a unique email (e.g., `test123@example.com`)

3. Click "Test Sign Up"

4. **Read the output carefully** and share what you see

## Step 2: Check Supabase Settings

### Email Confirmation Setting

1. Go to: https://supabase.com/dashboard/project/sbfpxgsgabkgbutzhgwm/auth/url-configuration

2. Scroll to "Email Auth"

3. Check if "Enable email confirmations" is ON or OFF

4. **For development, it should be OFF**

5. If it's ON, turn it OFF and save

### Auth Providers

1. Go to: https://supabase.com/dashboard/project/sbfpxgsgabkgbutzhgwm/auth/providers

2. Check if "Email" provider is enabled

3. It should show as enabled (green toggle)

### Rate Limiting

1. Go to: https://supabase.com/dashboard/project/sbfpxgsgabkgbutzhgwm/auth/rate-limits

2. Check if you've hit any rate limits

3. If yes, wait or increase limits

## Step 3: Check Supabase Logs

1. Go to: https://supabase.com/dashboard/project/sbfpxgsgabkgbutzhgwm/logs/auth-logs

2. Look for recent signup attempts

3. Check for any error messages

4. Share any errors you see

## Step 4: Verify Environment Variables

Check your `.env` file has the correct values:

```
PUBLIC_SUPABASE_URL=https://sbfpxgsgabkgbutzhgwm.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Make sure:
- URL matches your project
- Anon key is correct (not service role key)

## Common Issues

### Issue: "Email rate limit exceeded"
**Solution:** Wait 1 hour or increase rate limits in Supabase Dashboard

### Issue: "User already registered"
**Solution:** Use a different email or delete the user from Supabase Dashboard

### Issue: "Invalid email or password"
**Solution:** 
- Check password is at least 6 characters
- Check email format is valid

### Issue: "Email confirmations are required"
**Solution:** Disable email confirmations in Supabase Dashboard (see Step 2)

### Issue: "Signup is disabled"
**Solution:** Enable signups in Supabase Dashboard > Authentication > Settings

## What to Share

When reporting the issue, please share:

1. **Exact error message** from the debug tool
2. **Screenshot** of the debug tool output
3. **Email confirmation setting** (ON or OFF)
4. **Any errors** from Supabase logs
5. **Browser console errors** (F12 → Console tab)

## Quick Fixes

### Reset Everything

If nothing works, try this:

1. **Delete all test users** from Supabase Dashboard > Authentication > Users

2. **Clear browser completely:**
   - Close all tabs
   - Clear cookies and cache
   - Restart browser

3. **Restart dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

4. **Try again** with the debug tool

### Manual User Creation

If you need immediate access:

1. Go to Supabase Dashboard > Authentication > Users

2. Click "Add User"

3. Enter email and password

4. Click "Create User"

5. Go to SQL Editor and run:
   ```sql
   INSERT INTO public.profiles (id, full_name, role_buyer, role_seller)
   VALUES (
     'USER_ID_FROM_AUTH_USERS',
     'Your Name',
     true,
     false
   );
   ```

6. Try signing in with that user

## Next Steps

Once you share the debug tool output, I can:
- Identify the exact issue
- Provide a targeted fix
- Update the code if needed
