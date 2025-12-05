<script lang="ts">
	import { goto } from '$app/navigation';
	import { createBrowserClient } from '$lib/helpers/supabase';
	import { AuthService } from '$lib/services/auth';
	import type { UserRole } from '$lib/helpers/types';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	let email = $state('');
	let password = $state('');
	let fullName = $state('');
	let role = $state<UserRole>('buyer');
	let error = $state('');
	let loading = $state(false);

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	const authService = new AuthService(supabase);

	async function handleSignUp() {
		error = '';
		loading = true;

		try {
			await authService.signUp({ email, password, fullName, role });
			// Redirect based on role
			if (role === 'seller') {
				goto('/seller/dashboard');
			} else {
				goto('/');
			}
		} catch (e: any) {
			error = e.message || 'Failed to sign up';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200">
	<div class="card w-96 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-2xl font-bold mb-4">Sign Up</h2>

			{#if error}
				<div class="alert alert-error mb-4">
					<span>{error}</span>
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleSignUp(); }}>
				<div class="form-control mb-4">
					<label class="label" for="fullName">
						<span class="label-text">Full Name</span>
					</label>
					<input
						id="fullName"
						type="text"
						placeholder="John Doe"
						class="input input-bordered"
						bind:value={fullName}
						required
					/>
				</div>

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

				<div class="form-control mb-4">
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
						minlength="6"
					/>
				</div>

				<div class="form-control mb-6">
					<label class="label" for="role">
						<span class="label-text">I am a</span>
					</label>
					<select id="role" class="select select-bordered" bind:value={role}>
						<option value="buyer">Buyer (Startup)</option>
						<option value="seller">Seller (Service Provider)</option>
					</select>
				</div>

				<div class="form-control">
					<button type="submit" class="btn btn-primary" disabled={loading}>
						{loading ? 'Creating account...' : 'Sign Up'}
					</button>
				</div>
			</form>

			<div class="divider">OR</div>

			<div class="text-center">
				<p class="text-sm">
					Already have an account?
					<a href="/auth/signin" class="link link-primary">Sign in</a>
				</p>
			</div>
		</div>
	</div>
</div>
