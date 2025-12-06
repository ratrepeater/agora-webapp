<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	const { dashboard } = data;

	// Format currency
	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(cents / 100);
	}

	// Format date
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Get status badge class
	function getStatusClass(status: string): string {
		switch (status) {
			case 'completed':
				return 'badge-success';
			case 'in_progress':
				return 'badge-info';
			case 'paused':
				return 'badge-warning';
			default:
				return 'badge-ghost';
		}
	}
</script>

<div class="container mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6">My Dashboard</h1>

	{#if data.error}
		<div class="alert alert-error">
			<span>{data.error}</span>
		</div>
	{:else if dashboard}
		<!-- Overview Stats -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
			<div class="stat bg-base-200 rounded-lg">
				<div class="stat-title">Total Spent</div>
				<div class="stat-value text-primary">${dashboard.total_spent.toFixed(2)}</div>
			</div>

			<div class="stat bg-base-200 rounded-lg">
				<div class="stat-title">Active Products</div>
				<div class="stat-value text-secondary">{dashboard.active_products}</div>
			</div>

			<div class="stat bg-base-200 rounded-lg">
				<div class="stat-title">Average ROI</div>
				<div class="stat-value text-accent">{dashboard.average_roi.toFixed(1)}%</div>
			</div>

			<div class="stat bg-base-200 rounded-lg">
				<div class="stat-title">Total Products</div>
				<div class="stat-value">{dashboard.purchased_products.length}</div>
			</div>
		</div>

		<!-- Purchased Products -->
		<div class="mb-8">
			<h2 class="text-2xl font-bold mb-4">My Products</h2>

			{#if dashboard.purchased_products.length === 0}
				<div class="alert">
					<span>You haven't purchased any products yet.</span>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="table table-zebra w-full">
						<thead>
							<tr>
								<th>Product</th>
								<th>Purchase Date</th>
								<th>Status</th>
								<th>Usage Count</th>
								<th>ROI</th>
								<th>Satisfaction</th>
							</tr>
						</thead>
						<tbody>
							{#each dashboard.purchased_products as product}
								<tr>
									<td>
										<div class="flex items-center gap-3">
											{#if product.product.logo_url}
												<div class="avatar">
													<div class="mask mask-squircle w-12 h-12">
														<img src={product.product.logo_url} alt={product.product.name} />
													</div>
												</div>
											{/if}
											<div>
												<div class="font-bold">{product.product.name}</div>
												<div class="text-sm opacity-50">
													{formatCurrency(product.product.price_cents)}
												</div>
											</div>
										</div>
									</td>
									<td>{formatDate(product.purchase_date)}</td>
									<td>
										<span class="badge {getStatusClass(product.implementation_status)}">
											{product.implementation_status.replace('_', ' ')}
										</span>
									</td>
									<td>{product.usage_count}</td>
									<td>
										{#if product.roi_actual !== null}
											<span class="font-semibold">{product.roi_actual.toFixed(1)}%</span>
											{#if product.roi_expected !== null}
												<span class="text-sm opacity-50">
													/ {product.roi_expected.toFixed(1)}%
												</span>
											{/if}
										{:else}
											<span class="text-sm opacity-50">N/A</span>
										{/if}
									</td>
									<td>
										{#if product.satisfaction_score !== null}
											<div class="rating rating-sm">
												{#each Array(5) as _, i}
													<input
														type="radio"
														class="mask mask-star-2 bg-orange-400"
														checked={i < product.satisfaction_score}
														disabled
													/>
												{/each}
											</div>
										{:else}
											<span class="text-sm opacity-50">Not rated</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<!-- Well Performing Products -->
		{#if dashboard.well_performing_products.length > 0}
			<div class="mb-8">
				<h2 class="text-2xl font-bold mb-4">Top Performing Products</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					{#each dashboard.well_performing_products as product}
						<div class="card bg-base-200">
							<div class="card-body">
								<h3 class="card-title">{product.product.name}</h3>
								<div class="space-y-2">
									<div class="flex justify-between">
										<span>Usage:</span>
										<span class="font-semibold">{product.usage_count} times</span>
									</div>
									{#if product.roi_actual !== null}
										<div class="flex justify-between">
											<span>ROI:</span>
											<span class="font-semibold text-success">{product.roi_actual.toFixed(1)}%</span>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Underutilized Products -->
		{#if dashboard.underutilized_products.length > 0}
			<div class="mb-8">
				<h2 class="text-2xl font-bold mb-4">Underutilized Products</h2>
				<div class="alert alert-warning">
					<span>These products have low usage. Consider reviewing their implementation.</span>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
					{#each dashboard.underutilized_products as product}
						<div class="card bg-base-200">
							<div class="card-body">
								<h3 class="card-title">{product.product.name}</h3>
								<div class="space-y-2">
									<div class="flex justify-between">
										<span>Usage:</span>
										<span class="font-semibold text-warning">{product.usage_count} times</span>
									</div>
									<div class="flex justify-between">
										<span>Status:</span>
										<span class="badge {getStatusClass(product.implementation_status)}">
											{product.implementation_status.replace('_', ' ')}
										</span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Spending by Category -->
		{#if dashboard.spending_by_category.length > 0}
			<div class="mb-8">
				<h2 class="text-2xl font-bold mb-4">Spending by Category</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{#each dashboard.spending_by_category as category}
						<div class="stat bg-base-200 rounded-lg">
							<div class="stat-title">{category.category}</div>
							<div class="stat-value text-sm">${category.amount.toFixed(2)}</div>
							<div class="stat-desc">{category.product_count} products</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Implementation Timeline -->
		{#if dashboard.implementation_timeline.length > 0}
			<div class="mb-8">
				<h2 class="text-2xl font-bold mb-4">Implementation Timeline</h2>
				<div class="overflow-x-auto">
					<table class="table w-full">
						<thead>
							<tr>
								<th>Product</th>
								<th>Start Date</th>
								<th>Expected Completion</th>
								<th>Actual Completion</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							{#each dashboard.implementation_timeline as item}
								<tr>
									<td>{item.product_name}</td>
									<td>{formatDate(item.start_date)}</td>
									<td>
										{#if item.expected_completion}
											{formatDate(item.expected_completion)}
										{:else}
											<span class="text-sm opacity-50">N/A</span>
										{/if}
									</td>
									<td>
										{#if item.actual_completion}
											{formatDate(item.actual_completion)}
										{:else}
											<span class="text-sm opacity-50">In progress</span>
										{/if}
									</td>
									<td>
										<span class="badge {getStatusClass(item.status)}">
											{item.status.replace('_', ' ')}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}
</div>
