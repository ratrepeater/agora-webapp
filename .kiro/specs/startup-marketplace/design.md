# Design Document: Startup Marketplace

## Overview

The Startup Marketplace is a full-stack web application built with SvelteKit, TypeScript, TailwindCSS, DaisyUI, and Supabase. The platform enables startups to discover, evaluate, and purchase business services through an intuitive interface combining Netflix-style content discovery with Amazon's marketplace functionality.

### Key Design Principles

1. **Separation of Concerns**: Clear boundaries between UI components, business logic, and data access layers
2. **Type Safety**: Comprehensive TypeScript types generated from Supabase schema
3. **Progressive Enhancement**: Server-side rendering with client-side interactivity
4. **Scalability**: Database-first design with efficient indexing and RLS policies
5. **User Experience**: Responsive design with optimistic UI updates and loading states

### Technology Stack

- **Frontend**: SvelteKit 2.x with Svelte 5, TypeScript
- **Styling**: TailwindCSS 4.x with DaisyUI 5.x
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Build Tool**: Vite 7.x
- **Deployment**: SvelteKit adapter-auto (supports multiple platforms)

## Architecture

### System Architecture

The application follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│  (SvelteKit Pages, Components, Client-Side State)           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                   │
│  (SvelteKit Server Routes, Load Functions, Actions)         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Access Layer                     │
│  (Supabase Client, Database Queries, Auth, Storage)         │
└─────────────────────────────────────────────────────────────┘
```

### User Flows

#### Buyer Journey
1. **Discovery**: Browse homepage with Netflix-style rows or marketplace grid view
2. **Search & Filter**: Use search and category filters to find relevant products
3. **Evaluation**: View product details, compare up to 3 products, read reviews
4. **Decision**: Bookmark interesting products, request quotes for variable pricing
5. **Purchase**: Add to cart, complete checkout (demo transaction with zero charge)
6. **Post-Purchase**: Download products, track performance in dashboard, provide feedback

#### Seller Journey
1. **Onboarding**: Complete seller verification (company info, business registration)
2. **Product Management**: Add products with detailed information and metrics
3. **Analytics**: Monitor product performance, views, conversions, revenue
4. **Optimization**: Review competitor analysis, implement improvement suggestions
5. **Customer Engagement**: Respond to quote requests, review buyer feedback

**Design Rationale**: The user flows are designed to minimize friction while providing comprehensive information. Buyers can make informed decisions through multiple evaluation tools (comparison, reviews, metrics), while sellers have visibility into performance and competitive positioning.

### Directory Structure

```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── ProductCard.svelte
│   │   ├── ProductRow.svelte
│   │   ├── ComparisonTable.svelte
│   │   ├── NavShell.svelte
│   │   └── ...
│   ├── helpers/
│   │   ├── supabase.ts      # Supabase client initialization
│   │   ├── database.types.ts # Generated database types
│   │   └── types.ts         # Application types
│   ├── services/            # Business logic services
│   │   ├── products.ts      # Product operations
│   │   ├── cart.ts          # Cart operations
│   │   ├── orders.ts        # Order operations
│   │   ├── bookmarks.ts     # Bookmark operations
│   │   ├── reviews.ts       # Review operations
│   │   ├── analytics.ts     # Analytics operations
│   │   ├── quotes.ts        # Quote generation
│   │   └── recommendations.ts # Recommendation engine
│   └── stores/              # Svelte stores for client state
│       ├── auth.ts
│       ├── cart.ts
│       └── comparison.ts
├── routes/
│   ├── +layout.svelte       # Root layout with navigation
│   ├── +layout.server.ts    # Server-side session handling
│   ├── +page.svelte         # Homepage (Netflix-style)
│   ├── +page.server.ts      # Homepage data loading
│   ├── marketplace/
│   │   ├── +page.svelte     # Marketplace grid view
│   │   └── +page.server.ts
│   ├── products/
│   │   └── [id]/
│   │       ├── +page.svelte # Product detail page
│   │       └── +page.server.ts
│   ├── compare/
│   │   ├── +page.svelte     # Comparison page
│   │   └── +page.server.ts
│   ├── cart/
│   │   ├── +page.svelte     # Cart page
│   │   ├── +page.server.ts
│   │   └── checkout/
│   │       └── +page.server.ts
│   ├── orders/
│   │   ├── +page.svelte     # Order history
│   │   ├── +page.server.ts
│   │   └── [id]/
│   │       └── +page.svelte # Order detail
│   ├── bookmarks/
│   │   ├── +page.svelte
│   │   └── +page.server.ts
│   ├── dashboard/           # Buyer dashboard
│   │   ├── +page.svelte
│   │   ├── +page.server.ts
│   │   └── products/
│   │       └── [id]/        # Purchased product management
│   ├── seller/
│   │   ├── +layout.svelte   # Seller-specific layout
│   │   ├── +layout.server.ts
│   │   ├── dashboard/       # Seller analytics dashboard
│   │   ├── products/        # Product management
│   │   │   ├── +page.svelte # Product list
│   │   │   ├── new/         # Add product
│   │   │   └── [id]/
│   │   │       └── edit/    # Edit product
│   │   └── competitors/     # Competitor analysis
│   ├── auth/
│   │   ├── signin/
│   │   ├── signup/
│   │   └── signout/
│   └── api/                 # API endpoints
│       ├── quotes/
│       ├── downloads/
│       └── analytics/
└── app.html                 # HTML template
```

## Components and Interfaces

### Core Components

#### 1. ProductCard Component
Displays product summary information in grid and carousel layouts with aggregated metric scores.

**Props:**
- `product: ProductWithRating` - Product data including ratings
- `showCompareButton: boolean` - Toggle compare button visibility (default: true)
- `showBookmarkButton: boolean` - Toggle bookmark button visibility (default: true)
- `showAddToCartButton: boolean` - Toggle add to cart button visibility (default: true)
- `variant: 'grid' | 'carousel'` - Display variant

**Displayed Information** (on card):
- Company demo visual (image/screenshot)
- Product name
- Company logo
- Short description
- Price (or "Request Quote" button for quote-based products)
- Key business metrics:
  - **Overall Score**: Weighted average of all scores (0-100)
  - **Fit Score**: How well the product fits buyer's workflow (0-100)
  - **Feature Score**: Product completeness and capabilities (0-100)
  - **Integration Score**: Ease of integration (0-100)
  - **Review Score**: Buyer satisfaction (0-100)

**Interactive Elements:**
- Compare button (adds product to comparison list)
- Bookmark button (toggles bookmark status)
- Add to cart button (adds product to cart)
- Card click (navigates to product detail page)

**Events:**
- `on:compare` - Emitted when compare button clicked
- `on:bookmark` - Emitted when bookmark button clicked
- `on:addToCart` - Emitted when add to cart button clicked
- `on:click` - Emitted when card clicked

**Design Rationale**: The card design consolidates all essential product information in a scannable format, allowing buyers to quickly evaluate products without navigating to detail pages. The metric scores provide quantitative comparison points that support data-driven decision making.

#### ProductDetailView Component
Displays comprehensive product information on the product detail page.

**Sections**:
1. **Hero Section**: Product name, logo, demo visual, overall score, price (or "Request Quote" button), compare button, bookmark button, add to cart button
2. **Long Description**: Detailed product description and value proposition
3. **Extended Metrics Section**: Comprehensive business metrics with explanations:
   - ROI percentage
   - Retention rate over time
   - Quarter-over-quarter changes
   - Cloud/client classification (cloud, client, hybrid)
   - Implementation time (in days)
   - Access depth (levels of system access required)
4. **Score Breakdown**: Detailed breakdown of each score with contributing factors
5. **Feature List**: Prioritized list of features with most relevant at the top
6. **Reviews Section**: Customer reviews with reviewer name, rating, and review text, plus average rating
7. **Similar Products**: Recommendations for related products

**Props:**
- `product: ProductWithScores` - Complete product data with scores and features
- `scoreBreakdown: ScoreBreakdown` - Detailed score calculation breakdown
- `features: ProductFeature[]` - Sorted by relevance_score descending
- `reviews: ReviewWithBuyer[]` - Customer reviews
- `similarProducts: ProductWithScores[]` - Related product recommendations
- `isBookmarked: boolean` - Current bookmark status
- `isInCart: boolean` - Whether product is already in cart

**Design Rationale**: The detail page provides all information needed for a purchase decision, organized in a logical flow from high-level overview to detailed metrics to social proof (reviews) to alternatives (similar products). Extended metrics with explanations help buyers understand the business impact of each product.

#### 2. ProductRow Component
Horizontal scrolling row of products for Netflix-style homepage.

**Props:**
- `title: string` - Row title (e.g., "New Products", "Featured", "Recommended for You")
- `products: ProductWithRating[]` - Products to display
- `category?: string` - Optional category filter
- `showMoreLink?: string` - Optional link to view all products in this row

**Behavior** (Requirement 1):
- Horizontal scrolling with smooth animation
- Products displayed as cards in carousel format
- Lazy loading of additional products as user scrolls
- No page refresh when scrolling
- Scroll indicators (arrows) on hover
- Touch/swipe support for mobile devices

**Events:**
- `on:productClick` - Emitted when product card clicked
- `on:showMore` - Emitted when "Show More" link clicked

**Design Rationale**: The Netflix-style horizontal scrolling creates an engaging browsing experience that encourages exploration. Multiple rows organized by different criteria (new, featured, recommended) provide diverse discovery paths without overwhelming the user with too many products at once.

#### 3. ComparisonTable Component
Side-by-side product comparison display.

**Props:**
- `products: ProductWithRating[]` - Products to compare (max 3)
- `comparisonMetrics: string[]` - Metrics to display in comparison

**Displayed Information** (Requirement 5.3):
- Product name and logo
- Demo visual
- Price
- All metric scores (fit, feature, integration, review, overall)
- Extended metrics (ROI, retention, implementation time, etc.)
- Reviews summary (average rating, review count)
- Key features comparison
- Add to cart button for each product

**Events:**
- `on:remove` - Emitted when product removed from comparison
- `on:addToCart` - Emitted when add to cart clicked for a product
- `on:viewDetails` - Emitted when view details clicked for a product

**Behavior** (Requirement 5):
- Maximum 3 products can be compared simultaneously
- Attempting to add 4th product shows error message
- Products displayed in columns for easy side-by-side comparison
- Metrics aligned in rows for direct comparison
- Differences highlighted (e.g., highest score, lowest price)
- Empty state shown when fewer than 2 products in comparison

**Design Rationale**: The comparison table provides a structured way to evaluate products side-by-side. The 3-product limit prevents overwhelming users while allowing meaningful comparison. Highlighting differences helps buyers quickly identify the best option for their needs.

#### 4. NavShell Component
Main navigation bar with authentication state and cart count.

**Props:**
- `user: User | null` - Current authenticated user
- `userRole: 'buyer' | 'seller' | null` - User role for role-specific navigation
- `cartItemCount: number` - Number of items in cart
- `currentPath: string` - Current page path for active state highlighting

**Navigation Links** (Requirement 13):
- Homepage
- Marketplace
- Search (with inline search input)
- Category Filters (dropdown)
- Bookmarks (authenticated buyers only)
- Orders (authenticated buyers only)
- Cart (with item count badge)
- Dashboard (role-specific: buyer or seller dashboard)
- Sign In / Sign Out

**Behavior**:
- Active page link is highlighted
- Cart count badge only shown when cart has items
- Role-specific links shown based on user authentication and role
- Responsive design with mobile menu for smaller screens

**Design Rationale**: The navigation provides quick access to all major features while adapting to user authentication state and role. The cart count badge provides immediate feedback on cart status.

#### 5. FilterPanel Component
Category and search filters for marketplace.

**Props:**
- `categories: ProductCategory[]` - Available categories (HR, Law, Office, DevTools)
- `selectedCategory: ProductCategory | null` - Currently selected category
- `searchQuery: string` - Current search query
- `filters: ProductFilters` - Additional filter options (price range, rating, etc.)

**Events:**
- `on:categoryChange` - Emitted when category filter changes
- `on:searchChange` - Emitted when search query changes
- `on:filterChange` - Emitted when additional filters change
- `on:clearFilters` - Emitted when user clears all filters

**Design Rationale**: Filters are prominently displayed to support quick product discovery. The component supports both category-based browsing and keyword search, with the ability to combine both for refined results.

#### 6. CartSummary Component
Displays cart items and total cost with checkout functionality.

**Props:**
- `items: CartItemWithProduct[]` - Cart items with product details
- `total: number` - Total cart cost

**Events:**
- `on:removeItem` - Emitted when item removed from cart
- `on:updateQuantity` - Emitted when item quantity changed
- `on:checkout` - Emitted when checkout button clicked
- `on:clearCart` - Emitted when clear cart button clicked

**Design Rationale**: The cart provides a clear summary of pending purchases with easy quantity adjustment and removal. The total is prominently displayed to avoid checkout surprises.

#### 7. OrderHistoryList Component
Displays buyer's past orders with order details.

**Props:**
- `orders: OrderWithItems[]` - List of completed orders

**Events:**
- `on:viewOrder` - Emitted when order detail view requested

**Design Rationale**: Order history provides transparency and allows buyers to track their purchase history and access downloads for digital products.

#### 8. ReviewList Component
Displays product reviews with ratings and reviewer information.

**Props:**
- `reviews: ReviewWithBuyer[]` - Product reviews
- `averageRating: number` - Average rating across all reviews
- `canReview: boolean` - Whether current user can submit a review

**Events:**
- `on:submitReview` - Emitted when new review submitted

**Design Rationale**: Reviews provide social proof and help buyers make informed decisions. Displaying reviewer names adds credibility.

#### 9. QuoteRequestForm Component
Form for requesting automated product quotes.

**Props:**
- `product: Product` - Product for which quote is requested
- `buyerProfile: BuyerOnboarding | null` - Buyer profile for pre-filling

**Events:**
- `on:submitQuote` - Emitted when quote request submitted
- `on:cancel` - Emitted when form cancelled

**Design Rationale**: Quote requests capture buyer-specific requirements to generate accurate pricing, reducing friction in the sales process for variable-priced products.

#### 10. BundleSuggestion Component
Displays suggested product bundles based on cart contents.

**Props:**
- `bundles: ProductBundle[]` - Suggested bundles
- `currentCart: CartItemWithProduct[]` - Current cart items

**Events:**
- `on:addBundle` - Emitted when bundle added to cart
- `on:viewBundle` - Emitted when bundle details requested

**Design Rationale**: Bundle suggestions increase average order value by recommending complementary products that work well together.

### Authentication and Authorization

#### Authentication Flow

**Buyer Authentication** (Requirement 10):
- Sign-in page with email/password authentication via Supabase Auth
- Session maintained across pages using Supabase session management
- Protected routes (bookmarks, cart, orders, dashboard) redirect to sign-in if unauthenticated
- Sign-out clears session and returns to public homepage

**Seller Authentication** (Requirement 11):
- Separate seller sign-in page with role-based authentication
- Seller-specific dashboard and product management routes
- Verification status checked before allowing product creation
- Sign-out returns to public homepage

#### Authorization Strategy

**Row Level Security (RLS)**: Implemented at database level via Supabase
- Buyers can only access their own bookmarks, cart items, orders, and usage data
- Sellers can only manage their own products and view their own analytics
- Public read access for product listings, reviews, and product details
- Admin-level access for platform management (future enhancement)

**Route Protection**: Implemented at SvelteKit layout level
- `+layout.server.ts` checks authentication status and user role
- Redirects unauthenticated users to sign-in page
- Redirects unauthorized users (e.g., buyers accessing seller routes) to appropriate page
- Passes user session to all child routes

**Design Rationale**: Using Supabase Auth provides secure, production-ready authentication with minimal implementation effort. RLS ensures data security at the database level, preventing unauthorized access even if application-level checks fail.

### Transaction and Checkout Flow

#### Demo Transaction Processing (Requirement 7.4, 18.3)

The platform processes demo transactions with zero charge to simulate the complete purchase experience:

1. **Cart Review**: Buyer reviews cart items and total cost
2. **Checkout Initiation**: Buyer clicks checkout button
3. **Order Creation**: System creates order record with all cart items
4. **Demo Payment**: System processes zero-charge transaction (no actual payment)
5. **Order Confirmation**: System displays confirmation page with order details
6. **Download Access**: For digital products, download links immediately available
7. **Cart Clearing**: System clears buyer's cart after successful checkout
8. **Order History**: Order added to buyer's order history

#### Download Management (Requirement 18)

**Immediate Access**: After purchase completion, buyers receive immediate download access on the confirmation page

**Persistent Access**: Download links remain available in order history for all purchased digital products

**Download Tracking**: Each download event is tracked and updates usage metrics for analytics

**Security**: Download URLs are generated with buyer authentication verification to prevent unauthorized access

**Design Rationale**: Demo transactions allow the platform to showcase the complete purchase flow without payment processing complexity. This is ideal for demonstration and testing purposes while maintaining a realistic user experience. The download system provides immediate value delivery for digital products.

### Service Layer Interfaces

#### ProductService
```typescript
interface ProductService {
  // Read operations
  getAll(filters?: ProductFilters): Promise<ProductWithScores[]>
  getById(id: string): Promise<ProductWithScores | null>
  getBySeller(sellerId: string): Promise<ProductWithScores[]>
  getByCategory(category: ProductCategory): Promise<ProductWithScores[]>
  getFeatured(): Promise<ProductWithScores[]>
  getNew(): Promise<ProductWithScores[]>
  getSimilar(productId: string, limit: number): Promise<ProductWithScores[]>
  search(query: string, filters?: ProductFilters): Promise<ProductWithScores[]>
  
