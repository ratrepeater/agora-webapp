<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating } from '$app/stores';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import FilterPanel from '$lib/components/FilterPanel.svelte';
	import ProductCardSkeleton from '$lib/components/ProductCardSkeleton.svelte';
	import { comparisonStore } from '$lib/stores/comparison';
	import type { PageData } from './$types';
	import type { ProductWithRating, ProductCategory } from '$lib/helpers/types';

	let { data }: { data: PageData } = $props();

	// Track compared products
	let comparedProducts = $state<Set<string>>(new Set());

	// Subscribe to comparison store to track compared products
	$effect(() => {
		const unsubscribe = comparisonStore.subscribe((state) => {
			comparedProducts = new Set(state.products.map(p => p.id));
		});
		return unsubscribe;
	});

	// Check if we're navigating (loading new data)
	let isLoading = $derived($navigating !== null);

	// Track bookmarked products - initialize from server data
	let bookmarkedProducts = $state<Set<string>>(new Set(data.bookmarkedProductIds || []));
	let bookmarkingProducts = $state<Set<string>>(new Set());

	// Track cart quantities - map of productId to quantity, initialize from server data
	let cartQuantities = $state<Map<string, number>>(
		new Map(Object.entries(data.cartQuantities || {}).map(([k, v]) => [k, v as number]))
	);

	// Update bookmarked products and cart quantities when data changes (e.g., navigation)
	$effect(() => {
		if (data.bookmarkedProductIds) {
			bookmarkedProducts = new Set(data.bookmarkedProductIds);
		}
		if (data.cartQuantities) {
			cartQuantities = new Map(Object.entries(data.cartQuantities).map(([k, v]) => [k, v as number]));
		}
	});

	function handleProductClick(product: ProductWithRating) {
		goto(`/products/${product.id}`);
	}

	async function handleBookmark(productId: string) {
		// Prevent double-clicking
		if (bookmarkingProducts.has(productId)) return;
		
		bookmarkingProducts.add(productId);
		bookmarkingProducts = bookmarkingProducts;

		// Optimistically update UI immediately
		const wasBookmarked = bookmarkedProducts.has(productId);
		if (wasBookmarked) {
			const newSet = new Set(bookmarkedProducts);
			newSet.delete(productId);
			bookmarkedProducts = newSet;
		} else {
			bookmarkedProducts = new Set([...bookmarkedProducts, productId]);
		}

		try {
			const response = await fetch('/api/bookmarks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productId })
			});

			if (!response.ok) {
				// Revert on error
				if (wasBookmarked) {
					bookmarkedProducts = new Set([...bookmarkedProducts, productId]);
				} else {
					const newSet = new Set(bookmarkedProducts);
					newSet.delete(productId);
					bookmarkedProducts = newSet;
				}
				throw new Error('Failed to bookmark');
			}
		} catch (error) {
			console.error('Bookmark error:', error);
			alert('Failed to bookmark product. Please try again.');
		} finally {
			bookmarkingProducts.delete(productId);
			bookmarkingProducts = bookmarkingProducts;
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

	function handleCategoryChange(category: ProductCategory | null) {
		console.log('handleCategoryChange called with:', category);
		const params = new URLSearchParams(window.location.search);

		if (category === null) {
			params.delete('category');
		} else {
			params.set('category', category);
		}

		const newUrl = `/marketplace?${params.toString()}`;
		console.log('Navigating to:', newUrl);
		goto(newUrl);
	}

	function handleSearchChange(query: string) {
		console.log('handleSearchChange called with:', query);
		const params = new URLSearchParams(window.location.search);

		if (query) {
			params.set('q', query);
		} else {
			params.delete('q');
		}

		const newUrl = `/marketplace?${params.toString()}`;
		console.log('Navigating to:', newUrl);
		goto(newUrl);
	}

	function handleFilterChange(filters: any) {
		console.log('handleFilterChange called with:', filters);
		const params = new URLSearchParams(window.location.search);

		// Preserve search query
		if (data.searchQuery) {
			params.set('q', data.searchQuery);
		}

		// Update filters
		if (filters.minPrice !== undefined) {
			params.set('minPrice', filters.minPrice.toString());
		} else {
			params.delete('minPrice');
		}

		if (filters.maxPrice !== undefined) {
			params.set('maxPrice', filters.maxPrice.toString());
		} else {
			params.delete('maxPrice');
		}

		if (filters.minRating !== undefined) {
			params.set('minRating', filters.minRating.toString());
		} else {
			params.delete('minRating');
		}

		const newUrl = `/marketplace?${params.toString()}`;
		console.log('Navigating to:', newUrl);
		goto(newUrl);
	}

	function handleClearFilters() {
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
		<h1 class="text-4xl font-bold mb-2">Marketplace</h1>
		<p class="text-base-content/70">
			{#if data.searchQuery}
				Search results for "{data.searchQuery}"
			{:else}
				Browse all available services
			{/if}
		</p>
	</div>

	<div class="flex flex-col lg:flex-row gap-8">
		<!-- Filter Panel (Sidebar) -->
		<aside class="lg:w-64 flex-shrink-0">
			<FilterPanel
				categories={['hr', 'legal', 'marketing', 'devtools']}
				selectedCategory={(data.filters.category as any) || null}
				searchQuery={data.searchQuery}
				filters={{
					minPrice: data.filters.minPrice,
					maxPrice: data.filters.maxPrice,
					minRating: data.filters.minRating
				}}
				oncategorychange={handleCategoryChange}
				onsearchchange={handleSearchChange}
				onfilterchange={handleFilterChange}
				onclearfilters={handleClearFilters}
			/>
		</aside>

		<!-- Product Grid -->
		<main class="flex-1">
			{#if isLoading}
				<!-- Loading State -->
				<div class="mb-4 text-sm text-base-content/70">Loading products...</div>
				<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
					{#each Array(6) as _, i (i)}
						<ProductCardSkeleton variant="grid" />
					{/each}
				</div>
			{:else if data.products && data.products.length > 0}
				<div class="mb-4 text-sm text-base-content/70">
					Showing {data.products.length} {data.products.length === 1 ? 'product' : 'products'}
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
					{#each data.products.filter(p => p.id) as product (product.id)}
						{@const isBookmarked = bookmarkedProducts.has(product.id)}
						{@const isCompared = comparedProducts.has(product.id)}
						{@const cartQuantity = cartQuantities.get(product.id) || 0}
						<ProductCard
							{product}
							variant="grid"
							{isBookmarked}
							{isCompared}
							{cartQuantity}
							onclick={() => handleProductClick(product)}
							oncompare={() => handleCompare(product)}
							onbookmark={() => handleBookmark(product.id)}
							onaddtocart={() => handleAddToCart(product.id)}
							onupdatecartquantity={(qty) => handleUpdateCartQuantity(product.id, qty)}
						/>
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
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<h2 class="text-2xl font-bold mb-2">No products found</h2>
					<p class="text-base-content/70 mb-6">
						{#if data.searchQuery}
							Try adjusting your search or filters
						{:else}
							No products match your current filters
						{/if}
					</p>
					<button class="btn btn-primary" onclick={handleClearFilters}>
						Clear Filters
					</button>
				</div>
			{/if}
		</main>
	</div>
</div>
