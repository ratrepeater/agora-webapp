import { createServerClient } from '$lib/helpers/supabase';
import { SUPABASE_URL, SUPABASE_KEY } from '$env/static/private';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Create a Supabase client for this request
	event.locals.supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY);

	// Get the session from the request
	const {
		data: { session }
	} = await event.locals.supabase.auth.getSession();

	event.locals.session = session;

	// If there's a session, get the user's role from the profiles table
	if (session) {
		const { data: profile } = await event.locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', session.user.id)
			.single();

		event.locals.userRole = profile?.role || null;
	} else {
		event.locals.userRole = null;
	}

	return resolve(event);
};
