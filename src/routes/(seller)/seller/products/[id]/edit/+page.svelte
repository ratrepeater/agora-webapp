<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Form state
	let isSubmitting = $state(false);
	let logoFile: File | null = $state(null);
	let demoVisualFile: File | null = $state(null);

	// Handle file input changes
	function handleLogoChange(event: Event) {
		const target = event.target as HTMLInputElement;
		logoFile = target.files?.[0] || null;
	}

	function handleDemoVisualChange(event: Event) {
		const target = event.target as HTMLInputElement;
		demoVisualFile = target.files?.[0] || null;
	}

	function formatPrice(priceCents: number): number {
		return priceCents / 100;
	}
</script>

<div class="container mx-auto p-6 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">Edit Product</h1>
		<p class="text-gray-600 mt-2">Update your product information</p>
	</div>

	<form method="POST" enctype="multipart/form-data" use:enhance={() => {
		isSubmitting = true;
		return async ({ update }) => {
			await update();
			isSubmitting = false;
		};
	}}>
		<!-- Basic Information -->
		<div class="card bg-base-100 shadow-xl mb-6">
			<div class="card-body">
				<h2 class="card-title text-xl mb-4">Basic Information</h2>

				<!-- Product Name -->
				<div class="form-control">
					<label class="label" for="name">
						<span class="label-text font-semibold">Product Name <span class="text-error">*</span></span>
					</label>
					<input
						type="text"
						id="name"
						name="name"
						class="input input-bordered"
						class:input-error={form?.errors?.name}
						value={data.product.name}
						required
						maxlength="100"
					/>
					{#if form?.errors?.name}
						<label class="label">
							<span class="label-text-alt text-error">{form.errors.name}</span>
						</label>
					{/if}
				</div>

				<!-- Short Description -->
				<div class="form-control">
					<label class="label" for="short_description">
						<span class="label-text font-semibold">Short Description <span class="text-error">*</span></span>
						<span class="label-text-alt">Max 200 characters</span>
					</label>
					<textarea
						id="short_description"
						name="short_description"
						class="textarea textarea-bordered h-20"
						class:textarea-error={form?.errors?.short_description}
						required
						maxlength="200"
					>{data.product.short_description}</textarea>
					{#if form?.errors?.short_description}
						<label class="label">
							<span class="label-text-alt text-error">{form.errors.short_description}</span>
						</label>
					{/if}
				</div>

				<!-- Long Description -->
				<div class="form-control">
					<label class="label" for="long_description">
						<span class="label-text font-semibold">Long Description <span class="text-error">*</span></span>
						<span class="label-text-alt">Detailed product information</span>
					</label>
					<textarea
						id="long_description"
						name="long_description"
						class="textarea textarea-bordered h-32"
						class:textarea-error={form?.errors?.long_description}
						required
					>{data.product.long_description || ''}</textarea>
					{#if form?.errors?.long_description}
						<label class="label">
							<span class="label-text-alt text-error">{form.errors.long_description}</span>
						</label>
					{/if}
				</div>

				<!-- Category -->
				<div class="form-control">
					<label class="label" for="category_id">
						<span class="label-text font-semibold">Category <span class="text-error">*</span></span>
					</label>
					<select
						id="category_id"
						name="category_id"
						class="select select-bordered"
						class:select-error={form?.errors?.category_id}
						required
					>
						<option value="">Select a category</option>
						{#each data.categories as category}
							<option value={category.id} selected={category.id === data.product.category_id}>
								{category.name}
							</option>
						{/each}
					</select>
					{#if form?.errors?.category_id}
						<label class="label">
							<span class="label-text-alt text-error">{form.errors.category_id}</span>
						</label>
					{/if}
				</div>

				<!-- Price -->
				<div class="form-control">
					<label class="label" for="price">
						<span class="label-text font-semibold">Price (USD) <span class="text-error">*</span></span>
					</label>
					<input
						type="number"
						id="price"
						name="price"
						class="input input-bordered"
						class:input-error={form?.errors?.price}
						value={formatPrice(data.product.price_cents)}
						required
						min="0"
						step="0.01"
						placeholder="99.99"
					/>
					{#if form?.errors?.price}
						<label class="label">
							<span class="label-text-alt text-error">{form.errors.price}</span>
						</label>
					{/if}
				</div>
			</div>
		</div>

		<!-- Media Files -->
		<div class="card bg-base-100 shadow-xl mb-6">
			<div class="card-body">
				<h2 class="card-title text-xl mb-4">Media Files</h2>

				<!-- Current Logo -->
				{#if data.product.logo_url}
					<div class="mb-4">
						<p class="text-sm font-semibold mb-2">Current Logo:</p>
						<img src={data.product.logo_url} alt="Current logo" class="w-32 h-32 object-cover rounded-lg" />
					</div>
				{/if}

				<!-- Logo Upload -->
				<div class="form-control">
					<label class="label" for="logo">
						<span class="label-text font-semibold">Update Logo</span>
						<span class="label-text-alt">PNG, JPG, or WebP (max 2MB)</span>
					</label>
					<input
						type="file"
						id="logo"
						name="logo"
						class="file-input file-input-bordered"
						class:file-input-error={form?.errors?.logo}
						accept="image/png,image/jpeg,image/webp"
						onchange={handleLogoChange}
					/>
					{#if logoFile}
						<label class="label">
							<span class="label-text-alt">Selected: {logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)</span>
						</label>
					{/if}
					{#if form?.errors?.logo}
						<label class="label">
							<span class="label-text-alt text-error">{form.errors.logo}</span>
						</label>
					{/if}
				</div>

				<!-- Current Demo Visual -->
				{#if data.product.demo_visual_url}
					<div class="mb-4 mt-4">
						<p class="text-sm font-semibold mb-2">Current Demo Visual:</p>
						<img src={data.product.demo_visual_url} alt="Current demo visual" class="w-full max-w-md rounded-lg" />
					</div>
				{/if}

				<!-- Demo Visual Upload -->
				<div class="form-control">
					<label class="label" for="demo_visual">
						<span class="label-text font-semibold">Update Demo Visual</span>
						<span class="label-text-alt">PNG, JPG, or WebP (max 5MB)</span>
					</label>
					<input
						type="file"
						id="demo_visual"
						name="demo_visual"
						class="file-input file-input-bordered"
						class:file-input-error={form?.errors?.demo_visual}
						accept="image/png,image/jpeg,image/webp"
						onchange={handleDemoVisualChange}
					/>
					{#if demoVisualFile}
						<label class="label">
							<span class="label-text-alt">Selected: {demoVisualFile.name} ({(demoVisualFile.size / 1024).toFixed(1)} KB)</span>
						</label>
					{/if}
					{#if form?.errors?.demo_visual}
						<label class="label">
							<span class="label-text-alt text-error">{form.errors.demo_visual}</span>
						</label>
					{/if}
				</div>
			</div>
		</div>

		<!-- Product Metrics -->
		<div class="card bg-base-100 shadow-xl mb-6">
			<div class="card-body">
				<h2 class="card-title text-xl mb-4">Product Metrics</h2>
				<p class="text-sm text-gray-600 mb-4">These metrics help buyers evaluate your product</p>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- ROI Percentage -->
					<div class="form-control">
						<label class="label" for="roi_percentage">
							<span class="label-text">ROI Percentage</span>
						</label>
						<input
							type="number"
							id="roi_percentage"
							name="roi_percentage"
							class="input input-bordered"
							value={data.metrics.roi_percentage || ''}
							min="0"
							max="1000"
							step="0.1"
							placeholder="150"
						/>
					</div>

					<!-- Retention Rate -->
					<div class="form-control">
						<label class="label" for="retention_rate">
							<span class="label-text">Retention Rate (%)</span>
						</label>
						<input
							type="number"
							id="retention_rate"
							name="retention_rate"
							class="input input-bordered"
							value={data.metrics.retention_rate || ''}
							min="0"
							max="100"
							step="0.1"
							placeholder="95"
						/>
					</div>

					<!-- Implementation Time -->
					<div class="form-control">
						<label class="label" for="implementation_time_days">
							<span class="label-text">Implementation Time (days)</span>
						</label>
						<input
							type="number"
							id="implementation_time_days"
							name="implementation_time_days"
							class="input input-bordered"
							value={data.metrics.implementation_time_days || ''}
							min="0"
							step="1"
							placeholder="14"
						/>
					</div>

					<!-- QoQ Change -->
					<div class="form-control">
						<label class="label" for="quarter_over_quarter_change">
							<span class="label-text">Quarter-over-Quarter Change (%)</span>
						</label>
						<input
							type="number"
							id="quarter_over_quarter_change"
							name="quarter_over_quarter_change"
							class="input input-bordered"
							value={data.metrics.quarter_over_quarter_change || ''}
							step="0.1"
							placeholder="15"
						/>
					</div>

					<!-- Cloud/Client Classification -->
					<div class="form-control">
						<label class="label" for="cloud_client_classification">
							<span class="label-text">Deployment Model</span>
						</label>
						<select
							id="cloud_client_classification"
							name="cloud_client_classification"
							class="select select-bordered"
						>
							<option value="">Select deployment model</option>
							<option value="cloud" selected={data.metrics.cloud_client_classification === 'cloud'}>Cloud</option>
							<option value="client" selected={data.metrics.cloud_client_classification === 'client'}>Client</option>
							<option value="hybrid" selected={data.metrics.cloud_client_classification === 'hybrid'}>Hybrid</option>
						</select>
					</div>

					<!-- Access Depth -->
					<div class="form-control">
						<label class="label" for="access_depth">
							<span class="label-text">Access Depth</span>
							<span class="label-text-alt">e.g., "api, dashboard, admin"</span>
						</label>
						<input
							type="text"
							id="access_depth"
							name="access_depth"
							class="input input-bordered"
							value={data.metrics.access_depth || ''}
							placeholder="api, dashboard"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Product Flags -->
		<div class="card bg-base-100 shadow-xl mb-6">
			<div class="card-body">
				<h2 class="card-title text-xl mb-4">Product Flags</h2>

				<div class="form-control">
					<label class="label cursor-pointer justify-start gap-4">
						<input
							type="checkbox"
							name="is_featured"
							class="checkbox"
							checked={data.product.is_featured}
						/>
						<div>
							<span class="label-text font-semibold">Featured Product</span>
							<p class="text-sm text-gray-600">Display this product in featured sections</p>
						</div>
					</label>
				</div>
			</div>
		</div>

		<!-- Form Actions -->
		<div class="flex gap-4 justify-end">
			<a href="/seller/products" class="btn btn-ghost">Cancel</a>
			<button
				type="submit"
				class="btn btn-primary"
				disabled={isSubmitting}
			>
				{#if isSubmitting}
					<span class="loading loading-spinner"></span>
					Updating...
				{:else}
					Update Product
				{/if}
			</button>
		</div>

		<!-- General Form Error -->
		{#if form?.error}
			<div class="alert alert-error mt-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>{form.error}</span>
			</div>
		{/if}
	</form>
</div>
