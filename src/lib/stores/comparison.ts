// product comparison store
// manages products selected for comparison, organized by category
// persists state to localstorage and enforces a 3-product limit per category

import { writable } from 'svelte/store';
import type { ProductWithRating, ProductCategory } from '$lib/helpers/types';

const COMPARISON_STORAGE_KEY = 'marketplace_comparison';
const MAX_COMPARISON_PRODUCTS = 3;

interface ComparisonState {
    productsByCategory: Record<ProductCategory, ProductWithRating[]>;
    activeCategory: ProductCategory | null;
}

function createComparisonStore() {
    // initialize from localstorage if available
    const initialState = typeof window !== 'undefined' 
        ? loadFromLocalStorage() 
        : { productsByCategory: { hr: [], legal: [], marketing: [], devtools: [] }, activeCategory: null };

    const { subscribe, set, update } = writable<ComparisonState>(initialState);

    return {
        subscribe,
        
        // add a product to the comparison list for its category
        // enforces 3-product maximum per category
        // returns 'added' if successful, 'exists' if already in list, 'full' if category is at capacity
        add: (product: ProductWithRating): 'added' | 'exists' | 'full' | 'no_category' => {
            if (!product.category) {
                return 'no_category';
            }
            
            let result: 'added' | 'exists' | 'full' | 'no_category' = 'added';
            
            update((state) => {
                const category = product.category as ProductCategory;
                const categoryProducts = state.productsByCategory[category] || [];
                
                // check if product already exists in this category
                if (categoryProducts.some(p => p.id === product.id)) {
                    result = 'exists';
                    return state;
                }
                
                // check if we've reached the maximum for this category
                if (categoryProducts.length >= MAX_COMPARISON_PRODUCTS) {
                    result = 'full';
                    return state;
                }
                
                const newCategoryProducts = [...categoryProducts, product];
                const newState = {
                    productsByCategory: {
                        ...state.productsByCategory,
                        [category]: newCategoryProducts
                    },
                    activeCategory: category // always switch to the product's category
                };
                saveToLocalStorage(newState);
                return newState;
            });
            
            return result;
        },
        
        // remove a product from the comparison list
        remove: (productId: string): void => {
            update((state) => {
                const newProductsByCategory = { ...state.productsByCategory };
                
                // find which category the product belongs to and remove it
                let removedFromCategory: ProductCategory | null = null;
                for (const category of Object.keys(newProductsByCategory) as ProductCategory[]) {
                    const productIndex = newProductsByCategory[category].findIndex(p => p.id === productId);
                    if (productIndex !== -1) {
                        removedFromCategory = category;
                        newProductsByCategory[category] = newProductsByCategory[category].filter(
                            p => p.id !== productId
                        );
                        break; // product found and removed, exit loop
                    }
                }
                
                // determine new active category
                let newActiveCategory = state.activeCategory;
                
                // if we removed from the active category and it's now empty
                if (removedFromCategory === state.activeCategory && newProductsByCategory[removedFromCategory].length === 0) {
                    // find first non-empty category
                    const firstNonEmptyCategory = (['hr', 'legal', 'marketing', 'devtools'] as ProductCategory[]).find(
                        cat => newProductsByCategory[cat].length > 0
                    );
                    newActiveCategory = firstNonEmptyCategory || null;
                }
                // if we removed from a different category and active category is empty
                else if (state.activeCategory && newProductsByCategory[state.activeCategory].length === 0) {
                    // find first non-empty category
                    const firstNonEmptyCategory = (['hr', 'legal', 'marketing', 'devtools'] as ProductCategory[]).find(
                        cat => newProductsByCategory[cat].length > 0
                    );
                    newActiveCategory = firstNonEmptyCategory || null;
                }
                
                const newState = {
                    productsByCategory: newProductsByCategory,
                    activeCategory: newActiveCategory
                };
                saveToLocalStorage(newState);
                return newState;
            });
        },
        
        // clear all products from a specific category
        clearCategory: (category: ProductCategory): void => {
            update((state) => {
                const newState = {
                    productsByCategory: {
                        ...state.productsByCategory,
                        [category]: []
                    },
                    activeCategory: state.activeCategory
                };
                saveToLocalStorage(newState);
                return newState;
            });
        },
        
        // clear all products from all categories
        clear: (): void => {
            const emptyState = {
                productsByCategory: { hr: [], legal: [], marketing: [], devtools: [] },
                activeCategory: null
            };
            set(emptyState);
            saveToLocalStorage(emptyState);
        },
        
        // set the active category
        setActiveCategory: (category: ProductCategory | null): void => {
            update((state) => {
                const newState = { ...state, activeCategory: category };
                saveToLocalStorage(newState);
                return newState;
            });
        },
        
        // check if a product is in the comparison list
        has: (productId: string): boolean => {
            let result = false;
            subscribe((state) => {
                for (const products of Object.values(state.productsByCategory)) {
                    if (products.some(p => p.id === productId)) {
                        result = true;
                        break;
                    }
                }
            })();
            return result;
        },
        
        // get the current number of products in a category
        getCategoryCount: (category: ProductCategory): number => {
            let count = 0;
            subscribe((state) => {
                count = (state.productsByCategory[category] || []).length;
            })();
            return count;
        },
        
        // get total count across all categories
        getTotalCount: (): number => {
            let count = 0;
            subscribe((state) => {
                count = Object.values(state.productsByCategory).reduce(
                    (sum, products) => sum + products.length,
                    0
                );
            })();
            return count;
        }
    };
}

// load comparison state from localstorage
function loadFromLocalStorage(): ComparisonState {
    try {
        const stored = localStorage.getItem(COMPARISON_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // validate structure
            if (parsed && typeof parsed === 'object' && parsed.productsByCategory) {
                return parsed;
            }
        }
    } catch (error) {
        console.error('Error loading comparison from localStorage:', error);
    }
    return {
        productsByCategory: { hr: [], legal: [], marketing: [], devtools: [] },
        activeCategory: null
    };
}

// save comparison state to localstorage
function saveToLocalStorage(state: ComparisonState): void {
    try {
        localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Error saving comparison to localStorage:', error);
    }
}

export const comparisonStore = createComparisonStore();
