<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import NavShell from '$lib/components/NavShell.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import "$lib/styles/global.css"
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />

	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
	<link href="https://fonts.googleapis.com/css2?family=Michroma&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap" rel="stylesheet">
</svelte:head>

<div class="flex flex-col min-h-screen">
	<NavShell 
		user={data.session?.user || null}
		userRole={data.userRole}
	>
		<div class="flex-1">
			{@render children?.()}
		</div>
	</NavShell>
	<Footer />
</div>


<style>
	:global(body) {
		position: relative;
		margin: 0;
	}
</style>