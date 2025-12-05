<script lang="ts">
	import type { ProductWithScores } from '$lib/helpers/types';

	interface Props {
		product: ProductWithScores;
		showCompareButton?: boolean;
		showBookmarkButton?: boolean;
		showAddToCartButton?: boolean;
		variant?: 'grid' | 'carousel';
		isBookmarked?: boolean;
		isInCart?: boolean;
		oncompare?: () => void;
		onbookmark?: () => void;
		onaddtocart?: () => void;
		onclick?: () => void;
	}

	let {
		product,
		showCompareButton = true,
		showBookmarkButton = true,
		showAddToCartButton = true,
		variant = 'grid',
		isBookmarked = false,
		isInCart = false,
		oncompare,
		onbookmark,
		onaddtocart,
		onclick
	}: Props = $props();

	function handleCompare(e: MouseEvent) {
		e.stopPropagation();
		oncompare?.();
	}

	function handleBookmark(e: MouseEvent) {
		e.stopPropagation();
		onbookmark?.();
	}

	function handleAddToCart(e: MouseEvent) {
		e.stopPropagation();
		onaddtocart?.();
	}

	function handleClick() {
		onclick?.();
	}
</script>

<div
	class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer {variant ===
	'carousel'
		? 'w-80 flex-shrink-0'
		: 'w-full'}"
	onclick={handleClick}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
>
	<!-- Demo Visual -->
	{#if product.demo_visual_url}
		<figure class="relative h-48 overflow-hidden">
			<img
				src={product.demo_visual_url}
				alt="{product.name} demo"
				class="w-full h-full object-cover"
			/>
		</figure>
	{:else}
		<figure class="relative h-48 bg-base-200 flex items-center justify-center">
			<span class="text-base-content/30 text-4xl">📦</span>
		</figure>
	{/if}

	<div class="card-body p-4">
		<!-- Logo and Name -->
		<div class="flex items-start gap-3 mb-2">
			{#if product.logo_url}
				<img src={product.logo_url} alt="{product.name} logo" class="w-12 h-12 rounded-lg" />
			{:else}
				<div class="w-12 h-12 rounded-lg bg-base-200 flex items-center justify-center">
					<span class="text-2xl">🏢</span>
				</div>
			{/if}
			<div class="flex-1 min-w-0">
				<h3 class="card-title text-lg line-clamp-2">{product.name}</h3>
			</div>
		</div>

		<!-- Short Description -->
		<p class="text-sm text-base-content/70 line-clamp-2 mb-3">
			{product.short_description}
		</p>

		<!-- Price -->
		<div class="mb-3">
			<span class="text-2xl font-bold text-primary">${product.price.toFixed(2)}</span>
			<span class="text-sm text-base-content/60">/month</span>
		</div>

		<!-- Scores -->
		<div class="grid grid-cols-2 gap-2 mb-4">
			<div class="stat bg-base-200 rounded-lg p-2">
				<div class="stat-title text-xs">Overall</div>
				<div class="stat-value text-lg">{product.overall_score || 0}</div>
			</div>
			<div class="stat bg-base-200 rounded-lg p-2">
				<div class="stat-title text-xs">Fit</div>
				<div class="stat-value text-lg">{product.fit_score || 0}</div>
			</div>
			<div class="stat bg-base-200 rounded-lg p-2">
				<div class="stat-title text-xs">Features</div>
				<div class="stat-value text-lg">{product.feature_score || 0}</div>
			</div>
			<div class="stat bg-base-200 rounded-lg p-2">
				<div class="stat-title text-xs">Integration</div>
				<div class="stat-value text-lg">{product.integration_score || 0}</div>
			</div>
		</div>

		<!-- Review Score -->
		<div class="flex items-center gap-2 mb-4">
			<div class="rating rating-sm">
				{#each Array(5) as _, i}
					<input
						type="radio"
						class="mask mask-star-2 bg-orange-400"
						checked={i < Math.round((product.average_rating || 0))}
						disabled
					/>
				{/each}
			</div>
			<span class="text-sm text-base-content/70">
				{product.average_rating?.toFixed(1) || '0.0'} ({product.review_count || 0} reviews)
			</span>
		</div>

		<!-- Action Buttons -->
		<div class="card-actions justify-end gap-2">
			{#if showCompareButton}
				<button
					class="btn btn-sm btn-outline"
					onclick={handleCompare}
					aria-label="Compare {product.name}"
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
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
					Compare
				</button>
			{/if}

			{#if showBookmarkButton}
				<button
					class="btn btn-sm {isBookmarked ? 'btn-primary' : 'btn-outline'}"
					onclick={handleBookmark}
					aria-label="{isBookmarked ? 'Remove bookmark from' : 'Bookmark'} {product.name}"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
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
			{/if}

			{#if showAddToCartButton}
				<button
					class="btn btn-sm btn-primary"
					onclick={handleAddToCart}
					disabled={isInCart}
					aria-label="{isInCart ? 'Already in cart' : 'Add to cart'} {product.name}"
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
							d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
					{isInCart ? 'In Cart' : 'Add to Cart'}
				</button>
			{/if}
		</div>
	</div>
</div>
