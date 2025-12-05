# Implementation Plan: Startup Marketplace

## Overview
This implementation plan breaks down the Startup Marketplace feature into discrete, manageable coding tasks. Each task builds incrementally on previous work, with property-based tests integrated throughout to validate correctness properties from the design document.

---

## Tasks

- [x] 1. Set up database schema and type generation
  - Create Supabase migration files for all new tables (product_scores, product_analytics, buyer_product_usage, quotes, product_downloads, bundles, bundle_products, buyer_onboarding, seller_onboarding, product_features, competitor_relationships)
  - Run Supabase type generation to create TypeScript types
  - Update database.types.ts with generated types
  - Create custom TypeScript types in types.ts (ProductWithScores, ScoreBreakdown, ProductFeature, etc.)
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.8_

- [ ] 2. Implement core product service layer
  - [x] 2.1 Create ProductService with CRUD operations
    - Implement getAll, getById, getBySeller, getByCategory, getFeatured, getNew, search methods
    - Implement create, update, delete methods with seller authorization
    - Add database query logic using Supabase client
    - _Requirements: 2.1, 2.2, 3.1, 12.2, 17.2, 17.3_
  
  - [x] 2.2 Write property test for product data round-trip
    - **Property 44: Product data round-trip**
    - **Validates: Requirements 21.1**
  
  - [x] 2.3 Write property test for category filtering
    - **Property 2: Category filtering correctness**
    - **Validates: Requirements 2.2**
  
  - [x] 2.4 Write property test for search relevance
    - **Property 3: Search result relevance**
    - **Validates: Requirements 3.1**
  
  - [x] 2.5 Write property test for combined filters
    - **Property 4: Combined filter correctness**
    - **Validates: Requirements 3.2**

- [-] 3. Implement score calculation system
  - [x] 3.1 Create score calculation functions
    - Implement calculateFitScore with implementation time, deployment model, and complexity factors
    - Implement calculateFeatureScore with completeness and feature count factors
    - Implement calculateIntegrationScore with deployment type and category factors
    - Implement calculateReviewScore with rating normalization and confidence adjustment
    - Implement calculateOverallScore with weighted average
    - Create ScoreBreakdown generation logic
    - _Requirements: 4.4, 12.2_
  
  - [x] 3.2 Create ProductScoreService
    - Implement calculateScores method that computes all scores for a product
    - Implement recalculateAllScores for batch updates
    - Add database persistence for product_scores table
    - _Requirements: 4.4_
  
  - [x] 3.3 Write unit tests for score calculations
    - Test each score calculation function with known inputs
    - Test edge cases (missing data, extreme values)
    - Test overall score weighting
    - _Requirements: 4.4_

- [ ] 4. Implement product features system
  - [x] 4.1 Create ProductFeatureService
    - Implement methods to create, update, delete product features
    - Implement getByProduct method sorted by relevance_score
    - Add feature categorization logic
    - _Requirements: 4.1_
  
  - [x] 4.2 Write property test for feature score calculation
    - **Property 19: Form validation completeness**
    - **Validates: Requirements 12.3**

- [-] 5. Implement authentication and authorization
  - [x] 5.1 Set up Supabase Auth integration
    - Configure Supabase Auth in supabase.ts helper
    - Create auth store for client-side state management
    - Implement sign-in, sign-up, sign-out functions for buyers
    - Implement sign-in, sign-up, sign-out functions for sellers
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.1, 11.2, 11.3, 11.4_
  
  - [x] 5.2 Implement route protection
    - Create +layout.server.ts with session checking
    - Add redirect logic for unauthenticated users
    - Add role-based authorization checks
    - _Requirements: 10.5_
  
  - [x] 5.3 Write property test for protected route authorization
    - **Property 17: Protected route authorization**
    - **Validates: Requirements 10.5**

