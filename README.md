# Agora Marketplace

A modern B2B SaaS marketplace built with SvelteKit 5, Supabase, and TypeScript. Agora enables startups to discover, compare, and purchase business services across multiple categories.

## Features

### For Buyers
- **Product Discovery**: Browse products by category (HR, Legal, Marketing, DevTools)
- **Advanced Search**: Full-text search with filters (price, rating, category)
- **Product Comparison**: Compare up to 3 products side-by-side with category-specific metrics
- **Smart Recommendations**: Personalized product suggestions based on usage patterns
- **Shopping Cart**: Add products with quantity controls and optimistic UI updates
- **Bookmarks**: Save products for later review
- **Dashboard**: Track spending, usage analytics, and purchased products
- **Order Management**: View order history and download invoices

### For Sellers
- **Product Management**: Create and manage product listings with rich metadata
- **Analytics Dashboard**: Track views, conversions, and revenue metrics
- **Competitor Analysis**: Monitor competitor products and pricing
- **Review Management**: View and respond to customer reviews

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

#### 1. Clone the Repository
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

#### 3. Install Supabase CLI
```bash
npm install -g supabase
# or
brew install supabase/tap/supabase  # macOS
```

#### 4. Set Up Supabase Project

**Option A: Use Existing Supabase Project (Recommended)**
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish provisioning
3. Go to Project Settings > API
4. Copy your project URL and anon key

**Option B: Local Supabase (Advanced)**
```bash
supabase init
supabase start
```

#### 5. Configure Environment Variables
Create a `.env` file in the root directory:

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: For local development
# PUBLIC_SUPABASE_URL=http://localhost:54321
# PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

To get your credentials:
1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the **Project URL** and **anon/public** key

#### 6. Run Database Migrations
```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push

# Or apply migrations manually via Supabase dashboard
# Copy contents of supabase/migrations/*.sql and run in SQL Editor
```

#### 7. Seed the Database (Optional)
Run the score calculation script to populate product scores:
```bash
node scripts/calculate-product-scores.js
```

#### 8. Configure Authentication

**Enable Email/Password Auth:**
1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)

**Enable OAuth (Optional):**
1. Go to **Authentication** > **Providers**
2. Enable desired providers (Google, GitHub, etc.)
3. Add OAuth credentials from provider
4. Set redirect URL: `https://your-domain.com/auth/callback`

**Set Up Row Level Security (RLS):**
The migrations include RLS policies, but verify:
1. Go to **Authentication** > **Policies**
2. Ensure policies are enabled for all tables
3. Test with different user roles

#### 9. Start Development Server
```bash
npm run dev
# or
pnpm dev

# Server will start at http://localhost:5173
```

#### 10. Create Test Users

**Create a Buyer Account:**
1. Navigate to `http://localhost:5173/auth/signup`
2. Sign up with email/password
3. Verify email (check Supabase Auth logs)
4. Profile is automatically created

**Create a Seller Account:**
1. Sign up as a buyer first
2. Navigate to `/become-seller`
3. Fill out seller information
4. Account is upgraded to seller

### Environment Variables Reference

```bash
# Required
PUBLIC_SUPABASE_URL=          # Your Supabase project URL
PUBLIC_SUPABASE_ANON_KEY=     # Your Supabase anon/public key

# Optional - Development
NODE_ENV=development          # Environment mode
VITE_DEV_SERVER_URL=          # Custom dev server URL

# Optional - Production
PUBLIC_SITE_URL=              # Your production domain
```

### Database Schema Setup

The project includes migrations in `supabase/migrations/`:
- `20251205023859_initial_schema.sql` - Core tables and RLS policies
- `20251205230000_add_competitor_analysis_tables.sql` - Competitor features
- `20251206000000_performance_optimizations.sql` - Indexes and optimizations

**To apply migrations:**
```bash
# Via Supabase CLI
supabase db push

# Or manually in Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy migration file contents
# 3. Run the SQL
```

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
