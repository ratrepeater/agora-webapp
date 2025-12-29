// client-side supabase singleton

import { createBrowserClient } from './supabase';
import { SUPABASE_URL, SUPABASE_KEY } from '$env/static/private';

export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
