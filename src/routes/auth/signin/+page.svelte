<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { createBrowserClient } from '$lib/helpers/supabase';
	import { AuthService } from '$lib/services/auth';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	const authService = new AuthService(supabase);

	let error = $derived(form?.error || '');
	
	// Get feature name from redirectTo parameter
	const featureName = $derived(() => {
		const redirectTo = $page.url.searchParams.get('redirectTo');
		if (!redirectTo) return null;
		
		if (redirectTo.includes('/bookmarks')) return 'Bookmarks';
		if (redirectTo.includes('/compare')) return 'Compare';
		if (redirectTo.includes('/dashboard')) return 'Dashboard';
		if (redirectTo.includes('/orders')) return 'Orders';
		if (redirectTo.includes('/cart')) return 'Cart';
		return null;
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200">
	<div class="card w-96 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-2xl font-bold mb-4">Sign In</h2>
			
			{#if featureName()}
				<div class="alert alert-info mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
					<span>Sign in to access {featureName()}</span>
				</div>
			{/if}

			{#if error}
				<div class="alert alert-error mb-4">
					<span>{error}</span>
				</div>
			{/if}

			<form method="POST" use:enhance>
				<div class="form-control mb-4">
					<label class="label" for="email">
						<span class="label-text">Email</span>
					</label>
					<input
						id="email"
						name="email"
						type="email"
						placeholder="email@example.com"
						class="input input-bordered"
						required
					/>
				</div>

				<div class="form-control mb-6">
					<label class="label" for="password">
						<span class="label-text">Password</span>
					</label>
					<input
						id="password"
						name="password"
						type="password"
						placeholder="••••••••"
						class="input input-bordered"
						required
					/>
				</div>

				<div class="form-control">
					<button type="submit" class="btn btn-primary">
						Sign In
					</button>
				</div>
			</form>

			<div class="divider">OR</div>

			<!-- OAuth Providers -->
			<div class="space-y-2">
				<button
					type="button"
					class="btn btn-outline w-full"
					onclick={() => {
						alert('This feature is under development');
					}}
				>
					<svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
						<path
							fill="currentColor"
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						/>
						<path
							fill="currentColor"
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						/>
						<path
							fill="currentColor"
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						/>
						<path
							fill="currentColor"
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						/>
					</svg>
					Continue with Google
				</button>

				<button
					type="button"
					class="btn btn-outline w-full"
					onclick={() => {
						alert('This feature is under development');
					}}
				>
					<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
						/>
					</svg>
					Continue with GitHub
				</button>
			</div>

			<div class="divider"></div>

			<div class="text-center">
				<p class="text-sm">
					Don't have an account?
					<a href="/auth/signup" class="link link-primary">Sign up</a>
				</p>
			</div>
		</div>
	</div>
</div>