- [x] 6. Build core UI components
  - [x] 6.1 Create ProductCard component
    - Implement grid and carousel variants
    - Display product info, scores, price, demo visual
    - Add compare, bookmark, and add to cart buttons
    - Implement click handlers and event emission
    - _Requirements: 1.2, 2.4, 6.3, 14.4_
  
  - [x] 6.2 Write property test for product card completeness
    - **Property 1: Product card completeness**
    - **Validates: Requirements 1.2, 2.4, 4.1, 6.3, 14.4**
  
  - [x] 6.3 Create ProductRow component
    - Implement horizontal scrolling with smooth animation
    - Add lazy loading for additional products
    - Implement touch/swipe support
    - Add scroll indicators
    - _Requirements: 1.1, 1.3_
  
  - [x] 6.4 Create ProductDetailView component
    - Display hero section with product info and CTAs
    - Display long description and extended metrics
    - Display score breakdown with explanations
    - Display feature list sorted by relevance
    - Display reviews section
    - Display similar products section
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 6.5 Write property test for extended metrics completeness
    - **Property 5: Extended metrics completeness**
    - **Validates: Requirements 4.4**
  
  - [x] 6.6 Create ComparisonTable component
    - Display up to 3 products side-by-side
    - Show all metrics, price, reviews, features
    - Highlight differences between products
    - Add remove and add to cart buttons
    - Display empty state for < 2 products
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [x] 6.7 Write property test for comparison list size constraint
    - **Property 6: Comparison list size constraint**
    - **Validates: Requirements 5.2**
  
  - [x] 6.8 Write property test for comparison display completeness
    - **Property 7: Comparison display completeness**
    - **Validates: Requirements 5.3**
  
  - [x] 6.9 Create NavShell component
    - Display navigation links (Homepage, Marketplace, Search, etc.)
    - Show cart item count badge
    - Highlight active page
    - Show role-specific links based on user
    - Implement responsive mobile menu
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [x] 6.10 Write property test for cart count accuracy
    - **Property 25: Cart count accuracy**
    - **Validates: Requirements 13.4**
  
  - [x] 6.11 Create FilterPanel component
    - Display category filter options
    - Display search input with debouncing
    - Display additional filters (price, rating)
    - Emit filter change events
    - _Requirements: 2.2, 2.3, 3.1, 3.2_

- [-] 7. Implement bookmark functionality
  - [x] 7.1 Create BookmarkService
    - Implement add, remove, toggle methods
    - Implement getByBuyer and isBookmarked methods
    - Add database persistence to bookmarks table
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 7.2 Write property test for bookmark data round-trip
    - **Property 45: Bookmark data round-trip**
    - **Validates: Requirements 21.2**
  
  - [x] 7.3 Write property test for bookmark toggle idempotence
    - **Property 9: Bookmark toggle idempotence**
    - **Validates: Requirements 6.2**
  
  - [x] 7.4 Write property test for list modification invariant (bookmarks)
    - **Property 8: List modification invariant**
    - **Validates: Requirements 6.1, 6.4**

- [x] 8. Implement cart functionality
  - [x] 8.1 Create CartService
    - Implement addItem, updateQuantity, removeItem, clear methods
    - Implement getItems and getTotal methods
    - Add database persistence to cart_items table
    - Handle duplicate items by updating quantity
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 8.2 Write property test for cart data round-trip
    - **Property 46: Cart data round-trip**
    - **Validates: Requirements 21.3**
  
  - [x] 8.3 Write property test for cart total accuracy
    - **Property 10: Cart total accuracy**
    - **Validates: Requirements 7.2**
  
  - [x] 8.4 Write property test for cart removal updates total
    - **Property 11: Cart removal updates total**
    - **Validates: Requirements 7.3**
  
  - [x] 8.5 Write property test for list modification invariant (cart)
    - **Property 8: List modification invariant**
    - **Validates: Requirements 7.1**
  
  - [x] 8.6 Create CartSummary component
    - Display cart items with product details
    - Show total cost
    - Add quantity adjustment controls
    - Add remove item buttons
    - Add checkout button
    - _Requirements: 7.2, 7.3_

