import { supabase as supabaseClient } from '$lib/helpers/supabase.server';
import type { QuoteRequest } from '$lib/helpers/types';
import type { Database } from '$lib/database.types';

// Type-safe wrapper for supabase client
const supabase = supabaseClient as any;

type Quote = Database['public']['Tables']['quotes']['Row'];
type QuoteInsert = Database['public']['Tables']['quotes']['Insert'];
type CartItem = Database['public']['Tables']['cart_items']['Row'];
type CartInsert = Database['public']['Tables']['cart_items']['Insert'];

/**
 * QuoteService - Handles all quote-related database operations
 * Implements automated quote generation, acceptance, and management
 */
export class QuoteService {
	/**
	 * Generate an automated quote based on buyer requirements
	 * Implements pricing rules based on company size and requirements
	 * @param request - Quote request with buyer and product information
	 * @returns Generated quote
	 */
	async generateQuote(request: QuoteRequest): Promise<Quote> {
		// Get product information
		const { data: product, error: productError } = await supabase
			.from('products')
			.select('*')
			.eq('id', request.product_id)
			.single();

		if (productError) {
			throw new Error(`Failed to fetch product: ${productError.message}`);
		}

		// Calculate quoted price based on pricing rules
		const basePrice = product.price_cents / 100; // Convert cents to dollars
		const pricingBreakdown = this.calculatePricing(basePrice, request);

		// Set validity period (30 days from now)
		const validUntil = new Date();
		validUntil.setDate(validUntil.getDate() + 30);

		// Set estimated response date (3 days from now for seller review if needed)
		const estimatedResponseDate = new Date();
		estimatedResponseDate.setDate(estimatedResponseDate.getDate() + 3);

		// Create quote
		const quoteData: QuoteInsert = {
			product_id: request.product_id,
			buyer_id: request.buyer_id,
			seller_id: product.seller_id,
			company_size: request.company_size,
			requirements: request.requirements as any,
			quoted_price: pricingBreakdown.total,
			pricing_breakdown: pricingBreakdown as any,
			status: 'pending',
			valid_until: validUntil.toISOString(),
			estimated_response_date: estimatedResponseDate.toISOString(),
			buyer_company_info: request.buyer_company_info as any,
			additional_notes: request.additional_notes
		};

		const { data: quote, error: quoteError } = await supabase
			.from('quotes')
			.insert(quoteData as any)
			.select()
			.single();

		if (quoteError) {
			throw new Error(`Failed to create quote: ${quoteError.message}`);
		}

		return quote as Quote;
	}

	/**
	 * Calculate pricing based on automated rules
	 * @param basePrice - Base product price
	 * @param request - Quote request with company size and requirements
	 * @returns Pricing breakdown with total
	 */
	private calculatePricing(
		basePrice: number,
		request: QuoteRequest
	): Record<string, number> & { total: number } {
		const breakdown: Record<string, number> = {
			base_price: basePrice
		};

		// Company size multiplier
		let companySizeMultiplier = 1.0;
		if (request.company_size < 10) {
			companySizeMultiplier = 0.8; // Small company discount
		} else if (request.company_size < 50) {
			companySizeMultiplier = 1.0; // Standard pricing
		} else if (request.company_size < 200) {
			companySizeMultiplier = 1.5; // Medium company premium
		} else if (request.company_size < 500) {
			companySizeMultiplier = 2.0; // Large company premium
		} else {
			companySizeMultiplier = 3.0; // Enterprise premium
		}

		breakdown.company_size_adjustment = basePrice * (companySizeMultiplier - 1);

		// Feature requirements adjustment
		const requirements = request.requirements || {};
		const featureCount = Object.keys(requirements).length;
		const featureAdjustment = featureCount * basePrice * 0.1; // 10% per additional feature
		breakdown.feature_requirements = featureAdjustment;

		// Implementation complexity adjustment
		if (requirements.custom_implementation) {
			breakdown.custom_implementation = basePrice * 0.5; // 50% for custom work
		}

		// Volume discount (if requesting multiple licenses)
		const licenseCount = requirements.license_count || 1;
		if (licenseCount > 10) {
			breakdown.volume_discount = -basePrice * companySizeMultiplier * 0.15; // 15% discount
		} else if (licenseCount > 5) {
			breakdown.volume_discount = -basePrice * companySizeMultiplier * 0.1; // 10% discount
		}

		// Calculate total
		const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
		breakdown.total = Math.max(basePrice * 0.5, total); // Minimum 50% of base price

		return { ...breakdown, total: breakdown.total };
	}

