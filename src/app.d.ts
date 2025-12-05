// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/helpers/database.types';
import type { UserRole } from '$lib/helpers/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database>;
			session: Session | null;
			userRole: UserRole | null;
		}
		interface PageData {
			session: Session | null;
			userRole: UserRole | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
