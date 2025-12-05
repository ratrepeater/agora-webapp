<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-4">My Products</h1>
	<p>Product management page - to be implemented</p>
	<p class="text-sm text-gray-600">User: {data.session?.user.email}</p>
	<p class="text-sm text-gray-600">Role: {data.userRole}</p>
</div>
