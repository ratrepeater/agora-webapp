-- ============================================================================
-- SIMPLE FIX: Run this in Supabase Dashboard SQL Editor
-- ============================================================================

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role_buyer, role_seller)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    true,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 2. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Create profile for the user you just created
INSERT INTO public.profiles (id, full_name, role_buyer, role_seller)
VALUES (
  '330090c9-2d94-4545-be19-ef1a731bac90',
  'Teddy Zheng',
  true,
  false
)
ON CONFLICT (id) DO NOTHING;

-- 5. Create profiles for any other existing users
INSERT INTO public.profiles (id, full_name, role_buyer, role_seller)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1)
  ),
  true,
  false
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 6. Verify
SELECT 
  au.email,
  p.id as profile_id,
  p.full_name,
  CASE WHEN p.id IS NULL THEN '❌ NO PROFILE' ELSE '✅ HAS PROFILE' END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC
LIMIT 10;