  // Write operations (seller only)
  create(product: ProductInsert): Promise<Product>
  update(id: string, product: ProductUpdate): Promise<Product>
  delete(id: string): Promise<void>
  
  // Score calculation
  calculateScores(productId: string): Promise<ProductScores>
  recalculateAllScores(): Promise<void>
}

interface ProductScores {
  fit_score: number
  feature_score: number
  integration_score: number
}
```

#### CartService
```typescript
interface CartService {
  // Read operations
  getItems(buyerId: string): Promise<CartItemWithProduct[]>
  getTotal(buyerId: string): Promise<number>
  
  // Write operations
  addItem(buyerId: string, productId: string, quantity?: number): Promise<CartItem>
  updateQuantity(itemId: string, quantity: number): Promise<CartItem>
  removeItem(itemId: string): Promise<void>
  clear(buyerId: string): Promise<void>
}
```

#### OrderService
```typescript
interface OrderService {
  // Read operations
  getByBuyer(buyerId: string): Promise<OrderWithItems[]>
  getById(orderId: string): Promise<OrderWithItems | null>
  
  // Write operations
  create(buyerId: string, items: CartItemWithProduct[]): Promise<Order>
  
  // Analytics
  getBuyerPurchaseHistory(buyerId: string): Promise<PurchaseAnalytics>
}
```

#### BookmarkService
```typescript
interface BookmarkService {
  // Read operations
  getByBuyer(buyerId: string): Promise<BookmarkWithProduct[]>
  isBookmarked(buyerId: string, productId: string): Promise<boolean>
  
