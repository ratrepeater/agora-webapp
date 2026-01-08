<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { validateProductForm } from '$lib/helpers/validation';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Form state
	let isSubmitting = $state(false);
	let logoFile: File | null = $state(null);
	let demoVisualFile: File | null = $state(null);
	let clientErrors: Record<string, string> = $state({});
	let showValidation = $state(false);

	// Form values for client-side validation
	let formValues = $state({
		name: '',
		short_description: '',
		long_description: '',
		category_id: '',
		price: ''
	});

	// Handle file input changes
	function handleLogoChange(event: Event) {
		const target = event.target as HTMLInputElement;
		logoFile = target.files?.[0] || null;
		if (showValidation) {
			validateForm();
		}
	}

	function handleDemoVisualChange(event: Event) {
		const target = event.target as HTMLInputElement;
		demoVisualFile = target.files?.[0] || null;
		if (showValidation) {
			validateForm();
		}
	}

	// Client-side validation
	function validateForm(): boolean {
		const validation = validateProductForm({
			name: formValues.name,
			short_description: formValues.short_description,
			long_description: formValues.long_description,
			category_id: formValues.category_id,
			price: formValues.price,
			logo: logoFile,
			demo_visual: demoVisualFile
		});

		clientErrors = validation.errors;
		return validation.isValid;
	}

	// Handle form submission
	function handleSubmit(event: Event) {
		showValidation = true;
		if (!validateForm()) {
			event.preventDefault();
			// Scroll to first error
			const firstError = Object.keys(clientErrors)[0];
			if (firstError) {
				const element = document.getElementById(firstError);
				element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}
	}

	// Get error message (prefer server errors, fall back to client errors)
	function getError(field: string): string | undefined {
		return form?.errors?.[field] || (showValidation ? clientErrors[field] : undefined);
	}
</script>

<div class="container mx-auto p-6 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">Create New Product</h1>
		<p class="text-gray-600 mt-2">Add a new product to your marketplace listings</p>
	</div>

	<form 
		method="POST" 
		enctype="multipart/form-data" 
		onsubmit={handleSubmit}
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				isSubmitting = false;
			};
		}}
	>
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
						bind:value={formValues.name}
						oninput={() => showValidation && validateForm()}
						class="input input-bordered"
						class:input-error={getError('name')}
						required
						maxlength="100"
					/>
					{#if getError('name')}
						<label class="label">
							<span class="label-text-alt text-error">{getError('name')}</span>
						</label>
					{/if}
				</div>

				<!-- Short Description -->
				<div class="form-control">
					<label class="label" for="short_description">
						<span class="label-text font-semibold">Short Description <span class="text-error">*</span></span>
						<span class="label-text-alt">{formValues.short_description.length}/200 characters</span>
					</label>
					<textarea
						id="short_description"
						name="short_description"
						bind:value={formValues.short_description}
						oninput={() => showValidation && validateForm()}
						class="textarea textarea-bordered h-20"
						class:textarea-error={getError('short_description')}
						required
						maxlength="200"
					></textarea>
					{#if getError('short_description')}
						<label class="label">
							<span class="label-text-alt text-error">{getError('short_description')}</span>
						</label>
					{/if}
				</div>

				<!-- Long Description -->
				<div class="form-control">
					<label class="label" for="long_description">
						<span class="label-text font-semibold">Long Description <span class="text-error">*</span></span>
						<span class="label-text-alt">{formValues.long_description.length} characters (min 50)</span>
					</label>
					<textarea
						id="long_description"
						name="long_description"
						bind:value={formValues.long_description}
						oninput={() => showValidation && validateForm()}
						class="textarea textarea-bordered h-32"
						class:textarea-error={getError('long_description')}
						required
					></textarea>
					{#if getError('long_description')}
						<label class="label">
							<span class="label-text-alt text-error">{getError('long_description')}</span>
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
						bind:value={formValues.category_id}
						onchange={() => showValidation && validateForm()}
						class="select select-bordered"
						class:select-error={getError('category_id')}
						required
					>
						<option value="">Select a category</option>
						{#each data.categories as category}
							<option value={category.id}>{category.name}</option>
						{/each}
					</select>
					{#if getError('category_id')}
						<label class="label">
							<span class="label-text-alt text-error">{getError('category_id')}</span>
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
						bind:value={formValues.price}
						oninput={() => showValidation && validateForm()}
						class="input input-bordered"
						class:input-error={getError('price')}
						required
						min="0"
						step="0.01"
						placeholder="99.99"
					/>
					{#if getError('price')}
						<label class="label">
							<span class="label-text-alt text-error">{getError('price')}</span>
						</label>
					{/if}
				</div>
			</div>
		</div>

		<!-- Media Files -->
		<div class="card bg-base-100 shadow-xl mb-6">
			<div class="card-body">
				<h2 class="card-title text-xl mb-4">Media Files</h2>

				<!-- Logo Upload -->
				<div class="form-control">
					<label class="label" for="logo">
						<span class="label-text font-semibold">Logo</span>
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
					{#if getError('logo')}
						<label class="label">
							<span class="label-text-alt text-error">{getError('logo')}</span>
						</label>
					{/if}
				</div>

				<!-- Demo Visual Upload -->
				<div class="form-control">
					<label class="label" for="demo_visual">
						<span class="label-text font-semibold">Demo Visual</span>
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
					{#if getError('demo_visual')}
						<label class="label">
							<span class="label-text-alt text-error">{getError('demo_visual')}</span>
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
							<option value="cloud">Cloud</option>
							<option value="client">Client</option>
							<option value="hybrid">Hybrid</option>
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
					Creating...
				{:else}
					Create Product
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

		<!-- Success Message -->
		{#if form?.success}
			<div class="alert alert-success mt-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>Product created successfully!</span>
			</div>
			<meta http-equiv="refresh" content="0; url=/seller/products" />
		{/if}
	</form>
</div>
