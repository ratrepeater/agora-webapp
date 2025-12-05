<script lang="ts">
	import type { ProductWithScores } from '$lib/helpers/types';

	interface Props {
		products: ProductWithScores[];
		onremove?: (productId: string) => void;
		onaddtocart?: (productId: string) => void;
		onviewdetails?: (productId: string) => void;
	}

	let { products = [], onremove, onaddtocart, onviewdetails }: Props = $props();

	// Helper function to get the highest value in a metric across products
	function getHighestValue(metric: keyof ProductWithScores): number {
		return Math.max(...products.map((p) => (p[metric] as number) || 0));
	}

	// Helper function to get the lowest price
	function getLowestPrice(): number {
		return Math.min(...products.map((p) => p.price));
	}

	// Helper function to check if a value is the best (highest for scores, lowest for price)
	function isBestScore(value: number, metric: keyof ProductWithScores): boolean {
		return value === getHighestValue(metric);
	}

	function isBestPrice(value: number): boolean {
		return value === getLowestPrice();
	}

	function handleRemove(productId: string, e: MouseEvent) {
		e.stopPropagation();
		onremove?.(productId);
	}

	function handleAddToCart(productId: string, e: MouseEvent) {
		e.stopPropagation();
		onaddtocart?.(productId);
	}

	function handleViewDetails(productId: string, e: MouseEvent) {
		e.stopPropagation();
		onviewdetails?.(productId);
	}
</script>

