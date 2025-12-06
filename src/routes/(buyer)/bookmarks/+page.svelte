<script lang="ts">
	import { goto } from '$app/navigation';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import { comparisonStore } from '$lib/stores/comparison';
	import type { PageData } from './$types';
	import type { ProductWithRating } from '$lib/helpers/types';

	let { data }: { data: PageData } = $props();

	let bookmarks = $state(data.bookmarks || []);
	
	// Track compared products
	let comparedProducts = $state<Set<string>>(new Set());

	// Subscribe to comparison store to track compared products
	$effect(() => {
		const unsubscribe = comparisonStore.subscribe((state) => {
			comparedProducts = new Set(state.products.map(p => p.id));
		});
		return unsubscribe;
	});
	
	// Track cart quantities - map of productId to quantity, initialize from server data
	let cartQuantities = $state<Map<string, number>>(
		new Map(Object.entries(data.cartQuantities || {}).map(([k, v]) => [k, v as number]))
	);

	function handleProductClick(product: ProductWithRating) {
		goto(`/products/${product.id}`);
	}

	async function handleRemoveBookmark(productId: string) {
		try {
			const response = await fetch('/api/bookmarks', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productId })
			});

			if (response.ok) {
				// Remove from local state
				bookmarks = bookmarks.filter((b) => b.product.id !== productId);
			} else {
				console.error('Failed to remove bookmark');
			}
		} catch (error) {
			console.error('Failed to remove bookmark:', error);
		}
	}

	async function handleAddToCart(productId: string) {
		try {
			const response = await fetch('/api/cart', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productId, quantity: 1 })
			});

			if (!response.ok) {
				throw new Error('Failed to add to cart');
			}

			// Update local cart quantity
			const currentQty = cartQuantities.get(productId) || 0;
			const newQty = currentQty + 1;
			cartQuantities.set(productId, newQty);
			cartQuantities = new Map(cartQuantities); // Create new Map to trigger reactivity
		} catch (error) {
			console.error('Add to cart error:', error);
			alert('Failed to add to cart. Please try again.');
		}
	}

	async function handleUpdateCartQuantity(productId: string, newQuantity: number) {
		const currentQty = cartQuantities.get(productId) || 0;
		const diff = newQuantity - currentQty;

		// Update local state optimistically FIRST for instant UI feedback
		if (newQuantity > 0) {
			cartQuantities.set(productId, newQuantity);
		} else {
			cartQuantities.delete(productId);
		}
		cartQuantities = new Map(cartQuantities); // Create new Map to trigger reactivity

		try {
			if (diff > 0) {
				// Add more
				const response = await fetch('/api/cart', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ productId, quantity: diff })
				});

				if (!response.ok) {
					throw new Error('Failed to update cart');
				}
			} else if (diff < 0) {
				// Remove items
				const response = await fetch('/api/cart/product', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ productId, quantity: Math.abs(diff) })
				});

				if (!response.ok) {
					throw new Error('Failed to update cart');
				}
			}
		} catch (error) {
			console.error('Update cart error:', error);
			// Revert optimistic update on error
			if (currentQty > 0) {
				cartQuantities.set(productId, currentQty);
			} else {
				cartQuantities.delete(productId);
			}
			cartQuantities = new Map(cartQuantities);
			alert('Failed to update cart. Please try again.');
		}
	}

	function handleBrowseMarketplace() {
		goto('/marketplace');
	}

	function handleCompare(product: ProductWithRating) {
		// Check if product is already being compared
		if (comparedProducts.has(product.id)) {
			// Remove from comparison
			comparisonStore.remove(product.id);
		} else {
			// Try to add to comparison
			const result = comparisonStore.add(product);
			if (result === 'added') {
				goto('/compare');
			} else if (result === 'full') {
				alert('You can only compare up to 3 products at a time. Remove a product from the comparison to add a new one.');
			}
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Page Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">My Bookmarks</h1>
		<p class="text-base-content/70">Products you've saved for later</p>
	</div>

	{#if bookmarks && bookmarks.length > 0}
		<div class="mb-4 text-sm text-base-content/70">
			{bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
		</div>

		<!-- Bookmarked Products Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
			{#each bookmarks.filter(b => b.product?.id) as bookmark (bookmark.product.id)}
				{@const isCompared = comparedProducts.has(bookmark.product.id)}
				{@const cartQuantity = cartQuantities.get(bookmark.product.id) || 0}
				<div class="relative">
					<ProductCard
						product={bookmark.product}
						variant="grid"
						showBookmarkButton={false}
						{isCompared}
						{cartQuantity}
						onclick={() => handleProductClick(bookmark.product)}
						oncompare={() => handleCompare(bookmark.product)}
						onaddtocart={() => handleAddToCart(bookmark.product.id)}
						onupdatecartquantity={(qty) => handleUpdateCartQuantity(bookmark.product.id, qty)}
					/>
					<!-- Remove Bookmark Button -->
					<button
						class="btn btn-sm btn-circle btn-error absolute top-2 right-2 z-10"
						onclick={(e) => {
							e.stopPropagation();
							handleRemoveBookmark(bookmark.product.id);
						}}
						aria-label="Remove bookmark"
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
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Empty State -->
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
					d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
				/>
			</svg>
			<h2 class="text-2xl font-bold mb-2">No bookmarks yet</h2>
			<p class="text-base-content/70 mb-6">
				Start bookmarking products you're interested in to save them for later.
			</p>
			<button class="btn btn-primary" onclick={handleBrowseMarketplace}>
				Browse Marketplace
			</button>
		</div>
	{/if}
</div>
