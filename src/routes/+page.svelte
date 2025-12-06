<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating } from '$app/stores';
	import ProductRow from '$lib/components/ProductRow.svelte';
	import ProductRowSkeleton from '$lib/components/ProductRowSkeleton.svelte';
	import type { PageData } from './$types';
	import type { ProductWithRating } from '$lib/helpers/types';

	let { data }: { data: PageData } = $props();

	// Check if we're navigating (loading new data)
	let isLoading = $derived($navigating !== null);

	function handleProductClick(product: ProductWithRating) {
		goto(`/products/${product.id}`);
	}

	function handleViewAllNew() {
		goto('/marketplace?filter=new');
	}

	function handleViewAllFeatured() {
		goto('/marketplace?filter=featured');
	}

	function handleViewAllRecommended() {
		goto('/marketplace');
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Hero Section -->
	<div class="hero min-h-[40vh] bg-base-200 rounded-lg mb-12">
		<div class="hero-content text-center">
			<div class="max-w-2xl">
				<h1 class="text-5xl font-bold mb-4">The Marketplace for Startup Services</h1>
				<p class="text-xl mb-6">
					Discover, compare, and purchase the best business services for your startup
				</p>
				<button class="btn btn-primary btn-lg" onclick={() => goto('/marketplace')}>
					Browse Marketplace
				</button>
			</div>
		</div>
	</div>

	{#if isLoading}
		<!-- Loading State -->
		<ProductRowSkeleton title="New & Notable" />
		<ProductRowSkeleton title="Featured Services" />
		<ProductRowSkeleton title="Trending Now" />
	{:else}
		<!-- New Products Row -->
		{#if data.newProducts && data.newProducts.length > 0}
			<ProductRow
				title="New & Notable"
				products={data.newProducts}
				showMoreLink="/marketplace?filter=new"
				onproductclick={handleProductClick}
				onshowmore={handleViewAllNew}
			/>
		{/if}

		<!-- Featured Products Row -->
		{#if data.featuredProducts && data.featuredProducts.length > 0}
			<ProductRow
				title="Featured Services"
				products={data.featuredProducts}
				showMoreLink="/marketplace?filter=featured"
				onproductclick={handleProductClick}
				onshowmore={handleViewAllFeatured}
			/>
		{/if}

		<!-- Recommended Products Row -->
		{#if data.recommendedProducts && data.recommendedProducts.length > 0}
			<ProductRow
				title={data.isAuthenticated ? 'Recommended for You' : 'Trending Now'}
				products={data.recommendedProducts}
				showMoreLink="/marketplace"
				onproductclick={handleProductClick}
				onshowmore={handleViewAllRecommended}
			/>
		{/if}
	{/if}

	<!-- Empty State -->
	{#if (!data.newProducts || data.newProducts.length === 0) && (!data.featuredProducts || data.featuredProducts.length === 0) && (!data.recommendedProducts || data.recommendedProducts.length === 0)}
		<div class="text-center py-16">
			<h2 class="text-2xl font-bold mb-4">No products available yet</h2>
			<p class="text-base-content/70 mb-6">Check back soon for new services!</p>
		</div>
	{/if}
</div>