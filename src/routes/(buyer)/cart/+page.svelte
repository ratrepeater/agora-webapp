<script lang="ts">
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import CartSummary from '$lib/components/CartSummary.svelte';
	import BundleSuggestion from '$lib/components/BundleSuggestion.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function handleCheckout() {
		if (!data.session?.user) {
			goto('/auth/signin');
			return;
		}
		goto('/cart/checkout');
	}

	function handleContinueShopping() {
		goto('/marketplace');
	}

	async function handleRemoveItem(itemId: string) {
		try {
			const response = await fetch('/api/cart', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ itemId })
			});

			if (response.ok) {
				// Refresh the page data
				await invalidateAll();
			} else {
				throw new Error('Failed to remove item');
			}
		} catch (error) {
			console.error('Remove item error:', error);
			alert('Failed to remove item. Please try again.');
		}
	}

	async function handleUpdateQuantity(itemId: string, quantity: number) {
		try {
			const response = await fetch('/api/cart', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ itemId, quantity })
			});

			if (response.ok) {
				// Refresh the page data
				await invalidateAll();
			} else {
				throw new Error('Failed to update quantity');
			}
		} catch (error) {
			console.error('Update quantity error:', error);
			alert('Failed to update quantity. Please try again.');
		}
	}

	async function handleClearCart() {
		if (!confirm('Are you sure you want to clear your cart?')) {
			return;
		}

		try {
			const response = await fetch('/api/cart', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ clearAll: true })
			});

			if (response.ok) {
				// Refresh the page data
				await invalidateAll();
			} else {
				throw new Error('Failed to clear cart');
			}
		} catch (error) {
			console.error('Clear cart error:', error);
			alert('Failed to clear cart. Please try again.');
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Page Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Shopping Cart</h1>
		<p class="text-base-content/70">Review your items before checkout</p>
	</div>

	{#if data.items && data.items.length > 0}
		<!-- Cart Summary Component -->
		<CartSummary 
			items={data.items} 
			total={data.total} 
			oncheckout={handleCheckout}
			onremoveitem={handleRemoveItem}
			onupdatequantity={handleUpdateQuantity}
			onclearcart={handleClearCart}
		/>

		<!-- Continue Shopping Button -->
		<div class="mt-6 text-center">
			<button class="btn btn-ghost" onclick={handleContinueShopping}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 mr-2"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
				Continue Shopping
			</button>
		</div>

		<!-- Bundle Suggestions -->
		{#if data.suggestedBundles && data.suggestedBundles.length > 0}
			<div class="mt-8">
				<BundleSuggestion bundles={data.suggestedBundles} />
			</div>
		{/if}
	{:else}
		<!-- Empty Cart State -->
		<div class="text-center py-16">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-24 w-24 mx-auto mb-4 text-base-content/30"
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
			<h2 class="text-2xl font-bold mb-2">Your cart is empty</h2>
			<p class="text-base-content/70 mb-6">
				Start adding products to your cart to get started.
			</p>
			<button class="btn btn-primary" onclick={handleContinueShopping}>
				Browse Marketplace
			</button>
		</div>
	{/if}
</div>
