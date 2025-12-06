<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let isProcessing = $state(false);
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Page Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Checkout</h1>
		<p class="text-base-content/70">Complete your demo purchase</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Order Summary -->
		<div class="lg:col-span-2">
			<div class="card bg-base-200">
				<div class="card-body">
					<h2 class="card-title mb-4">Order Summary</h2>

					<!-- Order Items -->
					<div class="space-y-4">
						{#each data.items as item (item.id)}
							<div class="flex items-center gap-4 p-4 bg-base-100 rounded-lg">
								{#if item.product.demo_visual_url}
									<img
										src={item.product.demo_visual_url}
										alt={item.product.name}
										class="w-20 h-20 object-cover rounded"
									/>
								{:else}
									<div class="w-20 h-20 bg-base-300 rounded flex items-center justify-center">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-10 w-10 text-base-content/30"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
									</div>
								{/if}

								<div class="flex-1">
									<h3 class="font-semibold">{item.product.name}</h3>
									<p class="text-sm text-base-content/70">
										Quantity: {item.quantity}
									</p>
								</div>

								<div class="text-right">
									<p class="font-semibold">
										${((item.product.price_cents * item.quantity) / 100).toFixed(2)}
									</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Demo Transaction Notice -->
			<div class="alert alert-info mt-6">
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
				<span>
					This is a demo transaction. No actual payment will be processed. You will receive
					immediate access to download links after checkout.
				</span>
			</div>
		</div>

		<!-- Payment Summary -->
		<div class="lg:col-span-1">
			<div class="card bg-base-200 sticky top-4">
				<div class="card-body">
					<h2 class="card-title mb-4">Payment Summary</h2>

					<div class="space-y-2">
						<div class="flex justify-between">
							<span>Subtotal</span>
							<span>${(data.total / 100).toFixed(2)}</span>
						</div>
						<div class="flex justify-between">
							<span>Tax</span>
							<span>$0.00</span>
						</div>
						<div class="divider my-2"></div>
						<div class="flex justify-between text-lg font-bold">
							<span>Total</span>
							<span>${(data.total / 100).toFixed(2)}</span>
						</div>
					</div>

					<!-- Checkout Form -->
					<form method="POST" use:enhance={() => {
						isProcessing = true;
						return async ({ update }) => {
							await update();
							isProcessing = false;
						};
					}} class="mt-6">
						<button
							type="submit"
							class="btn btn-primary btn-block btn-lg"
							disabled={isProcessing}
						>
							{#if isProcessing}
								<span class="loading loading-spinner"></span>
								Processing...
							{:else}
								Complete Demo Purchase
							{/if}
						</button>
					</form>

					<p class="text-xs text-center text-base-content/70 mt-4">
						By completing this purchase, you agree to our terms of service and privacy policy.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