{#if products.length < 2}
	<!-- Empty state for fewer than 2 products -->
	<div class="flex flex-col items-center justify-center py-16 px-4 text-center">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-24 w-24 text-base-content/30 mb-4"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
			/>
		</svg>
		<h3 class="text-2xl font-bold mb-2">Add Products to Compare</h3>
		<p class="text-base-content/70 max-w-md">
			You need at least 2 products to make a meaningful comparison. Browse the marketplace and add
			products using the "Compare" button.
		</p>
	</div>
{:else}
	<!-- Comparison table -->
	<div class="overflow-x-auto">
		<table class="table table-zebra w-full">
			<thead>
				<tr>
					<th class="sticky left-0 bg-base-200 z-10">Feature</th>
					{#each products as product}
						<th class="text-center min-w-[280px]">
							<div class="flex flex-col items-center gap-2 p-2">
								<!-- Product header -->
								<div class="flex items-center gap-2">
									{#if product.logo_url}
										<img
											src={product.logo_url}
											alt="{product.name} logo"
											class="w-12 h-12 rounded-lg"
										/>
									{:else}
										<div class="w-12 h-12 rounded-lg bg-base-300 flex items-center justify-center">
											<span class="text-2xl">🏢</span>
										</div>
									{/if}
									<div class="text-left">
										<div class="font-bold text-base">{product.name}</div>
									</div>
								</div>

								<!-- Demo visual -->
								{#if product.demo_visual_url}
									<img
										src={product.demo_visual_url}
										alt="{product.name} demo"
										class="w-full h-32 object-cover rounded-lg"
									/>
								{:else}
									<div
										class="w-full h-32 bg-base-300 rounded-lg flex items-center justify-center"
									>
										<span class="text-4xl">📦</span>
									</div>
								{/if}

								<!-- Action buttons -->
								<div class="flex gap-2 w-full">
									<button
										class="btn btn-sm btn-error btn-outline flex-1"
										onclick={(e) => handleRemove(product.id, e)}
										aria-label="Remove {product.name} from comparison"
									>
										Remove
									</button>
									<button
										class="btn btn-sm btn-primary flex-1"
										onclick={(e) => handleAddToCart(product.id, e)}
										aria-label="Add {product.name} to cart"
									>
										Add to Cart
									</button>
								</div>
								<button
									class="btn btn-sm btn-ghost w-full"
									onclick={(e) => handleViewDetails(product.id, e)}
									aria-label="View {product.name} details"
								>
									View Details
								</button>
							</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				<!-- Price -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Price</td>
					{#each products as product}
						<td class="text-center">
							<span
								class="text-xl font-bold {isBestPrice(product.price)
									? 'text-success'
									: 'text-base-content'}"
							>
								${product.price.toFixed(2)}
							</span>
							<span class="text-sm text-base-content/60">/month</span>
							{#if isBestPrice(product.price)}
								<div class="badge badge-success badge-sm mt-1">Best Price</div>
							{/if}
						</td>
					{/each}
				</tr>

				<!-- Overall Score -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Overall Score</td>
					{#each products as product}
						<td class="text-center">
							<span
								class="text-2xl font-bold {isBestScore(product.overall_score || 0, 'overall_score')
									? 'text-success'
									: 'text-base-content'}"
							>
								{product.overall_score || 0}
							</span>
							{#if isBestScore(product.overall_score || 0, 'overall_score')}
								<div class="badge badge-success badge-sm mt-1">Highest</div>
							{/if}
						</td>
					{/each}
				</tr>

				<!-- Fit Score -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Fit Score</td>
					{#each products as product}
						<td class="text-center">
							<span
								class="text-xl {isBestScore(product.fit_score || 0, 'fit_score')
									? 'text-success font-bold'
									: 'text-base-content'}"
							>
								{product.fit_score || 0}
							</span>
							{#if isBestScore(product.fit_score || 0, 'fit_score')}
								<div class="badge badge-success badge-sm mt-1">Highest</div>
							{/if}
						</td>
					{/each}
				</tr>

				<!-- Feature Score -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Feature Score</td>
					{#each products as product}
						<td class="text-center">
							<span
								class="text-xl {isBestScore(product.feature_score || 0, 'feature_score')
									? 'text-success font-bold'
									: 'text-base-content'}"
							>
								{product.feature_score || 0}
							</span>
							{#if isBestScore(product.feature_score || 0, 'feature_score')}
								<div class="badge badge-success badge-sm mt-1">Highest</div>
							{/if}
						</td>
					{/each}
				</tr>

				<!-- Integration Score -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Integration Score</td>
					{#each products as product}
						<td class="text-center">
							<span
								class="text-xl {isBestScore(product.integration_score || 0, 'integration_score')
									? 'text-success font-bold'
									: 'text-base-content'}"
							>
								{product.integration_score || 0}
							</span>
							{#if isBestScore(product.integration_score || 0, 'integration_score')}
								<div class="badge badge-success badge-sm mt-1">Highest</div>
							{/if}
						</td>
					{/each}
				</tr>

				<!-- Review Score -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Review Score</td>
					{#each products as product}
						<td class="text-center">
							<span
								class="text-xl {isBestScore(product.review_score || 0, 'review_score')
									? 'text-success font-bold'
									: 'text-base-content'}"
							>
								{product.review_score || 0}
							</span>
							{#if isBestScore(product.review_score || 0, 'review_score')}
								<div class="badge badge-success badge-sm mt-1">Highest</div>
							{/if}
						</td>
					{/each}
				</tr>

				<!-- Average Rating -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Average Rating</td>
					{#each products as product}
						<td class="text-center">
							<div class="flex flex-col items-center gap-1">
								<div class="rating rating-sm">
									{#each Array(5) as _, i}
										<input
											type="radio"
											class="mask mask-star-2 bg-orange-400"
											checked={i < Math.round(product.average_rating || 0)}
											disabled
										/>
									{/each}
								</div>
								<span class="text-sm text-base-content/70">
									{product.average_rating?.toFixed(1) || '0.0'}
								</span>
							</div>
						</td>
					{/each}
				</tr>

				<!-- Review Count -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Review Count</td>
					{#each products as product}
						<td class="text-center">
							<span class="text-base">{product.review_count || 0} reviews</span>
						</td>
					{/each}
				</tr>

				<!-- Extended Metrics Section Header -->
				<tr class="bg-base-300">
					<td colspan={products.length + 1} class="font-bold text-center py-3">
						Extended Metrics
					</td>
				</tr>

				<!-- ROI Percentage -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">ROI</td>
					{#each products as product}
						<td class="text-center">
							<span
								class="text-lg {isBestScore(product.roi_percentage || 0, 'roi_percentage')
									? 'text-success font-bold'
									: 'text-base-content'}"
							>
								{product.roi_percentage ? `${product.roi_percentage}%` : 'N/A'}
							</span>
							{#if product.roi_percentage && isBestScore(product.roi_percentage, 'roi_percentage')}
								<div class="badge badge-success badge-sm mt-1">Highest</div>
							{/if}
						</td>
					{/each}
				</tr>

				<!-- Retention Rate -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Retention Rate</td>
					{#each products as product}
						<td class="text-center">
							<span
								class="text-lg {isBestScore(product.retention_rate || 0, 'retention_rate')
									? 'text-success font-bold'
									: 'text-base-content'}"
							>
								{product.retention_rate ? `${product.retention_rate}%` : 'N/A'}
							</span>
							{#if product.retention_rate && isBestScore(product.retention_rate, 'retention_rate')}
								<div class="badge badge-success badge-sm mt-1">Highest</div>
							{/if}
						</td>
					{/each}
				</tr>

				<!-- Implementation Time -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Implementation Time</td>
					{#each products as product}
						<td class="text-center">
							<span class="text-base">
								{product.implementation_time_days
									? `${product.implementation_time_days} days`
									: 'N/A'}
							</span>
						</td>
					{/each}
				</tr>

				<!-- Cloud/Client Classification -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Deployment Model</td>
					{#each products as product}
						<td class="text-center">
							<span class="badge badge-outline">
								{product.cloud_client_classification || 'N/A'}
							</span>
						</td>
					{/each}
				</tr>

				<!-- Access Depth -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Access Depth</td>
					{#each products as product}
						<td class="text-center">
							<span class="text-base">{product.access_depth || 'N/A'}</span>
						</td>
					{/each}
				</tr>

				<!-- Quarter over Quarter Change -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Q/Q Change</td>
					{#each products as product}
						<td class="text-center">
							<span
								class="text-base {product.quarter_over_quarter_change && product.quarter_over_quarter_change > 0
									? 'text-success'
									: product.quarter_over_quarter_change && product.quarter_over_quarter_change < 0
										? 'text-error'
										: 'text-base-content'}"
							>
								{product.quarter_over_quarter_change
									? `${product.quarter_over_quarter_change > 0 ? '+' : ''}${product.quarter_over_quarter_change}%`
									: 'N/A'}
							</span>
						</td>
					{/each}
				</tr>

				<!-- Description -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold align-top">Description</td>
					{#each products as product}
						<td class="text-left align-top">
							<p class="text-sm text-base-content/80 line-clamp-4">
								{product.short_description}
							</p>
						</td>
					{/each}
				</tr>

				<!-- Features Section Header -->
				{#if products.some((p) => p.features && p.features.length > 0)}
					<tr class="bg-base-300">
						<td colspan={products.length + 1} class="font-bold text-center py-3">
							Key Features
						</td>
					</tr>

					<!-- Features -->
					<tr>
						<td class="sticky left-0 bg-base-200 font-semibold align-top">Features</td>
						{#each products as product}
							<td class="text-left align-top">
								{#if product.features && product.features.length > 0}
									<ul class="list-disc list-inside text-sm space-y-1">
										{#each product.features.slice(0, 5) as feature}
											<li class="text-base-content/80">{feature.feature_name}</li>
										{/each}
										{#if product.features.length > 5}
											<li class="text-base-content/60 italic">
												+{product.features.length - 5} more features
											</li>
										{/if}
									</ul>
								{:else}
									<span class="text-sm text-base-content/60">No features listed</span>
								{/if}
							</td>
						{/each}
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
{/if}
