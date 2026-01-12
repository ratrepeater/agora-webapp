// global type definitions for sveltekit app
// extends app namespace with custom types for supabase integration

import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '$lib/helpers/database.types';
import type { UserRole } from '$lib/helpers/types';

// Custom session type for compatibility
interface CustomSession {
    user: User;
}

declare global {
    namespace App {
        // server-side locals available in hooks, load functions, and endpoints
        // populated by hooks.server.ts on every request
        interface Locals {
            supabase: SupabaseClient<Database>;
            session: CustomSession | null;
            userRole: UserRole | null;
        }

        // data passed from server load functions to pages
        // contains authentication state for client-side use
        interface PageData {
            session: CustomSession | null;
            userRole: UserRole | null;
        }
    }
}

export {};
