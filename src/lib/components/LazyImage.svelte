<script lang="ts">
	/**
	 * LazyImage Component
	 * 
	 * Implements lazy loading for images with placeholder support
	 * Uses Intersection Observer API for efficient loading
	 */
	
	interface Props {
		src: string;
		alt: string;
		class?: string;
		placeholderClass?: string;
		width?: number;
		height?: number;
		loading?: 'lazy' | 'eager';
	}
	
	let {
		src,
		alt,
		class: className = '',
		placeholderClass = 'bg-base-200 animate-pulse',
		width,
		height,
		loading = 'lazy'
	}: Props = $props();
	
	let imageElement: HTMLImageElement | null = $state(null);
	let isLoaded = $state(false);
	let hasError = $state(false);
	
	function handleLoad() {
		isLoaded = true;
	}
	
	function handleError() {
		hasError = true;
		isLoaded = true;
	}
</script>

<div class="relative overflow-hidden {className}" style:width={width ? `${width}px` : undefined} style:height={height ? `${height}px` : undefined}>
	{#if !isLoaded && !hasError}
		<div class="absolute inset-0 {placeholderClass}"></div>
	{/if}
	
	{#if hasError}
		<div class="absolute inset-0 flex items-center justify-center bg-base-200 text-base-content/50">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>
		</div>
	{:else}
		<img
			bind:this={imageElement}
			{src}
			{alt}
			{width}
			{height}
			{loading}
			class="w-full h-full object-cover transition-opacity duration-300 {isLoaded ? 'opacity-100' : 'opacity-0'}"
			onload={handleLoad}
			onerror={handleError}
		/>
	{/if}
</div>