  // Write operations
  add(buyerId: string, productId: string): Promise<Bookmark>
  remove(buyerId: string, productId: string): Promise<void>
  toggle(buyerId: string, productId: string): Promise<boolean>
}
```

#### ReviewService
```typescript
interface ReviewService {
  // Read operations
  getByProduct(productId: string): Promise<ReviewWithBuyer[]>
  getByBuyer(buyerId: string): Promise<ReviewWithProduct[]>
  getAverageRating(productId: string): Promise<number>
  
  // Write operations
  create(review: ReviewInsert): Promise<Review>
  update(id: string, review: ReviewUpdate): Promise<Review>
  delete(id: string): Promise<void>
}
```

#### AnalyticsService
```typescript
interface AnalyticsService {
  // Seller analytics
  getProductAnalytics(productId: string): Promise<ProductAnalytics>
  getSellerDashboard(sellerId: string): Promise<SellerDashboard>
  getCompetitorAnalysis(productId: string): Promise<CompetitorAnalysis>
  
  // Buyer analytics
  getBuyerProductPerformance(buyerId: string, productId: string): Promise<ProductPerformance>
  getBuyerDashboard(buyerId: string): Promise<BuyerDashboard>
  
  // Tracking
  trackProductView(productId: string, buyerId?: string): Promise<void>
  trackComparisonAdd(productId: string): Promise<void>
  trackBookmark(productId: string, buyerId: string): Promise<void>
  trackCartAdd(productId: string, buyerId: string): Promise<void>
  trackPurchase(productId: string, buyerId: string, amount: number): Promise<void>
}
```

**Seller Analytics Features** (Requirement 16):

1. **Product Performance Metrics**:
   - Views, unique visitors, detail page views
   - Bookmark counts and bookmark rate
   - Cart additions and cart add rate
   - Conversion rate and revenue
   - Time-series trends for all metrics

2. **Competitor Analysis**:
   - Main competitors identified by category and similarity
   - Comparative metrics (price, ratings, scores, features)
   - Market positioning (leader, challenger, follower)
   - Improvement suggestions based on competitive gaps

3. **Customer Insights**:
   - Recent reviews and feedback
   - Customer segments and behavior patterns
   - Repeat customer rate

**Buyer Dashboard Features** (Requirement 15):

1. **Purchased Product Management**:
   - All purchased products with usage metrics
   - Implementation status tracking
   - Usage statistics (usage count, frequency, active users)
   - ROI calculations (actual vs expected)

2. **Performance Tracking**:
   - Time-series data for adoption and value metrics
   - Satisfaction scores
   - Time and cost savings

3. **Feedback System**:
   - Ability to provide feedback on purchased products
   - Feature requests and issue reporting
   - Feedback visible to sellers for product improvement

**Design Rationale**: Analytics provide actionable insights for both buyers and sellers. Sellers can optimize their products and positioning based on performance data and competitive analysis. Buyers can track ROI and usage to ensure they're getting value from purchased products.

#### QuoteService
```typescript
interface QuoteService {
  // Quote generation
  generateQuote(request: QuoteRequest): Promise<Quote>
  acceptQuote(quoteId: string): Promise<CartItem>
  rejectQuote(quoteId: string): Promise<void>
  
  // Quote management
  getByBuyer(buyerId: string): Promise<Quote[]>
  getBySeller(sellerId: string): Promise<Quote[]>
  getById(quoteId: string): Promise<Quote | null>
  
  // Quote expiration
  checkExpiration(quoteId: string): Promise<boolean>
  extendValidity(quoteId: string, newDate: Date): Promise<Quote>
}
```

**Automated Quote Generation** (Requirement 19):

The quote system provides automated pricing for products with variable pricing based on buyer requirements:

1. **Quote Request Flow**:
   - Buyer views product with quote-based pricing
   - Product card displays "Request Quote" button instead of fixed price
   - Buyer fills out quote request form with company details and requirements
   - System automatically calculates pricing based on predefined rules

2. **Pricing Rules**:
   - Company size multiplier (larger companies = higher pricing)
   - Feature requirements (additional features = higher pricing)
   - Implementation complexity (custom requirements = higher pricing)
   - Volume discounts (multiple licenses = lower per-unit pricing)

3. **Quote Display**:
   - Quoted price with detailed breakdown
   - Validity period (typically 30 days)
   - Estimated response date (for seller review if needed)
   - Terms and conditions

4. **Quote Acceptance**:
   - Buyer reviews quote and can accept or reject
   - Accepted quote converts to cart item with locked price
   - Price remains locked even if base pricing changes
   - Quote can be purchased within validity period

**Design Rationale**: Automated quotes reduce friction in the sales process for variable-priced products. Buyers get immediate pricing without waiting for manual quotes, while sellers can encode their pricing logic into the system. The validity period creates urgency while the locked price provides certainty.

#### BundleService
```typescript
interface BundleService {
  // Bundle management
  getSuggestedBundles(cartItems: CartItem[]): Promise<ProductBundle[]>
  getFrequentlyBoughtTogether(productId: string): Promise<ProductBundle[]>
  createCustomBundle(productIds: string[]): Promise<ProductBundle>
  
  // Bundle pricing
  calculateBundlePrice(productIds: string[]): Promise<number>
  applyBundleDiscount(basePrice: number, productCount: number): Promise<number>
}
```

**Bundle System** (Requirement 20):

The bundle system helps buyers discover and purchase complementary products together:

1. **Bundle Suggestions**:
   - System suggests bundles when buyer adds multiple products to cart
   - Suggestions based on products commonly purchased together
   - Bundles show combined products with total price and discount

2. **Bundle Pricing Rules**:
   - Base pricing: Sum of individual product prices
   - Discount tiers:
     - 2 products: 5% discount
     - 3 products: 10% discount
     - 4+ products: 15% discount
   - Custom bundles can have seller-defined discounts

3. **Bundle Purchase**:
   - All bundle items processed as single transaction
   - Single order created with all bundle products
   - Bundle discount applied to order total
   - Individual products still tracked for analytics

4. **Bundle Types**:
   - **Auto-generated**: Based on purchase history analysis
   - **Custom**: Buyer creates from cart items
   - **Curated**: Seller-created bundles (future enhancement)

**Design Rationale**: Bundles increase average order value while providing value to buyers through discounts. The automatic suggestion system reduces decision fatigue by recommending proven combinations. Processing as a single transaction simplifies the purchase experience.

#### DownloadService
```typescript
interface DownloadService {
  // Download management
  getDownloadUrl(productId: string, buyerId: string, orderId: string): Promise<string>
  trackDownload(productId: string, buyerId: string, orderId: string): Promise<void>
  getDownloadHistory(buyerId: string): Promise<ProductDownload[]>
  
