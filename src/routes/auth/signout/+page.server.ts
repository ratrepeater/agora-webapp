import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Sign out the user
	await locals.supabase.auth.signOut();

	// Redirect to homepage
	throw redirect(303, '/');
};
