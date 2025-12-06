import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, locals, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		console.log('Sign in attempt:', email);

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		const { data, error } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		console.log('Sign in result:', { 
			success: !error, 
			hasSession: !!data.session,
			userId: data.user?.id 
		});

		if (error) {
			console.error('Sign in error:', error.message);
			return fail(400, { error: error.message });
		}

		// Check cookies were set
		const allCookies = cookies.getAll();
		console.log('Cookies after sign in:', allCookies.map(c => c.name));

		// Redirect to home page
		throw redirect(303, '/');
	}
} satisfies Actions;
