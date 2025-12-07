<script lang="ts">
	import type { ProductWithScores, ProductWithRating } from '$lib/helpers/types';

	interface Props {
		products: (ProductWithScores | ProductWithRating)[];
		category?: string | null;
		categoryMetrics?: { metricDefinitions: any[]; metrics: Record<string, any> };
		comparisonMetrics?: string[];
		addProductLabel?: string;
		cartQuantities?: Map<string, number>;
		onremove?: (productId: string) => void;
		onaddtocart?: (productId: string) => void;
		onupdatecartquantity?: (productId: string, quantity: number) => void;
		onviewdetails?: (productId: string) => void;
		onaddproduct?: () => void;
	}

	let { 
		products = [], 
		category = null,
		categoryMetrics = { metricDefinitions: [], metrics: {} },
		comparisonMetrics = [], 
		addProductLabel = 'Add Product',
		cartQuantities = new Map(),
		onremove, 
		onaddtocart, 
		onupdatecartquantity,
		onviewdetails, 
		onaddproduct 
	}: Props = $props();
	
	// Track UI state for each product
	let showAddedMessage = $state<Map<string, boolean>>(new Map());
	
	// Derive whether to show quantity controls based on cart quantities and added message
	function shouldShowQuantityControls(productId: string): boolean {
		const isShowingAdded = showAddedMessage.get(productId) || false;
		if (isShowingAdded) {
			return false;
		}
		const qty = cartQuantities.get(productId) || 0;
		return qty > 0;
	}
	
	let canAddMore = $derived(products.length < 3);
	let emptySlots = $derived(Math.max(0, 3 - products.length));

	// Helper to check if product has scores
	function hasScores(p: ProductWithScores | ProductWithRating): p is ProductWithScores {
		return 'overall_score' in p;
	}

	// Helper to format metric labels (replace underscores with spaces and capitalize)
	function formatMetricLabel(label: string): string {
		if (!label) return '';
		const formatted = label
			.replace(/_/g, ' ')
			.split(' ')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
		console.log('Formatting label:', label, '→', formatted);
		return formatted;
	}

	// Get color class based on score - refined red/yellow/green gradient
	function getScoreColor(score: number): string {
		// Green range (80-100): deeper green as score increases
		if (score >= 90) return 'text-green-600'; // Deep green: 90-100
		if (score >= 80) return 'text-green-500'; // Standard green: 80-89
		
		// Yellow range (60-79): slight gradient toward lime (high) and orange (low)
		if (score >= 75) return 'text-lime-500'; // Lime-ish: 75-79
		if (score >= 70) return 'text-yellow-500'; // Standard yellow: 70-74
		if (score >= 60) return 'text-orange-400'; // Orange-ish: 60-69
		
		// Red range (0-59): darker red as score decreases
		if (score >= 50) return 'text-red-500'; // Standard red: 50-59
		if (score >= 30) return 'text-red-600'; // Darker red: 30-49
		return 'text-red-700'; // Very dark red: 0-29
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
		
		// Show "Added!" message
		showAddedMessage.set(productId, true);
		showAddedMessage = new Map(showAddedMessage);
		setTimeout(() => {
			showAddedMessage.delete(productId);
			showAddedMessage = new Map(showAddedMessage);
		}, 500);
	}

	function handleIncreaseQuantity(productId: string, e: MouseEvent) {
		e.stopPropagation();
		const currentQty = cartQuantities.get(productId) || 0;
		onupdatecartquantity?.(productId, currentQty + 1);
	}

	function handleDecreaseQuantity(productId: string, e: MouseEvent) {
		e.stopPropagation();
		const currentQty = cartQuantities.get(productId) || 0;
		if (currentQty > 1) {
			onupdatecartquantity?.(productId, currentQty - 1);
		} else {
			onupdatecartquantity?.(productId, 0);
		}
	}

	function handleViewDetails(productId: string, e: MouseEvent) {
		e.stopPropagation();
		onviewdetails?.(productId);
	}
</script>

