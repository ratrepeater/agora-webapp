import { writable } from 'svelte/store';
import type { ProductWithRating } from '$lib/helpers/types';

const COMPARISON_STORAGE_KEY = 'marketplace_comparison';
const MAX_COMPARISON_PRODUCTS = 3;

interface ComparisonState {
	products: ProductWithRating[];
}

function createComparisonStore() {
	// Initialize from localStorage if available
	const initialProducts = typeof window !== 'undefined' 
		? loadFromLocalStorage() 
		: [];

	const { subscribe, set, update } = writable<ComparisonState>({
		products: initialProducts
	});

	return {
		subscribe,
		
		/**
		 * Add a product to the comparison list
		 * Enforces 3-product maximum
		 * Returns 'added' if successful, 'exists' if already in list, 'full' if list is at capacity
		 */
		add: (product: ProductWithRating): 'added' | 'exists' | 'full' => {
			let result: 'added' | 'exists' | 'full' = 'added';
			
			update((state) => {
				// Check if product already exists
				if (state.products.some(p => p.id === product.id)) {
					result = 'exists';
					return state;
				}
				
				// Check if we've reached the maximum
				if (state.products.length >= MAX_COMPARISON_PRODUCTS) {
					result = 'full';
					return state;
				}
				
				const newProducts = [...state.products, product];
				saveToLocalStorage(newProducts);
				return { products: newProducts };
			});
			
			return result;
		},
		
		/**
		 * Remove a product from the comparison list
		 */
		remove: (productId: string): void => {
			update((state) => {
				const newProducts = state.products.filter(p => p.id !== productId);
				saveToLocalStorage(newProducts);
				return { products: newProducts };
			});
		},
		
		/**
		 * Clear all products from the comparison list
		 */
		clear: (): void => {
			set({ products: [] });
			clearLocalStorage();
		},
		
		/**
		 * Check if a product is in the comparison list
		 */
		has: (productId: string): boolean => {
			let result = false;
			subscribe((state) => {
				result = state.products.some(p => p.id === productId);
			})();
			return result;
		},
		
		/**
		 * Get the current number of products in the comparison list
		 */
		getCount: (): number => {
			let count = 0;
			subscribe((state) => {
				count = state.products.length;
			})();
			return count;
		}
	};
}

/**
 * Load comparison products from localStorage
 */
function loadFromLocalStorage(): ProductWithRating[] {
	try {
		const stored = localStorage.getItem(COMPARISON_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Validate that it's an array and limit to max products
			if (Array.isArray(parsed)) {
				return parsed.slice(0, MAX_COMPARISON_PRODUCTS);
			}
		}
	} catch (error) {
		console.error('Error loading comparison from localStorage:', error);
	}
	return [];
}

/**
 * Save comparison products to localStorage
 */
function saveToLocalStorage(products: ProductWithRating[]): void {
	try {
		localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(products));
	} catch (error) {
		console.error('Error saving comparison to localStorage:', error);
	}
}

/**
 * Clear comparison products from localStorage
 */
function clearLocalStorage(): void {
	try {
		localStorage.removeItem(COMPARISON_STORAGE_KEY);
	} catch (error) {
		console.error('Error clearing comparison from localStorage:', error);
	}
}

export const comparisonStore = createComparisonStore();
