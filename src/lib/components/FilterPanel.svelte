<script lang="ts">
	import type { ProductCategory, ProductFilters } from '$lib/helpers/types';

	interface Props {
		categories?: ProductCategory[];
		selectedCategory?: ProductCategory | null;
		searchQuery?: string;
		filters?: ProductFilters;
		oncategorychange?: (category: ProductCategory | null) => void;
		onsearchchange?: (query: string) => void;
		onfilterchange?: (filters: ProductFilters) => void;
		onclearfilters?: () => void;
	}

	let {
		categories = ['hr', 'legal', 'marketing', 'devtools'],
		selectedCategory = null,
		searchQuery = '',
		filters = {},
		oncategorychange,
		onsearchchange,
		onfilterchange,
		onclearfilters
	}: Props = $props();

	// Map category keys to display names
	const categoryDisplayNames: Record<string, string> = {
		hr: 'HR',
		legal: 'Legal',
		marketing: 'Marketing',
		devtools: 'DevTools'
	};

	// Local state for category and search
	let localSelectedCategory = $state(selectedCategory);
	let localSearchQuery = $state(searchQuery);
	
	// Local state for additional filters
	let minPrice = $state(filters.minPrice ?? undefined);
	let maxPrice = $state(filters.maxPrice ?? undefined);
	let minRating = $state(filters.minRating ?? undefined);
	let featuredOnly = $state(filters.featured ?? false);
	let newOnly = $state(filters.new ?? false);

	// Sync local state with props when they change
	$effect(() => {
		localSelectedCategory = selectedCategory;
	});

	$effect(() => {
		localSearchQuery = searchQuery;
	});

	// Debounce timer for search
	let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	const DEBOUNCE_DELAY = 300; // milliseconds

	// Handle category selection
	function handleCategoryChange(category: ProductCategory | null) {
		console.log('FilterPanel: handleCategoryChange called with:', category);
		console.log('FilterPanel: oncategorychange callback exists?', !!oncategorychange);
		localSelectedCategory = category;
		oncategorychange?.(category);
	}

	// Handle search input with debouncing
	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value;
		localSearchQuery = value; // Update immediately for UI

		// Clear existing timer
		if (searchDebounceTimer) {
			clearTimeout(searchDebounceTimer);
		}

		// Set new timer
		searchDebounceTimer = setTimeout(() => {
			onsearchchange?.(value);
		}, DEBOUNCE_DELAY);
	}

	// Handle additional filter changes
	function handleFilterChange() {
		const newFilters: ProductFilters = {
			category: localSelectedCategory ?? undefined,
			minPrice: minPrice !== undefined && minPrice !== null ? minPrice : undefined,
			maxPrice: maxPrice !== undefined && maxPrice !== null ? maxPrice : undefined,
			minRating: minRating !== undefined && minRating !== null ? minRating : undefined,
			featured: featuredOnly || undefined,
			new: newOnly || undefined
		};

		// Remove undefined values
		Object.keys(newFilters).forEach((key) => {
			if (newFilters[key as keyof ProductFilters] === undefined) {
				delete newFilters[key as keyof ProductFilters];
			}
		});

		onfilterchange?.(newFilters);
	}

	// Handle clear all filters
	function handleClearFilters() {
		localSelectedCategory = null;
		localSearchQuery = '';
		minPrice = undefined;
		maxPrice = undefined;
		minRating = undefined;
		featuredOnly = false;
		newOnly = false;
		onclearfilters?.();
	}

	// Check if any filters are active
	let hasActiveFilters = $derived(
		localSelectedCategory !== null ||
			localSearchQuery !== '' ||
			minPrice !== undefined ||
			maxPrice !== undefined ||
			minRating !== undefined ||
			featuredOnly ||
			newOnly
	);
</script>

<div class="card bg-base-200 shadow-md">
	<div class="card-body">
		<h2 class="card-title text-lg">Filters</h2>

		<!-- Search Input -->
		<div class="form-control">
			<label class="label" for="search-input">
				<span class="label-text font-semibold">Search</span>
			</label>
			<input
				id="search-input"
				type="search"
				placeholder="Search products..."
				class="input input-bordered w-full"
				value={localSearchQuery}
				oninput={handleSearchInput}
			/>
		</div>

		<!-- Category Filter -->
		<div class="form-control">
			<div class="label">
				<span class="label-text font-semibold">Category</span>
			</div>
			<div class="flex flex-wrap gap-2">
				<button
					class="btn btn-sm {localSelectedCategory === null ? 'btn-primary' : 'btn-outline'}"
					onclick={() => handleCategoryChange(null)}
				>
					All
				</button>
				{#each categories as category}
					<button
						class="btn btn-sm {localSelectedCategory === category ? 'btn-primary' : 'btn-outline'}"
						onclick={() => handleCategoryChange(category)}
					>
						{categoryDisplayNames[category] || category}
					</button>
				{/each}
			</div>
		</div>

		<!-- Price Range Filter -->
		<div class="form-control">
			<div class="label">
				<span class="label-text font-semibold">Price Range</span>
			</div>
			<div class="flex gap-2 items-center">
				<input
					type="number"
					placeholder="Min"
					class="input input-bordered input-sm w-full"
					bind:value={minPrice}
					onchange={handleFilterChange}
					min="0"
					aria-label="Minimum price"
				/>
				<span class="text-sm">to</span>
				<input
					type="number"
					placeholder="Max"
					class="input input-bordered input-sm w-full"
					bind:value={maxPrice}
					onchange={handleFilterChange}
					min="0"
					aria-label="Maximum price"
				/>
			</div>
		</div>

		<!-- Rating Filter -->
		<div class="form-control">
			<label class="label" for="rating-filter">
				<span class="label-text font-semibold">Minimum Rating</span>
			</label>
			<select
				id="rating-filter"
				class="select select-bordered select-sm w-full"
				bind:value={minRating}
				onchange={handleFilterChange}
			>
				<option value={undefined}>Any Rating</option>
				<option value={4}>4+ Stars</option>
				<option value={3}>3+ Stars</option>
				<option value={2}>2+ Stars</option>
				<option value={1}>1+ Stars</option>
			</select>
		</div>

		<!-- Additional Filters -->
		<div class="form-control">
			<label class="label cursor-pointer justify-start gap-2">
				<input
					type="checkbox"
					class="checkbox checkbox-sm"
					bind:checked={featuredOnly}
					onchange={handleFilterChange}
				/>
				<span class="label-text">Featured Only</span>
			</label>
		</div>

		<div class="form-control">
			<label class="label cursor-pointer justify-start gap-2">
				<input
					type="checkbox"
					class="checkbox checkbox-sm"
					bind:checked={newOnly}
					onchange={handleFilterChange}
				/>
				<span class="label-text">New Products Only</span>
			</label>
		</div>

		<!-- Clear Filters Button -->
		{#if hasActiveFilters}
			<div class="card-actions justify-end mt-4">
				<button class="btn btn-sm btn-ghost" onclick={handleClearFilters}>Clear All Filters</button>
			</div>
		{/if}
	</div>
</div>
