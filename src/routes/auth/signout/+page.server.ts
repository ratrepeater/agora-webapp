import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Sign out the user
	if (locals.session) {
		await locals.supabase.auth.signOut();
	}

	// Redirect to home page
	throw redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ locals }) => {
		// Sign out the user
		if (locals.session) {
			await locals.supabase.auth.signOut();
		}

		// Return success - client will handle redirect
		return { success: true };
	}
};