- [-] 9. Implement order and checkout functionality
  - [x] 9.1 Create OrderService
    - Implement create method for demo transactions (zero charge)
    - Implement getByBuyer and getById methods
    - Add database persistence to orders and order_items tables
    - Clear cart after successful order creation
    - _Requirements: 7.4, 7.5, 8.1, 8.2_
  
  - [x] 9.2 Write property test for checkout creates order
    - **Property 12: Checkout creates order**
    - **Validates: Requirements 7.5**
  
  - [ ] 9.3 Write property test for order data round-trip
    - **Property 47: Order data round-trip**
    - **Validates: Requirements 21.4**
  
  - [ ] 9.4 Write property test for order display completeness
    - **Property 13: Order display completeness**
    - **Validates: Requirements 8.1**
  
  - [ ] 9.5 Write property test for order detail completeness
    - **Property 14: Order detail completeness**
    - **Validates: Requirements 8.2**
  
  - [ ] 9.6 Create OrderHistoryList component
    - Display all buyer orders with date, products, total
    - Add click handler to view order details
    - Display empty state for no orders
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 10. Implement review functionality
  - [ ] 10.1 Create ReviewService
    - Implement create, update, delete methods
    - Implement getByProduct, getByBuyer, getAverageRating methods
    - Add database persistence to reviews table
    - _Requirements: 9.1, 9.2_
  
  - [ ] 10.2 Write property test for review data round-trip
    - **Property 48: Review data round-trip**
    - **Validates: Requirements 21.5**
  
  - [ ] 10.3 Write property test for review display completeness
    - **Property 15: Review display completeness**
    - **Validates: Requirements 9.1**
  
  - [ ] 10.4 Write property test for average rating accuracy
    - **Property 16: Average rating accuracy**
    - **Validates: Requirements 9.2**
  
  - [ ] 10.5 Create ReviewList component
    - Display reviews with reviewer name, rating, text
    - Display average rating
    - Display empty state for no reviews
    - Add review submission form (if buyer can review)
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement comparison functionality
  - [ ] 12.1 Create comparison store
    - Implement client-side store for comparison list
    - Add methods to add, remove, clear products
    - Enforce 3-product maximum
    - Persist to localStorage for session continuity
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [ ] 12.2 Write property test for list modification invariant (comparison)
    - **Property 8: List modification invariant**
    - **Validates: Requirements 5.4**

- [ ] 13. Implement recommendation system
  - [ ] 13.1 Create RecommendationService
    - Implement getNewAndNotable based on created_at and featured status
    - Implement getPersonalized based on buyer profile and behavior
    - Implement getFrequentlyBoughtTogether based on order history
    - Implement getSimilarProducts based on category and features
    - Implement getTrending based on recent engagement
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [ ] 13.2 Write property test for recommendation prioritization
    - **Property 26: Recommendation prioritization**
    - **Validates: Requirements 14.5**

- [ ] 14. Implement seller product management
  - [ ] 14.1 Create product creation form
    - Build form with all required fields (name, description, price, metrics, etc.)
    - Add file upload for logo and demo visual
    - Implement form validation
    - Call ProductService.create on submission
    - _Requirements: 12.1, 12.2, 12.3, 12.5_
  
  - [ ] 14.2 Write property test for product creation visibility
    - **Property 18: Product creation visibility**
    - **Validates: Requirements 12.2**
  
  - [ ] 14.3 Write property test for form validation completeness
    - **Property 19: Form validation completeness**
    - **Validates: Requirements 12.3**
  
  - [ ] 14.4 Write property test for product categorization
    - **Property 20: Product categorization**
    - **Validates: Requirements 12.4**
  
  - [ ] 14.5 Write property test for file upload validation
    - **Property 21: File upload validation**
    - **Validates: Requirements 12.5**
  
  - [ ] 14.2 Create product management page
    - Display all seller products in a list
    - Add edit and delete buttons for each product
    - Implement product update form
    - Implement product deletion with confirmation
    - _Requirements: 17.1, 17.2, 17.3_
  
  - [ ] 14.6 Write property test for product update visibility
    - **Property 33: Product update visibility**
    - **Validates: Requirements 17.2**
  
  - [ ] 14.7 Write property test for product deletion behavior
    - **Property 34: Product deletion behavior**
    - **Validates: Requirements 17.3**

