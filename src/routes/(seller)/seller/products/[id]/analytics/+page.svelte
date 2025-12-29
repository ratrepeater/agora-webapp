<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    function formatPrice(priceCents: number): string {
        return `$${(priceCents / 100).toFixed(2)}`;
    }

    function formatNumber(num: number): string {
        return new Intl.NumberFormat('en-US').format(num);
    }

    function formatPercent(num: number): string {
        return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
    }

    function getTrendColor(trend: number): string {
        if (trend > 0) return 'text-success';
        if (trend < 0) return 'text-error';
        return 'text-base-content';
    }

    function getTrendIcon(trend: number): string {
        if (trend > 0) return '↑';
        if (trend < 0) return '↓';
        return '→';
    }
</script>

<div class="container mx-auto p-6">
    <!-- Header -->
    <div class="mb-6">
        <div class="flex items-center gap-2 text-sm breadcrumbs mb-2">
            <ul>
                <li><a href="/seller/products">My Products</a></li>
                <li>{data.product.name}</li>
                <li>Analytics</li>
            </ul>
        </div>
        <div class="flex justify-between items-start">
            <div>
                <h1 class="text-3xl font-bold">{data.product.name}</h1>
                <p class="text-gray-600 mt-1">In-depth analytics and performance metrics</p>
            </div>
            <div class="flex gap-2">
                <a href="/seller/products/{data.product.id}/edit" class="btn btn-outline btn-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Product
                </a>
                <a href="/products/{data.product.id}" class="btn btn-ghost btn-sm" target="_blank">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Live
                </a>
            </div>
        </div>
    </div>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- Total Views -->
        <div class="stats shadow">
            <div class="stat">
                <div class="stat-figure text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </div>
                <div class="stat-title">Total Views</div>
                <div class="stat-value text-primary">{formatNumber(data.totals.views)}</div>
                <div class="stat-desc {getTrendColor(data.viewsTrend)}">
                    {getTrendIcon(data.viewsTrend)} {formatPercent(data.viewsTrend)} from last week
                </div>
            </div>
        </div>

        <!-- Total Purchases -->
        <div class="stats shadow">
            <div class="stat">
                <div class="stat-figure text-success">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <div class="stat-title">Total Purchases</div>
                <div class="stat-value text-success">{formatNumber(data.totals.purchases)}</div>
                <div class="stat-desc {getTrendColor(data.purchasesTrend)}">
                    {getTrendIcon(data.purchasesTrend)} {formatPercent(data.purchasesTrend)} from last week
                </div>
            </div>
        </div>

        <!-- Total Downloads -->
        <div class="stats shadow">
            <div class="stat">
                <div class="stat-figure text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </div>
                <div class="stat-title">Total Downloads</div>
                <div class="stat-value text-secondary">{formatNumber(data.totals.downloads)}</div>
                <div class="stat-desc">After purchase downloads</div>
            </div>
        </div>

        <!-- Conversion Rate -->
        <div class="stats shadow">
            <div class="stat">
                <div class="stat-figure text-accent">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
                <div class="stat-title">Conversion Rate</div>
                <div class="stat-value text-accent">{data.conversionRate.toFixed(2)}%</div>
                <div class="stat-desc">Purchases / Views</div>
            </div>
        </div>
    </div>

    <!-- Engagement Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <!-- Bookmarks -->
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h3 class="card-title text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Bookmarks
                </h3>
                <div class="flex items-baseline gap-2">
                    <span class="text-3xl font-bold">{formatNumber(data.totals.bookmarks)}</span>
                    <span class="text-sm text-gray-600">total</span>
                </div>
                <div class="text-sm text-gray-600">
                    {data.bookmarkRate.toFixed(2)}% bookmark rate
                </div>
            </div>
        </div>

        <!-- Cart Adds -->
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h3 class="card-title text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Cart Additions
                </h3>
                <div class="flex items-baseline gap-2">
                    <span class="text-3xl font-bold">{formatNumber(data.totals.cart_adds)}</span>
                    <span class="text-sm text-gray-600">total</span>
                </div>
                <div class="text-sm text-gray-600">
                    {data.cartAddRate.toFixed(2)}% cart add rate
                </div>
            </div>
        </div>

        <!-- Revenue -->
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h3 class="card-title text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Estimated Revenue
                </h3>
                <div class="flex items-baseline gap-2">
                    <span class="text-3xl font-bold">{formatPrice(data.product.price_cents * data.totals.purchases)}</span>
                </div>
                <div class="text-sm text-gray-600">
                    {formatNumber(data.totals.purchases)} × {formatPrice(data.product.price_cents)}
                </div>
            </div>
        </div>
    </div>

    <!-- 30-Day Trend Chart -->
    <div class="card bg-base-100 shadow-xl mb-8">
        <div class="card-body">
            <h2 class="card-title">30-Day Performance Trend</h2>
            
            {#if data.last30Days.length > 0}
                <div class="overflow-x-auto">
                    <table class="table table-zebra">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Views</th>
                                <th>Cart Adds</th>
                                <th>Purchases</th>
                                <th>Downloads</th>
                                <th>Bookmarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each data.last30Days as day}
                                <tr>
                                    <td>{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                                    <td>{formatNumber(day.views || 0)}</td>
                                    <td>{formatNumber(day.cart_adds || 0)}</td>
                                    <td class="font-semibold">{formatNumber(day.purchases || 0)}</td>
                                    <td>{formatNumber(day.downloads || 0)}</td>
                                    <td>{formatNumber(day.bookmarks || 0)}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else}
                <div class="text-center py-8 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p>No analytics data available yet</p>
                    <p class="text-sm mt-1">Data will appear once your product starts receiving views and interactions</p>
                </div>
            {/if}
        </div>
    </div>

    <!-- Product Info Summary -->
    <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
            <h2 class="card-title">Product Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-gray-600">Product Name</p>
                    <p class="font-semibold">{data.product.name}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Price</p>
                    <p class="font-semibold">{formatPrice(data.product.price_cents)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Status</p>
                    <p class="font-semibold capitalize">{data.product.status}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Featured</p>
                    <p class="font-semibold">{data.product.is_featured ? 'Yes' : 'No'}</p>
                </div>
            </div>
        </div>
    </div>
</div>
