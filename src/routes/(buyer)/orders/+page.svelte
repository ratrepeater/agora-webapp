<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Format price from cents to dollars
	function formatPrice(cents: number): string {
		return `$${(cents / 100).toFixed(2)}`;
	}

	// Format date
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Handle download via API
	async function handleDownload(productId: string, orderId: string, productName: string) {
		try {
			const response = await fetch('/api/downloads', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productId, orderId })
			});

			if (response.ok) {
				const { downloadUrl } = await response.json();
				window.open(downloadUrl, '_blank');
			} else {
				throw new Error('Download failed');
			}
		} catch (error) {
			console.error('Download failed:', error);
			alert(`Failed to download ${productName}. Please try again or contact support.`);
		}
	}
</script>

<div class="container mx-auto p-4 max-w-6xl">
	<h1 class="text-3xl font-bold mb-6">My Orders</h1>

	{#if data.orders.length === 0}
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body text-center">
				<h2 class="card-title justify-center">No Orders Yet</h2>
				<p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
				<div class="card-actions justify-center mt-4">
					<a href="/marketplace" class="btn btn-primary">Browse Products</a>
				</div>
			</div>
		</div>
	{:else}
		<div class="space-y-6">
			{#each data.orders as order}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<!-- Order Header -->
						<div class="flex justify-between items-start mb-4">
							<div>
								<h2 class="card-title">Order #{order.id.slice(0, 8)}</h2>
								<p class="text-sm text-gray-600">
									Placed on {formatDate(order.created_at)}
								</p>
								{#if order.demo}
									<span class="badge badge-info badge-sm mt-1">Demo Order</span>
								{/if}
							</div>
							<div class="text-right">
								<p class="text-2xl font-bold">{formatPrice(order.demo_total_cents)}</p>
								<p class="text-sm text-gray-600">Total</p>
							</div>
						</div>

						<!-- Order Items -->
						<div class="divider my-2"></div>
						<div class="space-y-4">
							{#each order.items as item}
								<div class="flex items-center gap-4 p-4 bg-base-200 rounded-lg">
									<!-- Product Image -->
									{#if item.product.logo_url}
										<img
											src={item.product.logo_url}
											alt={item.product.name}
											class="w-16 h-16 object-cover rounded"
										/>
									{:else}
										<div class="w-16 h-16 bg-base-300 rounded flex items-center justify-center">
											<span class="text-2xl">📦</span>
										</div>
									{/if}

									<!-- Product Info -->
									<div class="flex-1">
										<h3 class="font-semibold">{item.product.name}</h3>
										<p class="text-sm text-gray-600">{item.product.short_description}</p>
										<div class="flex gap-4 mt-2 text-sm">
											<span>Quantity: {item.quantity}</span>
											<span>Price: {formatPrice(item.unit_price_cents)}</span>
											<span class="font-semibold">
												Subtotal: {formatPrice(item.subtotal_cents)}
											</span>
										</div>
									</div>

									<!-- Download Button -->
									<div class="flex flex-col gap-2">
										<button
											class="btn btn-primary btn-sm"
											onclick={() => handleDownload(item.product_id, order.id, item.product.name)}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
												/>
											</svg>
											Download
										</button>
										<a
											href="/products/{item.product_id}"
											class="btn btn-ghost btn-sm"
										>
											View Product
										</a>
									</div>
								</div>
							{/each}
						</div>

						<!-- Order Status -->
						<div class="divider my-2"></div>
						<div class="flex justify-between items-center">
							<div>
								<span class="badge badge-success">
									{order.status === 'completed' ? 'Completed' : order.status}
								</span>
							</div>
							<div class="text-sm text-gray-600">
								{order.items.length} {order.items.length === 1 ? 'item' : 'items'}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
