<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { createBrowserClient } from '$lib/helpers/supabase';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	let error = $state('');
	let processing = $state(true);

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	onMount(async () => {
		try {
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

				// Get redirect URL from query params
				const redirectTo = $page.url.searchParams.get('redirectTo') || '/';
				goto(redirectTo);
			} else {
				throw new Error('No session found');
			}
		} catch (e: any) {
			error = e.message || 'Authentication failed';
			processing = false;
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200">
	<div class="card w-96 bg-base-100 shadow-xl">
		<div class="card-body items-center text-center">
			{#if processing}
				<div class="loading loading-spinner loading-lg text-primary"></div>
				<h2 class="card-title mt-4">Completing sign in...</h2>
				<p class="text-sm text-base-content/70">Please wait while we set up your account</p>
			{:else if error}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-16 w-16 text-error mb-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<h2 class="card-title text-error">Authentication Failed</h2>
				<p class="text-sm text-base-content/70 mb-4">{error}</p>
				<a href="/auth/signin" class="btn btn-primary">Back to Sign In</a>
			{/if}
		</div>
	</div>
</div>
