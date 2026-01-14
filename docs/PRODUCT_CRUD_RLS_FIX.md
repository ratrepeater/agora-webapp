# Product CRUD Operations RLS Authentication Fix

## Problem

Product create, update, and delete operations were failing with RLS (Row Level Security) policy errors because they were using an unauthenticated Supabase client singleton.

### Symptoms
- **Delete**: "No rows were deleted. Product may not exist or RLS policy blocked deletion."
- **Update**: "Failed to update product: Cannot coerce the result to a single JSON object"
- **Create**: Would likely fail with similar RLS errors (not tested but same root cause)

### Root Cause

The `productService` class in `src/lib/services/products.ts` uses a singleton Supabase client imported from `$lib/helpers/supabase.server`:

```typescript
import { supabase } from '$lib/helpers/supabase.server';
```

This singleton client has **no user session context**, so when RLS policies check `auth.uid()`, they find no authenticated user and block the operation.

## Solution

Replace all authenticated database operations with `locals.supabase`, which contains the user's session and properly authenticates with RLS policies.

### Files Modified

#### 1. Product Delete (`src/routes/(seller)/seller/products/+page.server.ts`)
- ✅ Already fixed in previous iteration
- Uses `locals.supabase` directly instead of `productService.delete()`

#### 2. Product Update (`src/routes/(seller)/seller/products/[id]/edit/+page.server.ts`)
- ✅ Fixed: Replaced `productService.update()` with direct `locals.supabase` operations
- ✅ Fixed: All database queries now use `locals.supabase`:
  - Categories fetch
  - Product metrics fetch
  - Metric definitions fetch
  - Product update operation
  - Metrics insert
  - Logo upload
  - Demo visual upload
- ✅ Removed unused `supabase` singleton import
- ✅ Added comprehensive logging

#### 3. Product Create (`src/routes/(seller)/seller/products/new/+page.server.ts`)
- ✅ Fixed: Replaced `productService.create()` with direct `locals.supabase` operations
- ✅ Fixed: All database queries now use `locals.supabase`:
  - Categories fetch (in load function)
  - Product insert operation
  - Metric definitions fetch
  - Metrics insert
  - Logo upload
  - Demo visual upload
- ✅ Removed unused `supabase` and `productService` imports
- ✅ Added comprehensive logging

## Key Pattern

**Always use `locals.supabase` for authenticated operations:**

```typescript
// ❌ WRONG - No user context, RLS will block
const { data, error } = await supabase
  .from('products')
  .update({ ... })
  .eq('id', productId);

// ✅ CORRECT - Has user session, RLS will allow
const { data, error } = await locals.supabase
  .from('products')
  .update({ ... })
  .eq('id', productId);
```

## RLS Policies

The following RLS policies depend on `auth.uid()` and require authenticated client:

```sql
-- Sellers can delete own products
create policy "Sellers can delete own products" 
  on public.products 
  for delete 
  using (auth.uid() = seller_id);

-- Sellers can update own products
create policy "Sellers can update own products" 
  on public.products 
  for update 
  using (auth.uid() = seller_id);

-- Sellers can insert own products
create policy "Sellers can insert own products" 
  on public.products 
  for insert 
  with check (auth.uid() = seller_id);
```

## Testing

All three operations should now work correctly:
1. ✅ Create new product
2. ✅ Update existing product
3. ✅ Delete product

Each operation includes console logging for debugging:
- Create: `➕ Creating new product` → `✅ Product created successfully`
- Update: `🔄 Updating product` → `✅ Product updated successfully`
- Delete: `🗑️ Deleting product` → `✅ Successfully deleted product`

## Related Files

- `src/lib/services/products.ts` - Service class (still has methods but not used for CUD operations)
- `src/lib/helpers/supabase.server.ts` - Singleton client (only for unauthenticated reads)
- `src/hooks.server.ts` - Creates `locals.supabase` with user session
