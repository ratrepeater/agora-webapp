<script lang="ts">
	import { createBrowserClient } from '$lib/helpers/supabase';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	let email = $state('test@example.com');
	let password = $state('password123');
	let fullName = $state('Test User');
	let result = $state('');
	let loading = $state(false);

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	async function testSignUp() {
		loading = true;
		result = 'Testing signup...';

		try {
			// Test 1: Check Supabase connection
			const { data: healthCheck, error: healthError } = await supabase
				.from('profiles')
				.select('count')
				.limit(1);

			if (healthError) {
				result = `❌ Connection Error: ${healthError.message}`;
				loading = false;
				return;
			}

			result += '\n✅ Supabase connection OK';

			// Test 2: Try to sign up
			const { data: authData, error: authError } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						full_name: fullName
					}
				}
			});

			if (authError) {
				result += `\n❌ Signup Error: ${authError.message}`;
				result += `\n   Status: ${authError.status}`;
				result += `\n   Code: ${authError.code || 'N/A'}`;
				loading = false;
				return;
			}

			result += '\n✅ Signup successful!';
			result += `\n   User ID: ${authData.user?.id}`;
			result += `\n   Email: ${authData.user?.email}`;
			result += `\n   Confirmed: ${authData.user?.email_confirmed_at ? 'Yes' : 'No'}`;
			result += `\n   Session: ${authData.session ? 'Created' : 'Pending confirmation'}`;

			// Test 3: Check if profile was created
			if (authData.user) {
				await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for trigger

				const { data: profile, error: profileError } = await supabase
					.from('profiles')
					.select('*')
					.eq('id', authData.user.id)
					.single();

				if (profileError) {
					result += `\n⚠️ Profile check error: ${profileError.message}`;
				} else if (profile) {
					result += '\n✅ Profile created!';
					result += `\n   Name: ${profile.full_name}`;
					result += `\n   Buyer: ${profile.role_buyer}`;
					result += `\n   Seller: ${profile.role_seller}`;
				} else {
					result += '\n❌ Profile NOT created (trigger may not have fired)';
				}
			}
		} catch (e: any) {
			result += `\n❌ Unexpected error: ${e.message}`;
		} finally {
			loading = false;
		}
	}

	async function testSignIn() {
		loading = true;
		result = 'Testing sign in...';

		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (error) {
				result = `❌ Sign In Error: ${error.message}`;
				loading = false;
				return;
			}

			result = '✅ Sign in successful!';
			result += `\n   User ID: ${data.user?.id}`;
			result += `\n   Email: ${data.user?.email}`;
			result += `\n   Session: ${data.session ? 'Active' : 'None'}`;

			// Check profile
			if (data.user) {
				const { data: profile, error: profileError } = await supabase
					.from('profiles')
					.select('*')
					.eq('id', data.user.id)
					.single();

				if (profileError) {
					result += `\n⚠️ Profile error: ${profileError.message}`;
				} else if (profile) {
					result += '\n✅ Profile exists!';
					result += `\n   Name: ${profile.full_name}`;
					result += `\n   Buyer: ${profile.role_buyer}`;
					result += `\n   Seller: ${profile.role_seller}`;
				} else {
					result += '\n❌ No profile found';
				}
			}
		} catch (e: any) {
			result += `\n❌ Unexpected error: ${e.message}`;
		} finally {
			loading = false;
		}
	}

	async function checkSession() {
		loading = true;
		result = 'Checking current session...';

		try {
			const {
				data: { session },
				error
			} = await supabase.auth.getSession();

			if (error) {
				result = `❌ Session Error: ${error.message}`;
				loading = false;
				return;
			}

			if (!session) {
				result = '❌ No active session';
				loading = false;
				return;
			}

			result = '✅ Active session found!';
			result += `\n   User ID: ${session.user.id}`;
			result += `\n   Email: ${session.user.email}`;
			result += `\n   Expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`;

			// Check profile
			const { data: profile, error: profileError } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', session.user.id)
				.single();

			if (profileError) {
				result += `\n⚠️ Profile error: ${profileError.message}`;
			} else if (profile) {
				result += '\n✅ Profile exists!';
				result += `\n   Name: ${profile.full_name}`;
				result += `\n   Buyer: ${profile.role_buyer}`;
				result += `\n   Seller: ${profile.role_seller}`;
			} else {
				result += '\n❌ No profile found';
			}
		} catch (e: any) {
			result += `\n❌ Unexpected error: ${e.message}`;
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="card bg-base-100 shadow-xl max-w-2xl mx-auto">
		<div class="card-body">
			<h2 class="card-title text-2xl">Authentication Debug Tool</h2>
			<p class="text-sm text-base-content/70">Test signup, signin, and profile creation</p>

			<div class="divider"></div>

			<div class="form-control">
				<label class="label">
					<span class="label-text">Full Name</span>
				</label>
				<input type="text" class="input input-bordered" bind:value={fullName} />
			</div>

			<div class="form-control">
				<label class="label">
					<span class="label-text">Email</span>
				</label>
				<input type="email" class="input input-bordered" bind:value={email} />
			</div>

			<div class="form-control">
				<label class="label">
					<span class="label-text">Password</span>
				</label>
				<input type="password" class="input input-bordered" bind:value={password} />
			</div>

			<div class="divider"></div>

			<div class="flex gap-2 flex-wrap">
				<button class="btn btn-primary" onclick={testSignUp} disabled={loading}>
					{loading ? 'Testing...' : 'Test Sign Up'}
				</button>
				<button class="btn btn-secondary" onclick={testSignIn} disabled={loading}>
					{loading ? 'Testing...' : 'Test Sign In'}
				</button>
				<button class="btn btn-accent" onclick={checkSession} disabled={loading}>
					{loading ? 'Checking...' : 'Check Session'}
				</button>
			</div>

			{#if result}
				<div class="divider"></div>
				<div class="mockup-code">
					<pre><code>{result}</code></pre>
				</div>
			{/if}

			<div class="divider"></div>

			<div class="alert alert-info">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="stroke-current shrink-0 w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<div class="text-sm">
					<p><strong>Instructions:</strong></p>
					<ul class="list-disc list-inside mt-2">
						<li>Use a unique email for each test</li>
						<li>Check the output for detailed error messages</li>
						<li>If signup succeeds but no profile, trigger isn't working</li>
						<li>If signup fails, check Supabase settings</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>
