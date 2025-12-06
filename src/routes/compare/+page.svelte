<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ComparisonTable from '$lib/components/ComparisonTable.svelte';
	import { comparisonStore } from '$lib/stores/comparison';
	import type { ProductWithRating, ProductCategory } from '$lib/helpers/types';

	const categories: ProductCategory[] = ['hr', 'legal', 'marketing', 'devtools'];
	const categoryLabels: Record<ProductCategory, string> = {
		hr: 'HR',
		legal: 'Legal',
		marketing: 'Marketing',
		devtools: 'DevTools'
	};

	// Get category from URL or use active category from store
	let selectedCategory = $state<ProductCategory | null>(null);
	let productsByCategory = $state<Record<ProductCategory, ProductWithRating[]>>({
		hr: [],
		legal: [],
		marketing: [],
		devtools: []
	});
	let products = $state<ProductWithRating[]>([]);

	// Subscribe to comparison store
	$effect(() => {
		const unsubscribe = comparisonStore.subscribe((state) => {
			productsByCategory = state.productsByCategory;
			
			// Get category from URL query param
			const urlCategory = $page.url.searchParams.get('category') as ProductCategory | null;
			
			// Determine selected category
			if (urlCategory && categories.includes(urlCategory)) {
				selectedCategory = urlCategory;
			} else if (state.activeCategory) {
				selectedCategory = state.activeCategory;
			} else {
				// Find first non-empty category
				const firstCategory = categories.find(
					cat => state.productsByCategory[cat].length > 0
				);
				selectedCategory = firstCategory || 'hr';
			}
			
			// Update products for selected category
			products = selectedCategory ? state.productsByCategory[selectedCategory] : [];
		});
		return unsubscribe;
	});

	function handleRemove(productId: string) {
		comparisonStore.remove(productId);
	}

	function handleAddToCart(productId: string) {
		goto(`/products/${productId}`);
	}

	function handleViewDetails(productId: string) {
		goto(`/products/${productId}`);
	}

	function handleBrowseMarketplace() {
		if (selectedCategory) {
			goto(`/marketplace?category=${selectedCategory}`);
		} else {
			goto('/marketplace');
		}
	}

	function handleClearComparison() {
		if (selectedCategory) {
			comparisonStore.clearCategory(selectedCategory);
		}
	}

	function handleCategoryChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const category = target.value as ProductCategory;
		selectedCategory = category;
		comparisonStore.setActiveCategory(category);
		// Update URL
		goto(`/compare?category=${category}`, { replaceState: true });
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Page Header -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold mb-2">Compare Products</h1>
			<p class="text-base-content/70">
				Compare up to 3 products side-by-side to find the best fit for your needs
			</p>
		</div>
		
		<!-- Category Selector -->
		<div class="flex items-center gap-3">
			<span class="text-lg font-semibold">Compare:</span>
			<select
				class="select select-bordered"
				value={selectedCategory || ''}
				onchange={handleCategoryChange}
				aria-label="Select category"
			>
				{#each categories as category}
					{@const count = productsByCategory[category].length}
					<option value={category}>
						{categoryLabels[category]} ({count}/3)
					</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Comparison Table -->
	<ComparisonTable
		{products}
		category={selectedCategory}
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
		addProductLabel={selectedCategory ? `Add ${categoryLabels[selectedCategory]} Product` : 'Add Product'}
	/>

	<!-- Clear Comparison Button -->
	{#if products && products.length > 0}
		<div class="mt-8 text-center">
			<button class="btn btn-outline" onclick={handleClearComparison}>
				Clear {selectedCategory ? categoryLabels[selectedCategory] : ''} Comparison
			</button>
		</div>
	{/if}

	<!-- Browse Category Products Button -->
	{#if selectedCategory}
		<div class="mt-8 text-center">
			<button class="btn btn-outline btn-primary btn-lg" onclick={handleBrowseMarketplace}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Browse {categoryLabels[selectedCategory]} Products
			</button>
		</div>
	{/if}
</div>
