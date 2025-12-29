<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { comparisonStore } from '$lib/stores/comparison';
    import type { ProductWithRating, ProductCategory } from '$lib/helpers/types';

    let productsByCategory = $state<Record<ProductCategory, ProductWithRating[]>>({
        hr: [],
        legal: [],
        marketing: [],
        devtools: []
    });
    let activeCategory = $state<ProductCategory | null>(null);
    let comparedProducts = $state<ProductWithRating[]>([]);

    const categories: ProductCategory[] = ['hr', 'legal', 'marketing', 'devtools'];
    const categoryLabels: Record<ProductCategory, string> = {
        hr: 'HR',
        legal: 'Legal',
        marketing: 'Marketing',
        devtools: 'DevTools'
    };

    // Track previous active category to prevent loops
    let previousActiveCategory = $state<ProductCategory | null>(null);

    // Subscribe to comparison store
    $effect(() => {
        const unsubscribe = comparisonStore.subscribe((state) => {
            productsByCategory = state.productsByCategory;
            const newActiveCategory = state.activeCategory;
            
            // Update compared products based on active category
            if (newActiveCategory) {
                const newComparedProducts = state.productsByCategory[newActiveCategory] || [];
                
                // If current category is empty and we haven't just switched, find a category with products
                if (newComparedProducts.length === 0 && newActiveCategory === previousActiveCategory) {
                    const categoryWithProducts = categories.find(
                        cat => state.productsByCategory[cat].length > 0
                    );
                    if (categoryWithProducts && categoryWithProducts !== newActiveCategory) {
                        // Use setTimeout to break out of the reactive cycle
                        setTimeout(() => {
                            comparisonStore.setActiveCategory(categoryWithProducts);
                        }, 0);
                    }
                }
                
                comparedProducts = newComparedProducts;
            } else {
                comparedProducts = [];
            }
            
            activeCategory = newActiveCategory;
            previousActiveCategory = newActiveCategory;
        });
        return unsubscribe;
    });

    function removeProduct(productId: string) {
        comparisonStore.remove(productId);
    }

    function handleCompare() {
        // Show the bar if it's hidden
        if (isCollapsed) {
            isCollapsed = false;
            if (typeof window !== 'undefined') {
                localStorage.setItem('comparisonBarCollapsed', 'false');
            }
        }
        
        if (activeCategory) {
            goto(`/compare?category=${activeCategory}`);
        } else {
            goto('/compare');
        }
    }

    function handleCategoryChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const category = target.value as ProductCategory;
        comparisonStore.setActiveCategory(category);
    }

    // Get total count across all categories
    let totalCount = $derived(
        Object.values(productsByCategory).reduce((sum, products) => sum + products.length, 0)
    );

    // Check if any category has products
    let hasAnyProducts = $derived(totalCount > 0);
    
    // Collapse/expand state - persisted in localStorage
    let isCollapsed = $state(false);
    let showButton = $state(false); // Controls which button to show (delayed for animation)
    let previousTotalCount = $state(0);
    
    // Load collapsed state from localStorage on mount
    onMount(() => {
        const saved = localStorage.getItem('comparisonBarCollapsed');
        if (saved !== null) {
            const collapsed = saved === 'true';
            isCollapsed = collapsed;
            showButton = collapsed; // Sync button state on load
        }
        // Set initial count
        previousTotalCount = totalCount;
    });
    
    // Track count changes and auto-show bar when products are added
    $effect(() => {
        // Only auto-show if count actually increased (user added a product)
        if (totalCount > previousTotalCount && totalCount > 0 && previousTotalCount > 0) {
            isCollapsed = false;
            showButton = false;
            if (typeof window !== 'undefined') {
                localStorage.setItem('comparisonBarCollapsed', 'false');
            }
        }
        previousTotalCount = totalCount;
    });
    
    function toggleCollapse() {
        if (isCollapsed) {
            // Expanding - change button immediately, then expand
            showButton = false;
            isCollapsed = false;
        } else {
            // Collapsing - collapse first, then change button after animation
            isCollapsed = true;
            setTimeout(() => {
                showButton = true;
            }, 300); // Match the transition duration
        }
        
        // Save state to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('comparisonBarCollapsed', String(isCollapsed));
        }
    }
</script>

{#if hasAnyProducts}
    <!-- Show Button - Fixed at bottom when fully collapsed -->
    {#if showButton}
        <button
            type="button"
            onclick={toggleCollapse}
            class="fixed bottom-2 left-1/2 -translate-x-1/2 z-[51] btn btn-primary btn-xs rounded-lg shadow-lg"
            aria-label="Show comparison bar"
        >
            <!-- Up arrow -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
            </svg>
        </button>
    {/if}
    
    <!-- Comparison Bar Wrapper -->
    <div class="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out {isCollapsed ? 'translate-y-full' : 'translate-y-0'}">
        <!-- Comparison Bar Content -->
        <div class="bg-base-100 border-t-2 border-base-300 shadow-2xl relative">
            <!-- Toggle Button - Inside the bar at the top (slides with bar) -->
            {#if !showButton}
                <button
                    type="button"
                    onclick={toggleCollapse}
                    class="absolute left-1/2 -translate-x-1/2 top-1 z-10 btn btn-primary btn-xs rounded-lg shadow-lg"
                    aria-label="Hide comparison bar"
                >
                    <!-- Down arrow -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            {/if}
            
        <div class="container mx-auto px-8 py-4 pt-8">
            <div class="flex items-center justify-between gap-8">
                <div class="flex items-center gap-4 flex-1 min-w-0">
                    <!-- Category Dropdown with Label -->
                    <div class="flex items-center gap-3 flex-shrink-0">
                        <span class="text-lg font-semibold whitespace-nowrap">Compare</span>
                        <select
                            class="select select-bordered select-lg text-lg font-semibold"
                            value={activeCategory || ''}
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

                    {#if comparedProducts.length > 0}
                        <!-- Products in active category -->
                        <div class="flex gap-4 overflow-x-auto min-h-[4rem]">
                            {#each comparedProducts as product (product.id)}
                                <div class="flex items-center gap-4 bg-base-200 rounded-lg px-3.5 py-2.5 whitespace-nowrap">
                                    <span class="text-lg font-medium">{product.name}</span>
                                    <button
                                        type="button"
                                        onclick={() => removeProduct(product.id)}
                                        class="btn btn-ghost btn-md btn-circle"
                                        aria-label="Remove {product.name}"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <!-- Empty state with same height as product chips -->
                        <div class="flex items-center gap-4 bg-base-200 rounded-lg px-3.5 py-2.5 whitespace-nowrap min-h-[4rem]">
                            <span class="text-lg text-base-content/70">
                                No {activeCategory ? categoryLabels[activeCategory] : ''} products to compare. 
                                <a 
                                    href="/marketplace?category={activeCategory}" 
                                    class="link link-primary font-medium bg-base-200 px-2 py-1 rounded"
                                >
                                    Browse {activeCategory ? categoryLabels[activeCategory] : ''}
                                </a>
                            </span>
                        </div>
                    {/if}
                </div>

                <button
                    type="button"
                    onclick={handleCompare}
                    class="btn btn-primary btn-lg text-lg whitespace-nowrap"
                    disabled={comparedProducts.length < 1}
                >
                    Compare Now
                </button>
                <button
                    type="button"
                    onclick={() => activeCategory && comparisonStore.clearCategory(activeCategory)}
                    class="btn btn-ghost btn-lg btn-circle"
                    aria-label="Clear category"
                    disabled={comparedProducts.length === 0}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
        </div>
    </div>
{/if}
