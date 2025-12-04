# Category-Specific Metrics Guide

## Overview
Your database now has separate metric tables for each product category, allowing you to store category-specific performance data.

## Categories & Metrics

### 1. Marketing Tools (`marketing_metrics`)
Measurable marketing outcomes:
- `conversion_lift_percentage` - Improvement in conversion rates
- `lead_cost_usd` - Cost per lead in USD
- `attribution_accuracy_error_percentage` - Error rate in attribution
- `email_deliverability_percentage` - Email delivery success rate
- `audience_match_rate_percentage` - Audience targeting accuracy
- `engagement_rate_percentage` - User engagement metrics

### 2. HR Tools (`hr_metrics`)
Operational HR metrics:
- `payroll_error_rate_percentage` - Payroll processing accuracy
- `onboarding_time_days` - Time to onboard new employees
- `time_to_fill_days` - Recruitment time (ATS)
- `compliance_tasks_automated_count` - Number of automated compliance tasks
- `employee_record_completeness_percentage` - Data completeness

### 3. Legal Tools (`legal_metrics`)
Legal workflow metrics:
- `contract_cycle_time_days` - Time to complete contracts
- `redlines_per_contract_avg` - Average contract revisions
- `template_reuse_rate_percentage` - Template utilization
- `risk_flag_detection_rate_percentage` - Risk identification accuracy
- `version_count_avg` - Average document versions
- `workflow_automation_steps_count` - Automated workflow steps

## Database Structure

Each category has:
- A dedicated metrics table linked to products via `product_id`
- One-to-one relationship (one product = one metrics record)
- Automatic timestamps (`created_at`, `updated_at`)
- Row Level Security (sellers manage their own, everyone can view)

## Convenience Views

Three views combine products with their category-specific metrics:

### `marketing_products_full`
All Marketing products with their metrics and ratings

### `hr_products_full`
All HR products with their metrics and ratings

### `legal_products_full`
All Legal products with their metrics and ratings

## Example Queries

```typescript
// Get all Marketing products with their specific metrics
const { data } = await supabase
  .from('marketing_products_full')
  .select('*')
  .order('average_rating', { ascending: false });

// Get a single product with its Marketing metrics
const { data } = await supabase
  .from('products')
  .select('*, marketing_metrics(*)')
  .eq('id', productId)
  .single();

// Add Marketing metrics to a product
const { data } = await supabase
  .from('marketing_metrics')
  .insert({
    product_id: productId,
    conversion_lift_percentage: 25.5,
    lead_cost_usd: 12.50,
    email_deliverability_percentage: 98.2,
    engagement_rate_percentage: 45.0
  });

// Get all HR products with high onboarding efficiency
const { data } = await supabase
  .from('hr_products_full')
  .select('*')
  .lte('onboarding_time_days', 7)
  .order('onboarding_time_days', { ascending: true });

// Get Legal products with fast contract cycles
const { data } = await supabase
  .from('legal_products_full')
  .select('*')
  .lte('contract_cycle_time_days', 5)
  .order('contract_cycle_time_days', { ascending: true });

// Update HR metrics for a product
const { data } = await supabase
  .from('hr_metrics')
  .update({
    payroll_error_rate_percentage: 0.5,
    compliance_tasks_automated_count: 15
  })
  .eq('product_id', productId);
```

## Adding a Product with Metrics

```typescript
// 1. Create the product
const { data: product } = await supabase
  .from('products')
  .insert({
    seller_id: userId,
    name: 'Email Marketing Pro',
    category: 'Marketing',
    short_description: 'Advanced email marketing platform',
    long_description: 'Full description here...',
    price: 99.99
  })
  .select()
  .single();

// 2. Add category-specific metrics
const { data: metrics } = await supabase
  .from('marketing_metrics')
  .insert({
    product_id: product.id,
    conversion_lift_percentage: 30.0,
    lead_cost_usd: 8.50,
    email_deliverability_percentage: 99.1,
    audience_match_rate_percentage: 85.0,
    engagement_rate_percentage: 52.3
  });
```

## Filtering & Comparison

```typescript
// Compare products by specific metrics
const { data } = await supabase
  .from('marketing_products_full')
  .select('name, conversion_lift_percentage, lead_cost_usd, average_rating')
  .order('conversion_lift_percentage', { ascending: false })
  .limit(3);

// Find best value (high performance, low cost)
const { data } = await supabase
  .from('marketing_products_full')
  .select('*')
  .gte('conversion_lift_percentage', 20)
  .lte('lead_cost_usd', 15)
  .order('average_rating', { ascending: false });
```
