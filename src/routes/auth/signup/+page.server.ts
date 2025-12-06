import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const fullName = formData.get('fullName') as string;

		console.log('Sign up attempt:', email, fullName);

		if (!email || !password || !fullName) {
			return fail(400, { error: 'All fields are required' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters' });
		}

		const { data, error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					full_name: fullName
				}
			}
		});

		console.log('Sign up result:', { 
			success: !error, 
			hasSession: !!data.session,
			userId: data.user?.id 
		});

		if (error) {
			console.error('Sign up error:', error.message);
			return fail(400, { error: error.message });
		}

		// Profile will be created by database trigger
		// Redirect to home page
		throw redirect(303, '/');
	}
} satisfies Actions;
