# Agora Marketplace

A modern B2B SaaS marketplace built with SvelteKit 5, Supabase, and TypeScript. Agora enables startups to discover, compare, and purchase business services across multiple categories.

## Features
- **Product Discovery**: Browse products by category (HR, Legal, Marketing, DevTools)
- **Advanced Search**: Full-text search with filters (price, rating, category)
- **Product Comparison**: Compare up to 3 products side-by-side with category-specific metrics
- **Smart Recommendations**: Personalized product suggestions based on usage patterns
- **Shopping Cart**: Add products with quantity controls and optimistic UI updates
- **Bookmarks**: Save products for later review
- **Dashboard**: Track spending, usage analytics, and purchased products
- **Order Management**: View order history and download invoices

### Product Comparison System
- **Category-Specific Metrics**: Each category has 16 unique metrics for detailed comparison
- **Scoring System**: Products rated on fit, features, integrations, and reviews
- **Visual Comparison Table**: Side-by-side comparison with "Best Price" and "Highest Score" badges
- **Comparison Bar**: Persistent bottom bar for managing compared products across pages

## Tech Stack

- **Framework**: SvelteKit 5 (with Svelte 5 runes)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OAuth support
- **Styling**: TailwindCSS + DaisyUI
- **Language**: TypeScript
- **Deployment**: Vercel-ready

## Project Structure

```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── ComparisonBar.svelte
│   │   ├── ComparisonTable.svelte
│   │   ├── ProductCard.svelte
│   │   ├── ProductDetailView.svelte
│   │   └── ...
│   ├── services/            # Business logic and API calls
│   │   ├── products.ts
│   │   ├── cart.ts
│   │   ├── bookmarks.ts
│   │   └── ...
│   ├── stores/              # Svelte stores
│   │   └── comparison.ts    # Comparison state management
│   └── helpers/             # Utility functions and types
├── routes/
│   ├── (buyer)/             # Buyer-specific routes
│   │   ├── cart/
│   │   ├── bookmarks/
│   │   ├── dashboard/
│   │   └── orders/
│   ├── (seller)/            # Seller-specific routes
│   │   └── seller/
│   ├── marketplace/         # Product browsing
│   ├── compare/             # Product comparison
│   ├── products/[id]/       # Product detail pages
│   └── api/                 # API endpoints
└── supabase/
    └── migrations/          # Database schema migrations
```

## Key Components

### ComparisonTable
Displays up to 3 products side-by-side with:
- Product scores (overall, fit, feature, integration, review)
- Category-specific metrics (16 per category)
- Price comparison with "Best Price" badge
- Cart integration with quantity controls
- Responsive design with sticky headers

### ComparisonBar
Persistent bottom bar that:
- Shows compared products across all pages
- Allows category switching
- Auto-switches to categories with products when current becomes empty
- Provides quick access to comparison page

### ProductCard
Reusable product card with:
- Bookmark button with animation
- Compare button (turns blue when compared)
- Add to cart with quantity controls
- Optimistic UI updates for all actions

## Database Schema

### Core Tables
- `products`: Product listings with pricing and metadata
- `categories`: Product categories (HR, Legal, Marketing, DevTools)
- `product_scores`: Calculated scores for each product
- `metric_definitions`: Category-specific metric definitions
- `product_metric_values`: Metric values for each product
- `cart_items`: Shopping cart contents
- `bookmarks`: Saved products
- `orders`: Purchase history
- `reviews`: Product reviews

## State Management

### Comparison Store
Manages product comparison state with:
- Products organized by category
- Active category tracking
- Maximum 3 products per category
- Persistent across page navigation

### Cart State
- Server-side initialization for immediate display
- Optimistic updates for instant feedback
- Error handling with rollback
- Consistent across all pages (marketplace, product detail, compare, bookmarks)

## Key Features Implementation

### Optimistic UI Updates
All user actions (bookmark, cart, compare) use optimistic updates:
1. Update local state immediately
2. Make API call
3. Revert on error

### Server-Side Data Loading
Cart quantities and bookmarks loaded server-side for:
- Immediate display on page load
- No loading flicker
- Better SEO and performance

