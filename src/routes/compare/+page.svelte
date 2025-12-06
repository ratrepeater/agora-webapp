<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ComparisonTable from '$lib/components/ComparisonTable.svelte';
	import { comparisonStore } from '$lib/stores/comparison';
	import type { ProductWithRating, ProductCategory } from '$lib/helpers/types';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

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
	let categoryMetrics = $state<any>({ metricDefinitions: [], metrics: {} });
	let cartQuantities = $state<Map<string, number>>(
		new Map(Object.entries(data.cartQuantities || {}).map(([k, v]) => [k, v as number]))
	);

	// Update cart quantities when data changes
	$effect(() => {
		if (data.cartQuantities) {
			cartQuantities = new Map(Object.entries(data.cartQuantities).map(([k, v]) => [k, v as number]));
		}
	});

	// Fetch category metrics
	async function fetchCategoryMetrics() {
		if (selectedCategory && products.length > 0) {
			const productIds = products.map(p => p.id).join(',');
			try {
				const response = await fetch(`/api/products/metrics?category=${selectedCategory}&productIds=${productIds}`);
				if (response.ok) {
					const data = await response.json();
					categoryMetrics = data;
				} else {
					categoryMetrics = { metricDefinitions: [], metrics: {} };
				}
			} catch (error) {
				console.error('Error fetching category metrics:', error);
				categoryMetrics = { metricDefinitions: [], metrics: {} };
			}
		} else {
			categoryMetrics = { metricDefinitions: [], metrics: {} };
		}
	}

	// Subscribe to comparison store and fetch products with scores
	$effect(() => {
		const unsubscribe = comparisonStore.subscribe(async (state) => {
			productsByCategory = state.productsByCategory;
			
			// Get category from URL query param (only read once to avoid loops)
			const urlCategory = $page.url.searchParams.get('category') as ProductCategory | null;
			
			// Determine selected category (only if not already set by user interaction)
			let newCategory: ProductCategory | null = null;
			if (urlCategory && categories.includes(urlCategory)) {
				newCategory = urlCategory;
			} else if (state.activeCategory) {
				newCategory = state.activeCategory;
			} else {
				// Find first non-empty category
				const firstCategory = categories.find(
					cat => state.productsByCategory[cat].length > 0
				);
				newCategory = firstCategory || 'hr';
			}
			
			// Only update if category actually changed
			if (newCategory !== selectedCategory) {
				selectedCategory = newCategory;
			}
			
			// Get products for selected category
			const categoryProducts = selectedCategory ? state.productsByCategory[selectedCategory] : [];
			
			// Fetch products with scores if we have products
			if (categoryProducts.length > 0) {
				const ids = categoryProducts.map(p => p.id);
				try {
					const response = await fetch(`/api/products/with-scores?productIds=${ids.join(',')}`);
					if (response.ok) {
						const data = await response.json();
						products = data.products || [];
					} else {
						products = categoryProducts;
					}
				} catch (error) {
					console.error('Error fetching products with scores:', error);
					products = categoryProducts;
				}
				
				// Fetch category metrics after products are loaded
				await fetchCategoryMetrics();
			} else {
				products = [];
				categoryMetrics = { metricDefinitions: [], metrics: {} };
			}
		});
		return unsubscribe;
	});

	function handleRemove(productId: string) {
		comparisonStore.remove(productId);
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
		comparisonStore.setActiveCategory(category);
		// Update URL - don't set selectedCategory here, let the effect handle it
		goto(`/compare?category=${category}`, { replaceState: true, noScroll: true });
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
		categoryMetrics={categoryMetrics}
		{cartQuantities}
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
		onupdatecartquantity={handleUpdateCartQuantity}
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