  // File management
  uploadProductFile(productId: string, file: File): Promise<string>
  validateFileAccess(buyerId: string, productId: string): Promise<boolean>
}
```

#### RecommendationService
```typescript
interface RecommendationService {
  // Recommendation algorithms
  getPersonalized(buyerId: string, limit: number): Promise<ProductWithRating[]>
  getFrequentlyBoughtTogether(productId: string, limit: number): Promise<ProductWithRating[]>
  getSuggestedBundles(buyerId: string): Promise<ProductBundle[]>
  getTrending(limit: number): Promise<ProductWithRating[]>
  getNewAndNotable(limit: number): Promise<ProductWithRating[]>
  getSimilarProducts(productId: string, limit: number): Promise<ProductWithRating[]>
}
```

**Recommendation Algorithms** (Requirement 14):

1. **New and Notable**: Recently added products and featured products, sorted by recency and featured status
2. **Recommended for You**: Personalized recommendations based on:
   - Browsing history (viewed products)
   - Bookmarked products
   - Purchased products
   - Buyer profile preferences (interested categories, priority metrics)
3. **Frequently Bought Together**: Products commonly purchased with the current product, based on order history analysis
4. **Similar Products**: Products in the same category with similar features and metrics
5. **Trending**: Products with high recent engagement (views, bookmarks, purchases)

**Prioritization Criteria** (Requirement 14.5):
- Recency: Newer products ranked higher
- Ratings: Higher-rated products ranked higher
- Featured status: Featured products boosted in rankings
- Buyer behavior: Products matching buyer's interests and past behavior ranked higher

**Design Rationale**: The recommendation system uses multiple algorithms to provide diverse discovery paths. Personalization increases relevance while trending and new products ensure fresh content. The system balances exploration (new products) with exploitation (similar to what buyer likes).

### Data Persistence Strategy

**Supabase Database Integration** (Requirement 21):

All marketplace data is persisted in Supabase PostgreSQL database with the following guarantees:

1. **Product Data**: All product information (name, description, pricing, metrics) stored in `products` table
2. **Bookmark Data**: Buyer-product bookmark relationships stored in `bookmarks` table
3. **Cart Data**: Cart items with quantities stored in `cart_items` table
4. **Order Data**: Completed orders and order items stored in `orders` and `order_items` tables
5. **Review Data**: Product reviews with ratings stored in `reviews` table
6. **Analytics Data**: Performance metrics stored in `product_analytics` table
7. **Authentication**: User sessions managed by Supabase Auth service
8. **File Storage**: Product images and downloadable files stored in Supabase Storage

**Data Consistency**:
- Transactions used for multi-step operations (checkout, order creation)
- Foreign key constraints ensure referential integrity
- Row Level Security (RLS) policies enforce data access rules
- Indexes on frequently queried columns for performance

**Data Retrieval**:
- All UI components fetch data from Supabase via service layer
- Server-side data loading in SvelteKit `+page.server.ts` files
- Client-side updates via Supabase client for real-time interactions
- Caching strategy for frequently accessed data (featured products, categories)

**Design Rationale**: Centralizing all data in Supabase provides a single source of truth, simplifies data management, and leverages Supabase's built-in features (auth, RLS, real-time subscriptions). The service layer abstraction allows for future database changes without affecting UI components.

### Search and Discovery

**Search Functionality** (Requirement 3):

1. **Search Query Processing**:
   - Text search across product name, short description, and long description
   - Category matching for category-based searches
   - Case-insensitive matching
   - Partial word matching for better results

2. **Filter Combination** (Requirement 3.2):
   - Search query + category filter
   - Search query + price range filter
   - Search query + rating filter
   - Multiple filters can be applied simultaneously
   - Results must match ALL applied filters (AND logic)

3. **Search Results**:
   - Products displayed in grid layout
   - Relevance-based sorting (exact matches first)
   - Empty state with helpful message when no results found
   - Search query preserved in URL for sharing and bookmarking

4. **Search Performance**:
   - Database full-text search using PostgreSQL's text search features
   - Indexed columns for fast query execution
   - Debounced search input (300ms) to reduce unnecessary queries
   - Result caching for common queries

**Category Filtering** (Requirement 2):

1. **Category Options**: HR, Law, Office, DevTools
2. **Filter Behavior**:
   - Single category selection (radio button style)
   - "All Categories" option to clear filter
   - Immediate results update on selection
   - Category preserved in URL

3. **Category Display**:
   - Category filter panel on marketplace page
   - Product count shown for each category
   - Active category highlighted

**Design Rationale**: The search system balances simplicity with power. Text search across multiple fields ensures buyers find relevant products even with partial information. Filter combination allows progressive refinement of results. URL preservation enables sharing and bookmarking of search results.

## Data Models

### Database Schema Extensions

The existing schema covers most requirements. Additional tables needed:

#### product_analytics Table
```sql
create table public.product_analytics (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  date date not null default current_date,
  
  -- Traffic metrics
  views integer default 0,
  unique_visitors integer default 0,
  detail_page_views integer default 0,
  comparison_adds integer default 0,
  
  -- Engagement metrics
  bookmarks integer default 0,
  bookmark_rate decimal(5,4) default 0, -- bookmarks / views
  cart_adds integer default 0,
  cart_add_rate decimal(5,4) default 0, -- cart_adds / views
  quote_requests integer default 0,
  
  -- Conversion metrics
  purchases integer default 0,
  conversion_rate decimal(5,4) default 0, -- purchases / views
  revenue decimal(10,2) default 0,
  average_order_value decimal(10,2) default 0,
  
  -- User behavior metrics
  average_time_on_page integer default 0, -- seconds
  bounce_rate decimal(5,4) default 0,
  return_visitor_rate decimal(5,4) default 0,
  
  -- Competitive metrics
  market_share_percentage decimal(5,2) default 0,
  category_rank integer,
  
  created_at timestamptz default now(),
  
  unique(product_id, date)
);
```

#### product_scores Table
```sql
create table public.product_scores (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  fit_score integer check (fit_score >= 0 and fit_score <= 100),
  feature_score integer check (feature_score >= 0 and feature_score <= 100),
  integration_score integer check (integration_score >= 0 and integration_score <= 100),
  review_score integer check (review_score >= 0 and review_score <= 100),
  overall_score integer check (overall_score >= 0 and overall_score <= 100),
  score_breakdown jsonb, -- Detailed breakdown of how each score was calculated
  calculated_at timestamptz default now(),
  updated_at timestamptz default now(),
  model_version text default 'v1.0', -- Track which ML model version calculated the scores
  
  unique(product_id)
);
```

#### buyer_product_usage Table
```sql
create table public.buyer_product_usage (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  
  -- Implementation tracking
  implementation_status text default 'pending', -- pending, in_progress, completed, abandoned
  implementation_started_at timestamptz,
  implementation_completed_at timestamptz,
  
  -- Usage metrics
  usage_count integer default 0,
  last_used_at timestamptz,
  active_users integer default 0,
  usage_frequency text, -- daily, weekly, monthly, rarely
  
  -- Performance metrics
  roi_actual decimal(5,2),
  roi_expected decimal(5,2),
  satisfaction_score integer check (satisfaction_score >= 1 and satisfaction_score <= 5),
  time_saved_hours decimal(10,2),
  cost_saved decimal(10,2),
  
  -- Feedback
  feedback_text text,
  feature_requests jsonb,
  issues_reported jsonb,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(buyer_id, product_id, order_id)
);
```

#### quotes Table
```sql
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  company_size integer,
  requirements jsonb,
  quoted_price decimal(10,2) not null,
  pricing_breakdown jsonb,
  status text default 'pending', -- pending, sent, accepted, expired, rejected
  valid_until timestamptz not null,
  estimated_response_date timestamptz,
  sent_to_seller_at timestamptz,
  seller_notified boolean default false,
  buyer_company_info jsonb,
  additional_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

#### product_downloads Table
```sql
create table public.product_downloads (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  download_url text not null,
  file_name text not null,
  file_size_bytes bigint,
  downloaded_at timestamptz default now()
);
```

#### bundles Table
```sql
create table public.bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  discount_percentage decimal(5,2) default 0,
  is_auto_generated boolean default false,
  created_at timestamptz default now()
);

create table public.bundle_products (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.bundles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  
  unique(bundle_id, product_id)
);
```

#### buyer_onboarding Table
```sql
create table public.buyer_onboarding (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  completed boolean default false,
  
  -- Company information
  company_name text,
  company_size integer,
  company_structure text, -- startup, small_business, enterprise
  industry text,
  
  -- Interests and preferences
  interested_categories text[], -- Array of product categories
  budget_range text, -- low, medium, high, enterprise
  priority_metrics text[], -- What metrics matter most: roi, ease_of_use, integration, support
  
  -- Onboarding progress
  steps_completed jsonb default '[]'::jsonb,
  started_at timestamptz default now(),
  completed_at timestamptz,
  
  unique(buyer_id)
);
```

#### seller_onboarding Table
```sql
create table public.seller_onboarding (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  completed boolean default false,
  verified boolean default false,
  
  -- Company verification
  company_name text not null,
  company_website text,
  business_registration_number text,
  tax_id text,
  verification_documents jsonb, -- URLs to uploaded verification docs
  
  -- Product information
  primary_category product_category,
  product_count_estimate integer,
  
  -- Onboarding progress
  steps_completed jsonb default '[]'::jsonb,
  verification_status text default 'pending', -- pending, in_review, approved, rejected
  verification_notes text,
  started_at timestamptz default now(),
  completed_at timestamptz,
  verified_at timestamptz,
  
  unique(seller_id)
);
```

#### product_features Table
```sql
create table public.product_features (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  feature_name text not null,
  feature_description text,
  relevance_score integer check (relevance_score >= 0 and relevance_score <= 100),
  category text, -- core, integration, support, analytics, etc.
  is_highlighted boolean default false,
  display_order integer default 0,
  created_at timestamptz default now()
);

create index idx_product_features_product on public.product_features(product_id);
create index idx_product_features_relevance on public.product_features(relevance_score desc);
```

#### competitor_relationships Table
```sql
create table public.competitor_relationships (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  competitor_product_id uuid not null references public.products(id) on delete cascade,
  similarity_score decimal(5,2), -- How similar are these products (0-100)
  market_overlap_score decimal(5,2), -- How much do they compete for same customers
  calculated_at timestamptz default now(),
  
  unique(product_id, competitor_product_id),
  check (product_id != competitor_product_id)
);
```

