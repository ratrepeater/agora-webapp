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

        // Get the session to check if profile exists
        const {
            data: { session }
        } = await locals.supabase.auth.getSession();

        // Profile is created automatically by database trigger
        // No need to manually check or create profile here

        throw redirect(303, redirectTo);
    }

    const supabase = locals.supabase;

    // Get the session from the URL hash
    const { data, error: authError } = await supabase.auth.getSession();

    if (authError) {
        throw authError;
    }

    if (data.session) {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.session.user.id)
            .single();

        // If no profile exists, create one (for OAuth users)
        if (profileError || !profile) {
            const { error: insertError } = await supabase.from('profiles').insert({
                id: data.session.user.id,
                full_name: data.session.user.user_metadata.full_name || data.session.user.user_metadata.name || '',
                role_buyer: true,
                role_seller: false
            });

            if (insertError) {
                console.error('Error creating profile:', insertError);
            }
        }
    } else {
        throw new Error('No session found');
    }

    throw redirect(303, redirectTo);
};