<!-- Comparison table -->
{#if products.length === 0}
	<div class="text-center py-16">
		<p class="text-xl mb-4">No products to compare</p>
		<button class="btn btn-primary" onclick={() => onaddproduct?.()}>
			Browse Products
		</button>
	</div>
{:else}
<div class="overflow-x-auto">
		<table class="table w-full" style="table-layout: fixed;">
			<thead>
				<tr>
					<th class="sticky left-0 bg-base-200 z-10 whitespace-nowrap" style="width: 200px;">Feature</th>
					{#each products as product}
						{@const qty = cartQuantities.get(product.id) || 0}
						{@const showAdded = showAddedMessage.get(product.id) || false}
						{@const showQty = shouldShowQuantityControls(product.id)}
						
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
								{#if !showQty && !showAdded}
									<button
										class="btn btn-sm btn-primary w-full"
										onclick={(e) => handleAddToCart(product.id, e)}
										aria-label="Add {product.name} to cart"
									>
										Add to Cart
									</button>
								{:else if showAdded}
									<button class="btn btn-sm btn-success w-full" disabled>
										Added!
									</button>
								{:else}
									<div class="btn-group w-full">
										<button class="btn btn-sm btn-primary" onclick={(e) => handleDecreaseQuantity(product.id, e)}>
											{#if qty === 1}
												<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											{:else}
												<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
												</svg>
											{/if}
										</button>
										<button class="btn btn-sm btn-primary no-animation pointer-events-none">
											{qty}
										</button>
										<button class="btn btn-sm btn-primary" onclick={(e) => handleIncreaseQuantity(product.id, e)}>
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
											</svg>
										</button>
									</div>
								{/if}
								
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
									onclick={() => onaddproduct?.()}
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
									{addProductLabel}
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
				<!-- Divider Row -->
				<tr>
					<td colspan={products.length + emptySlots + 1} class="p-0">
						<div class="border-t-2 border-black"></div>
					</td>
				</tr>


				<!-- Price -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Price</td>
					{#each products as product}
						<td class="text-center">
							<div class="flex flex-col items-center gap-1">
								<div class="flex items-center gap-2">
									<span
										class="text-xl font-bold {isBestPrice(product.price_cents || 0)
											? 'text-success'
											: 'text-base-content'}"
									>
										${((product.price_cents || 0) / 100).toFixed(2)}
									</span>
									<span class="text-sm text-base-content/60">/month</span>
									{#if isBestPrice(product.price_cents || 0)}
										<div class="badge badge-success badge-sm">Best Price</div>
									{/if}
								</div>
							</div>
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
							<div class="flex items-center justify-center gap-2">
								<span class="text-xl">
									<span class="{getScoreColor(product.overall_score || 0)}">
										{product.overall_score || 0}</span><span class="text-sm text-gray-400 ml-0.5">/100</span>
								</span>
								{#if isBestScore(product.overall_score || 0, 'overall_score')}
									<div class="badge badge-success badge-sm">Highest</div>
								{/if}
							</div>
						</td>
					{/each}
					{#each Array(emptySlots) as _, i}
						<td class="bg-base-200"></td>
					{/each}
				</tr>

				<!-- Divider Row -->
				<tr>
					<td colspan={products.length + emptySlots + 1} class="p-0">
						<div class="border-t-2 border-black"></div>
					</td>
				</tr>

				<!-- Fit Score -->
				<tr>
					<td class="sticky left-0 bg-base-200 font-semibold">Fit Score</td>
					{#each products as product}
						<td class="text-center">
							<div class="flex items-center justify-center gap-2">
								<span class="text-xl">
									<span class="{getScoreColor(product.fit_score || 0)}">
										{product.fit_score || 0}</span><span class="text-sm text-gray-400 ml-0.5">/100</span>
								</span>
								{#if isBestScore(product.fit_score || 0, 'fit_score')}
									<div class="badge badge-success badge-sm">Highest</div>
								{/if}
							</div>
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
							<div class="flex items-center justify-center gap-2">
								<span class="text-xl">
									<span class="{getScoreColor(product.feature_score || 0)}">
										{product.feature_score || 0}</span><span class="text-sm text-gray-400 ml-0.5">/100</span>
								</span>
								{#if isBestScore(product.feature_score || 0, 'feature_score')}
									<div class="badge badge-success badge-sm">Highest</div>
								{/if}
							</div>
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
							<div class="flex items-center justify-center gap-2">
								<span class="text-xl">
									<span class="{getScoreColor(product.integration_score || 0)}">
										{product.integration_score || 0}</span><span class="text-sm text-gray-400 ml-0.5">/100</span>
								</span>
								{#if isBestScore(product.integration_score || 0, 'integration_score')}
									<div class="badge badge-success badge-sm">Highest</div>
								{/if}
							</div>
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
							<div class="flex items-center justify-center gap-2">
								<span class="text-xl">
									<span class="{getScoreColor(product.review_score || 0)}">
										{product.review_score || 0}</span><span class="text-sm text-gray-400 ml-0.5">/100</span>
								</span>
								{#if isBestScore(product.review_score || 0, 'review_score')}
									<div class="badge badge-success badge-sm">Highest</div>
								{/if}
							</div>
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

				<!-- Divider Row -->
				<tr>
					<td colspan={products.length + emptySlots + 1} class="p-0">
						<div class="border-t-2 border-black"></div>
					</td>
				</tr>

				<!-- Category-Specific Metrics Section -->
				{#if categoryMetrics.metricDefinitions && categoryMetrics.metricDefinitions.length > 0}
					<tr class="bg-base-300">
						<td class="sticky left-0 bg-base-300"></td>
						<td colspan={products.length + emptySlots} class="font-bold text-center py-3">
							Category-Specific Metrics
						</td>
					</tr>

					<!-- Divider Row -->
					<tr>
						<td colspan={products.length + emptySlots + 1} class="p-0">
							<div class="border-t-2 border-black"></div>
						</td>
					</tr>

					{#each categoryMetrics.metricDefinitions as metricDef}
						<tr>
							<td class="sticky left-0 bg-base-200 font-semibold">
								{formatMetricLabel(metricDef.label)}
								{#if metricDef.description}
									<div class="text-xs font-normal text-base-content/60 mt-1">
										{metricDef.description}
									</div>
								{/if}
							</td>
							{#each products as product}
								{@const metricData = categoryMetrics.metrics[product.id]?.[metricDef.code]}
								<td class="text-center">
									{#if metricData}
										{#if metricDef.data_type === 'boolean'}
											<span class="badge {metricData.value ? 'badge-success' : 'badge-ghost'}">
												{metricData.value ? 'Yes' : 'No'}
											</span>
										{:else if metricDef.data_type === 'number'}
											<span class="text-lg">
												{metricData.value}
												{#if metricData.unit}
													<span class="text-sm text-base-content/60">{metricData.unit}</span>
												{/if}
											</span>
										{:else}
											<span class="text-base">{metricData.value}</span>
										{/if}
									{:else}
										<span class="text-sm text-base-content/60">N/A</span>
									{/if}
								</td>
							{/each}
							{#each Array(emptySlots) as _, i}
								<td class="bg-base-200"></td>
							{/each}
						</tr>
					{/each}
				{/if}

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

{/if}
