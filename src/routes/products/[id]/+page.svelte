<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ProductDetailView from '$lib/components/ProductDetailView.svelte';
	import ComparisonBar from '$lib/components/ComparisonBar.svelte';
	import type { PageData } from './$types';
	import { comparisonStore } from '$lib/stores/comparison';

	let { data }: { data: PageData } = $props();

	// Local state with optimistic updates
	let isBookmarked = $state(data.isBookmarked);
	let cartQuantity = $state(data.cartQuantity || 0);
	
	// Track if product is in comparison
	let isCompared = $state(false);

	// Update cart quantity when data changes (e.g., navigation)
	$effect(() => {
		cartQuantity = data.cartQuantity || 0;
	});

	// Subscribe to comparison store
	$effect(() => {
		const unsubscribe = comparisonStore.subscribe((state) => {
			if (data.product) {
				// Check all categories for the product
				isCompared = Object.values(state.productsByCategory).some(
					products => products.some(p => p.id === data.product.id)
				);
			}
		});
		return unsubscribe;
	});

	async function handleCompare() {
		if (data.product) {
			if (isCompared) {
				comparisonStore.remove(data.product.id);
			} else {
				const result = comparisonStore.add(data.product);
				if (result === 'full') {
					alert('You can only compare up to 3 products at a time. Remove a product from the comparison to add a new one.');
				}
			}
		}
	}

	async function handleBookmark() {
		if (!data.isAuthenticated) {
			alert('Please sign in to bookmark items.');
			goto('/auth/signin?redirectTo=' + encodeURIComponent($page.url.pathname));
			return;
		}

		if (!data.product) return;

		// Optimistically update UI immediately
		const wasBookmarked = isBookmarked;
		isBookmarked = !isBookmarked;

		try {
			const response = await fetch('/api/bookmarks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productId: data.product.id })
			});

			if (!response.ok) {
				// Revert on error
				isBookmarked = wasBookmarked;
				
				if (response.status === 401) {
					alert('Please sign in to bookmark items.');
					goto('/auth/signin?redirectTo=' + encodeURIComponent($page.url.pathname));
					return;
				}
				
				throw new Error('Failed to bookmark');
			}
		} catch (error) {
			console.error('Bookmark error:', error);
			alert('Failed to bookmark. Please try again.');
		}
	}

	async function handleAddToCart() {
		if (!data.isAuthenticated) {
			alert('Please sign in to add items to the cart.');
			goto('/auth/signin?redirectTo=' + encodeURIComponent($page.url.pathname));
			return;
		}

		if (!data.product) return;

		try {
			const response = await fetch('/api/cart', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productId: data.product.id, quantity: 1 })
			});

			if (!response.ok) {
				if (response.status === 401) {
					alert('Please sign in to add items to the cart.');
					goto('/auth/signin?redirectTo=' + encodeURIComponent($page.url.pathname));
					return;
				}
				throw new Error('Failed to add to cart');
			}

			// Update local cart quantity
			cartQuantity = (cartQuantity || 0) + 1;
		} catch (error) {
			console.error('Add to cart error:', error);
			alert('Failed to add to cart. Please try again.');
		}
	}

	async function handleUpdateCartQuantity(newQuantity: number) {
		if (!data.isAuthenticated || !data.product) return;

		const currentQty = cartQuantity;
		const diff = newQuantity - currentQty;

		// Update local state optimistically FIRST for instant UI feedback
		cartQuantity = newQuantity;

		try {
			if (diff > 0) {
				// Add more
				const response = await fetch('/api/cart', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ productId: data.product.id, quantity: diff })
				});

				if (!response.ok) {
					throw new Error('Failed to update cart');
				}
			} else if (diff < 0) {
				// Remove items
				const response = await fetch('/api/cart/product', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ productId: data.product.id, quantity: Math.abs(diff) })
				});

				if (!response.ok) {
					throw new Error('Failed to update cart');
				}
			}
		} catch (error) {
			console.error('Update cart error:', error);
			// Revert optimistic update on error
			cartQuantity = currentQty;
			alert('Failed to update cart. Please try again.');
		}
	}

</script>

<div class="container mx-auto px-4 py-8">
	{#if data.product}
		<ProductDetailView
			product={data.product}
			features={data.features}
			reviews={data.reviews}
			categoryMetrics={data.categoryMetrics}
			averageRating={data.averageRating}
			{isBookmarked}
			{isCompared}
			{cartQuantity}
			oncompare={handleCompare}
			onbookmark={handleBookmark}
			onaddtocart={handleAddToCart}
			onupdatecartquantity={handleUpdateCartQuantity}
		/>
	{:else}
		<div class="text-center py-16">
			<h2 class="text-2xl font-bold mb-4">Product not found</h2>
			<p class="text-base-content/70 mb-6">The product you're looking for doesn't exist.</p>
			<button class="btn btn-primary" onclick={() => goto('/marketplace')}>
				Browse Marketplace
			</button>
		</div>
	{/if}
</div>

<!-- Comparison Bar -->
<ComparisonBar />
