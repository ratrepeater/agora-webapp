<script lang="ts">
	interface Props {
		variant?: 'grid' | 'carousel';
	}

	let { variant = 'grid' }: Props = $props();
</script>

<div class="card bg-base-100 shadow-xl animate-pulse">
	<!-- Demo Visual Skeleton -->
	<figure class="aspect-video bg-base-300"></figure>

	<div class="card-body">
		<!-- Logo and Name Skeleton -->
		<div class="flex items-start gap-3 mb-2">
			<div class="w-12 h-12 rounded-lg bg-base-300"></div>
			<div class="flex-1 space-y-2">
				<div class="h-6 bg-base-300 rounded w-3/4"></div>
				<div class="h-4 bg-base-300 rounded w-1/2"></div>
			</div>
		</div>

		<!-- Description Skeleton -->
		<div class="space-y-2 mb-4">
			<div class="h-4 bg-base-300 rounded w-full"></div>
			<div class="h-4 bg-base-300 rounded w-5/6"></div>
		</div>

		<!-- Metrics Skeleton -->
		<div class="grid grid-cols-2 gap-2 mb-4">
			<div class="h-8 bg-base-300 rounded"></div>
			<div class="h-8 bg-base-300 rounded"></div>
			<div class="h-8 bg-base-300 rounded"></div>
			<div class="h-8 bg-base-300 rounded"></div>
		</div>

		<!-- Price and Actions Skeleton -->
		<div class="flex items-center justify-between">
			<div class="h-8 bg-base-300 rounded w-24"></div>
			<div class="flex gap-2">
				<div class="h-10 w-10 bg-base-300 rounded-lg"></div>
				<div class="h-10 w-10 bg-base-300 rounded-lg"></div>
			</div>
		</div>
	</div>
</div>

