<script lang="ts">
	import ProductCardSkeleton from './ProductCardSkeleton.svelte';

	interface Props {
		title?: string;
		count?: number;
	}

	let { title = 'Loading...', count = 4 }: Props = $props();
</script>

<div class="mb-8">
	<!-- Title Skeleton -->
	<div class="flex items-center justify-between mb-4">
		{#if title}
			<h2 class="text-2xl font-bold">{title}</h2>
		{:else}
			<div class="h-8 bg-base-300 rounded w-48 animate-pulse"></div>
		{/if}
	</div>

	<!-- Product Cards Skeleton -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		{#each Array(count) as _, i (i)}
			<ProductCardSkeleton variant="carousel" />
		{/each}
	</div>
</div>

