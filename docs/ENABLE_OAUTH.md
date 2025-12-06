# Enable OAuth - Quick Guide

Your app already has OAuth buttons for Google and GitHub. To enable them:

## Step 1: Configure in Supabase Dashboard

Go to: https://supabase.com/dashboard/project/sbfpxgsgabkgbutzhgwm/auth/providers

### For Email/Password (Already Working)
✅ Email provider is already enabled

### For Google OAuth

1. Click on **Google** provider
2. Toggle **Enable Sign in with Google** to ON
3. You'll need:
   - **Client ID** from Google Cloud Console
   - **Client Secret** from Google Cloud Console
4. Get these from: https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Add redirect URI: `https://sbfpxgsgabkgbutzhgwm.supabase.co/auth/v1/callback`
5. Paste the credentials in Supabase
6. Click **Save**

### For GitHub OAuth

1. Click on **GitHub** provider
2. Toggle **Enable Sign in with GitHub** to ON
3. You'll need:
   - **Client ID** from GitHub
   - **Client Secret** from GitHub
4. Get these from: https://github.com/settings/developers
   - Click "New OAuth App"
   - Authorization callback URL: `https://sbfpxgsgabkgbutzhgwm.supabase.co/auth/v1/callback`
5. Paste the credentials in Supabase
6. Click **Save**

## Step 2: Configure Redirect URLs

Go to: https://supabase.com/dashboard/project/sbfpxgsgabkgbutzhgwm/auth/url-configuration

1. Set **Site URL**: `http://localhost:5173`
2. Add **Redirect URLs**:
   ```
   http://localhost:5173/auth/callback
   http://localhost:5173/*
   ```
3. Click **Save**

## Step 3: Test

1. Go to http://localhost:5173/auth/signin
2. Click "Continue with Google" or "Continue with GitHub"
3. Complete the OAuth flow
4. You should be signed in!

## Current Status

- ✅ Email/Password signup and signin working
- ✅ OAuth UI buttons added
- ⏳ OAuth providers need to be enabled in Supabase Dashboard (follow steps above)

## Note

The error "Unsupported provider: provider is not enabled" means you need to complete Step 1 above to enable the OAuth providers in your Supabase dashboard.
