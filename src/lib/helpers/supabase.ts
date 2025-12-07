// supabase client factory functions
// creates properly configured clients for server-side and browser contexts

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// creates a server-side supabase client without session persistence
// use in +page.server.ts, +layout.server.ts, and api endpoints
export function createServerClient(supabaseUrl: string, supabaseKey: string) {
	return createClient<Database>(supabaseUrl, supabaseKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false
		}
	});
}

// creates a browser-side supabase client with session persistence
// use in svelte components and client-side code
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