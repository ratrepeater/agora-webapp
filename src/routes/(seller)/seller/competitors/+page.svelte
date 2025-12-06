<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function handleProductChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		const productId = select.value;
		goto(`/seller/competitors?productId=${productId}`);
	}

	function formatPrice(cents: number): string {
		return `$${(cents / 100).toFixed(2)}`;
	}

	function formatPercentage(value: number): string {
		return `${(value * 100).toFixed(1)}%`;
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Page Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Competitor Analysis</h1>
		<p class="text-base-content/70">
			Understand your competitive position and identify opportunities for improvement
		</p>
	</div>

	{#if data.sellerProducts && data.sellerProducts.length > 0}
		<!-- Product Selector -->
		<div class="mb-8">
			<label for="product-select" class="label">
				<span class="label-text font-semibold">Select Product</span>
			</label>
			<select
				id="product-select"
				class="select select-bordered w-full max-w-md"
				value={data.selectedProduct?.id}
				onchange={handleProductChange}
			>
				{#each data.sellerProducts as product}
					<option value={product.id}>{product.name}</option>
				{/each}
			</select>
		</div>

		{#if data.competitorAnalysis && data.selectedProduct}
			<!-- Market Position Overview -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<div class="stat bg-base-200 rounded-lg">
					<div class="stat-title">Market Position</div>
					<div class="stat-value text-primary">
						{data.competitorAnalysis.market_position || 'N/A'}
					</div>
					<div class="stat-desc">Based on competitive analysis</div>
				</div>

				<div class="stat bg-base-200 rounded-lg">
					<div class="stat-title">Competitors Tracked</div>
					<div class="stat-value">
						{data.competitorAnalysis.competitors?.length || 0}
					</div>
					<div class="stat-desc">In your category</div>
				</div>

				<div class="stat bg-base-200 rounded-lg">
					<div class="stat-title">Your Price</div>
					<div class="stat-value text-secondary">
						{formatPrice(data.selectedProduct.price_cents)}
					</div>
					<div class="stat-desc">
						{#if data.competitorAnalysis.price_comparison}
							{data.competitorAnalysis.price_comparison.position}
						{/if}
					</div>
				</div>
			</div>

			<!-- Competitors Table -->
			{#if data.competitorAnalysis.competitors && data.competitorAnalysis.competitors.length > 0}
				<div class="card bg-base-100 shadow-xl mb-8">
					<div class="card-body">
						<h2 class="card-title mb-4">Main Competitors</h2>

						<div class="overflow-x-auto">
							<table class="table table-zebra">
								<thead>
									<tr>
										<th>Product</th>
										<th>Price</th>
										<th>Rating</th>
										<th>Reviews</th>
										<th>Similarity</th>
										<th>Market Overlap</th>
									</tr>
								</thead>
								<tbody>
									{#each data.competitorAnalysis.competitors as competitor}
										<tr>
											<td>
												<div class="flex items-center gap-3">
													{#if competitor.logo_url}
														<img
															src={competitor.logo_url}
															alt={competitor.name}
															class="w-10 h-10 rounded"
														/>
													{/if}
													<div>
														<div class="font-bold">{competitor.name}</div>
														<div class="text-sm text-base-content/70">
															{competitor.short_description?.substring(0, 50)}...
														</div>
													</div>
												</div>
											</td>
											<td>{formatPrice(competitor.price_cents)}</td>
											<td>
												<div class="flex items-center gap-1">
													<span>{competitor.average_rating?.toFixed(1) || 'N/A'}</span>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-4 w-4 text-warning"
														fill="currentColor"
														viewBox="0 0 20 20"
													>
														<path
															d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
														/>
													</svg>
												</div>
											</td>
											<td>{competitor.review_count || 0}</td>
											<td>
												<progress
													class="progress progress-primary w-20"
													value={competitor.similarity_score || 0}
													max="100"
												></progress>
												<span class="text-xs ml-2">
													{competitor.similarity_score?.toFixed(0) || 0}%
												</span>
											</td>
											<td>
												<progress
													class="progress progress-secondary w-20"
													value={competitor.market_overlap_score || 0}
													max="100"
												></progress>
												<span class="text-xs ml-2">
													{competitor.market_overlap_score?.toFixed(0) || 0}%
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			{/if}

			<!-- Improvement Suggestions -->
			{#if data.competitorAnalysis.improvement_suggestions && data.competitorAnalysis.improvement_suggestions.length > 0}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title mb-4">Improvement Suggestions</h2>

						<div class="space-y-4">
							{#each data.competitorAnalysis.improvement_suggestions as suggestion}
								<div class="alert alert-info">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										class="stroke-current shrink-0 w-6 h-6"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
									<span>{suggestion}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		{:else}
			<div class="alert alert-warning">
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
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<span>No competitor analysis available for this product yet.</span>
			</div>
		{/if}
	{:else}
		<!-- No Products State -->
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
					d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
				/>
			</svg>
			<h2 class="text-2xl font-bold mb-2">No products yet</h2>
			<p class="text-base-content/70 mb-6">
				Add products to your catalog to see competitor analysis.
			</p>
			<button class="btn btn-primary" onclick={() => goto('/seller/products/new')}>
				Add Your First Product
			</button>
		</div>
	{/if}
</div>
