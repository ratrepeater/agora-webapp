<script lang="ts">
    import type { PageData } from './$types';
    import { downloadService } from '$lib/services/downloads';

    let { data }: { data: PageData } = $props();

    // Format price from cents to dollars
    function formatPrice(cents: number): string {
        return `$${(cents / 100).toFixed(2)}`;
    }

    // Format date
    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Handle download
    async function handleDownload(productId: string, productName: string) {
        try {
            if (!data.session) return;
            
            const downloadUrl = await downloadService.getDownloadUrl(
                productId,
                data.session.user.id,
                data.order.id
            );

            // Track the download
            await downloadService.trackDownload(productId, data.session.user.id, data.order.id);

            // Open download in new tab
            window.open(downloadUrl, '_blank');
        } catch (error) {
            console.error('Download failed:', error);
            alert(`Failed to download ${productName}. Please try again or contact support.`);
        }
    }
</script>

<div class="container mx-auto p-4 max-w-4xl">
    <!-- Success Banner -->
    <div class="alert alert-success mb-6">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
        <div>
            <h3 class="font-bold">Order Confirmed!</h3>
            <div class="text-sm">Your order has been successfully placed.</div>
        </div>
    </div>

    <!-- Order Details Card -->
    <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
            <!-- Order Header -->
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h1 class="text-3xl font-bold">Order Confirmation</h1>
                    <p class="text-sm text-gray-600 mt-2">
                        Order #{data.order.id.slice(0, 8)}
                    </p>
                    <p class="text-sm text-gray-600">
                        Placed on {formatDate(data.order.created_at)}
                    </p>
                    {#if data.order.demo}
                        <span class="badge badge-info badge-sm mt-2">Demo Order (No Charge)</span>
                    {/if}
                </div>
                <div class="text-right">
                    <p class="text-3xl font-bold">{formatPrice(data.order.demo_total_cents)}</p>
                    <p class="text-sm text-gray-600">Total</p>
                </div>
            </div>

            <div class="divider"></div>

            <!-- Download Section -->
            <div class="bg-primary/10 p-4 rounded-lg mb-4">
                <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                    </svg>
                    Your Downloads
                </h2>
                <p class="text-sm text-gray-600 mb-4">
                    Your products are ready to download. You can also access them anytime from your order history.
                </p>
            </div>

            <!-- Order Items with Download Links -->
            <div class="space-y-4">
                {#each data.order.items as item}
                    <div class="flex items-center gap-4 p-4 bg-base-200 rounded-lg">
                        <!-- Product Image -->
                        {#if item.product.logo_url}
                            <img
                                src={item.product.logo_url}
                                alt={item.product.name}
                                class="w-20 h-20 object-cover rounded"
                            />
                        {:else}
                            <div class="w-20 h-20 bg-base-300 rounded flex items-center justify-center">
                                <span class="text-3xl">📦</span>
                            </div>
                        {/if}

                        <!-- Product Info -->
                        <div class="flex-1">
                            <h3 class="font-semibold text-lg">{item.product.name}</h3>
                            <p class="text-sm text-gray-600">{item.product.short_description}</p>
                            <div class="flex gap-4 mt-2 text-sm">
                                <span>Quantity: {item.quantity}</span>
                                <span>Price: {formatPrice(item.unit_price_cents)}</span>
                                <span class="font-semibold">
                                    Subtotal: {formatPrice(item.subtotal_cents)}
                                </span>
                            </div>
                        </div>

                        <!-- Download Button (Prominent) -->
                        <div class="flex flex-col gap-2">
                            <button
                                class="btn btn-primary"
                                onclick={() => handleDownload(item.product_id, item.product.name)}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                </svg>
                                Download Now
                            </button>
                            <a
                                href="/products/{item.product_id}"
                                class="btn btn-ghost btn-sm"
                            >
                                View Product
                            </a>
                        </div>
                    </div>
                {/each}
            </div>

            <div class="divider"></div>

            <!-- Order Summary -->
            <div class="flex justify-between items-center text-lg">
                <span class="font-semibold">Total</span>
                <span class="font-bold">{formatPrice(data.order.demo_total_cents)}</span>
            </div>

            <!-- Actions -->
            <div class="card-actions justify-end mt-4">
                <a href="/orders" class="btn btn-ghost">View All Orders</a>
                <a href="/businesses" class="btn btn-primary">Continue Shopping</a>
            </div>
        </div>
    </div>

    <!-- Help Section -->
    <div class="mt-6 text-center text-sm text-gray-600">
        <p>Need help? Contact our support team or visit our help center.</p>
        <p class="mt-2">
            You can access your downloads anytime from your
            <a href="/orders" class="link link-primary">order history</a>.
        </p>
    </div>
</div>