- [ ] 15. Implement analytics system
  - [ ] 15.1 Create AnalyticsService
    - Implement tracking methods (trackProductView, trackBookmark, trackCartAdd, trackPurchase)
    - Implement getProductAnalytics with traffic, engagement, conversion metrics
    - Implement getSellerDashboard with overview and performance data
    - Add database persistence to product_analytics table
    - _Requirements: 16.1, 17.4_
  
  - [ ] 15.2 Write property test for analytics data round-trip
    - **Property 49: Analytics data round-trip**
    - **Validates: Requirements 21.8**
  
  - [ ] 15.3 Write property test for seller analytics completeness
    - **Property 30: Seller analytics completeness**
    - **Validates: Requirements 16.1**
  
  - [ ] 15.4 Write property test for product performance metrics display
    - **Property 35: Product performance metrics display**
    - **Validates: Requirements 17.4**
  
  - [ ] 15.5 Create seller analytics dashboard page
    - Display product views, conversions, revenue metrics
    - Display time-series charts for trends
    - Display top and underperforming products
    - _Requirements: 16.1, 17.4_

- [ ] 16. Implement competitor analysis
  - [ ] 16.1 Create competitor identification logic
    - Implement algorithm to identify competitors based on category and similarity
    - Calculate similarity_score and market_overlap_score
    - Store relationships in competitor_relationships table
    - _Requirements: 16.2_
  
  - [ ] 16.2 Implement getCompetitorAnalysis method
    - Fetch competitor products with comparative metrics
    - Calculate price, feature, metric, and score comparisons
    - Generate improvement suggestions based on gaps
    - _Requirements: 16.2, 16.3_
  
  - [ ] 16.3 Write property test for competitor analysis completeness
    - **Property 31: Competitor analysis completeness**
    - **Validates: Requirements 16.2**
  
  - [ ] 16.4 Create competitor analysis page
    - Display main competitors with comparative data
    - Display market positioning
    - Display improvement suggestions
    - _Requirements: 16.2, 16.3, 16.4_

- [ ] 17. Implement buyer dashboard
  - [ ] 17.1 Create buyer product usage tracking
    - Implement methods to track implementation status, usage count, ROI
    - Add database persistence to buyer_product_usage table
    - Implement feedback submission
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [ ] 17.2 Write property test for buyer dashboard completeness
    - **Property 27: Buyer dashboard completeness**
    - **Validates: Requirements 15.1**
  
  - [ ] 17.3 Write property test for product performance display
    - **Property 28: Product performance display**
    - **Validates: Requirements 15.2**
  
  - [ ] 17.4 Write property test for feedback persistence
    - **Property 29: Feedback persistence**
    - **Validates: Requirements 15.4**
  
  - [ ] 17.5 Create buyer dashboard page
    - Display purchased products with usage metrics
    - Display implementation status and ROI data
    - Display time-series charts for performance tracking
    - Add feedback submission form
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [ ] 18. Implement download functionality
  - [ ] 18.1 Create DownloadService
    - Implement getDownloadUrl with authentication verification
    - Implement trackDownload to record download events
    - Implement uploadProductFile for sellers
    - Add database persistence to product_downloads table
    - _Requirements: 18.1, 18.2, 18.4_
  
  - [ ] 18.2 Write property test for download availability after purchase
    - **Property 36: Download availability after purchase**
    - **Validates: Requirements 18.1, 18.2**
  
  - [ ] 18.3 Write property test for download tracking
    - **Property 37: Download tracking**
    - **Validates: Requirements 18.4**
  
  - [ ] 18.4 Add download links to order confirmation and history
    - Display download buttons on order confirmation page
    - Display download links in order history
    - Track downloads when links clicked
    - _Requirements: 18.1, 18.2_

