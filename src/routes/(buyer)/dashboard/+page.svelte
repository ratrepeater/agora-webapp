<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-4">Buyer Dashboard</h1>
	<p>Dashboard page - to be implemented</p>
	<p class="text-sm text-gray-600">User: {data.session?.user.email}</p>
</div>
