// server-side request handler that runs on every request
// sets up supabase client, session, and user role in event.locals for use throughout the app

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_KEY } from '$env/static/private';
import type { Handle } from '@sveltejs/kit';
import type { Database } from '$lib/helpers/database.types';

export const handle: Handle = async ({ event, resolve }) => {
    // initialize supabase client with cookie-based session management
    event.locals.supabase = createSupabaseServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
        cookies: {
            getAll: () => event.cookies.getAll(),
            setAll: (cookiesToSet) => {
                cookiesToSet.forEach(({ name, value, options }) => {
                    event.cookies.set(name, value, { ...options, path: '/' });
                });
            }
        }
    });

    // retrieve current session
    const {
        data: { session }
    } = await event.locals.supabase.auth.getSession();

    event.locals.session = session;

    // fetch user role from profiles table if authenticated
    if (session) {
        const { data: profile } = await event.locals.supabase
            .from('profiles')
            .select('role_buyer, role_seller')
            .eq('id', session.user.id)
            .single();

        // seller role takes precedence when user has both roles
        if (profile?.role_seller) {
            event.locals.userRole = 'seller';
        } else if (profile?.role_buyer) {
            event.locals.userRole = 'buyer';
        } else {
            event.locals.userRole = null;
        }
    } else {
        event.locals.userRole = null;
    }

    return resolve(event, {
        // allow supabase headers to pass through
        filterSerializedResponseHeaders(name) {
            return name === 'content-range' || name === 'x-supabase-api-version';
        }
    });
};
