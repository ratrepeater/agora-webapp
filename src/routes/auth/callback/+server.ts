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

        // Get the user to check if profile exists
        const {
            data: { user },
            error: userError
        } = await locals.supabase.auth.getUser();

        if (userError) {
            console.error('Error getting user:', userError);
            throw redirect(303, '/auth/signin?error=auth_failed');
        }

        // Profile is created automatically by database trigger
        // No need to manually check or create profile here

        throw redirect(303, redirectTo);
    }

    const supabase = locals.supabase;

    // Get the user from the authenticated session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
        throw authError;
    }

    if (user) {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        // If no profile exists, create one (for OAuth users)
        if (profileError || !profile) {
            const { error: insertError } = await supabase.from('profiles').insert({
                id: user.id,
                full_name: user.user_metadata.full_name || user.user_metadata.name || '',
                role_buyer: true,
                role_seller: false
            });

            if (insertError) {
                console.error('Error creating profile:', insertError);
            }
        }
    } else {
        throw new Error('No user found');
    }

    throw redirect(303, redirectTo);
};
