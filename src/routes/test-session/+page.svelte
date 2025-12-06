<script lang="ts">
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto px-4 py-8">
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Session Test</h2>
			
			<div class="divider"></div>
			
			<p><strong>Has Session:</strong> {data.hasSession ? '✅ Yes' : '❌ No'}</p>
			<p><strong>User ID:</strong> {data.userId || 'None'}</p>
			<p><strong>Email:</strong> {data.userEmail || 'None'}</p>
			<p><strong>Role:</strong> {data.userRole || 'None'}</p>
			
			<div class="divider"></div>
			
			<pre class="bg-base-200 p-4 rounded overflow-auto">{JSON.stringify(data, null, 2)}</pre>
		</div>
	</div>
</div>
