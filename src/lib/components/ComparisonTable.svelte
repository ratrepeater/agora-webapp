<script lang="ts">
	import type { ProductWithScores, ProductWithRating } from '$lib/helpers/types';

	interface Props {
		products: (ProductWithScores | ProductWithRating)[];
		comparisonMetrics?: string[];
		onremove?: (productId: string) => void;
		onaddtocart?: (productId: string) => void;
		onviewdetails?: (productId: string) => void;
		onaddproduct?: () => void;
	}

	let { products = [], comparisonMetrics = [], onremove, onaddtocart, onviewdetails, onaddproduct }: Props = $props();
	
	let canAddMore = $derived(products.length < 3);
	let emptySlots = $derived(Math.max(0, 3 - products.length));

	// Helper to check if product has scores
	function hasScores(p: ProductWithScores | ProductWithRating): p is ProductWithScores {
		return 'overall_score' in p;
	}

	// Helper function to get the highest value in a metric across products
	function getHighestValue(metric: string): number {
		return Math.max(...products.map((p) => {
			if (hasScores(p) && metric in p) {
				return (p[metric as keyof ProductWithScores] as number) || 0;
			}
			return 0;
		}));
	}

	// Helper function to get the lowest price
	function getLowestPrice(): number {
		return Math.min(...products.map((p) => p.price_cents || 0));
	}

	// Helper function to check if a value is the best (highest for scores, lowest for price)
	function isBestScore(value: number, metric: string): boolean {
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

<!-- Comparison table -->
<div class="overflow-x-auto">
		<table class="table w-full" style="table-layout: fixed;">
			<thead>
				<tr>
					<th class="sticky left-0 bg-base-200 z-10 whitespace-nowrap" style="width: 200px;">Feature</th>
					{#each products as product}
						<th class="text-center relative">
							<!-- Remove button (top-right corner) -->
							<button
								class="btn btn-sm btn-circle btn-error absolute top-2 right-2 z-20"
								onclick={(e) => handleRemove(product.id, e)}
								aria-label="Remove {product.name} from comparison"
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
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>

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
								<button
									class="btn btn-sm btn-primary w-full"
									onclick={(e) => handleAddToCart(product.id, e)}
									aria-label="Add {product.name} to cart"
								>
									Add to Cart
								</button>
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
					{#each Array(emptySlots) as _, i}
						<th class="text-center bg-base-200 p-0">
							<div class="flex flex-col items-center justify-center gap-4 p-8 h-full">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-16 w-16 text-base-content/30"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
								<button
									class="btn btn-lg btn-primary"
									onclick={onaddproduct}
									aria-label="Add another product to compare"
								>
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
											d="M12 4v16m8-8H4"
										/>
									</svg>
									Add Product
								</button>
								<p class="text-sm text-base-content/60 text-center">
									Compare up to 3 products
								</p>
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
								class="text-xl font-bold {isBestPrice(product.price_cents || 0)
									? 'text-success'
									: 'text-base-content'}"
							>
								${((product.price_cents || 0) / 100).toFixed(2)}
							</span>
							<span class="text-sm text-base-content/60">/month</span>
							{#if isBestPrice(product.price_cents || 0)}
								<div class="badge badge-success badge-sm mt-1">Best Price</div>
							{/if}
						</td>
					{/each}
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
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
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
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
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
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
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
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
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
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
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
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
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
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
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
					{/each}
				</tr>

				<!-- Extended Metrics Section Header -->
				<tr class="bg-base-300">
					<td class="sticky left-0 bg-base-300"></td>
					<td colspan={products.length + emptySlots} class="font-bold text-center py-3">
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
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
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
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
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
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
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
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
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
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
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
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
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
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
					{/each}
				</tr>

				<!-- Features Section Header -->
				{#if products.some((p) => p.features && p.features.length > 0)}
					<tr class="bg-base-300">
						<td class="sticky left-0 bg-base-300"></td>
						<td colspan={products.length + emptySlots} class="font-bold text-center py-3">
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
						{#each Array(emptySlots) as _, i}
							<td class="bg-base-200"></td>
						{/each}
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
