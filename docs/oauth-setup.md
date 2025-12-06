# OAuth Setup Guide

This guide explains how to configure OAuth providers (Google, GitHub) in your Supabase project.

## Prerequisites

- A Supabase project (you're using: https://sbfpxgsgabkgbutzhgwm.supabase.co)
- Access to the Supabase Dashboard

## Quick Start

The OAuth buttons are already integrated in your signup/signin pages. You just need to:
1. Set up OAuth apps with Google/GitHub
2. Configure them in Supabase Dashboard
3. The app will handle the rest automatically

## Setup Steps

### 1. Get Your Supabase Callback URL

Your Supabase callback URL is:
```
https://sbfpxgsgabkgbutzhgwm.supabase.co/auth/v1/callback
```

You'll need this for both Google and GitHub setup.

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen
6. Add authorized redirect URIs:
   - `https://sbfpxgsgabkgbutzhgwm.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**
8. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/sbfpxgsgabkgbutzhgwm
9. Navigate to **Authentication** → **Providers**
10. Find **Google** and click to configure
11. Paste your Client ID and Client Secret
12. Click **Save**

### 3. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the application details:
   - **Application name**: Agora Marketplace
   - **Homepage URL**: http://localhost:5173
   - **Authorization callback URL**: `https://sbfpxgsgabkgbutzhgwm.supabase.co/auth/v1/callback`
4. Click **Register application**
5. Copy the **Client ID**
6. Generate a new **Client Secret**
7. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/sbfpxgsgabkgbutzhgwm
8. Navigate to **Authentication** → **Providers**
9. Find **GitHub** and click to configure
10. Paste your Client ID and Client Secret
11. Click **Save**

### 4. Configure Redirect URLs in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/sbfpxgsgabkgbutzhgwm
2. Navigate to **Authentication** → **URL Configuration**
3. Set **Site URL** to: `http://localhost:5173`
4. Add to **Redirect URLs**: 
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173/*` (wildcard for all routes)
5. Click **Save**

## How It Works

1. User clicks "Continue with Google" or "Continue with GitHub"
2. User is redirected to the OAuth provider's login page
3. After successful authentication, the provider redirects back to `/auth/callback`
4. The callback handler:
   - Exchanges the auth code for a session
   - Creates a profile if it doesn't exist
   - Redirects the user to their destination

## Profile Creation

For OAuth users, a profile is automatically created with:
- `full_name`: From OAuth provider metadata
- `role_buyer`: `true` (default)
- `role_seller`: `false` (default)

Users can update their role later through the app settings.

## Testing

1. Start your dev server: `npm run dev`
2. Navigate to `/auth/signin` or `/auth/signup`
3. Click on an OAuth provider button
4. Complete the OAuth flow
5. You should be redirected back to the app with an active session

## Troubleshooting

### "Invalid redirect URL" error
- Make sure the redirect URL is added to Supabase's allowed redirect URLs
- Check that the OAuth provider's callback URL matches Supabase's callback URL

### Profile not created
- Check the browser console for errors
- Verify that the profiles table has the correct schema
- Ensure RLS policies allow profile creation

### Session not persisting
- Check that cookies are enabled in the browser
- Verify that the Supabase client is configured correctly
- Check the browser's Application/Storage tab for session data
