/**
 * Simple in-memory cache with TTL (Time To Live) support
 * Used for caching frequently accessed data like featured products
 */

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number; // Time to live in milliseconds
}

class Cache {
	private store: Map<string, CacheEntry<any>> = new Map();

	/**
	 * Set a value in the cache with TTL
	 * @param key - Cache key
	 * @param data - Data to cache
	 * @param ttl - Time to live in milliseconds (default: 5 minutes)
	 */
	set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
		this.store.set(key, {
			data,
			timestamp: Date.now(),
			ttl
		});
	}

	/**
	 * Get a value from the cache
	 * Returns null if key doesn't exist or has expired
	 * @param key - Cache key
	 * @returns Cached data or null
	 */
	get<T>(key: string): T | null {
		const entry = this.store.get(key);

		if (!entry) {
			return null;
		}

		// Check if entry has expired
		const now = Date.now();
		if (now - entry.timestamp > entry.ttl) {
			this.store.delete(key);
			return null;
		}

		return entry.data as T;
	}

	/**
	 * Check if a key exists and is not expired
	 * @param key - Cache key
	 * @returns true if key exists and is valid
	 */
	has(key: string): boolean {
		return this.get(key) !== null;
	}

	/**
	 * Delete a specific key from the cache
	 * @param key - Cache key
	 */
	delete(key: string): void {
		this.store.delete(key);
	}

	/**
	 * Clear all entries from the cache
	 */
	clear(): void {
		this.store.clear();
	}

	/**
	 * Remove all expired entries from the cache
	 */
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.store.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.store.delete(key);
			}
		}
	}

	/**
	 * Get or set a value in the cache
	 * If the key exists and is valid, return the cached value
	 * Otherwise, call the factory function, cache the result, and return it
	 * 
	 * @param key - Cache key
	 * @param factory - Function to generate the value if not cached
	 * @param ttl - Time to live in milliseconds (default: 5 minutes)
	 * @returns Cached or newly generated data
	 */
	async getOrSet<T>(
		key: string,
		factory: () => Promise<T>,
		ttl: number = 5 * 60 * 1000
	): Promise<T> {
		const cached = this.get<T>(key);
		if (cached !== null) {
			return cached;
		}

		const data = await factory();
		this.set(key, data, ttl);
		return data;
	}
}

// Export a singleton instance
export const cache = new Cache();

// Run cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
	setInterval(() => {
		cache.cleanup();
	}, 10 * 60 * 1000);
}

/**
 * Cache keys for common queries
 */
export const CACHE_KEYS = {
	FEATURED_PRODUCTS: 'featured_products',
	NEW_PRODUCTS: 'new_products',
	CATEGORIES: 'categories',
	PRODUCT_BY_ID: (id: string) => `product_${id}`,
	PRODUCTS_BY_CATEGORY: (category: string) => `products_category_${category}`,
	PRODUCT_REVIEWS: (productId: string) => `product_reviews_${productId}`,
	PRODUCT_FEATURES: (productId: string) => `product_features_${productId}`
};

/**
 * Cache TTL values (in milliseconds)
 */
export const CACHE_TTL = {
	SHORT: 1 * 60 * 1000, // 1 minute
	MEDIUM: 5 * 60 * 1000, // 5 minutes
	LONG: 15 * 60 * 1000, // 15 minutes
	VERY_LONG: 60 * 60 * 1000 // 1 hour
};