- [ ] 19. Implement quote system
  - [ ] 19.1 Create QuoteService
    - Implement generateQuote with automated pricing rules
    - Implement acceptQuote to convert to cart item
    - Implement quote management methods
    - Add database persistence to quotes table
    - _Requirements: 19.1, 19.2, 19.3, 19.4_
  
  - [ ] 19.2 Write property test for quote UI conditional display
    - **Property 38: Quote UI conditional display**
    - **Validates: Requirements 19.1**
  
  - [ ] 19.3 Write property test for quote calculation correctness
    - **Property 39: Quote calculation correctness**
    - **Validates: Requirements 19.2**
  
  - [ ] 19.4 Write property test for quote display completeness
    - **Property 40: Quote display completeness**
    - **Validates: Requirements 19.3**
  
  - [ ] 19.5 Write property test for quote acceptance creates cart item
    - **Property 41: Quote acceptance creates cart item**
    - **Validates: Requirements 19.4**
  
  - [ ] 19.6 Create QuoteRequestForm component
    - Build form to capture company size and requirements
    - Call QuoteService.generateQuote on submission
    - Display generated quote with pricing breakdown
    - Add accept and reject buttons
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [ ] 20. Implement bundle system
  - [ ] 20.1 Create BundleService
    - Implement getSuggestedBundles based on cart contents
    - Implement getFrequentlyBoughtTogether for bundle suggestions
    - Implement calculateBundlePrice with discount tiers
    - Add database persistence to bundles and bundle_products tables
    - _Requirements: 20.1, 20.2, 20.3_
  
  - [ ] 20.2 Write property test for bundle pricing correctness
    - **Property 42: Bundle pricing correctness**
    - **Validates: Requirements 20.2**
  
  - [ ] 20.3 Write property test for bundle purchase atomicity
    - **Property 43: Bundle purchase atomicity**
    - **Validates: Requirements 20.4**
  
  - [ ] 20.4 Create BundleSuggestion component
    - Display suggested bundles with products and pricing
    - Show discount percentage
    - Add button to add bundle to cart
    - _Requirements: 20.1, 20.2, 20.3_

- [ ] 21. Build main pages and routing
  - [ ] 21.1 Create homepage (+page.svelte)
    - Display multiple ProductRow components (New, Featured, Recommended)
    - Load data in +page.server.ts using RecommendationService
    - _Requirements: 1.1, 1.2, 1.3, 14.1, 14.2_
  
  - [ ] 21.2 Write property test for navigation presence
    - **Property 22: Navigation presence**
    - **Validates: Requirements 13.1**
  
  - [ ] 21.3 Write property test for navigation functionality
    - **Property 23: Navigation functionality**
    - **Validates: Requirements 13.2**
  
  - [ ] 21.4 Write property test for active navigation highlighting
    - **Property 24: Active navigation highlighting**
    - **Validates: Requirements 13.3**
  
  - [ ] 21.5 Create marketplace page
    - Display products in grid layout
    - Add FilterPanel component
    - Load data in +page.server.ts using ProductService
    - Handle filter and search query parameters
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_
  
  - [ ] 21.6 Create product detail page ([id]/+page.svelte)
    - Display ProductDetailView component
    - Load product, features, reviews, similar products in +page.server.ts
    - Add compare, bookmark, add to cart functionality
    - _Requirements: 1.4, 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 21.7 Create comparison page
    - Display ComparisonTable component
    - Load comparison products from store
    - Handle empty state
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 21.8 Create bookmarks page
    - Display bookmarked products in grid
    - Load data in +page.server.ts using BookmarkService
    - Add remove bookmark functionality
    - _Requirements: 6.3, 6.4_
  
  - [ ] 21.9 Create cart page
    - Display CartSummary component
    - Add checkout button that navigates to checkout
    - _Requirements: 7.2, 7.3_
  
  - [ ] 21.10 Create checkout page
    - Display order summary
    - Process demo transaction on submit
    - Redirect to order confirmation with download links
    - _Requirements: 7.4, 7.5, 18.1_
  
  - [ ] 21.11 Create orders page
    - Display OrderHistoryList component
    - Load data in +page.server.ts using OrderService
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ] 21.12 Create buyer dashboard page
    - Display purchased products with performance metrics
    - Load data in +page.server.ts using AnalyticsService
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [ ] 21.13 Create seller dashboard page
    - Display analytics overview
    - Load data in +page.server.ts using AnalyticsService
    - _Requirements: 16.1, 17.4_
  
  - [ ] 21.14 Create seller products page
    - Display product management interface
    - Add create, edit, delete functionality
    - _Requirements: 12.1, 17.1, 17.2, 17.3_
  
  - [ ] 21.15 Create seller competitor analysis page
    - Display competitor analysis data
    - Load data in +page.server.ts using AnalyticsService
    - _Requirements: 16.2, 16.3, 16.4_
  
  - [ ] 21.16 Create auth pages (signin, signup, signout)
    - Build sign-in forms for buyers and sellers
    - Build sign-up forms with role selection
    - Implement sign-out functionality
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.1, 11.2, 11.3, 11.4_

