<script lang="ts">
	import type { CartItemWithProduct } from '$lib/helpers/types';

	interface Props {
		items: CartItemWithProduct[];
		total: number;
		onremoveitem?: (itemId: string) => void;
		onupdatequantity?: (itemId: string, quantity: number) => void;
		oncheckout?: () => void;
		onclearcart?: () => void;
	}

	let {
		items,
		total,
		onremoveitem,
		onupdatequantity,
		oncheckout,
		onclearcart
	}: Props = $props();

	function handleRemoveItem(itemId: string) {
		onremoveitem?.(itemId);
	}

	function handleUpdateQuantity(itemId: string, quantity: number) {
		if (quantity > 0) {
			onupdatequantity?.(itemId, quantity);
		}
	}

	function handleCheckout() {
		oncheckout?.();
	}

	function handleClearCart() {
		onclearcart?.();
	}
</script>

<div class="w-full max-w-4xl mx-auto">
	<!-- Cart Header -->
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-3xl font-bold">Shopping Cart</h2>
		{#if items.length > 0}
			<button class="btn btn-sm btn-ghost" onclick={handleClearCart}>
				Clear Cart
			</button>
		{/if}
	</div>

	{#if items.length === 0}
		<!-- Empty Cart State -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body items-center text-center py-16">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-24 w-24 text-base-content/30 mb-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
				<h3 class="text-2xl font-bold mb-2">Your cart is empty</h3>
				<p class="text-base-content/70 mb-6">
					Add some products to your cart to get started
				</p>
				<a href="/marketplace" class="btn btn-primary">
					Browse Products
				</a>
			</div>
		</div>
	{:else}
		<!-- Cart Items -->
		<div class="space-y-4 mb-6">
			{#each items as item (item.id)}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body p-4">
						<div class="flex gap-4">
							<!-- Product Image -->
							<div class="flex-shrink-0">
								{#if item.product.demo_visual_url}
									<img
										src={item.product.demo_visual_url}
										alt={item.product.name}
										class="w-24 h-24 object-cover rounded-lg"
									/>
								{:else}
									<div class="w-24 h-24 bg-base-200 rounded-lg flex items-center justify-center">
										<span class="text-4xl">📦</span>
									</div>
								{/if}
							</div>

							<!-- Product Details -->
							<div class="flex-1 min-w-0">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<h3 class="text-lg font-bold mb-1">{item.product.name}</h3>
										<p class="text-sm text-base-content/70 line-clamp-2 mb-2">
											{item.product.short_description}
										</p>
										<div class="flex items-center gap-2">
											<span class="text-xl font-bold text-primary">
												${item.product.price.toFixed(2)}
											</span>
											<span class="text-sm text-base-content/60">/month</span>
										</div>
									</div>

									<!-- Remove Button -->
									<button
										class="btn btn-sm btn-ghost btn-circle"
										onclick={() => handleRemoveItem(item.id)}
										aria-label="Remove {item.product.name} from cart"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>

								<!-- Quantity Controls -->
								<div class="flex items-center gap-3 mt-4">
									<span class="text-sm font-medium">Quantity:</span>
									<div class="join">
										<button
											class="btn btn-sm join-item"
											onclick={() => handleUpdateQuantity(item.id, (item.quantity || 1) - 1)}
											disabled={(item.quantity || 1) <= 1}
											aria-label="Decrease quantity"
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
													d="M20 12H4"
												/>
											</svg>
										</button>
										<input
											type="number"
											class="input input-sm join-item w-16 text-center"
											value={item.quantity || 1}
											min="1"
											onchange={(e) => {
												const value = parseInt(e.currentTarget.value);
												if (!isNaN(value) && value > 0) {
													handleUpdateQuantity(item.id, value);
												}
											}}
											aria-label="Quantity"
										/>
										<button
											class="btn btn-sm join-item"
											onclick={() => handleUpdateQuantity(item.id, (item.quantity || 1) + 1)}
											aria-label="Increase quantity"
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
													d="M12 4v16m8-8H4"
												/>
											</svg>
										</button>
									</div>
									<span class="text-sm text-base-content/70 ml-auto">
										Subtotal: <span class="font-bold"
											>${(item.product.price * (item.quantity || 1)).toFixed(2)}</span
										>
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Cart Summary -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="text-xl font-bold mb-4">Order Summary</h3>

				<div class="space-y-2 mb-4">
					<div class="flex justify-between text-base-content/70">
						<span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
						<span>${total.toFixed(2)}</span>
					</div>
					<div class="flex justify-between text-base-content/70">
						<span>Tax</span>
						<span>$0.00</span>
					</div>
					<div class="divider my-2"></div>
					<div class="flex justify-between text-xl font-bold">
						<span>Total</span>
						<span class="text-primary">${total.toFixed(2)}</span>
					</div>
				</div>

				<button class="btn btn-primary btn-block" onclick={handleCheckout}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
						/>
					</svg>
					Proceed to Checkout
				</button>

				<p class="text-xs text-center text-base-content/60 mt-4">
					This is a demo transaction with zero charge
				</p>
			</div>
		</div>
	{/if}
</div>
