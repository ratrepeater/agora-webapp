<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { dashboard } = data;

	// Format currency
	function formatCurrency(cents: number): string {
		return `$${(cents / 100).toFixed(2)}`;
	}

	// Format number with commas
	function formatNumber(num: number): string {
		return num.toLocaleString();
	}

	// Get trend icon
	function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
		if (trend === 'up') return '↑';
		if (trend === 'down') return '↓';
		return '→';
	}

	// Get trend color
	function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
		if (trend === 'up') return 'text-success';
		if (trend === 'down') return 'text-error';
		return 'text-base-content';
	}
</script>

<div class="container mx-auto p-4 max-w-7xl">
	<h1 class="text-3xl font-bold mb-6">Seller Analytics Dashboard</h1>

	<!-- Overview Metrics -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		<div class="card bg-base-200 shadow-md">
			<div class="card-body">
				<h2 class="card-title text-sm">Total Products</h2>
				<p class="text-3xl font-bold">{formatNumber(dashboard.total_products)}</p>
			</div>
		</div>

		<div class="card bg-base-200 shadow-md">
			<div class="card-body">
				<h2 class="card-title text-sm">Total Revenue</h2>
				<p class="text-3xl font-bold">{formatCurrency(dashboard.total_revenue)}</p>
			</div>
		</div>

		<div class="card bg-base-200 shadow-md">
			<div class="card-body">
				<h2 class="card-title text-sm">Total Orders</h2>
				<p class="text-3xl font-bold">{formatNumber(dashboard.total_orders)}</p>
			</div>
		</div>

		<div class="card bg-base-200 shadow-md">
			<div class="card-body">
				<h2 class="card-title text-sm">Average Rating</h2>
				<p class="text-3xl font-bold">{dashboard.average_rating.toFixed(1)} ⭐</p>
			</div>
		</div>
	</div>

	<!-- Performance Charts -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
		<!-- Revenue Trend -->
		<div class="card bg-base-100 shadow-md">
			<div class="card-body">
				<h2 class="card-title">Revenue Trend</h2>
				{#if dashboard.revenue_trend.length > 0}
					<div class="space-y-2">
						{#each dashboard.revenue_trend.slice(-7) as point}
							<div class="flex justify-between items-center">
								<span class="text-sm">{point.date}</span>
								<span class="font-semibold">{formatCurrency(point.value)}</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-500">No revenue data yet</p>
				{/if}
			</div>
		</div>

		<!-- Order Trend -->
		<div class="card bg-base-100 shadow-md">
			<div class="card-body">
				<h2 class="card-title">Order Trend</h2>
				{#if dashboard.order_trend.length > 0}
					<div class="space-y-2">
						{#each dashboard.order_trend.slice(-7) as point}
							<div class="flex justify-between items-center">
								<span class="text-sm">{point.date}</span>
								<span class="font-semibold">{formatNumber(point.value)}</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-500">No order data yet</p>
				{/if}
			</div>
		</div>

		<!-- Conversion Trend -->
		<div class="card bg-base-100 shadow-md">
			<div class="card-body">
				<h2 class="card-title">Conversion Trend</h2>
				{#if dashboard.conversion_trend.length > 0}
					<div class="space-y-2">
						{#each dashboard.conversion_trend.slice(-7) as point}
							<div class="flex justify-between items-center">
								<span class="text-sm">{point.date}</span>
								<span class="font-semibold">{formatNumber(point.value)}</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-500">No conversion data yet</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Product Performance -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
		<!-- Top Products -->
		<div class="card bg-base-100 shadow-md">
			<div class="card-body">
				<h2 class="card-title">Top Performing Products</h2>
				{#if dashboard.top_products.length > 0}
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Product</th>
									<th>Views</th>
									<th>Conv. Rate</th>
									<th>Revenue</th>
									<th>Trend</th>
								</tr>
							</thead>
							<tbody>
								{#each dashboard.top_products as product}
									<tr>
										<td class="font-medium">{product.product.name}</td>
										<td>{formatNumber(product.views)}</td>
										<td>{(product.conversion_rate * 100).toFixed(1)}%</td>
										<td>{formatCurrency(product.revenue)}</td>
										<td class={getTrendColor(product.trend)}>
											{getTrendIcon(product.trend)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="text-sm text-gray-500">No product data yet</p>
				{/if}
			</div>
		</div>

		<!-- Underperforming Products -->
		<div class="card bg-base-100 shadow-md">
			<div class="card-body">
				<h2 class="card-title">Underperforming Products</h2>
				{#if dashboard.underperforming_products.length > 0}
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Product</th>
									<th>Views</th>
									<th>Conv. Rate</th>
									<th>Revenue</th>
									<th>Trend</th>
								</tr>
							</thead>
							<tbody>
								{#each dashboard.underperforming_products as product}
									<tr>
										<td class="font-medium">{product.product.name}</td>
										<td>{formatNumber(product.views)}</td>
										<td>{(product.conversion_rate * 100).toFixed(1)}%</td>
										<td>{formatCurrency(product.revenue)}</td>
										<td class={getTrendColor(product.trend)}>
											{getTrendIcon(product.trend)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="text-sm text-gray-500">No product data yet</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Recent Reviews -->
	<div class="card bg-base-100 shadow-md mb-8">
		<div class="card-body">
			<h2 class="card-title">Recent Reviews</h2>
			{#if dashboard.recent_reviews.length > 0}
				<div class="space-y-4">
					{#each dashboard.recent_reviews as review}
						<div class="border-b border-base-300 pb-4 last:border-b-0">
							<div class="flex justify-between items-start mb-2">
								<div>
									<p class="font-semibold">{review.buyer.full_name || review.buyer.email}</p>
									<p class="text-sm text-gray-500">
										{new Date(review.created_at).toLocaleDateString()}
									</p>
								</div>
								<div class="rating rating-sm">
									{#each Array(5) as _, i}
										<span class={i < review.rating ? 'text-warning' : 'text-gray-300'}>★</span>
									{/each}
								</div>
							</div>
							{#if review.title}
								<p class="font-medium mb-1">{review.title}</p>
							{/if}
							{#if review.body}
								<p class="text-sm">{review.body}</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-gray-500">No reviews yet</p>
			{/if}
		</div>
	</div>

	<!-- Market Position -->
	<div class="card bg-base-100 shadow-md">
		<div class="card-body">
			<h2 class="card-title">Market Position</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<p class="text-sm text-gray-500">Category</p>
					<p class="font-semibold">{dashboard.market_position.category}</p>
				</div>
				<div>
					<p class="text-sm text-gray-500">Rank</p>
					<p class="font-semibold">
						#{dashboard.market_position.rank} of {dashboard.market_position.total_competitors}
					</p>
				</div>
				<div>
					<p class="text-sm text-gray-500">Market Share</p>
					<p class="font-semibold">{dashboard.market_position.market_share.toFixed(1)}%</p>
				</div>
				<div>
					<p class="text-sm text-gray-500">Position</p>
					<p class="font-semibold capitalize">{dashboard.market_position.position}</p>
				</div>
			</div>
		</div>
	</div>
</div>
