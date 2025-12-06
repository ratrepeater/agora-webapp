import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_KEY } from '$env/static/private';
import type { Handle } from '@sveltejs/kit';
import type { Database } from '$lib/helpers/database.types';

export const handle: Handle = async ({ event, resolve }) => {
	// Create a Supabase client with cookie handling
	event.locals.supabase = createSupabaseServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
		cookies: {
			getAll: () => {
				return event.cookies.getAll();
			},
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	// Get the session from the request
	const {
		data: { session }
	} = await event.locals.supabase.auth.getSession();

	event.locals.session = session;

	// If there's a session, get the user's role from the profiles table
	if (session) {
		const { data: profile } = await event.locals.supabase
			.from('profiles')
			.select('role_buyer, role_seller')
			.eq('id', session.user.id)
			.single();

		// Determine primary role (seller takes precedence if both are true)
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
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
