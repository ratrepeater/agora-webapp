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

        // Check if user already exists
        const { data: existingUser } = await locals.supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return fail(400, { error: 'Email is already registered. Use a different email.' });
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
            // Check if email is already registered
            if (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('registered')) {
                return fail(400, { error: 'Email is already registered. Use a different email.' });
            }
            return fail(400, { error: error.message });
        }

        /*// If no session was created, the email might already be registered
        if (!data.session && data.user) {
            return fail(400, { error: 'Email is already registered. Use a different email.' });
        }*/

        // Profile will be created by database trigger
        return {
            success: true,
            message: "Profile created. Please check your email for a confirmation link."
        };
    }
} satisfies Actions;