### TypeScript Type Definitions

```typescript
// Core types
export type ProductCategory = 'HR' | 'Law' | 'Office' | 'DevTools'
export type UserRole = 'buyer' | 'seller'
export type CloudClientType = 'cloud' | 'client' | 'hybrid'

// Extended product type with ratings and scores
export interface ProductWithRating extends Product {
  average_rating: number
  review_count: number
}

export interface ProductWithScores extends ProductWithRating {
  fit_score: number // 0-100
  feature_score: number // 0-100
  integration_score: number // 0-100
  review_score: number // 0-100
  overall_score: number // 0-100
  score_breakdown: ScoreBreakdown
  features: ProductFeature[]
}

export interface ScoreBreakdown {
  fit: {
    score: number
    factors: {
      implementation_time: number
      deployment_model: number
      complexity: number
      buyer_match?: number
    }
  }
  feature: {
    score: number
    factors: {
      completeness: number
      description_quality: number
      feature_count: number
      high_value_features: number
    }
  }
  integration: {
    score: number
    factors: {
      deployment_type: number
      category_ecosystem: number
      api_availability: number
      buyer_compatibility?: number
    }
  }
  review: {
    score: number
    factors: {
      average_rating: number
      review_count: number
      confidence_adjustment: number
    }
  }
}

export interface ProductFeature {
  id: string
  product_id: string
  feature_name: string
  feature_description: string
  relevance_score: number // 0-100
  category: string
  is_highlighted: boolean
  display_order: number
}

// Cart item with product details
export interface CartItemWithProduct extends CartItem {
  product: ProductWithRating
}

// Order with items
export interface OrderWithItems extends Order {
  items: OrderItemWithProduct[]
}

export interface OrderItemWithProduct extends OrderItem {
  product: ProductWithRating
}

// Bookmark with product
export interface BookmarkWithProduct extends Bookmark {
  product: ProductWithRating
}

// Review with buyer info
export interface ReviewWithBuyer extends Review {
  buyer: {
    full_name: string | null
    email: string
  }
}

// Analytics types
export interface ProductAnalytics {
  product_id: string
  
  // Traffic metrics
  total_views: number
  unique_visitors: number
  detail_page_views: number
  comparison_adds: number
  traffic_trend: TimeSeriesData[]
  
  // Engagement metrics
  total_bookmarks: number
  bookmark_rate: number
  total_cart_adds: number
  cart_add_rate: number
  quote_requests: number
  average_time_on_page: number
  bounce_rate: number
  return_visitor_rate: number
  engagement_trend: TimeSeriesData[]
  
  // Conversion metrics
  total_purchases: number
  conversion_rate: number
  total_revenue: number
  average_order_value: number
  conversion_funnel: ConversionFunnel
  revenue_trend: TimeSeriesData[]
  
  // Competitive metrics
  market_share_percentage: number
  category_rank: number
  
  // Review metrics
  average_rating: number
  review_count: number
  rating_distribution: RatingDistribution
  review_trend: TimeSeriesData[]
}

export interface SellerDashboard {
  // Overview metrics
  total_products: number
  total_revenue: number
  total_orders: number
  average_rating: number
  
  // Performance charts
  revenue_trend: TimeSeriesData[]
  order_trend: TimeSeriesData[]
  conversion_trend: TimeSeriesData[]
  
  // Product performance
  top_products: ProductPerformanceSummary[]
  underperforming_products: ProductPerformanceSummary[]
  
  // Customer insights
  recent_reviews: ReviewWithBuyer[]
  customer_segments: CustomerSegment[]
  repeat_customer_rate: number
  
  // Competitive position
  market_position: MarketPosition
  category_rankings: CategoryRanking[]
}

export interface ProductPerformanceSummary {
  product: ProductWithScores
  views: number
  conversion_rate: number
  revenue: number
  growth_rate: number
  trend: 'up' | 'down' | 'stable'
}

export interface CompetitorAnalysis {
  product: ProductWithScores
  competitors: CompetitorProduct[]
  market_position: 'leader' | 'challenger' | 'follower'
  
  // Detailed comparisons
  price_comparison: PriceComparison
  feature_comparison: FeatureComparison[]
  metric_comparison: MetricComparison
  score_comparison: ScoreComparison
  
  // Improvement suggestions (paywall-locked premium feature)
  improvement_suggestions: ImprovementSuggestion[]
  is_premium_unlocked: boolean
}

export interface CompetitorProduct extends ProductWithScores {
  similarity_score: number
  market_overlap_score: number
  price_difference: number
  price_difference_percentage: number
  rating_difference: number
  score_differences: {
    fit: number
    feature: number
    integration: number
    review: number
    overall: number
  }
}

export interface ImprovementSuggestion {
  category: string // pricing, features, marketing, support
  priority: 'high' | 'medium' | 'low'
  suggestion: string
  expected_impact: string
  based_on_metrics: string[]
  estimated_effort: string
}

export interface BuyerDashboard {
  // Overview
  purchased_products: PurchasedProductSummary[]
  total_spent: number
  active_products: number
  average_roi: number
  
  // Performance tracking
  roi_trend: TimeSeriesData[]
  usage_trend: TimeSeriesData[]
  satisfaction_trend: TimeSeriesData[]
  
  // Product health
  well_performing_products: PurchasedProductSummary[]
  underutilized_products: PurchasedProductSummary[]
  
  // Recommendations
  recommended_products: ProductWithScores[]
  recommended_bundles: ProductBundle[]
  
  // Charts and visualizations
  spending_by_category: CategorySpending[]
  implementation_timeline: ImplementationTimeline[]
}

export interface TimeSeriesData {
  date: string
  value: number
  label?: string
}

export interface ConversionFunnel {
  views: number
  detail_views: number
  cart_adds: number
  purchases: number
  conversion_rates: {
    view_to_detail: number
    detail_to_cart: number
    cart_to_purchase: number
    overall: number
  }
}

export interface RatingDistribution {
  five_star: number
  four_star: number
  three_star: number
  two_star: number
  one_star: number
}

export interface CustomerSegment {
  segment_name: string
  customer_count: number
  average_order_value: number
  repeat_purchase_rate: number
}

export interface MarketPosition {
  category: string
  rank: number
  total_competitors: number
  market_share: number
  position: 'leader' | 'challenger' | 'follower'
}

export interface CategoryRanking {
  category: string
  rank: number
  score: number
  trend: 'up' | 'down' | 'stable'
}

export interface PriceComparison {
  your_price: number
  competitor_average: number
  market_low: number
  market_high: number
  position: 'premium' | 'competitive' | 'budget'
}

export interface FeatureComparison {
  feature_name: string
  your_product: boolean
  competitors_with_feature: number
  total_competitors: number
  importance_score: number
}

export interface MetricComparison {
  roi: { yours: number; competitor_avg: number }
  retention: { yours: number; competitor_avg: number }
  implementation_time: { yours: number; competitor_avg: number }
}

export interface ScoreComparison {
  your_scores: ProductScores
  competitor_average: ProductScores
  market_leader: ProductScores
}

export interface CategorySpending {
  category: string
  amount: number
  product_count: number
}

export interface ImplementationTimeline {
  product_name: string
  start_date: string
  expected_completion: string
  actual_completion?: string
  status: string
}

export interface PurchasedProductSummary {
  product: ProductWithRating
  purchase_date: string
  implementation_status: string
  usage_count: number
  roi_actual: number | null
  roi_expected: number | null
}

export interface Quote {
  id: string
  product_id: string
  buyer_id: string
  seller_id: string
  company_size: number
  requirements: Record<string, any>
  quoted_price: number
  pricing_breakdown: Record<string, number>
  status: 'pending' | 'sent' | 'accepted' | 'expired' | 'rejected'
  valid_until: string
  estimated_response_date: string
  sent_to_seller_at?: string
  seller_notified: boolean
  buyer_company_info: Record<string, any>
  additional_notes?: string
  created_at: string
  updated_at: string
}

export interface QuoteRequest {
  product_id: string
  buyer_id: string
  company_size: number
  requirements: Record<string, any>
  buyer_company_info: Record<string, any>
  additional_notes?: string
}

export interface BuyerOnboarding {
  id: string
  buyer_id: string
  completed: boolean
  
  // Company information
  company_name?: string
  company_size?: number
  company_structure?: 'startup' | 'small_business' | 'enterprise'
  industry?: string
  
  // Interests and preferences
  interested_categories?: string[]
  budget_range?: 'low' | 'medium' | 'high' | 'enterprise'
  priority_metrics?: string[]
  
  // Progress tracking
  steps_completed: string[]
  started_at: string
  completed_at?: string
}

export interface SellerOnboarding {
  id: string
  seller_id: string
  completed: boolean
  verified: boolean
  
  // Company verification
  company_name: string
  company_website?: string
  business_registration_number?: string
  tax_id?: string
  verification_documents?: Record<string, string>
  
  // Product information
  primary_category?: ProductCategory
  product_count_estimate?: number
  
  // Progress tracking
  steps_completed: string[]
  verification_status: 'pending' | 'in_review' | 'approved' | 'rejected'
  verification_notes?: string
  started_at: string
  completed_at?: string
  verified_at?: string
}

export interface ProductBundle {
  id: string
  name: string
  description: string
  products: ProductWithRating[]
  total_price: number
  discounted_price: number
  discount_percentage: number
}

// Filter types
export interface ProductFilters {
  category?: ProductCategory
  minPrice?: number
  maxPrice?: number
  minRating?: number
  featured?: boolean
  new?: boolean
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties were identified as redundant or combinable:

- Properties about product card display (1.2, 2.4) can be combined into a single comprehensive property
- Properties about list size changes (bookmark add/remove, cart add/remove, comparison add/remove) follow the same pattern and can be consolidated
- Properties about data persistence (21.1-21.8) all follow round-trip patterns and can be grouped
- Properties about navigation and UI consistency (13.1-13.4) can be combined

The following properties represent the unique, non-redundant validation requirements:

### Core Data Properties

**Property 1: Product card completeness**
*For any* product displayed in any context (grid, carousel, comparison, bookmarks), the rendered product card should contain all required fields: name, logo, short description, price, and aggregated metric scores (fit score, feature score, integration score, review score).
**Validates: Requirements 1.2, 2.4, 4.1, 6.3, 14.4**

**Property 2: Category filtering correctness**
*For any* category filter selection, all returned products should have a category matching the selected filter.
**Validates: Requirements 2.2**

**Property 3: Search result relevance**
*For any* search query, all returned products should match the query in at least one of: name, description, or category.
**Validates: Requirements 3.1**

**Property 4: Combined filter correctness**
*For any* search query and filter combination, all returned products should satisfy both the search criteria and the filter criteria.
**Validates: Requirements 3.2**

**Property 5: Extended metrics completeness**
*For any* product detail view, the displayed metrics should include ROI, retention rate, quarter-over-quarter changes, cloud/client classification, implementation time, and access depth.
**Validates: Requirements 4.4**

### List Management Properties

**Property 6: Comparison list size constraint**
*For any* comparison list, the number of products should never exceed 3.
**Validates: Requirements 5.2**

**Property 7: Comparison display completeness**
*For any* set of products in the comparison view, each product should display price, all metrics, reviews summary, and demo visuals.
**Validates: Requirements 5.3**

**Property 8: List modification invariant**
*For any* list operation (bookmark add/remove, cart add/remove, comparison add/remove), adding an item should increase the list size by 1, and removing an item should decrease the list size by 1.
**Validates: Requirements 5.4, 6.1, 6.4, 7.1**

**Property 9: Bookmark toggle idempotence**
*For any* product, bookmarking it twice should return the bookmark list to its original state (toggle behavior).
**Validates: Requirements 6.2**

### Cart and Order Properties

**Property 10: Cart total accuracy**
*For any* cart, the displayed total cost should equal the sum of (price × quantity) for all cart items.
**Validates: Requirements 7.2**

**Property 11: Cart removal updates total**
*For any* cart item removal, the new total should equal the old total minus the removed item's (price × quantity).
**Validates: Requirements 7.3**

**Property 12: Checkout creates order**
*For any* cart at checkout, completing the checkout should create an order containing all cart items with matching product IDs, quantities, and prices.
**Validates: Requirements 7.5**

**Property 13: Order display completeness**
*For any* order in the order history, the displayed information should include order date, all products purchased, and total cost.
**Validates: Requirements 8.1**

**Property 14: Order detail completeness**
*For any* order detail view, the displayed information should include all products and complete transaction details.
**Validates: Requirements 8.2**

### Review Properties

**Property 15: Review display completeness**
*For any* product with reviews, each displayed review should include reviewer name, rating, and review text.
**Validates: Requirements 9.1**

**Property 16: Average rating accuracy**
*For any* product with reviews, the displayed average rating should equal the arithmetic mean of all review ratings for that product.
**Validates: Requirements 9.2**

### Authentication and Authorization Properties

**Property 17: Protected route authorization**
*For any* unauthenticated user attempting to access protected routes (bookmarks, cart, orders, dashboard), the system should redirect to the sign-in page.
**Validates: Requirements 10.5**

### Product Management Properties

**Property 18: Product creation visibility**
*For any* valid product data submitted by a seller, the created product should appear in marketplace queries immediately after creation.
**Validates: Requirements 12.2**

**Property 19: Form validation completeness**
*For any* incomplete product form submission, the validation should identify and display errors for all missing required fields.
**Validates: Requirements 12.3**

**Property 20: Product categorization**
*For any* newly created product, it should automatically appear in queries filtered by its category.
**Validates: Requirements 12.4**

**Property 21: File upload validation**
*For any* file upload (logo or demo visual), the system should validate format and size before accepting, rejecting invalid files.
**Validates: Requirements 12.5**

### Navigation Properties

**Property 22: Navigation presence**
*For any* page in the application, the navigation bar should be present and contain links to all main sections.
**Validates: Requirements 13.1**

**Property 23: Navigation functionality**
*For any* navigation link click, the system should navigate to the corresponding page.
**Validates: Requirements 13.2**

**Property 24: Active navigation highlighting**
*For any* page, the corresponding navigation item should be highlighted as active.
**Validates: Requirements 13.3**

**Property 25: Cart count accuracy**
*For any* cart with items, the navigation bar should display a count equal to the number of items in the cart.
**Validates: Requirements 13.4**

### Recommendation Properties

**Property 26: Recommendation prioritization**
*For any* set of recommended products, they should be ordered by the prioritization criteria (recency, ratings, featured status, buyer behavior).
**Validates: Requirements 14.5**

### Dashboard Properties

**Property 27: Buyer dashboard completeness**
*For any* buyer accessing the product management dashboard, all purchased products should be displayed with usage metrics and performance data.
**Validates: Requirements 15.1**

**Property 28: Product performance display**
*For any* purchased product view, the display should include implementation status, usage statistics, and ROI calculations.
**Validates: Requirements 15.2**

**Property 29: Feedback persistence**
*For any* buyer feedback submission, the feedback should be stored and retrievable by the seller.
**Validates: Requirements 15.4**

**Property 30: Seller analytics completeness**
*For any* seller accessing the analytics dashboard, the display should include product views, conversion rates, bookmark counts, and revenue metrics.
**Validates: Requirements 16.1**

**Property 31: Competitor analysis completeness**
*For any* product in competitor analysis, the display should include main competitors with comparative metrics and market positioning.
**Validates: Requirements 16.2**

**Property 32: Seller product management display**
*For any* seller accessing the product management page, all their products should be displayed with edit and delete options.
**Validates: Requirements 17.1**

**Property 33: Product update visibility**
*For any* product update by a seller, subsequent queries should return the updated product data.
**Validates: Requirements 17.2**

**Property 34: Product deletion behavior**
*For any* product deletion, the product should not appear in marketplace queries but should remain visible in historical order data.
**Validates: Requirements 17.3**

**Property 35: Product performance metrics display**
*For any* product in the seller's performance view, the display should include sales data, review summaries, and engagement metrics.
**Validates: Requirements 17.4**

### Download and Transaction Properties

**Property 36: Download availability after purchase**
*For any* downloadable product purchase, download links should be immediately available on the confirmation page and in order history.
**Validates: Requirements 18.1, 18.2**

**Property 37: Download tracking**
*For any* product download, the download event should be recorded and usage metrics should be updated.
**Validates: Requirements 18.4**

### Quote Properties

**Property 38: Quote UI conditional display**
*For any* product with quote-based pricing, the product card should display a "Request Quote" button instead of a fixed price.
**Validates: Requirements 19.1**

**Property 39: Quote calculation correctness**
*For any* quote request, the calculated price should follow the predefined pricing rules based on company size and requirements.
**Validates: Requirements 19.2**

**Property 40: Quote display completeness**
*For any* generated quote, the display should include pricing breakdown and validity period.
**Validates: Requirements 19.3**

**Property 41: Quote acceptance creates cart item**
*For any* accepted quote, a cart item should be created with the product ID and the exact quoted price.
**Validates: Requirements 19.4**

### Bundle Properties

**Property 42: Bundle pricing correctness**
*For any* custom bundle, the calculated price should follow the bundle pricing rules (base prices with discount applied).
**Validates: Requirements 20.2**

**Property 43: Bundle purchase atomicity**
*For any* bundle purchase, all bundle items should be included in a single order transaction.
**Validates: Requirements 20.4**

### Data Persistence Properties

**Property 44: Product data round-trip**
*For any* product created or updated, storing then retrieving the product should return equivalent data.
**Validates: Requirements 21.1**

**Property 45: Bookmark data round-trip**
*For any* bookmark added, storing then retrieving the bookmark should return the same buyer-product relationship.
**Validates: Requirements 21.2**

**Property 46: Cart data round-trip**
*For any* cart item added, storing then retrieving the cart should return the same items.
**Validates: Requirements 21.3**

**Property 47: Order data round-trip**
*For any* order completed, storing then retrieving the order should return the same order data and items.
**Validates: Requirements 21.4**

**Property 48: Review data round-trip**
*For any* review submitted, storing then retrieving the review should return equivalent review data.
**Validates: Requirements 21.5**

**Property 49: Analytics data round-trip**
*For any* analytics metrics calculated, storing then retrieving the metrics should return equivalent data.
**Validates: Requirements 21.8**

## Error Handling

### Error Categories

1. **Validation Errors**: Invalid user input, missing required fields, format violations
2. **Authentication Errors**: Invalid credentials, expired sessions, insufficient permissions
3. **Database Errors**: Connection failures, constraint violations, query timeouts
4. **Business Logic Errors**: Comparison list full, product out of stock, quote expired
5. **External Service Errors**: File upload failures, payment processing errors

### Error Handling Strategy

#### Client-Side Validation
- Form validation before submission
- Real-time feedback for user input
- Clear error messages with actionable guidance
- Prevent invalid state transitions

#### Server-Side Validation
- Validate all inputs regardless of client-side validation
- Return structured error responses with error codes
- Log errors for debugging and monitoring
- Sanitize error messages before displaying to users

#### Database Error Handling
- Catch and handle constraint violations gracefully
- Implement retry logic for transient failures
- Use transactions for multi-step operations
- Provide fallback behavior for read failures

#### User-Facing Error Messages
- Use plain language, avoid technical jargon
- Provide specific guidance on how to resolve the error
- Include support contact information for critical errors
- Maintain consistent error message formatting

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
    timestamp: string
  }
}
```

