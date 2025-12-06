<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto px-4 py-8">
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-2xl">Auth Debug Info</h2>

			<div class="divider"></div>

			<h3 class="font-bold text-lg">Session</h3>
			{#if data.session}
				<div class="bg-base-200 p-4 rounded-lg">
					<p><strong>User ID:</strong> {data.session.user.id}</p>
					<p><strong>Email:</strong> {data.session.user.email}</p>
					<p><strong>Created:</strong> {new Date(data.session.user.created_at).toLocaleString()}</p>
				</div>
			{:else}
				<div class="alert alert-warning">
					<span>No active session</span>
				</div>
			{/if}

			<div class="divider"></div>

			<h3 class="font-bold text-lg">User Role</h3>
			{#if data.userRole}
				<div class="badge badge-primary badge-lg">{data.userRole}</div>
			{:else}
				<div class="alert alert-warning">
					<span>No role assigned</span>
				</div>
			{/if}

			<div class="divider"></div>

			<h3 class="font-bold text-lg">Profile</h3>
			{#if data.profile}
				<div class="bg-base-200 p-4 rounded-lg">
					<p><strong>ID:</strong> {data.profile.id}</p>
					<p><strong>Full Name:</strong> {data.profile.full_name || 'Not set'}</p>
					<p><strong>Company:</strong> {data.profile.company_name || 'Not set'}</p>
					<p><strong>Buyer Role:</strong> {data.profile.role_buyer ? '✅' : '❌'}</p>
					<p><strong>Seller Role:</strong> {data.profile.role_seller ? '✅' : '❌'}</p>
				</div>
			{:else}
				<div class="alert alert-error">
					<span>⚠️ No profile found! This is the issue.</span>
				</div>
			{/if}

			<div class="divider"></div>

			<div class="flex gap-2">
				<a href="/" class="btn btn-primary">Go Home</a>
				<a href="/auth/signin" class="btn btn-outline">Sign In</a>
				<a href="/auth/signup" class="btn btn-outline">Sign Up</a>
			</div>
		</div>
	</div>
</div>
