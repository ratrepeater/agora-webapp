<script lang="ts">
	import type { ProductWithScores } from '$lib/helpers/types';
	import ProductCard from './ProductCard.svelte';

	interface Props {
		title: string;
		products: ProductWithScores[];
		category?: string;
		showMoreLink?: string;
		onproductclick?: (product: ProductWithScores) => void;
		onshowmore?: () => void;
	}

	let {
		title,
		products,
		category,
		showMoreLink,
		onproductclick,
		onshowmore
	}: Props = $props();

	let scrollContainer: HTMLDivElement;

	function scrollLeft() {
		if (scrollContainer) {
			scrollContainer.scrollBy({ left: -400, behavior: 'smooth' });
		}
	}

	function scrollRight() {
		if (scrollContainer) {
			scrollContainer.scrollBy({ left: 400, behavior: 'smooth' });
		}
	}

	function handleProductClick(product: ProductWithScores) {
		onproductclick?.(product);
	}

	function handleShowMore() {
		onshowmore?.();
	}
</script>

<div class="product-row mb-8">
	<!-- Row Header -->
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-2xl font-bold">{title}</h2>
		{#if showMoreLink}
			<button class="btn btn-ghost btn-sm" onclick={handleShowMore}>
				View All
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 ml-1"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		{/if}
	</div>

	<!-- Scrollable Product Container -->
	<div class="relative group">
		<!-- Left Scroll Button -->
		<button
			class="btn btn-circle btn-sm absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
			onclick={scrollLeft}
			aria-label="Scroll left"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>

		<!-- Product Cards Container -->
		<div
			bind:this={scrollContainer}
			class="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar pb-4"
			style="scroll-padding: 0 1rem;"
		>
			{#each products as product (product.id)}
				<div class="snap-start">
					<ProductCard
						{product}
						variant="carousel"
						onclick={() => handleProductClick(product)}
					/>
				</div>
			{/each}
		</div>

		<!-- Right Scroll Button -->
		<button
			class="btn btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
			onclick={scrollRight}
			aria-label="Scroll right"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</button>
	</div>
</div>

<style>
	.hide-scrollbar {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}

	.hide-scrollbar::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}
</style>
