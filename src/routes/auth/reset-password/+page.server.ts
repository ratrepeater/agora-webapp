import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
    default: async ({ request, locals, cookies }) => {
        const formData = await request.formData();
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;
        
        console.log('Attempt to reset password');

        if (!password || !confirmPassword) {
            return fail(400, { error: 'Password and confirm password are required' });
        }

        if (password !== confirmPassword) {
            return fail(400, { error: 'Passwords do not match' });
        }

        const { data, error } = await locals.supabase.auth.updateUser({
            password: password,
            data: {
                password: password,
                confirmed_at: new Date().toISOString()
            }
        });

        if (error) {
            return fail(400, { error: error.message });
        }

        await locals.supabase.auth.signInWithPassword({
            email: data.user.email as string,
            password: password
        });

        return redirect(303, '/');
    }
} satisfies Actions;