### Common Error Scenarios

1. **Product Not Found**: Return 404 with message "Product not found"
2. **Unauthorized Access**: Redirect to sign-in with return URL
3. **Comparison List Full**: Display toast message "Maximum 3 products can be compared"
4. **Duplicate Bookmark**: Silently handle (idempotent operation)
5. **Cart Item Already Exists**: Update quantity instead of creating duplicate
6. **Invalid File Upload**: Display validation error with accepted formats and size limits
7. **Quote Expired**: Display message with option to request new quote
8. **Database Connection Error**: Display generic error with retry option

## Testing Strategy

### Dual Testing Approach

The application will use both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Property-Based Testing

**Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each property test must be tagged with a comment referencing the design document property
- Tag format: `// Feature: startup-marketplace, Property {number}: {property_text}`

**Property Test Examples**:

```typescript
// Feature: startup-marketplace, Property 2: Category filtering correctness
test('category filter returns only matching products', () => {
  fc.assert(
    fc.asyncProperty(
      fc.constantFrom('HR', 'Law', 'Office'),
      async (category) => {
        const products = await productService.getByCategory(category)
        return products.every(p => p.category === category)
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: startup-marketplace, Property 10: Cart total accuracy
test('cart total equals sum of item prices', () => {
  fc.assert(
    fc.asyncProperty(
      fc.array(cartItemGenerator(), { minLength: 1, maxLength: 10 }),
      async (items) => {
        const cart = await createCartWithItems(items)
        const expectedTotal = items.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        )
        const actualTotal = await cartService.getTotal(cart.buyer_id)
        return Math.abs(expectedTotal - actualTotal) < 0.01 // floating point tolerance
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: startup-marketplace, Property 16: Average rating accuracy
test('average rating equals mean of all ratings', () => {
  fc.assert(
    fc.asyncProperty(
      fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 50 }),
      async (ratings) => {
        const product = await createProductWithReviews(ratings)
        const expectedAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length
        const actualAvg = await reviewService.getAverageRating(product.id)
        return Math.abs(expectedAvg - actualAvg) < 0.01
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: startup-marketplace, Property 44: Product data round-trip
test('product create-retrieve round trip preserves data', () => {
  fc.assert(
    fc.asyncProperty(
      productGenerator(),
      async (productData) => {
        const created = await productService.create(productData)
        const retrieved = await productService.getById(created.id)
        return isEquivalentProduct(created, retrieved)
      }
    ),
    { numRuns: 100 }
  )
})
```