	/**
	 * Accept a quote and convert it to a cart item
	 * @param quoteId - Quote ID to accept
	 * @returns Created cart item
	 */
	async acceptQuote(quoteId: string): Promise<CartItem> {
		// Get quote details
		const { data: quote, error: quoteError } = await supabase
			.from('quotes')
			.select('*')
			.eq('id', quoteId)
			.single();

		if (quoteError) {
			throw new Error(`Failed to fetch quote: ${quoteError.message}`);
		}

		const quoteData = quote as Quote;

		// Check if quote is still valid
		const now = new Date();
		const validUntil = new Date(quoteData.valid_until);
		if (now > validUntil) {
			throw new Error('Quote has expired');
		}

		// Check if quote is in pending status
		if (quoteData.status !== 'pending' && quoteData.status !== 'sent') {
			throw new Error(`Quote cannot be accepted (status: ${quoteData.status})`);
		}

		// Update quote status to accepted
		const { error: updateError } = await supabase
			.from('quotes')
			.update({ status: 'accepted', updated_at: new Date().toISOString() } as any)
			.eq('id', quoteId);

		if (updateError) {
			throw new Error(`Failed to update quote status: ${updateError.message}`);
		}

		// Get or create cart
		const { data: existingCart, error: cartFindError } = await supabase
			.from('carts')
			.select('id')
			.eq('buyer_id', quoteData.buyer_id)
			.eq('status', 'open')
			.maybeSingle();

		if (cartFindError) {
			throw new Error(`Failed to find cart: ${cartFindError.message}`);
		}

		let cartId: string;
		if (existingCart) {
			cartId = existingCart.id;
		} else {
			const { data: newCart, error: cartCreateError } = await supabase
				.from('carts')
				.insert({ buyer_id: quoteData.buyer_id, status: 'open' } as any)
				.select('id')
				.single();

			if (cartCreateError) {
				throw new Error(`Failed to create cart: ${cartCreateError.message}`);
			}
			cartId = newCart!.id;
		}

		// Add to cart with quoted price
		const quotedPriceCents = Math.round(quoteData.quoted_price * 100);

		const cartItemData: CartInsert = {
			cart_id: cartId,
			product_id: quoteData.product_id,
			quantity: 1,
			unit_price_cents: quotedPriceCents
		};

		const { data: cartItem, error: cartError } = await supabase
			.from('cart_items')
			.insert(cartItemData as any)
			.select()
			.single();

		if (cartError) {
			throw new Error(`Failed to add quote to cart: ${cartError.message}`);
		}

		return cartItem as CartItem;
	}

	/**
	 * Reject a quote
	 * @param quoteId - Quote ID to reject
	 */
	async rejectQuote(quoteId: string): Promise<void> {
		const { error } = await supabase
			.from('quotes')
			.update({ status: 'rejected', updated_at: new Date().toISOString() } as any)
			.eq('id', quoteId);

		if (error) {
			throw new Error(`Failed to reject quote: ${error.message}`);
		}
	}

	/**
	 * Get all quotes for a buyer
	 * @param buyerId - Buyer's profile ID
	 * @returns Array of quotes
	 */
	async getByBuyer(buyerId: string): Promise<Quote[]> {
		const { data, error } = await supabase
			.from('quotes')
			.select('*')
			.eq('buyer_id', buyerId)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch buyer quotes: ${error.message}`);
		}

		return (data as Quote[]) || [];
	}

	/**
	 * Get all quotes for a seller
	 * @param sellerId - Seller's profile ID
	 * @returns Array of quotes
	 */
	async getBySeller(sellerId: string): Promise<Quote[]> {
		const { data, error } = await supabase
			.from('quotes')
			.select('*')
			.eq('seller_id', sellerId)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch seller quotes: ${error.message}`);
		}

		return (data as Quote[]) || [];
	}

	/**
	 * Get a quote by ID
	 * @param quoteId - Quote ID
	 * @returns Quote or null if not found
	 */
	async getById(quoteId: string): Promise<Quote | null> {
		const { data, error } = await supabase.from('quotes').select('*').eq('id', quoteId).maybeSingle();

		if (error) {
			throw new Error(`Failed to fetch quote: ${error.message}`);
		}

		return data as Quote | null;
	}

	/**
	 * Check if a quote has expired
	 * @param quoteId - Quote ID
	 * @returns True if expired, false otherwise
	 */
	async checkExpiration(quoteId: string): Promise<boolean> {
		const quote = await this.getById(quoteId);
		if (!quote) {
			throw new Error('Quote not found');
		}

		const now = new Date();
		const validUntil = new Date(quote.valid_until);
		return now > validUntil;
	}

	/**
	 * Extend the validity period of a quote
	 * @param quoteId - Quote ID
	 * @param newDate - New validity date
	 * @returns Updated quote
	 */
	async extendValidity(quoteId: string, newDate: Date): Promise<Quote> {
		const { data, error } = await supabase
			.from('quotes')
			.update({ valid_until: newDate.toISOString(), updated_at: new Date().toISOString() } as any)
			.eq('id', quoteId)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to extend quote validity: ${error.message}`);
		}

		return data as Quote;
	}
}

// Export a singleton instance
export const quoteService = new QuoteService();
