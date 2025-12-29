<script lang="ts">
    import { goto } from '$app/navigation';
    import { navigating } from '$app/stores';
    import ProductRow from '$lib/components/ProductRow.svelte';
    import ProductRowSkeleton from '$lib/components/ProductRowSkeleton.svelte';
    import ComparisonBar from '$lib/components/ComparisonBar.svelte';
    import type { PageData } from './$types';
    import type { ProductWithRating } from '$lib/helpers/types';
    import { comparisonStore } from '$lib/stores/comparison';
    import { onMount } from 'svelte';

    let scrollY = $state(0);

    onMount(() => {
        const handleScroll = () => {
            scrollY = window.scrollY;
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    });

    let { data }: { data: PageData } = $props();

    // Check if we're navigating (loading new data)
    let isLoading = $derived($navigating !== null);

    // Debug: Log data on mount
    $effect(() => {
        console.log('Homepage client data:', {
            newProducts: data.newProducts?.length || 0,
            featuredProducts: data.featuredProducts?.length || 0,
            recommendedProducts: data.recommendedProducts?.length || 0,
            isAuthenticated: data.isAuthenticated
        });
    });

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
        console.log('Navigating to product:', product.id, product.name);
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
                
                // If unauthorized, show message and redirect to sign in
                if (response.status === 401) {
                    alert('Please sign in to bookmark items.');
                    goto('/auth/signin?redirectTo=/');
                    return;
                }
                
                throw new Error('Failed to bookmark');
            }
        } catch (error) {
            console.error('Bookmark error:', error);
            alert('Failed to bookmark. Please try again.');
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
                if (response.status === 401) {
                    alert('Please sign in to add items to the cart.');
                    goto('/auth/signin?redirectTo=/');
                    return;
                }
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

<!-- Animated Page Background -->
<div class="fixed inset-0 -z-10 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900">
    <!-- Animated circles (static position, only pulse) -->
    <div class="absolute top-10 left-10 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute top-40 right-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    <div class="absolute bottom-20 left-1/4 w-72 h-72 bg-blue-600/18 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    <div class="absolute bottom-40 right-1/3 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1.5s;"></div>
    
    <!-- Dynamic Particles - More concentrated on sides (circles and squares only) -->
    <!-- Left side particles (0-15%) -->
    <div class="particle" style="top: calc(8% - {scrollY * 0.05}px); left: 3%; animation-delay: 0s;">
        <div class="w-1.5 h-1.5 bg-white/60 rounded-full animate-particle-bounce"></div>
    </div>
    <div class="particle" style="top: calc(15% - {scrollY * 0.08}px); left: 7%; animation-delay: 0.3s;">
        <div class="w-1.5 h-1.5 bg-white/50 animate-particle-spin"></div>
    </div>
    <div class="particle" style="top: calc(22% - {scrollY * 0.06}px); left: 5%; animation-delay: 0.6s;">
        <div class="w-2 h-2 bg-white/65 rounded-full animate-particle-pulse"></div>
    </div>
    <div class="particle" style="top: calc(30% - {scrollY * 0.09}px); left: 10%; animation-delay: 0.9s;">
        <div class="w-1.5 h-1.5 bg-white/55 animate-particle-bounce"></div>
    </div>
    <div class="particle" style="top: calc(38% - {scrollY * 0.07}px); left: 4%; animation-delay: 1.2s;">
        <div class="w-2 h-2 bg-white/60 rounded-full animate-particle-spin"></div>
    </div>
    <div class="particle" style="top: calc(46% - {scrollY * 0.1}px); left: 12%; animation-delay: 1.5s;">
        <div class="w-1.5 h-1.5 bg-white/50 animate-particle-pulse"></div>
    </div>
    <div class="particle" style="top: calc(54% - {scrollY * 0.05}px); left: 6%; animation-delay: 1.8s;">
        <div class="w-1.5 h-1.5 bg-white/65 rounded-full animate-particle-bounce"></div>
    </div>
    <div class="particle" style="top: calc(62% - {scrollY * 0.08}px); left: 9%; animation-delay: 2.1s;">
        <div class="w-2 h-2 bg-white/55 animate-particle-spin"></div>
    </div>
    <div class="particle" style="top: calc(70% - {scrollY * 0.06}px); left: 3%; animation-delay: 2.4s;">
        <div class="w-1.5 h-1.5 bg-white/60 rounded-full animate-particle-pulse"></div>
    </div>
    <div class="particle" style="top: calc(78% - {scrollY * 0.09}px); left: 11%; animation-delay: 2.7s;">
        <div class="w-1.5 h-1.5 bg-white/50 animate-particle-bounce"></div>
    </div>
    <div class="particle" style="top: calc(86% - {scrollY * 0.07}px); left: 5%; animation-delay: 3.0s;">
        <div class="w-2 h-2 bg-white/65 rounded-full animate-particle-spin"></div>
    </div>
    <div class="particle" style="top: calc(94% - {scrollY * 0.1}px); left: 8%; animation-delay: 3.3s;">
        <div class="w-1.5 h-1.5 bg-white/55 animate-particle-pulse"></div>
    </div>
    
    <!-- Right side particles (85-97%) -->
    <div class="particle" style="top: calc(10% - {scrollY * 0.06}px); left: 88%; animation-delay: 0.2s;">
        <div class="w-1.5 h-1.5 bg-white/60 animate-particle-bounce"></div>
    </div>
    <div class="particle" style="top: calc(17% - {scrollY * 0.09}px); left: 93%; animation-delay: 0.5s;">
        <div class="w-1.5 h-1.5 bg-white/50 rounded-full animate-particle-spin"></div>
    </div>
    <div class="particle" style="top: calc(25% - {scrollY * 0.07}px); left: 90%; animation-delay: 0.8s;">
        <div class="w-2 h-2 bg-white/65 animate-particle-pulse"></div>
    </div>
    <div class="particle" style="top: calc(33% - {scrollY * 0.1}px); left: 95%; animation-delay: 1.1s;">
        <div class="w-1.5 h-1.5 bg-white/55 rounded-full animate-particle-bounce"></div>
    </div>
    <div class="particle" style="top: calc(41% - {scrollY * 0.05}px); left: 87%; animation-delay: 1.4s;">
        <div class="w-2 h-2 bg-white/60 animate-particle-spin"></div>
    </div>
    <div class="particle" style="top: calc(49% - {scrollY * 0.08}px); left: 92%; animation-delay: 1.7s;">
        <div class="w-1.5 h-1.5 bg-white/50 rounded-full animate-particle-pulse"></div>
    </div>
    <div class="particle" style="top: calc(57% - {scrollY * 0.06}px); left: 89%; animation-delay: 2.0s;">
        <div class="w-1.5 h-1.5 bg-white/65 animate-particle-bounce"></div>
    </div>
    <div class="particle" style="top: calc(65% - {scrollY * 0.09}px); left: 94%; animation-delay: 2.3s;">
        <div class="w-2 h-2 bg-white/55 rounded-full animate-particle-spin"></div>
    </div>
    <div class="particle" style="top: calc(73% - {scrollY * 0.07}px); left: 91%; animation-delay: 2.6s;">
        <div class="w-1.5 h-1.5 bg-white/60 animate-particle-pulse"></div>
    </div>
    <div class="particle" style="top: calc(81% - {scrollY * 0.1}px); left: 96%; animation-delay: 2.9s;">
        <div class="w-1.5 h-1.5 bg-white/50 animate-particle-bounce"></div>
    </div>
    <div class="particle" style="top: calc(89% - {scrollY * 0.05}px); left: 88%; animation-delay: 3.2s;">
        <div class="w-2 h-2 bg-white/65 rounded-full animate-particle-spin"></div>
    </div>
    <div class="particle" style="top: calc(97% - {scrollY * 0.08}px); left: 93%; animation-delay: 3.5s;">
        <div class="w-1.5 h-1.5 bg-white/55 animate-particle-pulse"></div>
    </div>
    
    <!-- Center particles (30-70%) - fewer -->
    <div class="particle" style="top: calc(20% - {scrollY * 0.06}px); left: 45%; animation-delay: 0.4s;">
        <div class="w-1.5 h-1.5 bg-white/50 rounded-full animate-particle-bounce"></div>
    </div>
    <div class="particle" style="top: calc(40% - {scrollY * 0.07}px); left: 55%; animation-delay: 1.0s;">
        <div class="w-2 h-2 bg-white/60 animate-particle-spin"></div>
    </div>
    <div class="particle" style="top: calc(60% - {scrollY * 0.09}px); left: 50%; animation-delay: 1.6s;">
        <div class="w-1.5 h-1.5 bg-white/55 rounded-full animate-particle-pulse"></div>
    </div>
    <div class="particle" style="top: calc(80% - {scrollY * 0.05}px); left: 48%; animation-delay: 2.2s;">
        <div class="w-1.5 h-1.5 bg-white/60 animate-particle-bounce"></div>
    </div>
    <div class="particle" style="top: calc(35% - {scrollY * 0.08}px); left: 52%; animation-delay: 0.7s;">
        <div class="w-2 h-2 bg-white/50 rounded-full animate-particle-spin"></div>
    </div>
    <div class="particle" style="top: calc(55% - {scrollY * 0.06}px); left: 47%; animation-delay: 1.3s;">
        <div class="w-1.5 h-1.5 bg-white/65 animate-particle-pulse"></div>
    </div>
</div>

<div class="container mx-auto px-4 py-8 relative">
    <!-- Hero Section -->
    <div class="hero min-h-[50vh] mb-12 relative overflow-hidden">
        <!-- Content -->
        <div class="hero-content text-center relative z-10 py-16">
            <div class="max-w-3xl">
                <h1 class="text-6xl font-bold mb-6 text-white leading-tight">The Marketplace for Startup Services</h1>
                <p class="text-2xl mb-8 text-white/90">
                    Discover, compare, and purchase the best business services for your startup
                </p>
                <button class="btn btn-lg bg-blue-600 hover:bg-blue-700 text-white border-0 px-8 shadow-xl hover:shadow-2xl transition-all" onclick={() => goto('/marketplace')}>
                    Browse Marketplace
                </button>
            </div>
        </div>
    </div>

    {#if isLoading}
        <!-- Loading State -->
        <ProductRowSkeleton title="Recommended for You" />
        <ProductRowSkeleton title="New & Notable" />
        <ProductRowSkeleton title="Featured Services" />
    {:else}
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

<style>
    .particle {
        position: absolute;
        transition: top 0.3s ease-out;
        pointer-events: none;
    }

    @keyframes particle-bounce {
        0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.6;
        }
        50% {
            transform: translateY(-15px) translateX(5px) scale(1.1);
            opacity: 0.6;
        }
    }

    @keyframes particle-spin {
        0% {
            transform: rotate(0deg) translateX(0) scale(1);
            opacity: 0.5;
        }
        50% {
            transform: rotate(180deg) translateX(8px) scale(1.1);
            opacity: 0.5;
        }
        100% {
            transform: rotate(360deg) translateX(0) scale(1);
            opacity: 0.5;
        }
    }

    @keyframes particle-pulse {
        0%, 100% {
            transform: scale(1) translateY(0);
            opacity: 0.6;
        }
        50% {
            transform: scale(1.2) translateY(-20px);
            opacity: 0.6;
        }
    }

    @keyframes particle-spawn {
        0% {
            transform: scale(0);
            opacity: 0;
        }
        50% {
            opacity: 0.6;
        }
        100% {
            transform: scale(1);
            opacity: 0.6;
        }
    }

    @keyframes particle-despawn {
        0% {
            transform: scale(1);
            opacity: 0.6;
        }
        100% {
            transform: scale(0);
            opacity: 0;
        }
    }

    :global(.animate-particle-bounce) {
        animation: particle-bounce 8s ease-in-out infinite;
    }

    :global(.animate-particle-spin) {
        animation: particle-spin 10s linear infinite;
    }

    :global(.animate-particle-pulse) {
        animation: particle-pulse 7s ease-in-out infinite;
    }

    /* Spawn/despawn animations for specific particles */
    .particle:nth-child(5n+1) {
        animation: particle-spawn 2s ease-out 0s 1, particle-despawn 2s ease-in 18s 1;
    }

    .particle:nth-child(7n+2) {
        animation: particle-spawn 2s ease-out 5s 1, particle-despawn 2s ease-in 23s 1;
    }

    .particle:nth-child(11n+3) {
        animation: particle-spawn 2s ease-out 10s 1, particle-despawn 2s ease-in 28s 1;
    }

    /* Interaction effect - particles glow when near each other */
    .particle:hover {
        filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
    }
</style>