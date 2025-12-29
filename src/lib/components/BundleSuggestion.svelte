<script lang="ts">
    import type { ProductBundle } from '$lib/helpers/types';

    interface Props {
        bundles: ProductBundle[];
        onaddbundle?: (bundle: ProductBundle) => void;
        onviewbundle?: (bundle: ProductBundle) => void;
    }

    let { bundles, onaddbundle, onviewbundle }: Props = $props();

    function handleAddBundle(bundle: ProductBundle) {
        onaddbundle?.(bundle);
    }

    function handleViewBundle(bundle: ProductBundle) {
        onviewbundle?.(bundle);
    }

    function formatPrice(cents: number): string {
        return (cents / 100).toFixed(2);
    }
</script>

{#if bundles.length > 0}
    <div class="w-full">
        <!-- Section Header -->
        <div class="mb-6">
            <h2 class="text-2xl font-bold mb-2">Suggested Bundles</h2>
            <p class="text-base-content/70">
                Save more by purchasing these products together
            </p>
        </div>

        <!-- Bundle Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each bundles as bundle (bundle.id)}
                <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                    <div class="card-body">
                        <!-- Bundle Header -->
                        <div class="flex items-start justify-between mb-4">
                            <div class="flex-1">
                                <h3 class="card-title text-lg mb-1">{bundle.name}</h3>
                                {#if bundle.description}
                                    <p class="text-sm text-base-content/70 line-clamp-2">
                                        {bundle.description}
                                    </p>
                                {/if}
                            </div>
                            <!-- Discount Badge -->
                            {#if bundle.discount_percentage > 0}
                                <div class="badge badge-success badge-lg font-bold">
                                    -{bundle.discount_percentage}%
                                </div>
                            {/if}
                        </div>

                        <!-- Products in Bundle -->
                        <div class="space-y-2 mb-4">
                            <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                                Includes {bundle.products.length} {bundle.products.length === 1
                                    ? 'Product'
                                    : 'Products'}:
                            </p>
                            <div class="space-y-1">
                                {#each bundle.products as product}
                                    <div class="flex items-center gap-2 text-sm">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="h-4 w-4 text-success flex-shrink-0"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        <span class="truncate">{product.name}</span>
                                    </div>
                                {/each}
                            </div>
                        </div>

                        <!-- Pricing -->
                        <div class="mb-4">
                            <div class="flex items-baseline gap-2 mb-1">
                                {#if bundle.discount_percentage > 0}
                                    <span class="text-sm text-base-content/50 line-through">
                                        ${formatPrice(bundle.total_price)}
                                    </span>
                                {/if}
                                <span class="text-2xl font-bold text-primary">
                                    ${formatPrice(bundle.discounted_price)}
                                </span>
                                <span class="text-sm text-base-content/60">/month</span>
                            </div>
                            {#if bundle.discount_percentage > 0}
                                <p class="text-xs text-success font-medium">
                                    Save ${formatPrice(bundle.total_price - bundle.discounted_price)} per month
                                </p>
                            {/if}
                        </div>

                        <!-- Actions -->
                        <div class="card-actions justify-end gap-2">
                            {#if onviewbundle}
                                <button
                                    class="btn btn-sm btn-ghost"
                                    onclick={() => handleViewBundle(bundle)}
                                    aria-label="View bundle details"
                                >
                                    View Details
                                </button>
                            {/if}
                            <button
                                class="btn btn-sm btn-primary"
                                onclick={() => handleAddBundle(bundle)}
                                aria-label="Add {bundle.name} to cart"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                                Add Bundle
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
{/if}
