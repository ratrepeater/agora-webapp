<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { createBrowserClient } from '$lib/helpers/supabase';
	import { AuthService } from '$lib/services/auth';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	const authService = new AuthService(supabase);

	async function handleSignIn() {
		error = '';
		loading = true;

		try {
			await authService.signIn({ email, password });
			
			// Get the redirect URL from query params or default to homepage
			const redirectTo = $page.url.searchParams.get('redirectTo') || '/';
			goto(redirectTo);
		} catch (e: any) {
			error = e.message || 'Failed to sign in';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200">
	<div class="card w-96 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-2xl font-bold mb-4">Sign In</h2>

			{#if error}
				<div class="alert alert-error mb-4">
					<span>{error}</span>
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleSignIn(); }}>
				<div class="form-control mb-4">
					<label class="label" for="email">
						<span class="label-text">Email</span>
					</label>
					<input
						id="email"
						type="email"
						placeholder="email@example.com"
						class="input input-bordered"
						bind:value={email}
						required
					/>
				</div>

				<div class="form-control mb-6">
					<label class="label" for="password">
						<span class="label-text">Password</span>
					</label>
					<input
						id="password"
						type="password"
						placeholder="••••••••"
						class="input input-bordered"
						bind:value={password}
						required
					/>
				</div>

				<div class="form-control">
					<button type="submit" class="btn btn-primary" disabled={loading}>
						{loading ? 'Signing in...' : 'Sign In'}
					</button>
				</div>
			</form>

			<div class="divider">OR</div>

			<div class="text-center">
				<p class="text-sm">
					Don't have an account?
					<a href="/auth/signup" class="link link-primary">Sign up</a>
				</p>
			</div>
		</div>
	</div>
</div>
