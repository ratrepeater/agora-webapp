import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { SUPABASE_URL, SUPABASE_KEY } from '$env/static/private';

// Server-side client (for use in +page.server.ts, +layout.server.ts, etc.)
export function createServerClient(supabaseUrl: string, supabaseKey: string) {
	return createClient<Database>(supabaseUrl, supabaseKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false
		}
	});
}

// Browser client (for use in components and client-side code)
export function createBrowserClient(supabaseUrl: string, supabaseAnonKey: string) {
	return createClient<Database>(supabaseUrl, supabaseAnonKey, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: true,
			storage: typeof window !== 'undefined' ? window.localStorage : undefined
		}
	});
}

// Legacy singleton for backward compatibility with existing services
// This will be used in server-side code only
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);