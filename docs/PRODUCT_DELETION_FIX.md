# Product Deletion Fix - RLS Authentication Issue

## Problem Identified

Product deletion was failing with the following symptoms:
- Delete operation returned 0 rows deleted
- No error was thrown
- RLS policy was blocking the deletion

**Root Cause**: The product service was using a server-side singleton Supabase client (`supabase.server.ts`) that **does not have the authenticated user's session context**. 

The RLS policy requires:
```sql
create policy "Sellers can delete own products"
  on public.products for delete 
  using (auth.uid() = seller_id);
```

This policy checks `auth.uid()` which is only available when using an authenticated Supabase client. The singleton client has no user context, so `auth.uid()` returns `null`, causing the RLS policy to block all deletions.

## Solution Implemented

**Use the authenticated Supabase client from `locals.supabase`** instead of the singleton client.

### Changes Made

#### 1. Server Action (`+page.server.ts`)

**Before**:
```typescript
const product = await productService.getByIdForOwnership(productId);
await productService.delete(productId);
```

**After**:
```typescript
// Use locals.supabase which has the user's session
const { data: product } = await locals.supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

const { data: deletedData, error } = await locals.supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .select();
```

#### 2. API Endpoint (`/api/products/[id]/+server.ts`)

Same fix - replaced `productService` calls with direct `locals.supabase` calls.

### Why This Works

1. **`locals.supabase`** is created in `hooks.server.ts` with the user's session
2. It has access to `auth.uid()` which returns the authenticated user's ID
3. RLS policies can now properly verify `auth.uid() = seller_id`
4. Deletion succeeds when the seller owns the product

## Comprehensive Logging Added

Added detailed console logging at every step:

```typescript
console.log('=== DELETE ACTION STARTED ===');
console.log('Session exists:', !!locals.session);
console.log('User role:', locals.userRole);
console.log('Product ID from form:', productId);
console.log('🔍 Verifying product ownership...');
console.log('Product found:', !!product);
console.log('Product seller_id:', product?.seller_id);
console.log('Current user id:', locals.session.user.id);
console.log('✅ Ownership verified, proceeding with deletion...');
console.log('Delete operation result:', { deletedRows, data, error });
console.log('✅ Product deleted successfully from database');
console.log('=== DELETE ACTION COMPLETED ===');
```

This helps debug any future issues with:
- Authentication state
- Product ownership verification
- Database operation results
- RLS policy behavior

## Key Takeaway

**Always use `locals.supabase` in server-side code that needs to respect RLS policies based on the authenticated user.**

The singleton `supabase.server` client should only be used for:
- Operations that don't require user context
- Admin operations that bypass RLS
- Background jobs without user sessions

## Files Modified

- `src/routes/(seller)/seller/products/+page.server.ts` - Fixed delete action
- `src/routes/api/products/[id]/+server.ts` - Fixed API endpoint
- `src/routes/(seller)/seller/products/+page.svelte` - Added frontend logging
- `src/lib/services/products.ts` - Added service-level logging (for reference)

## Testing

To verify the fix works:
1. Sign in as a seller
2. Navigate to "My Products"
3. Click "Delete" on any product
4. Confirm deletion in modal
5. Check browser console for detailed logs
6. Check server console for deletion confirmation
7. Verify product is removed from the list
8. Verify product is deleted from database

Expected console output:
```
=== DELETE ACTION STARTED ===
Session exists: true
User role: seller
Product ID from form: [uuid]
🔍 Verifying product ownership...
Product found: true
Product seller_id: [uuid]
Current user id: [uuid]
✅ Ownership verified, proceeding with deletion...
Delete operation result: { deletedRows: 1, data: [...], error: null }
✅ Product deleted successfully from database
=== DELETE ACTION COMPLETED ===
```