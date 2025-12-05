<script lang="ts">
	import type {
		ProductWithScores,
		ScoreBreakdown,
		ProductFeature,
		ReviewWithBuyer
	} from '$lib/helpers/types';
	import ProductCard from './ProductCard.svelte';

	interface Props {
		product: ProductWithScores;
		scoreBreakdown?: ScoreBreakdown;
		features?: ProductFeature[];
		reviews?: ReviewWithBuyer[];
		similarProducts?: ProductWithScores[];
		isBookmarked?: boolean;
		isInCart?: boolean;
		oncompare?: () => void;
		onbookmark?: () => void;
		onaddtocart?: () => void;
	}

	let {
		product,
		scoreBreakdown,
		features = [],
		reviews = [],
		similarProducts = [],
		isBookmarked = false,
		isInCart = false,
		oncompare,
		onbookmark,
		onaddtocart
	}: Props = $props();

	// Calculate average rating from reviews
	const averageRating = $derived(
		reviews.length > 0
			? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
			: product.average_rating || 0
	);

	// Sort features by relevance score
	const sortedFeatures = $derived([...features].sort((a, b) => b.relevance_score - a.relevance_score));
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
						<span class="text-4xl font-bold text-primary">${product.price.toFixed(2)}</span>
						<span class="text-lg text-base-content/60">/month</span>
					</div>
					<div class="divider divider-horizontal"></div>
					<div class="stat bg-base-300 rounded-lg p-4">
						<div class="stat-title">Overall Score</div>
						<div class="stat-value text-3xl">{product.overall_score || 0}</div>
						<div class="stat-desc">out of 100</div>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex gap-3">
					<button class="btn btn-primary btn-lg" onclick={onaddtocart} disabled={isInCart}>
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
						{isInCart ? 'In Cart' : 'Add to Cart'}
					</button>
					<button class="btn btn-outline btn-lg" onclick={oncompare}>
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
						Compare
					</button>
					<button
						class="btn {isBookmarked ? 'btn-primary' : 'btn-outline'} btn-lg"
						onclick={onbookmark}
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

	<!-- Extended Metrics -->
	<div class="card bg-base-100 shadow-xl mb-8">
		<div class="card-body">
			<h2 class="card-title text-2xl mb-4">Business Metrics</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#if product.roi_percentage !== null}
					<div class="stat bg-base-200 rounded-lg">
						<div class="stat-title">ROI</div>
						<div class="stat-value text-2xl">{product.roi_percentage}%</div>
						<div class="stat-desc">Return on Investment</div>
					</div>
				{/if}
				{#if product.retention_rate !== null}
					<div class="stat bg-base-200 rounded-lg">
						<div class="stat-title">Retention Rate</div>
						<div class="stat-value text-2xl">{product.retention_rate}%</div>
						<div class="stat-desc">Customer retention</div>
					</div>
				{/if}
				{#if product.quarter_over_quarter_change !== null}
					<div class="stat bg-base-200 rounded-lg">
						<div class="stat-title">QoQ Change</div>
						<div class="stat-value text-2xl {product.quarter_over_quarter_change >= 0 ? 'text-success' : 'text-error'}">
							{product.quarter_over_quarter_change > 0 ? '+' : ''}{product.quarter_over_quarter_change}%
						</div>
						<div class="stat-desc">Quarter over quarter</div>
					</div>
				{/if}
				{#if product.cloud_client_classification}
					<div class="stat bg-base-200 rounded-lg">
						<div class="stat-title">Deployment</div>
						<div class="stat-value text-2xl capitalize">{product.cloud_client_classification}</div>
						<div class="stat-desc">Deployment model</div>
					</div>
				{/if}
				{#if product.implementation_time_days !== null}
					<div class="stat bg-base-200 rounded-lg">
						<div class="stat-title">Implementation</div>
						<div class="stat-value text-2xl">{product.implementation_time_days}</div>
						<div class="stat-desc">Days to implement</div>
					</div>
				{/if}
				{#if product.access_depth}
					<div class="stat bg-base-200 rounded-lg">
						<div class="stat-title">Access Depth</div>
						<div class="stat-value text-xl">{product.access_depth}</div>
						<div class="stat-desc">System access levels</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Score Breakdown -->
	<div class="card bg-base-100 shadow-xl mb-8">
		<div class="card-body">
			<h2 class="card-title text-2xl mb-4">Score Breakdown</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<div class="flex justify-between items-center mb-2">
						<span class="font-semibold">Fit Score</span>
						<span class="text-2xl font-bold">{product.fit_score || 0}</span>
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
						<span class="text-2xl font-bold">{product.feature_score || 0}</span>
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
						<span class="text-2xl font-bold">{product.integration_score || 0}</span>
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
					<span class="text-base-content/60">({reviews.length} reviews)</span>
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
							{#if review.review_text}
								<p class="text-base-content/80">{review.review_text}</p>
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
