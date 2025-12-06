<script lang="ts">
	import { goto } from '$app/navigation';
	import ComparisonTable from '$lib/components/ComparisonTable.svelte';
	import { comparisonStore } from '$lib/stores/comparison';
	import type { ProductWithRating } from '$lib/helpers/types';

	// Subscribe to comparison store
	let products = $derived($comparisonStore.products);

	function handleRemove(productId: string) {
		comparisonStore.remove(productId);
	}

	function handleAddToCart(productId: string) {
		// Navigate to product detail page or add to cart directly
		goto(`/products/${productId}`);
	}

	function handleViewDetails(productId: string) {
		goto(`/products/${productId}`);
	}

	function handleBrowseMarketplace() {
		goto('/marketplace');
	}

	function handleClearComparison() {
		comparisonStore.clear();
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Page Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Compare Products</h1>
		<p class="text-base-content/70">
			Compare up to 3 products side-by-side to find the best fit for your needs
		</p>
	</div>

	<!-- Comparison Table -->
	<ComparisonTable
		{products}
		comparisonMetrics={[
			'price',
			'overall_score',
			'fit_score',
			'feature_score',
			'integration_score',
			'review_score',
			'average_rating',
			'review_count'
		]}
		onremove={handleRemove}
		onaddtocart={handleAddToCart}
		onviewdetails={handleViewDetails}
		onaddproduct={handleBrowseMarketplace}
	/>

	<!-- Clear Comparison Button -->
	{#if products && products.length > 0}
		<div class="mt-8 text-center">
			<button class="btn btn-outline" onclick={handleClearComparison}>
				Clear Comparison
			</button>
		</div>
	{/if}

	<!-- Info Box -->
	{#if products && products.length > 0 && products.length < 3}
		<div class="alert alert-info mt-8">
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
				You can compare up to 3 products. You currently have {products.length}
				{products.length === 1 ? 'product' : 'products'} selected.
			</span>
		</div>
	{/if}
</div>
