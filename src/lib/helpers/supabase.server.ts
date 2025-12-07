// server-side supabase singleton
// warning: only import this in server-side code (+page.server.ts, +server.ts, services)
// do not import in .svelte component files - use locals.supabase instead

import { createServerClient } from './supabase';
import { SUPABASE_URL, SUPABASE_KEY } from '$env/static/private';

export const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY);
