<script lang="ts">
	import type { ProductWithScores, ProductWithRating } from '$lib/helpers/types';
	import LazyImage from './LazyImage.svelte';

	interface Props {
		product: ProductWithScores | ProductWithRating;
		showCompareButton?: boolean;
		showBookmarkButton?: boolean;
		showAddToCartButton?: boolean;
		variant?: 'grid' | 'carousel';
		isBookmarked?: boolean;
		isCompared?: boolean;
		isInCart?: boolean;
		cartQuantity?: number;
		oncompare?: () => void;
		onbookmark?: () => void;
		onaddtocart?: () => void;
		onupdatecartquantity?: (quantity: number) => void;
		onclick?: () => void;
	}

	let {
		product,
		showCompareButton = true,
		showBookmarkButton = true,
		showAddToCartButton = true,
		variant = 'grid',
		isBookmarked = false,
		isCompared = false,
		isInCart = false,
		cartQuantity = 0,
		oncompare,
		onbookmark,
		onaddtocart,
		onupdatecartquantity,
		onclick
	}: Props = $props();

	// Animation state
	let isAnimating = $state(false);
	let showAddedMessage = $state(false);
	let showQuantityControls = $state(cartQuantity > 0);

	// Helper to check if product has scores
	function hasScores(p: ProductWithScores | ProductWithRating): p is ProductWithScores {
		return 'overall_score' in p;
	}

	function handleCompare(e: MouseEvent | KeyboardEvent) {
		e.stopPropagation();
		oncompare?.();
	}

	function handleBookmark(e: MouseEvent | KeyboardEvent) {
		e.stopPropagation();

		// Trigger animation
		isAnimating = true;
		setTimeout(() => {
			isAnimating = false;
		}, 300);

		onbookmark?.();
	}

	function handleAddToCart(e: MouseEvent | KeyboardEvent) {
		e.stopPropagation();

		// Call the add to cart callback immediately
		onaddtocart?.();

		// Show "Added!" message for 0.5 seconds
		showAddedMessage = true;
		setTimeout(() => {
			showAddedMessage = false;
			showQuantityControls = true;
		}, 500);
	}

	function handleIncreaseQuantity(e: MouseEvent | KeyboardEvent) {
		e.stopPropagation();
		const newQuantity = cartQuantity + 1;
		onupdatecartquantity?.(newQuantity);
	}

	function handleDecreaseQuantity(e: MouseEvent | KeyboardEvent) {
		e.stopPropagation();
		if (cartQuantity > 1) {
			const newQuantity = cartQuantity - 1;
			onupdatecartquantity?.(newQuantity);
		} else {
			// If quantity becomes 0, hide quantity controls
			showQuantityControls = false;
			onupdatecartquantity?.(0);
		}
	}

	function handleClick() {
		onclick?.();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}

	// Update showQuantityControls when cartQuantity changes from parent
	$effect(() => {
		if (cartQuantity > 0 && !showAddedMessage) {
			showQuantityControls = true;
		} else if (cartQuantity === 0) {
			showQuantityControls = false;
		}
	});
</script>

<div
	class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer {variant ===
		'carousel'
		? 'w-80 flex-shrink-0'
		: 'w-full h-full'} flex flex-col"
	onclick={handleClick}
	role="article"
	tabindex="0"
	aria-label="Product: {product.name}"
	onkeydown={handleKeyDown}
>
	<!-- Demo Visual -->
	{#if product.demo_visual_url}
		<figure class="relative h-48 overflow-hidden">
			<LazyImage
				src={product.demo_visual_url}
				alt="{product.name} demo"
				class="w-full h-48"
				height={192}
			/>
			<!-- Category Badge Overlay -->
			{#if product.category}
				<div class="absolute top-2 left-2">
					<span class="badge badge-primary badge-lg capitalize font-semibold shadow-lg">
						{product.category}
					</span>
				</div>
			{/if}
		</figure>
	{:else}
		<figure class="relative h-48 bg-base-200 flex items-center justify-center">
			<span class="text-base-content/30 text-4xl">📦</span>
			<!-- Category Badge Overlay -->
			{#if product.category}
				<div class="absolute top-2 left-2">
					<span class="badge badge-primary badge-lg capitalize font-semibold shadow-lg">
						{product.category}
					</span>
				</div>
			{/if}
		</figure>
	{/if}

	<div class="card-body p-4 flex-1 flex flex-col">
		<!-- Logo and Name -->
		<div class="flex items-start gap-3 mb-2">
			{#if product.logo_url}
				<LazyImage
					src={product.logo_url}
					alt="{product.name} logo"
					class="w-12 h-12 rounded-lg"
					width={48}
					height={48}
				/>
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
			<span class="text-2xl font-bold text-primary"
				>${((product.price_cents || 0) / 100).toFixed(2)}</span
			>
			<span class="text-sm text-base-content/60">/month</span>
		</div>

		<!-- Scores (only show if product has scores) -->
		{#if hasScores(product)}
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
		{/if}

		<!-- Review Score -->
		<div class="flex items-center gap-2 mb-4">
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
				{product.average_rating?.toFixed(1) || '0.0'} ({product.review_count || 0} reviews)
			</span>
		</div>

		<!-- Action Buttons -->
		<div class="card-actions justify-end gap-2 mt-auto">
			{#if showCompareButton}
				<button
					class="btn btn-sm {isCompared
						? 'btn-primary bg-blue-600 border-blue-600 hover:bg-blue-700'
						: 'btn-outline'}"
					onclick={handleCompare}
					aria-label="{isCompared ? 'Product is being compared' : 'Compare'} {product.name}"
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
					{isCompared ? 'Compared' : 'Compare'}
				</button>
			{/if}

			{#if showBookmarkButton}
				<button
					class="btn btn-sm transition-all {isBookmarked
						? 'btn-primary bg-blue-600 border-blue-600 hover:bg-blue-700'
						: 'btn-outline'}"
					style="transition-duration: 300ms;"
					onclick={handleBookmark}
					aria-label="{isBookmarked ? 'Remove bookmark from' : 'Bookmark'} {product.name}"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 transition-all {isAnimating
							? 'scale-150 rotate-12'
							: 'scale-100 rotate-0'}"
						style="transition-duration: 300ms;"
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
				{#if showAddedMessage}
					<!-- "Added!" message -->
					<button
						class="btn btn-sm btn-success bg-green-600 border-green-600"
						disabled
						aria-label="Added to cart"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Added!
					</button>
				{:else if showQuantityControls && cartQuantity > 0}
					<!-- Quantity controls -->
					<div class="join">
						<button
							class="btn btn-sm btn-primary join-item"
							onclick={handleDecreaseQuantity}
							aria-label="{cartQuantity === 1 ? 'Remove from cart' : 'Decrease quantity'}"
						>
							{#if cartQuantity === 1}
								<!-- Trash icon when quantity is 1 -->
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
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							{:else}
								<!-- Minus sign when quantity > 1 -->
								−
							{/if}
						</button>
						<button class="btn btn-sm btn-primary join-item pointer-events-none" disabled>
							{cartQuantity}
						</button>
						<button
							class="btn btn-sm btn-primary join-item"
							onclick={handleIncreaseQuantity}
							aria-label="Increase quantity"
						>
							+
						</button>
					</div>
				{:else}
					<!-- Add to Cart button -->
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
			{/if}
		</div>
	</div>
</div>