### Category-Specific Metrics
Each category has unique metrics stored in:
- `metric_definitions`: Defines metrics per category
- `product_metric_values`: Stores values per product
- Dynamically displayed in comparison table and product details

### Score Calculation
Products scored on 4 dimensions:
- **Fit Score** (30%): Based on category-specific metrics
- **Feature Score** (25%): Number and quality of features
- **Integration Score** (25%): Available integrations
- **Review Score** (20%): Customer ratings

## Development

### Prerequisites
- **Node.js** 18+ (20+ recommended)
- **npm** or **pnpm** (pnpm recommended for faster installs)
- **Supabase CLI** (for local development and migrations)
- **Supabase Account** (for hosted database)

### Initial Setup


### Prerequisites
- Node.js 18+ (20+ recommended)
- npm or pnpm

### Installation Steps

#### 1. Clone Repository
```bash
git clone <repository-url>
cd agora-webapp
```

#### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the project root with the following content:

```bash
# supabase configuration
SUPABASE_URL=https://sbfpxgsgabkgbutzhgwm.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZnB4Z3NnYWJrZ2J1dHpoZ3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODg0ODMsImV4cCI6MjA3Nzc2NDQ4M30.45pNssaz8rTmgOE-QL_ks0RMEEych7OzaFORdJHcEQA
PUBLIC_SUPABASE_URL=https://sbfpxgsgabkgbutzhgwm.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZnB4Z3NnYWJrZ2J1dHpoZ3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODg0ODMsImV4cCI6MjA3Nzc2NDQ4M30.45pNssaz8rTmgOE-QL_ks0RMEEych7OzaFORdJHcEQA
```

**Note:** These are public credentials that connect you to a shared demo Supabase instance. The database is already set up with sample data. You can create your own account and test all features safely.

#### 4. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

#### 5. Sign in to Test account

1. Navigate to sign in
2. Sign in with email/password (email: ryanliu847@gmail.com, password: testing)


### Troubleshooting

**Issue: "Failed to fetch" errors**
- Check that Supabase URL and anon key are correct
- Verify your Supabase project is running
- Check browser console for CORS errors

**Issue: Authentication not working**
- Verify email provider is enabled in Supabase
- Check that redirect URLs are configured
- Look at Supabase Auth logs for errors

**Issue: RLS policy errors**
- Ensure migrations have been run
- Check that user has correct role (buyer/seller)
- Verify policies in Supabase dashboard

**Issue: Products not showing**
- Run the seed script: `node scripts/calculate-product-scores.js`
- Check that products exist in database
- Verify product status is 'published'

**Issue: Infinite loops in browser**
- Check browser console for `effect_update_depth_exceeded` errors
- This usually means a `$effect` is reading and writing the same state
- See "Important Notes" section for prevention tips

### Development Workflow

1. **Make changes** to components/routes
2. **Hot reload** automatically updates browser
3. **Check types**: `npm run check`
4. **Lint code**: `npm run lint`
5. **Test features** in browser
6. **Commit changes** with descriptive messages

### Testing Accounts

For development, create these test accounts:
- **Buyer**: `buyer@test.com` / `password123`
- **Seller**: `seller@test.com` / `password123`

Add products to cart, create bookmarks, and test comparison features.

## Important Notes

### Svelte 5 Runes
This project uses Svelte 5 with runes (`$state`, `$derived`, `$effect`). Key considerations:
- Always create new Map/Set instances to trigger reactivity
- Avoid `$effect` loops by not reading and writing the same state
- Use `setTimeout` to break reactive cycles when needed

### Infinite Loop Prevention
Watch for these patterns:
- `$effect` that reads and writes the same state
- Store subscriptions that trigger store updates
- Derived values used in effects that modify their dependencies

### Cart Quantity Display
Cart quantities are:
- Fetched server-side in page load functions
- Initialized from server data
- Updated optimistically on user actions
- Consistent across all pages

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run check`: Type check
- `npm run lint`: Lint code

## Contributing

When adding new features:
1. Follow existing patterns for state management
2. Use optimistic updates for user actions
3. Fetch initial data server-side when possible
4. Test for infinite `$effect` loops
5. Ensure cart/bookmark state is consistent across pages

## License

MIT
