<script lang="ts">
	import type {
		ProductWithScores,
		ProductWithRating,
		ScoreBreakdown,
		ProductFeature,
		ReviewWithBuyer
	} from '$lib/helpers/types';
	import ProductCard from './ProductCard.svelte';

	interface Props {
		product: ProductWithScores | ProductWithRating;
		scoreBreakdown?: ScoreBreakdown;
		features?: ProductFeature[];
		reviews?: ReviewWithBuyer[];
		similarProducts?: ProductWithScores[];
		categoryMetrics?: { metricDefinitions: any[]; metrics: Record<string, any> };
		averageRating?: number;
		isBookmarked?: boolean;
		isCompared?: boolean;
		cartQuantity?: number;
		oncompare?: () => void;
		onbookmark?: () => void;
		onaddtocart?: () => void;
		onupdatecartquantity?: (quantity: number) => void;
	}

	let {
		product,
		scoreBreakdown,
		features = [],
		reviews = [],
		categoryMetrics = { metricDefinitions: [], metrics: {} },
		similarProducts = [],
		averageRating: propAverageRating,
		isBookmarked = false,
		isCompared = false,
		cartQuantity = 0,
		oncompare,
		onbookmark,
		onaddtocart,
		onupdatecartquantity
	}: Props = $props();

	// Local state for animations and UI
	let isAnimating = $state(false);
	let showAddedMessage = $state(false);

	// Helper to format metric labels (replace underscores with spaces and capitalize)
	function formatMetricLabel(label: string): string {
		if (!label) return '';
		return label
			.replace(/_/g, ' ')
			.split(' ')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
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

	// Derive whether to show quantity controls
	const showQuantityControls = $derived(!showAddedMessage && cartQuantity > 0);

	// Calculate average rating from reviews or use provided value
	const averageRating = $derived(
		propAverageRating !== undefined
			? propAverageRating
			: reviews.length > 0
				? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
				: product.average_rating || 0
	);

	// Sort features by relevance score
	const sortedFeatures = $derived([...features].sort((a, b) => b.relevance_score - a.relevance_score));

	// Handle bookmark with animation
	function handleBookmark() {
		isAnimating = true;
		setTimeout(() => {
			isAnimating = false;
		}, 300);
		onbookmark?.();
	}

	// Handle add to cart
	function handleAddToCart() {
		onaddtocart?.();
		showAddedMessage = true;
		setTimeout(() => {
			showAddedMessage = false;
		}, 500);
	}

	// Handle quantity increase
	function handleIncreaseQuantity() {
		const newQuantity = cartQuantity + 1;
		onupdatecartquantity?.(newQuantity);
	}

	// Handle quantity decrease
	function handleDecreaseQuantity() {
		if (cartQuantity > 1) {
			const newQuantity = cartQuantity - 1;
			onupdatecartquantity?.(newQuantity);
		} else {
			onupdatecartquantity?.(0);
		}
	}
</script>

<div class="product-detail-view max-w-7xl mx-auto p-6">
	<!-- Hero Section -->
	<div class="hero bg-base-200 rounded-lg mb-8">
		<div class="hero-content flex-col lg:flex-row gap-8 w-full">
			<!-- Demo Visual -->
			<div class="flex-shrink-0">
				{#if product.demo_visual_url}
					<img
						src={product.demo_visual_url}
						alt="{product.name} demo"
						class="max-w-sm rounded-lg shadow-2xl"
					/>
				{:else}
					<div class="w-96 h-64 bg-base-300 rounded-lg flex items-center justify-center">
						<span class="text-6xl">📦</span>
					</div>
				{/if}
			</div>

			<!-- Product Info -->
			<div class="flex-1">
				<div class="flex items-start gap-4 mb-4">
					{#if product.logo_url}
						<img src={product.logo_url} alt="{product.name} logo" class="w-16 h-16 rounded-lg" />
					{/if}
					<div class="flex-1">
						<h1 class="text-4xl font-bold">{product.name}</h1>
						<p class="text-lg text-base-content/70 mt-2">{product.short_description}</p>
					</div>
				</div>

				<!-- Price and Overall Score -->
				<div class="flex items-center gap-6 mb-6">
					<div>
						<span class="text-4xl font-bold text-primary">${((product.price_cents || 0) / 100).toFixed(2)}</span>
						<span class="text-lg text-base-content/60">/month</span>
					</div>
					<div class="divider divider-horizontal"></div>
					{#if 'overall_score' in product}
						<div class="stat bg-base-300 rounded-lg p-4">
							<div class="stat-title">Overall Score</div>
							<div class="stat-value text-3xl">
								<span class="{getScoreColor(product.overall_score || 0)}">{product.overall_score || 0}</span><span class="text-lg text-gray-400 ml-1">/100</span>
							</div>
						</div>
					{/if}
				</div>

				<!-- Action Buttons -->
				<div class="flex gap-3">
					<!-- Add to Cart / Quantity Controls -->
					{#if !showQuantityControls && !showAddedMessage}
						<button class="btn btn-primary btn-lg" onclick={handleAddToCart}>
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
									d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
							Add to Cart
						</button>
					{:else if showAddedMessage}
						<button class="btn btn-success btn-lg" disabled>
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
									d="M5 13l4 4L19 7"
								/>
							</svg>
							Added!
						</button>
					{:else}
						<div class="btn-group">
							<button class="btn btn-primary btn-lg" onclick={handleDecreaseQuantity}>
								{#if cartQuantity === 1}
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
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								{:else}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
									</svg>
								{/if}
							</button>
							<button class="btn btn-primary btn-lg no-animation pointer-events-none">
								{cartQuantity}
							</button>
							<button class="btn btn-primary btn-lg" onclick={handleIncreaseQuantity}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
							</button>
						</div>
					{/if}

					<!-- Compare Button -->
					<button
						class="btn btn-lg {isCompared
							? 'btn-primary bg-blue-600 border-blue-600 hover:bg-blue-700'
							: 'btn-outline'}"
						onclick={oncompare}
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
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						{isCompared ? 'Compared' : 'Compare'}
					</button>

					<!-- Bookmark Button -->
					<button
						class="btn {isBookmarked ? 'btn-primary' : 'btn-outline'} btn-lg {isAnimating ? 'scale-110' : ''}"
						style="transition-duration: 300ms;"
						onclick={handleBookmark}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill={isBookmarked ? 'currentColor' : 'none'}
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Long Description -->
	<div class="card bg-base-100 shadow-xl mb-8">
		<div class="card-body">
			<h2 class="card-title text-2xl">About This Product</h2>
			<p class="text-base-content/80 whitespace-pre-line">{product.long_description}</p>
		</div>
	</div>

	<!-- Score Breakdown -->
	{#if 'fit_score' in product}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">Score Breakdown</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<div class="flex justify-between items-center mb-2">
							<span class="font-semibold">Fit Score</span>
							<span class="text-2xl font-bold">
								{product.fit_score || 0}<span class="text-sm text-gray-400 ml-1">/100</span>
							</span>
						</div>
						<progress
							class="progress progress-primary w-full"
							value={product.fit_score || 0}
							max="100"
						></progress>
						<p class="text-sm text-base-content/70 mt-2">
							How well the product fits into your workflow
						</p>
					</div>

					<div>
						<div class="flex justify-between items-center mb-2">
							<span class="font-semibold">Feature Score</span>
							<span class="text-2xl font-bold">
								{product.feature_score || 0}<span class="text-sm text-gray-400 ml-1">/100</span>
							</span>
						</div>
						<progress
							class="progress progress-secondary w-full"
							value={product.feature_score || 0}
							max="100"
						></progress>
						<p class="text-sm text-base-content/70 mt-2">Product completeness and capabilities</p>
					</div>

					<div>
						<div class="flex justify-between items-center mb-2">
							<span class="font-semibold">Integration Score</span>
							<span class="text-2xl font-bold">
								{product.integration_score || 0}<span class="text-sm text-gray-400 ml-1">/100</span>
							</span>
						</div>
						<progress
							class="progress progress-accent w-full"
							value={product.integration_score || 0}
							max="100"
						></progress>
						<p class="text-sm text-base-content/70 mt-2">Ease of integration with your stack</p>
					</div>

					<div>
						<div class="flex justify-between items-center mb-2">
							<span class="font-semibold">Review Score</span>
							<span class="text-2xl font-bold">{product.review_score || 0}</span>
						</div>
						<progress
							class="progress progress-info w-full"
							value={product.review_score || 0}
							max="100"
						></progress>
						<p class="text-sm text-base-content/70 mt-2">Customer satisfaction rating</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Category-Specific Metrics -->
	{#if categoryMetrics.metricDefinitions && categoryMetrics.metricDefinitions.length > 0}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4 capitalize">{product.category || 'Category'} Metrics</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each categoryMetrics.metricDefinitions as metricDef}
						{@const metricData = categoryMetrics.metrics[metricDef.code]}
						<div class="stat bg-base-200 rounded-lg">
							<div class="stat-title">{formatMetricLabel(metricDef.label)}</div>
							{#if metricData}
								{#if metricDef.data_type === 'boolean'}
									<div class="stat-value text-2xl">
										<span class="badge {metricData.value ? 'badge-success' : 'badge-ghost'} badge-lg">
											{metricData.value ? 'Yes' : 'No'}
										</span>
									</div>
								{:else if metricDef.data_type === 'number'}
									<div class="stat-value text-2xl">
										{metricData.value}
										{#if metricData.unit}
											<span class="text-lg">{metricData.unit}</span>
										{/if}
									</div>
								{:else}
									<div class="stat-value text-xl">{metricData.value}</div>
								{/if}
								{#if metricDef.description}
									<div class="stat-desc">{metricDef.description}</div>
								{/if}
							{:else}
								<div class="stat-value text-base-content/50">N/A</div>
								{#if metricDef.description}
									<div class="stat-desc">{metricDef.description}</div>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Features List -->
	{#if sortedFeatures.length > 0}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">Key Features</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each sortedFeatures as feature (feature.id)}
						<div class="flex items-start gap-3 p-3 bg-base-200 rounded-lg">
							<div class="badge badge-primary badge-lg">{feature.relevance_score}</div>
							<div class="flex-1">
								<h3 class="font-semibold">{feature.feature_name}</h3>
								{#if feature.feature_description}
									<p class="text-sm text-base-content/70">{feature.feature_description}</p>
								{/if}
								{#if feature.feature_category}
									<span class="badge badge-sm mt-1">{feature.feature_category}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Reviews Section -->
	<div class="card bg-base-100 shadow-xl mb-8">
		<div class="card-body">
			<div class="flex items-center justify-between mb-4">
				<h2 class="card-title text-2xl">Customer Reviews</h2>
				<div class="flex items-center gap-2">
					<div class="rating rating-md">
						{#each Array(5) as _, i}
							<input
								type="radio"
								class="mask mask-star-2 bg-orange-400"
								checked={i < Math.round(averageRating)}
								disabled
							/>
						{/each}
					</div>
					<span class="text-lg font-semibold">{averageRating.toFixed(1)}</span>
					<span class="text-base-content/60">({product.review_count || reviews.length} reviews)</span>
				</div>
			</div>

			{#if reviews.length > 0}
				<div class="space-y-4">
					{#each reviews as review (review.id)}
						<div class="border-l-4 border-primary pl-4 py-2">
							<div class="flex items-center gap-2 mb-2">
								<span class="font-semibold">{review.buyer.full_name || 'Anonymous'}</span>
								<div class="rating rating-sm">
									{#each Array(5) as _, i}
										<input
											type="radio"
											class="mask mask-star-2 bg-orange-400"
											checked={i < review.rating}
											disabled
										/>
									{/each}
								</div>
							</div>
							{#if review.title}
								<h4 class="font-semibold text-base mb-1">{review.title}</h4>
							{/if}
							{#if review.body}
								<p class="text-base-content/80">{review.body}</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8 text-base-content/60">
					<p>No reviews yet. Be the first to review this product!</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Similar Products -->
	{#if similarProducts.length > 0}
		<div class="mb-8">
			<h2 class="text-2xl font-bold mb-4">Similar Products</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each similarProducts as similarProduct (similarProduct.id)}
					<ProductCard product={similarProduct} variant="grid" />
				{/each}
			</div>
		</div>
	{/if}
</div>