### Unit Testing

**Framework**: Vitest (fast unit test framework for Vite projects)

**Coverage Areas**:
- Component rendering with various props
- Service layer functions with specific inputs
- Edge cases (empty lists, null values, boundary conditions)
- Error handling paths
- Authentication and authorization logic
- Form validation logic

**Unit Test Examples**:

```typescript
describe('ProductCard', () => {
  test('renders all required fields', () => {
    const product = createMockProduct()
    render(ProductCard, { props: { product } })
    
    expect(screen.getByText(product.name)).toBeInTheDocument()
    expect(screen.getByText(product.short_description)).toBeInTheDocument()
    expect(screen.getByText(`$${product.price}`)).toBeInTheDocument()
  })
  
  test('emits compare event when compare button clicked', async () => {
    const product = createMockProduct()
    const { component } = render(ProductCard, { 
      props: { product, showCompareButton: true } 
    })
    
    const compareButton = screen.getByRole('button', { name: /compare/i })
    await fireEvent.click(compareButton)
    
    expect(component.$$.callbacks.compare).toHaveBeenCalled()
  })
})

describe('CartService', () => {
  test('addItem creates new cart item', async () => {
    const buyerId = 'buyer-123'
    const productId = 'product-456'
    
    const item = await cartService.addItem(buyerId, productId)
    
    expect(item.buyer_id).toBe(buyerId)
    expect(item.product_id).toBe(productId)
    expect(item.quantity).toBe(1)
  })
  
  test('addItem updates quantity if item exists', async () => {
    const buyerId = 'buyer-123'
    const productId = 'product-456'
    
    await cartService.addItem(buyerId, productId, 2)
    const updated = await cartService.addItem(buyerId, productId, 3)
    
    expect(updated.quantity).toBe(5)
  })
  
  test('clear removes all items for buyer', async () => {
    const buyerId = 'buyer-123'
    await cartService.addItem(buyerId, 'product-1')
    await cartService.addItem(buyerId, 'product-2')
    
    await cartService.clear(buyerId)
    const items = await cartService.getItems(buyerId)
    
    expect(items).toHaveLength(0)
  })
})
```

### Integration Testing

**Scope**: Test complete user flows across multiple components and services

**Key Flows to Test**:
1. Browse products → Add to cart → Checkout → View order
2. Search products → Filter by category → View details → Bookmark
3. Compare products → Remove from comparison → Add to cart
4. Seller: Create product → View analytics → Update product
5. Buyer: Purchase product → Track performance → Provide feedback

### Test Data Management

**Generators**: Create reusable data generators for property tests
```typescript
const productGenerator = () => fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  short_description: fc.string({ minLength: 10, maxLength: 200 }),
  long_description: fc.string({ minLength: 50, maxLength: 2000 }),
  price: fc.float({ min: 0.01, max: 10000, noNaN: true }),
  category: fc.constantFrom('HR', 'Law', 'Office'),
  seller_id: fc.uuid()
})
```

**Fixtures**: Create mock data for unit tests
```typescript
const createMockProduct = (overrides = {}) => ({
  id: 'product-123',
  name: 'Test Product',
  short_description: 'A test product',
  long_description: 'A longer description of the test product',
  price: 99.99,
  category: 'HR',
  seller_id: 'seller-456',
  average_rating: 4.5,
  review_count: 10,
  ...overrides
})
```

### Test Organization

```
src/
├── lib/
│   ├── components/
│   │   ├── ProductCard.svelte
│   │   └── ProductCard.test.ts
│   ├── services/
│   │   ├── products.ts
│   │   ├── products.test.ts
│   │   └── products.property.test.ts
│   └── test-utils/
│       ├── generators.ts
│       ├── fixtures.ts
│       └── test-helpers.ts
```

### Score Calculation Algorithms

**Note on Future Optimization**: The current score calculation algorithms use rule-based heuristics. The system is designed to support machine learning models that will optimize score calculations based on user experience data. Future versions will include:
- ML models trained on user engagement patterns, purchase decisions, and satisfaction metrics
- Models that interact with each other for holistic optimization (e.g., recommendation model influences scoring model)
- A/B testing framework to evaluate model performance
- Continuous learning from user feedback and behavior
- Personalized scoring based on buyer preferences and company profile

All scores are calculated on a 0-100 scale for precision and consistency.

#### Fit Score Calculation (v1.0 - Rule-Based)
The fit score evaluates how well a product fits into a buyer's workflow based on implementation complexity and deployment model:

```typescript
function calculateFitScore(product: Product, buyerProfile?: BuyerOnboarding): number {
  let score = 100
  
  // Implementation time penalty (0-40 points)
  if (product.implementation_time_days > 90) score -= 40
  else if (product.implementation_time_days > 30) score -= 20
  else if (product.implementation_time_days > 7) score -= 10
  
  // Cloud/client bonus (0-15 points)
  if (product.cloud_client_classification === 'cloud') score += 10
  else if (product.cloud_client_classification === 'hybrid') score += 5
  
  // Access depth consideration (deeper = more complex, 0-20 points penalty)
  const depthPenalty = (product.access_depth?.split(',').length || 1) * 2
  score -= Math.min(depthPenalty, 20)
  
  // Buyer-specific adjustments (if profile available)
  if (buyerProfile) {
    // Company size match
    if (buyerProfile.company_size && product.implementation_time_days) {
      // Smaller companies prefer faster implementation
      if (buyerProfile.company_size < 50 && product.implementation_time_days < 14) score += 10
      if (buyerProfile.company_size > 500 && product.implementation_time_days > 30) score += 5
    }
  }
  
  return Math.max(0, Math.min(100, score))
}
```

