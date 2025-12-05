import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Check if user is authenticated
	if (!locals.session) {
		// Redirect to sign-in page with return URL
		throw redirect(303, `/auth/signin?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	return {
		session: locals.session,
		userRole: locals.userRole
	};
};
