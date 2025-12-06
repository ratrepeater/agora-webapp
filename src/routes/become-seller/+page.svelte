<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let companyName = $state('');
	let loading = $state(false);
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200 px-4">
	<div class="card w-full max-w-2xl bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-3xl font-bold mb-2">Become a Seller</h2>
			<p class="text-base-content/70 mb-6">
				Start selling your services on the Agora Marketplace
			</p>

			{#if form?.error}
				<div class="alert alert-error mb-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="stroke-current shrink-0 h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>{form.error}</span>
				</div>
			{/if}

			<!-- Benefits Section -->
			<div class="bg-base-200 rounded-lg p-6 mb-6">
				<h3 class="font-bold text-lg mb-4">Seller Benefits</h3>
				<ul class="space-y-3">
					<li class="flex items-start gap-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-success flex-shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<div>
							<strong>Reach Startups:</strong> Connect with startups looking for your services
						</div>
					</li>
					<li class="flex items-start gap-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-success flex-shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<div>
							<strong>Manage Products:</strong> List and manage your service offerings
						</div>
					</li>
					<li class="flex items-start gap-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-success flex-shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<div>
							<strong>Analytics:</strong> Track views, engagement, and competitor insights
						</div>
					</li>
					<li class="flex items-start gap-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-success flex-shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<div>
							<strong>Quote Requests:</strong> Receive and respond to custom quote requests
						</div>
					</li>
				</ul>
			</div>

			<form method="POST" use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}>
				<div class="form-control mb-6">
					<label class="label" for="companyName">
						<span class="label-text">Company Name (Optional)</span>
					</label>
					<input
						id="companyName"
						name="companyName"
						type="text"
						placeholder="Your Company Inc."
						class="input input-bordered"
						bind:value={companyName}
					/>
					<label class="label">
						<span class="label-text-alt">You can update this later in your profile</span>
					</label>
				</div>

				<div class="form-control">
					<button type="submit" class="btn btn-primary btn-lg" disabled={loading}>
						{#if loading}
							<span class="loading loading-spinner"></span>
							Activating Seller Account...
						{:else}
							Become a Seller
						{/if}
					</button>
				</div>
			</form>

			<div class="divider"></div>

			<div class="text-center">
				<p class="text-sm text-base-content/70">
					Not ready yet?
					<a href="/" class="link link-primary">Continue as a buyer</a>
				</p>
			</div>
		</div>
	</div>
</div>
