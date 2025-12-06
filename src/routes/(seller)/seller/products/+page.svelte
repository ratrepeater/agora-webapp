<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let deletingProductId = $state<string | null>(null);
	let showDeleteModal = $state(false);
	let productToDelete = $state<{ id: string; name: string } | null>(null);

	function confirmDelete(productId: string, productName: string) {
		productToDelete = { id: productId, name: productName };
		showDeleteModal = true;
	}

	function cancelDelete() {
		showDeleteModal = false;
		productToDelete = null;
	}

	function formatPrice(priceCents: number): string {
		return `$${(priceCents / 100).toFixed(2)}`;
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="container mx-auto p-6">
	<!-- Header -->
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">My Products</h1>
			<p class="text-gray-600 mt-1">Manage your marketplace listings</p>
		</div>
		<a href="/seller/products/new" class="btn btn-primary">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add New Product
		</a>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="alert alert-success mb-4">
			<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<span>{form.message}</span>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert alert-error mb-4">
			<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<span>{form.error}</span>
		</div>
	{/if}

	<!-- Products List -->
	{#if data.products.length === 0}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body text-center py-12">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
				</svg>
				<h2 class="text-2xl font-bold mb-2">No products yet</h2>
				<p class="text-gray-600 mb-4">Get started by creating your first product listing</p>
				<a href="/seller/products/new" class="btn btn-primary">Create Your First Product</a>
			</div>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each data.products as product}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<div class="flex gap-4">
							<!-- Product Image -->
							<div class="flex-shrink-0">
								{#if product.logo_url}
									<img src={product.logo_url} alt={product.name} class="w-20 h-20 object-cover rounded-lg" />
								{:else}
									<div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
									</div>
								{/if}
							</div>

							<!-- Product Info -->
							<div class="flex-grow">
								<div class="flex justify-between items-start">
									<div>
										<h3 class="card-title text-xl">
											{product.name}
											{#if product.is_featured}
												<span class="badge badge-primary badge-sm">Featured</span>
											{/if}
											{#if product.status === 'draft'}
												<span class="badge badge-warning badge-sm">Draft</span>
											{:else if product.status === 'archived'}
												<span class="badge badge-error badge-sm">Archived</span>
											{/if}
										</h3>
										<p class="text-gray-600 mt-1">{product.short_description}</p>
									</div>
									<div class="text-right">
										<p class="text-2xl font-bold">{formatPrice(product.price_cents)}</p>
										<div class="flex items-center gap-1 text-sm text-gray-600 mt-1">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
											</svg>
											<span>{product.average_rating.toFixed(1)} ({product.review_count} reviews)</span>
										</div>
									</div>
								</div>

								<div class="flex gap-2 mt-4 text-sm text-gray-600">
									<span>Created: {formatDate(product.created_at)}</span>
									<span>•</span>
									<span>Updated: {formatDate(product.updated_at)}</span>
								</div>

								<!-- Actions -->
								<div class="card-actions justify-end mt-4">
									<a href="/seller/products/{product.id}/edit" class="btn btn-sm btn-outline">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
										Edit
									</a>
									<a href="/seller/products/{product.id}/analytics" class="btn btn-sm btn-primary">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
										</svg>
										See In-Depth Analytics
									</a>
									<button
										type="button"
										class="btn btn-sm btn-error btn-outline"
										onclick={() => confirmDelete(product.id, product.name)}
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
										Delete
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && productToDelete}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg">Confirm Deletion</h3>
			<p class="py-4">
				Are you sure you want to delete <strong>{productToDelete.name}</strong>?
				This action cannot be undone. The product will be removed from the marketplace but will remain visible in historical order data.
			</p>
			<div class="modal-action">
				<button type="button" class="btn btn-ghost" onclick={cancelDelete}>Cancel</button>
				<form method="POST" action="?/delete" use:enhance={() => {
					deletingProductId = productToDelete?.id || null;
					return async ({ update }) => {
						await update();
						deletingProductId = null;
						showDeleteModal = false;
						productToDelete = null;
					};
				}}>
					<input type="hidden" name="productId" value={productToDelete.id} />
					<button
						type="submit"
						class="btn btn-error"
						disabled={deletingProductId === productToDelete.id}
					>
						{#if deletingProductId === productToDelete.id}
							<span class="loading loading-spinner"></span>
							Deleting...
						{:else}
							Delete Product
						{/if}
					</button>
				</form>
			</div>
		</div>
		<div class="modal-backdrop" onclick={cancelDelete}></div>
	</div>
{/if}
