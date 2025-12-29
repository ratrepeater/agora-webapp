import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, locals, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const redirectTo = formData.get('redirectTo') as string;

		console.log('Attempt to reset password for:', email);
		console.log('Redirect to:', redirectTo);

		if (!email) {
			return fail(400, { error: 'Email is required' });
		}

		const { error } = await locals.supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectTo });

		if (error) {
			return fail(400, { error: error.message });
		}

		return {
			success: true,
		};
	}
} satisfies Actions;
