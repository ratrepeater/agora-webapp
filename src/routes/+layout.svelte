<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="header">
	Hi
</div>

{@render children?.()}

<style>
	:global(body) {
		position: relative;
		margin: 0;
	}

	.header {
		position: sticky;
		top: 0;
		z-index: 10;
		width: 100%;
		height: 72px;
		background-color: hsla(0, 0%, 95%, 0.3);
		box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(12px);
	}
</style>