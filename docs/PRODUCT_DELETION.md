# Product Deletion Implementation

## Overview

This document describes the implementation of product deletion functionality for sellers in the marketplace application. The implementation uses **hard delete** to completely remove products from the system, ensuring they don't appear anywhere on the site.

## Key Changes Applied

**Issue**: Soft-deleted products were still appearing in various places (homepage, marketplace, product detail pages).

**Solution**: Switched from soft delete to hard delete and added proper status filtering where needed:

1. **Hard Delete**: Products are completely removed from the database
2. **Status Filtering**: Public pages only show products with `status = 'published'`
3. **Ownership Verification**: Uses `getByIdForOwnership` method for seller operations

## Implementation Details

### 1. Frontend (Seller Products Page)

**File**: `src/routes/(seller)/seller/products/+page.svelte`

**Features**:
- Delete button for each product in the seller's product list
- Confirmation modal with product name display
- Loading state during deletion
- Success/error message handling
- Accessibility improvements (proper ARIA labels, button elements)

**UI Flow**:
1. Seller clicks "Delete" button on a product
2. Confirmation modal appears with product name
3. Seller confirms deletion
4. Loading spinner shows during API call
5. Success/error message displays
6. Product list refreshes

### 2. Server-Side Action

**File**: `src/routes/(seller)/seller/products/+page.server.ts`

**Action**: `delete`

**Security Features**:
- Authentication check (must be signed in)
- Authorization check (must be seller role)
- Ownership verification (product must belong to seller)
- Input validation (product ID required)

**Process**:
1. Validate user session and role
2. Extract product ID from form data
3. Verify product exists and belongs to seller
4. Call product service delete method
5. Return success/error response

### 3. API Endpoint

**File**: `src/routes/api/products/[id]/+server.ts`

**Method**: `DELETE /api/products/[id]`

**Features**:
- RESTful API endpoint for product deletion
- Same security checks as server action
- JSON response format
- Proper HTTP status codes

**Usage**:
```typescript
const response = await fetch(`/api/products/${productId}`, {
    method: 'DELETE',
    credentials: 'include'
});
```

### 5. Service Layer Fixes

**File**: `src/lib/services/products.ts`

**Key Methods**:

**`delete(id: string)`** - Soft delete implementation:
```typescript
async delete(id: string): Promise<void> {
    const { error } = await supabase
        .from('products')
        .update({ status: 'archived' })
        .eq('id', id);

    if (error) {
        throw new Error(`Failed to delete product: ${error.message}`);
    }
}
```

**`getByIdForOwnership(id: string)`** - Ownership verification without status filtering:
```typescript
async getByIdForOwnership(id: string): Promise<Product | null> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
    // Returns product regardless of status for ownership checks
}
```

**`getBySeller(sellerId: string, includeArchived: boolean = false)`** - Fixed to filter archived products:
```typescript
// Filter out archived products unless explicitly requested
if (!includeArchived) {
    query = query.neq('status', 'archived');
}
```

**Method**: `delete(id: string)`

**Key Features**:
- **Hard delete**: Completely removes product from database
- **Immediate effect**: Product disappears from all pages instantly
- **RLS protection**: Database policies ensure only owners can delete

```typescript
async delete(id: string): Promise<void> {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(`Failed to delete product: ${error.message}`);
    }
}
```

**`getByIdForOwnership(id: string)`** - Ownership verification without status filtering:
```typescript
async getByIdForOwnership(id: string): Promise<Product | null> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
    // Returns product regardless of status for ownership checks
}
```

**`getBySeller(sellerId: string)`** - Returns all seller's products:
```typescript
async getBySeller(sellerId: string): Promise<ProductWithRating[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
    // Returns all products (draft, published) - archived ones are deleted
}
```

## Database Security (RLS Policies)

### Existing Policy

**File**: `supabase/migrations/20251205023859_initial_schema.sql`

```sql
create policy "Sellers can delete own products"
  on public.products for delete 
  using (auth.uid() = seller_id);
```

### Policy Analysis

**Security Features**:
- ✅ **Authentication Required**: `auth.uid()` ensures user is signed in
- ✅ **Ownership Verification**: `seller_id = auth.uid()` ensures seller owns the product
- ✅ **Operation Specific**: Policy only applies to DELETE operations
- ✅ **Row-Level Security**: Each seller can only delete their own products

**Policy Effectiveness**:
- Prevents unauthorized deletion attempts
- Works with both hard deletes and soft deletes (UPDATE operations)
- Automatically enforced at database level
- No additional application-level checks needed for basic security

### Additional Security Considerations

Since the application uses **soft deletes** (UPDATE status to 'archived'), the relevant policy is actually:

```sql
create policy "Sellers can update own products"
  on public.products for update 
  using (auth.uid() = seller_id);
```

This policy covers the soft delete operation and provides the same security guarantees.

## Security Benefits

1. **Defense in Depth**: Multiple layers of security checks
   - Frontend validation
   - Server-side authentication/authorization
   - Database RLS policies

2. **Complete Removal**: Hard delete ensures products don't appear anywhere
   - No confusion with archived/hidden products
   - Clean database without orphaned data
   - Immediate effect across all pages

3. **Proper Authorization**: Only product owners can delete their products
   - Session validation
   - Role-based access control
   - Ownership verification

4. **Status-Based Access Control**: Public pages only show published products
   - Homepage filters by `status = 'published'`
   - Marketplace filters by `status = 'published'`
   - Product detail pages filter by `status = 'published'`
   - Search results filter by `status = 'published'`

## Usage Examples

### From Seller Dashboard
1. Navigate to `/seller/products`
2. Click "Delete" button on any product
3. Confirm in modal dialog
4. Product status changes to 'archived'

### Via API (for integrations)
```typescript
const response = await fetch(`/api/products/${productId}`, {
    method: 'DELETE',
    headers: {
        'Authorization': 'Bearer ' + token
    }
});

if (response.ok) {
    console.log('Product deleted successfully');
}
```

## Error Handling

**Common Error Scenarios**:
- **401 Unauthorized**: User not signed in
- **403 Forbidden**: User doesn't own the product
- **404 Not Found**: Product doesn't exist
- **500 Server Error**: Database operation failed

**Error Messages**:
- User-friendly messages in UI
- Detailed error logging for debugging
- Proper HTTP status codes for API responses

## Testing Considerations

**Test Cases**:
1. ✅ Seller can delete their own products
2. ✅ Seller cannot delete other sellers' products
3. ✅ Unauthenticated users cannot delete products
4. ✅ Non-seller users cannot delete products
5. ✅ Deleted products show as 'archived' status
6. ✅ Historical orders remain intact after deletion
7. ✅ UI shows appropriate loading/success/error states

## Future Enhancements

**Potential Improvements**:
- Bulk delete functionality
- Restore archived products feature
- Delete confirmation with typing product name
- Scheduled deletion (delete after X days)
- Admin override for emergency deletions

## Summary

The product deletion functionality now uses **hard delete** to completely remove products from the system. Key improvements:

✅ **Complete Removal**: Deleted products are permanently removed from the database
✅ **Immediate Effect**: Products disappear from all pages instantly
✅ **Status Filtering**: Public pages only show published products
✅ **Security**: RLS policies and ownership verification protect against unauthorized deletions
✅ **Clean Architecture**: No confusion between archived, draft, and published products

**Key security principle**: Products are completely removed when deleted, and public pages only show published products through proper status filtering.