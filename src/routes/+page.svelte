<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating } from '$app/stores';
	import ProductRow from '$lib/components/ProductRow.svelte';
	import ProductRowSkeleton from '$lib/components/ProductRowSkeleton.svelte';
	import ComparisonBar from '$lib/components/ComparisonBar.svelte';
	import type { PageData } from './$types';
	import type { ProductWithRating } from '$lib/helpers/types';
	import { comparisonStore } from '$lib/stores/comparison';

	let { data }: { data: PageData } = $props();

	// Check if we're navigating (loading new data)
	let isLoading = $derived($navigating !== null);

	// Bookmark state
	let bookmarkedProductIds = $state<Set<string>>(new Set());
	let bookmarkingProducts = $state<Set<string>>(new Set());

	// Track compared products from the store
	let comparedProductIds = $state<Set<string>>(new Set());

	// Track cart quantities - map of productId to quantity, initialize from server data
	let cartQuantities = $state<Map<string, number>>(
		new Map(Object.entries(data.cartQuantities || {}).map(([k, v]) => [k, v as number]))
	);

	// Subscribe to comparison store to track compared products
	$effect(() => {
		const unsubscribe = comparisonStore.subscribe((state) => {
			const allProducts = Object.values(state.productsByCategory).flat();
			comparedProductIds = new Set(allProducts.map(p => p.id));
		});
		return unsubscribe;
	});

	// Update cart quantities when data changes
	$effect(() => {
		if (data.cartQuantities) {
			cartQuantities = new Map(Object.entries(data.cartQuantities).map(([k, v]) => [k, v as number]));
		}
	});

	// Initialize bookmarked products if user is authenticated
	$effect(() => {
		if (data.isAuthenticated) {
			loadBookmarks();
		}
	});

	async function loadBookmarks() {
		try {
			const response = await fetch('/api/bookmarks');
			if (response.ok) {
				const bookmarks = await response.json();
				bookmarkedProductIds = new Set(bookmarks.map((b: any) => b.product_id));
			}
		} catch (error) {
			console.error('Error loading bookmarks:', error);
		}
	}

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

	function handleCompare(product: ProductWithRating) {
		// Check if product is already being compared
		if (comparedProductIds.has(product.id)) {
			// Remove from comparison
			comparisonStore.remove(product.id);
		} else {
			// Try to add to comparison
			const result = comparisonStore.add(product);
			if (result === 'full') {
				alert('You can only compare up to 3 products at a time. Remove a product from the comparison to add a new one.');
			}
		}
	}

	async function handleBookmark(productId: string) {
		// Prevent double-clicking
		if (bookmarkingProducts.has(productId)) return;
		
		bookmarkingProducts.add(productId);
		bookmarkingProducts = bookmarkingProducts;

		// Optimistically update UI immediately
		const wasBookmarked = bookmarkedProductIds.has(productId);
		if (wasBookmarked) {
			const newSet = new Set(bookmarkedProductIds);
			newSet.delete(productId);
			bookmarkedProductIds = newSet;
		} else {
			bookmarkedProductIds = new Set([...bookmarkedProductIds, productId]);
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
					bookmarkedProductIds = new Set([...bookmarkedProductIds, productId]);
				} else {
					const newSet = new Set(bookmarkedProductIds);
					newSet.delete(productId);
					bookmarkedProductIds = newSet;
				}
				
				// If unauthorized, redirect to sign in
				if (response.status === 401) {
					goto('/auth/signin?redirectTo=/');
					return;
				}
				
				throw new Error('Failed to bookmark');
			}
		} catch (error) {
			console.error('Bookmark error:', error);
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
			cartQuantities = new Map(cartQuantities);
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
		cartQuantities = new Map(cartQuantities);

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
				{bookmarkedProductIds}
				{comparedProductIds}
				{cartQuantities}
				onproductclick={handleProductClick}
				onshowmore={handleViewAllNew}
				oncompare={handleCompare}
				onbookmark={handleBookmark}
				onaddtocart={handleAddToCart}
				onupdatecartquantity={handleUpdateCartQuantity}
			/>
		{/if}

		<!-- Featured Products Row -->
		{#if data.featuredProducts && data.featuredProducts.length > 0}
			<ProductRow
				title="Featured Services"
				products={data.featuredProducts}
				showMoreLink="/marketplace?filter=featured"
				{bookmarkedProductIds}
				{comparedProductIds}
				{cartQuantities}
				onproductclick={handleProductClick}
				onshowmore={handleViewAllFeatured}
				oncompare={handleCompare}
				onbookmark={handleBookmark}
				onaddtocart={handleAddToCart}
				onupdatecartquantity={handleUpdateCartQuantity}
			/>
		{/if}

		<!-- Recommended Products Row -->
		{#if data.recommendedProducts && data.recommendedProducts.length > 0}
			<ProductRow
				title={data.isAuthenticated ? 'Recommended for You' : 'Trending Now'}
				products={data.recommendedProducts}
				showMoreLink="/marketplace"
				{bookmarkedProductIds}
				{comparedProductIds}
				{cartQuantities}
				onproductclick={handleProductClick}
				onshowmore={handleViewAllRecommended}
				oncompare={handleCompare}
				onbookmark={handleBookmark}
				onaddtocart={handleAddToCart}
				onupdatecartquantity={handleUpdateCartQuantity}
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

<!-- Comparison Bar -->
<ComparisonBar />