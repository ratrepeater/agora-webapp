import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const redirectTo = url.searchParams.get('redirectTo') || '/';

	if (code) {
		// Exchange the code for a session
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error('Error exchanging code for session:', error);
			throw redirect(303, '/auth/signin?error=auth_failed');
		}

		// Get the session to check if profile exists
		const {
			data: { session }
		} = await locals.supabase.auth.getSession();

		// Profile is created automatically by database trigger
		// No need to manually check or create profile here
	}

	throw redirect(303, redirectTo);
};
