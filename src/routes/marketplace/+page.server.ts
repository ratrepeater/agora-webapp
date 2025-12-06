import type { PageServerLoad } from './$types';
import { productService } from '$lib/services/products';
import { BookmarkService } from '$lib/services/bookmarks';
import { CartService } from '$lib/services/cart';
import type { ProductFilters, ProductCategory } from '$lib/helpers/types';

export const load: PageServerLoad = async ({ url, locals }) => {
	try {
		// Extract query parameters
		const searchQuery = url.searchParams.get('q') || '';
		const categoryParam = url.searchParams.get('category');
		const minPrice = url.searchParams.get('minPrice');
		const maxPrice = url.searchParams.get('maxPrice');
		const minRating = url.searchParams.get('minRating');
		const featured = url.searchParams.get('filter') === 'featured';
		const isNew = url.searchParams.get('filter') === 'new';

		// Build filters object
		const filters: ProductFilters = {};

		if (categoryParam && categoryParam !== 'All') {
			filters.category = categoryParam as ProductCategory;
		}

		if (minPrice) {
			filters.minPrice = parseFloat(minPrice);
		}

		if (maxPrice) {
			filters.maxPrice = parseFloat(maxPrice);
		}

		if (minRating) {
			filters.minRating = parseFloat(minRating);
		}

		if (featured) {
			filters.featured = true;
		}

		if (isNew) {
			filters.new = true;
		}

		// Fetch products based on search query or filters
		let products;
		if (searchQuery) {
			products = await productService.search(searchQuery, filters);
		} else {
			products = await productService.getAll(filters);
		}

		// Fetch user's bookmarks and cart if authenticated
		let bookmarkedProductIds: string[] = [];
		let cartQuantities: Record<string, number> = {};
		
		if (locals.session?.user) {
			try {
				const bookmarkService = new BookmarkService(locals.supabase);
				const bookmarks = await bookmarkService.getByBuyer(locals.session.user.id);
				bookmarkedProductIds = bookmarks.map(b => b.product_id);
			} catch (error) {
				console.error('Error loading bookmarks:', error);
			}

			try {
				const cartService = new CartService(locals.supabase);
				const cartItems = await cartService.getItems(locals.session.user.id);
				// Build a map of product_id -> quantity
				cartQuantities = cartItems.reduce((acc, item) => {
					acc[item.product_id] = item.quantity || 1;
					return acc;
				}, {} as Record<string, number>);
			} catch (error) {
				console.error('Error loading cart:', error);
			}
		}

		return {
			products,
			searchQuery,
			bookmarkedProductIds,
			cartQuantities,
			filters: {
				category: categoryParam || 'All',
				minPrice: minPrice ? parseFloat(minPrice) : undefined,
				maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
				minRating: minRating ? parseFloat(minRating) : undefined,
				featured,
				new: isNew
			}
		};
	} catch (error) {
		console.error('Error loading marketplace data:', error);
		return {
			products: [],
			searchQuery: '',
			bookmarkedProductIds: [],
			cartQuantities: {},
			filters: {
				category: 'All'
			}
		};
	}
};
