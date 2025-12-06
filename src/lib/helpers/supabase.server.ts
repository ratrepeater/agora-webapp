import { createServerClient } from './supabase';
import { SUPABASE_URL, SUPABASE_KEY } from '$env/static/private';

// Server-side singleton for use in services and server-side code only
// DO NOT import this in client-side code (.svelte files)
export const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY);
