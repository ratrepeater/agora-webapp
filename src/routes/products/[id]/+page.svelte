<script lang="ts">
	import { goto } from '$app/navigation';
	import ProductDetailView from '$lib/components/ProductDetailView.svelte';
	import ProductRow from '$lib/components/ProductRow.svelte';
	import type { PageData } from './$types';
	import type { ProductWithRating } from '$lib/helpers/types';
	import { comparisonStore } from '$lib/stores/comparison';

	let { data }: { data: PageData } = $props();

	let isBookmarked = $state(data.isBookmarked);
	let isInCart = $state(data.isInCart);
	
	// Track if product is in comparison
	let isCompared = $state(false);

	// Subscribe to comparison store
	$effect(() => {
		const unsubscribe = comparisonStore.subscribe((state) => {
			isCompared = data.product ? state.products.some(p => p.id === data.product.id) : false;
		});
		return unsubscribe;
	});

	async function handleCompare() {
		if (data.product) {
			// Check if product is already being compared
			if (isCompared) {
				// Remove from comparison
				comparisonStore.remove(data.product.id);
			} else {
				// Try to add to comparison
				const result = comparisonStore.add(data.product);
				if (result === 'added') {
					goto('/compare');
				} else if (result === 'full') {
					alert('You can only compare up to 3 products at a time. Remove a product from the comparison to add a new one.');
				}
			}
		}
	}

	async function handleBookmark() {
		if (!data.isAuthenticated) {
			goto('/auth/signin');
			return;
		}

		try {
			if (data.product) {
				const response = await fetch('/api/bookmarks', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ productId: data.product.id })
				});

				if (response.ok) {
					const result = await response.json();
					isBookmarked = result.bookmarked;
				}
			}
		} catch (error) {
			console.error('Failed to toggle bookmark:', error);
		}
	}

	async function handleAddToCart() {
		if (!data.isAuthenticated) {
			goto('/auth/signin');
			return;
		}

		try {
			if (data.product) {
				const response = await fetch('/api/cart', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ productId: data.product.id, quantity: 1 })
				});

				if (response.ok) {
					isInCart = true;
				}
			}
		} catch (error) {
			console.error('Failed to add to cart:', error);
		}
	}

	function handleSimilarProductClick(product: ProductWithRating) {
		goto(`/products/${product.id}`);
	}
</script>

<div class="container mx-auto px-4 py-8">
	{#if data.product}
		<ProductDetailView
			product={data.product}
			features={data.features}
			reviews={data.reviews}
			averageRating={data.averageRating}
			{isBookmarked}
			{isCompared}
			{isInCart}
			oncompare={handleCompare}
			onbookmark={handleBookmark}
			onaddtocart={handleAddToCart}
		/>

		<!-- Similar Products Section -->
		{#if data.similarProducts && data.similarProducts.length > 0}
			<div class="mt-16">
				<ProductRow
					title="Similar Products"
					products={data.similarProducts}
					onproductclick={handleSimilarProductClick}
				/>
			</div>
		{/if}
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
