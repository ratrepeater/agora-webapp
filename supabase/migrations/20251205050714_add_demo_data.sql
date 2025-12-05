-- ============================================================================
-- DEMO DATA: Categories, Profile, and 4 Products
-- ============================================================================

-- 1) Create categories with specific IDs
INSERT INTO public.categories (id, key, name, description) VALUES
  ('347fd7b4-c9b6-447c-8d27-d428ff5bbe86', 'marketing', 'Marketing Tools', 'Marketing automation and analytics platforms'),
  ('51b038f1-dac1-41ed-965c-b50ea784de3a', 'hr', 'HR Tools', 'Human resources management and payroll solutions'),
  ('76a101e2-af85-4304-bd5a-787c2c0fce72', 'devtools', 'Developer Tools', 'Development tools, CI/CD, and infrastructure automation'),
  ('d872ddba-ee38-4de0-ba1a-247f638f2940', 'legal', 'Legal Tools', 'Contract management and legal workflow automation')
ON CONFLICT (id) DO NOTHING;
-- 2) Create a demo user in auth.users (required for profile)
-- Note: This creates a user with a fake email for demo purposes
-- Using a simple encrypted password (not for production use)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'demo@example.com',
  '$2a$10$demopasswordhashfordemouser',  -- Dummy hash for demo
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;
-- 3) Create demo profile (will be auto-created by trigger, but we ensure it exists)
INSERT INTO public.profiles (id, full_name, company_name, role_buyer, role_seller)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Demo User',
  'Demo Company',
  true,
  true
)
ON CONFLICT (id) DO NOTHING;
-- 4) Insert four products in four different categories
WITH demo_profile AS (
  SELECT '00000000-0000-0000-0000-000000000001'::uuid AS profile_id
),
insert_products AS (
  INSERT INTO public.products (
    id,
    seller_id,
    category_id,
    name,
    slug,
    short_description,
    long_description,
    logo_url,
    demo_visual_url,
    price_cents,
    is_featured,
    is_bundle,
    bundle_pricing_mode,
    status
  )
  SELECT
    -- Product 1: Marketing (normal product, in bundle)
    '39d46efb-df20-4635-bac7-e0173f26acac'::uuid,
    dp.profile_id,
    '347fd7b4-c9b6-447c-8d27-d428ff5bbe86'::uuid, -- marketing
    'FunnelVision Marketing Dashboard',
    'funnelvision-marketing-dashboard',
    'Marketing analytics dashboard for funnels and campaigns.',
    'Track top-of-funnel, conversion rates, and ROI across channels with a unified, no-code dashboard.',
    'https://example.com/logos/funnelvision.png',
    'https://example.com/demos/funnelvision-demo.png',
    9900,          -- $99.00
    false,
    false,
    'fixed',
    'published'
  FROM demo_profile dp
  
  UNION ALL
  
  SELECT
    -- Product 2: HR (normal product, in bundle)
    '454ad092-62d8-46dd-9aff-09abcc34cfe0'::uuid,
    dp.profile_id,
    '51b038f1-dac1-41ed-965c-b50ea784de3a'::uuid, -- hr
    'PeoplePulse HR Hub',
    'peoplepulse-hr-hub',
    'Modern HR hub for employee onboarding and performance.',
    'Centralize onboarding tasks, reviews, and compliance training in one workspace.',
    'https://example.com/logos/peoplepulse.png',
    'https://example.com/demos/peoplepulse-demo.png',
    12900,         -- $129.00
    false,
    false,
    'fixed',
    'published'
  FROM demo_profile dp
  
  UNION ALL
  
  SELECT
    -- Product 3: Devtools (normal product, will be bookmarked)
    'b503642b-bb29-462c-b558-a527c58ab938'::uuid,
    dp.profile_id,
    '76a101e2-af85-4304-bd5a-787c2c0fce72'::uuid, -- devtools
    'DevFlow CI Accelerator',
    'devflow-ci-accelerator',
    'CI pipeline accelerator for faster builds and deployments.',
    'Optimize build times, visualize pipeline health, and track deployment frequency with out-of-the-box dashboards.',
    'https://example.com/logos/devflow.png',
    'https://example.com/demos/devflow-demo.png',
    14900,         -- $149.00
    true,
    false,
    'fixed',
    'published'
  FROM demo_profile dp
  
  UNION ALL
  
  SELECT
    -- Product 4: Legal (bundle product, will be in a cart)
    'ed0f196c-2b4a-48cc-8952-e6c0d9e6b28c'::uuid,
    dp.profile_id,
    'd872ddba-ee38-4de0-ba1a-247f638f2940'::uuid, -- legal
    'LaunchSuite Go-To-Market Bundle',
    'launchsuite-gtm-bundle',
    'Bundled toolkit combining marketing, HR, and legal essentials.',
    'A curated bundle that combines marketing analytics and HR hub capabilities, packaged with legal-ready workflows.',
    'https://example.com/logos/launchsuite.png',
    'https://example.com/demos/launchsuite-demo.png',
    19900,         -- $199.00 bundle price
    true,
    true,          -- this is the bundle
    'fixed',
    'published'
  FROM demo_profile dp
  RETURNING id
),
-- 5) Define bundle items: bundle (product 4) contains products 1 and 2
insert_bundle_items AS (
  INSERT INTO public.bundle_items (
    id,
    bundle_product_id,
    product_id,
    quantity
  )
  VALUES
    (
      gen_random_uuid(),
      'ed0f196c-2b4a-48cc-8952-e6c0d9e6b28c'::uuid,  -- bundle product
      '39d46efb-df20-4635-bac7-e0173f26acac'::uuid,  -- marketing product
      1
    ),
    (
      gen_random_uuid(),
      'ed0f196c-2b4a-48cc-8952-e6c0d9e6b28c'::uuid,  -- bundle product
      '454ad092-62d8-46dd-9aff-09abcc34cfe0'::uuid,  -- HR product
      1
    )
  RETURNING bundle_product_id
),
-- 6) Bookmark one of the non-bundle products (Devtools product 3)
insert_bookmark AS (
  INSERT INTO public.bookmarks (buyer_id, product_id)
  SELECT
    dp.profile_id,
    'b503642b-bb29-462c-b558-a527c58ab938'::uuid  -- DevFlow CI Accelerator
  FROM demo_profile dp
  RETURNING buyer_id
),
-- 7) Create a cart and add the final product (bundle product 4) into it
insert_cart AS (
  INSERT INTO public.carts (id, buyer_id, status)
  SELECT
    'f84c1d6a-0bf7-4b3f-a2d3-8baa3ed2fa38'::uuid,  -- fixed demo cart id
    dp.profile_id,
    'open'
  FROM demo_profile dp
  RETURNING id, buyer_id
)
INSERT INTO public.cart_items (
  id,
  cart_id,
  product_id,
  quantity,
  unit_price_cents
)
SELECT
  gen_random_uuid(),
  c.id,
  'ed0f196c-2b4a-48cc-8952-e6c0d9e6b28c'::uuid,  -- LaunchSuite bundle in the cart
  1,
  19900                                          -- match bundle price_cents
FROM insert_cart c;