- [ ] 22. Implement search functionality
  - [ ] 22.1 Add search to NavShell
    - Add search input with debouncing
    - Navigate to marketplace with search query parameter
    - _Requirements: 3.1, 13.1_
  
  - [ ] 22.2 Enhance ProductService.search
    - Implement full-text search across name, description
    - Support combined search and filter queries
    - Return empty array with no results
    - _Requirements: 3.1, 3.2, 3.4_

- [ ] 23. Add analytics tracking throughout application
  - [ ] 23.1 Add view tracking
    - Track product views on detail page load
    - Track marketplace page views
    - _Requirements: 16.1_
  
  - [ ] 23.2 Add interaction tracking
    - Track bookmark additions
    - Track cart additions
    - Track comparison additions
    - Track purchases
    - _Requirements: 16.1, 18.4_

- [ ] 24. Implement error handling and validation
  - [ ] 24.1 Add form validation
    - Validate product creation form
    - Validate quote request form
    - Validate review submission form
    - Display validation errors to users
    - _Requirements: 12.3, 12.5_
  
  - [ ] 24.2 Add error boundaries
    - Create error pages for 404, 500, etc.
    - Add try-catch blocks in service methods
    - Display user-friendly error messages
    - Log errors for debugging
    - _Requirements: All_
  
  - [ ] 24.3 Add loading states
    - Add loading spinners for async operations
    - Add skeleton screens for page loads
    - Implement optimistic UI updates
    - _Requirements: All_

- [ ] 25. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 26. Polish and optimization
  - [ ] 26.1 Optimize performance
    - Add database indexes for common queries
    - Implement pagination for product lists
    - Lazy load images with placeholders
    - Add caching for featured products
    - _Requirements: All_
  
  - [ ] 26.2 Improve accessibility
    - Add ARIA labels to interactive elements
    - Ensure keyboard navigation works
    - Test with screen readers
    - Verify color contrast ratios
    - _Requirements: All_
  
  - [ ] 26.3 Responsive design
    - Test on mobile, tablet, desktop
    - Adjust layouts for different screen sizes
    - Optimize touch interactions for mobile
    - _Requirements: All_

---

## Notes

- All property-based tests should use fast-check with minimum 100 iterations
- Each property test must include a comment with the format: `// Feature: startup-marketplace, Property {number}: {property_text}`
- Demo transactions process with zero charge - no actual payment integration needed
- Supabase handles authentication, database, and file storage
- Type generation should be run after any schema changes
