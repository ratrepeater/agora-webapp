import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, url }) => {
    const { provider, redirectTo } = await request.json();

    if (!provider || !['google', 'github'].includes(provider)) {
        return json({ error: 'Invalid provider' }, { status: 400 });
    }

    const { data, error } = await locals.supabase.auth.signInWithOAuth({
        provider: provider as 'google' | 'github',
        options: {
            redirectTo: `${url.origin}/auth/callback${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`
        }
    });

    if (error) {
        return json({ error: error.message }, { status: 400 });
    }

    return json({ url: data.url });
};