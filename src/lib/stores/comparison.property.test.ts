import { describe, test, beforeEach, expect } from 'vitest';
import * as fc from 'fast-check';
import { comparisonStore } from './comparison';
import { productWithScoresArb } from '$lib/test-utils/generators';
import type { ProductWithRating } from '$lib/helpers/types';

describe('Comparison Store Property Tests', () => {
	beforeEach(() => {
		// Clear the store before each test
		comparisonStore.clear();
		
		// Clear localStorage
		if (typeof window !== 'undefined') {
			localStorage.clear();
		}
	});

	// Feature: startup-marketplace, Property 8: List modification invariant
	// Validates: Requirements 5.4
	test('Property 8: List modification invariant (comparison) - adding increases list size by 1, removing decreases by 1', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.array(productWithScoresArb(), { minLength: 1, maxLength: 5 }),
				async (products) => {
					// Get initial count
					let initialCount = 0;
					comparisonStore.subscribe((state) => {
						initialCount = state.products.length;
					})();

					// Pick a product to add (use first product)
					const productToAdd = products[0];

					// Add the product
					const added = comparisonStore.add(productToAdd);

					// Get count after adding
					let afterAddCount = 0;
					comparisonStore.subscribe((state) => {
						afterAddCount = state.products.length;
					})();

					// If we successfully added (not at max), verify count increased by 1
					let addIncreasedByOne = true;
					if (added) {
						addIncreasedByOne = afterAddCount === initialCount + 1;
					} else {
						// If not added, count should be unchanged (we were at max)
						addIncreasedByOne = afterAddCount === initialCount;
					}

					// Only test removal if we successfully added
					let removeDecreasedByOne = true;
					let backToInitial = true;
					
					if (added) {
						// Remove the product
						comparisonStore.remove(productToAdd.id);

						// Get count after removing
						let afterRemoveCount = 0;
						comparisonStore.subscribe((state) => {
							afterRemoveCount = state.products.length;
						})();

						// Verify removing decreased count by 1
						removeDecreasedByOne = afterRemoveCount === afterAddCount - 1;

						// Verify we're back to initial count
						backToInitial = afterRemoveCount === initialCount;
					}

					return addIncreasedByOne && removeDecreasedByOne && backToInitial;
				}
			),
			{ numRuns: 100 }
		);
	});

	// Additional test: Verify 3-product maximum constraint
	test('Property 6: Comparison list size constraint - list never exceeds 3 products', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.array(productWithScoresArb(), { minLength: 4, maxLength: 10 }),
				async (products) => {
					// Clear store
					comparisonStore.clear();

					// Try to add all products
					for (const product of products) {
						comparisonStore.add(product);
					}

					// Get final count
					let finalCount = 0;
					comparisonStore.subscribe((state) => {
						finalCount = state.products.length;
					})();

					// Verify count never exceeds 3
					return finalCount <= 3;
				}
			),
			{ numRuns: 100 }
		);
	});

	// Additional test: Verify localStorage persistence
	test('Comparison list persists to localStorage for session continuity', async () => {
		// Skip if not in browser environment
		if (typeof window === 'undefined') {
			return;
		}

		await fc.assert(
			fc.asyncProperty(
				fc.array(productWithScoresArb(), { minLength: 1, maxLength: 3 }),
				async (products) => {
					// Clear store and localStorage
					comparisonStore.clear();
					localStorage.clear();

					// Add products
					for (const product of products) {
						comparisonStore.add(product);
					}

					// Check localStorage
					const stored = localStorage.getItem('marketplace_comparison');
					
					if (!stored) {
						return false;
					}

					const parsed = JSON.parse(stored);
					
					// Verify stored data matches what we added
					return Array.isArray(parsed) && parsed.length === products.length;
				}
			),
			{ numRuns: 100 }
		);
	});

	// Additional test: Verify duplicate prevention
	test('Adding the same product twice does not increase list size', async () => {
		await fc.assert(
			fc.asyncProperty(
				productWithScoresArb(),
				async (product) => {
					// Clear store
					comparisonStore.clear();

					// Add product first time
					const firstAdd = comparisonStore.add(product);

					// Get count after first add
					let countAfterFirst = 0;
					comparisonStore.subscribe((state) => {
						countAfterFirst = state.products.length;
					})();

					// Try to add same product again
					const secondAdd = comparisonStore.add(product);

					// Get count after second add
					let countAfterSecond = 0;
					comparisonStore.subscribe((state) => {
						countAfterSecond = state.products.length;
					})();

					// Verify:
					// 1. First add should succeed
					// 2. Second add should fail (return false)
					// 3. Count should remain the same
					return firstAdd && !secondAdd && countAfterFirst === countAfterSecond;
				}
			),
			{ numRuns: 100 }
		);
	});
});