#### Feature Score Calculation (v1.0 - Rule-Based)
The feature score evaluates product completeness and capability richness:

```typescript
function calculateFeatureScore(product: Product, features: ProductFeature[]): number {
  let score = 60 // Base score
  
  // Completeness bonus (0-20 points)
  if (product.roi_percentage) score += 4
  if (product.retention_rate) score += 4
  if (product.quarter_over_quarter_change) score += 3
  if (product.demo_visual_url) score += 3
  if (product.long_description.length > 500) score += 6
  
  // Description quality (0-10 points)
  const descriptionWords = product.long_description.split(/\s+/).length
  if (descriptionWords > 200) score += 10
  else if (descriptionWords > 100) score += 5
  
  // Feature count and quality (0-20 points)
  const featureCount = features.length
  if (featureCount > 20) score += 20
  else if (featureCount > 10) score += 15
  else if (featureCount > 5) score += 10
  else score += featureCount * 2
  
  // High-relevance features bonus (0-10 points)
  const highRelevanceFeatures = features.filter(f => f.relevance_score > 80).length
  score += Math.min(highRelevanceFeatures * 2, 10)
  
  return Math.max(0, Math.min(100, score))
}
```

#### Integration Score Calculation (v1.0 - Rule-Based)
The integration score evaluates ease of integration and compatibility:

```typescript
function calculateIntegrationScore(product: Product, buyerProfile?: BuyerOnboarding): number {
  let score = 70 // Neutral baseline
  
  // Cloud products generally integrate better (0-15 points)
  if (product.cloud_client_classification === 'cloud') score += 10
  else if (product.cloud_client_classification === 'hybrid') score += 5
  else score -= 10 // Client-only products are harder to integrate
  
  // Category-based adjustments (0-10 points)
  // Some categories have better integration ecosystems
  if (product.category === 'DevTools') score += 10
  else if (product.category === 'HR') score += 5
  
  // API and integration features (0-15 points)
  // This will be enhanced when we track actual integration capabilities
  if (product.access_depth?.includes('api')) score += 15
  
  // Buyer-specific adjustments (if profile available)
  if (buyerProfile?.interested_categories?.includes(product.category)) {
    score += 10 // Likely to integrate well with buyer's existing stack
  }
  
  return Math.max(0, Math.min(100, score))
}
```

#### Review Score Calculation
The review score is derived from buyer reviews, normalized to 0-100 scale:

```typescript
function calculateReviewScore(averageRating: number, reviewCount: number): number {
  // Convert 1-5 star rating to 0-100 scale
  let score = ((averageRating - 1) / 4) * 100
  
  // Apply confidence penalty for low review counts
  // Products with few reviews get a slight penalty
  if (reviewCount < 5) score *= 0.8
  else if (reviewCount < 10) score *= 0.9
  else if (reviewCount < 20) score *= 0.95
  
  return Math.max(0, Math.min(100, Math.round(score)))
}
```

#### Overall Score Calculation
The overall score is a weighted average of all component scores:

```typescript
function calculateOverallScore(scores: {
  fit_score: number
  feature_score: number
  integration_score: number
  review_score: number
}): number {
  // Weights can be adjusted based on ML model insights
  const weights = {
    fit: 0.30,
    feature: 0.25,
    integration: 0.25,
    review: 0.20
  }
  
  const overall = (
    scores.fit_score * weights.fit +
    scores.feature_score * weights.feature +
    scores.integration_score * weights.integration +
    scores.review_score * weights.review
  )
  
  return Math.round(overall)
}
```

## Implementation Notes

### Performance Considerations

1. **Database Queries**:
   - Use the `products_with_ratings` view for efficient rating aggregation
   - Implement pagination for product lists (20-50 items per page)
   - Use database indexes for common query patterns
   - Cache frequently accessed data (featured products, categories)

2. **Client-Side Performance**:
   - Lazy load images with placeholder
   - Implement virtual scrolling for long product lists
   - Debounce search input (300ms delay)
   - Use SvelteKit's prefetching for navigation

3. **Bundle Size**:
   - Code-split routes for faster initial load
   - Lazy load heavy components (comparison table, charts)
   - Optimize images (WebP format, responsive sizes)

### Security Considerations

1. **Row Level Security**: Already implemented in database schema
2. **Input Sanitization**: Validate and sanitize all user inputs
3. **SQL Injection Prevention**: Use parameterized queries (Supabase handles this)
4. **XSS Prevention**: Svelte automatically escapes HTML
5. **CSRF Protection**: SvelteKit provides CSRF protection for forms
6. **File Upload Security**: Validate file types, scan for malware, limit file sizes
7. **Rate Limiting**: Implement rate limiting for API endpoints
8. **Session Management**: Use Supabase Auth with secure session handling

### Accessibility

1. **Semantic HTML**: Use proper heading hierarchy, landmarks, and ARIA labels
2. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
3. **Screen Reader Support**: Provide descriptive labels and announcements
4. **Color Contrast**: Meet WCAG AA standards (4.5:1 for normal text)
5. **Focus Management**: Visible focus indicators, logical tab order
6. **Form Accessibility**: Associate labels with inputs, provide error announcements

### Future Enhancements

The design accommodates future features mentioned in requirements:

1. **Company Info Input**: Add fields to buyer profile for tool integration preferences
2. **Product Evaluation Agents**: Internal service for automated product analysis
3. **Smart Bundling**: Enhanced bundling algorithm considering integration compatibility
4. **Advanced Search**: Machine learning-based search with semantic understanding
5. **Real-time Notifications**: WebSocket integration for live updates
6. **Multi-currency Support**: Currency conversion and localization
7. **Advanced Analytics**: Predictive analytics and forecasting for sellers

### Development Workflow

1. **Database Schema Changes**: Create migration files in `supabase/migrations/`
2. **Type Generation**: Run `supabase gen types typescript` after schema changes
3. **Component Development**: Build components in isolation, test with Storybook (optional)
4. **Service Layer First**: Implement and test services before building UI
5. **Progressive Enhancement**: Ensure core functionality works without JavaScript
6. **Code Review**: Require review for all changes, especially database and auth code

### Deployment Considerations

1. **Environment Variables**: Store sensitive config in `.env` files
2. **Database Migrations**: Run migrations before deploying new code
3. **Static Asset Optimization**: Use SvelteKit's build optimization
4. **CDN**: Serve static assets from CDN for better performance
5. **Monitoring**: Implement error tracking (Sentry) and analytics
6. **Backup Strategy**: Regular database backups, point-in-time recovery
7. **Rollback Plan**: Maintain ability to quickly rollback deployments

## Design Summary

This design document provides a comprehensive blueprint for the Startup Marketplace platform, addressing all 21 requirements from the requirements document:

**Core User Experiences**:
- Netflix-style homepage with horizontal scrolling product rows (Req 1)
- Marketplace grid view with category filters (Req 2)
- Search with combined filters (Req 3)
- Detailed product pages with extended metrics (Req 4)
- Side-by-side comparison of up to 3 products (Req 5)
- Bookmark management (Req 6)
- Cart and demo checkout flow (Req 7)
- Order history tracking (Req 8)
- Product reviews and ratings (Req 9)

**Authentication & Authorization**:
- Separate buyer and seller authentication flows (Req 10, 11)
- Role-based access control with RLS
- Protected routes with automatic redirection

**Seller Features**:
- Product creation and management (Req 12, 17)
- Analytics dashboard with performance metrics (Req 16)
- Competitor analysis and improvement suggestions (Req 16)

**Advanced Features**:
- Personalized recommendations (Req 14)
- Buyer dashboard for purchased product tracking (Req 15)
- Product downloads with tracking (Req 18)
- Automated quote generation (Req 19)
- Bundle suggestions and pricing (Req 20)

**Technical Foundation**:
- Supabase database for all data persistence (Req 21)
- SvelteKit for server-side rendering and routing
- TypeScript for type safety
- Property-based testing with fast-check
- Comprehensive error handling and validation

**Key Design Decisions**:
1. **Score-Based Product Evaluation**: Introduced fit, feature, integration, and review scores to help buyers make data-driven decisions
2. **Service Layer Abstraction**: Clean separation between UI, business logic, and data access for maintainability
3. **Demo Transactions**: Zero-charge purchases to showcase complete flow without payment complexity
4. **Automated Quotes**: Rule-based pricing for variable-priced products to reduce sales friction
5. **Netflix-Style Discovery**: Engaging horizontal scrolling to encourage exploration
6. **Dual Testing Strategy**: Both unit tests and property-based tests for comprehensive coverage

The design is built to accommodate future enhancements including ML-based scoring, advanced search algorithms, smart bundling with integration analysis, and real-time notifications.

