import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Check if user is authenticated
	if (!locals.session) {
		// Redirect to sign-in page with return URL
		throw redirect(303, `/auth/signin?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	// Check if user has seller role
	if (locals.userRole !== 'seller') {
		// Redirect to homepage if not a seller
		throw redirect(303, '/');
	}

	return {
		session: locals.session,
		userRole: locals.userRole
	};
};
