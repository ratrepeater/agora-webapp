-- ============================================================================
-- EMERGENCY FIX: Create profiles for existing users and fix trigger
-- Copy and paste this entire script into Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. First, let's see if the trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Drop and recreate the trigger function with proper permissions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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
      SPLIT_PART(NEW.email, '@', 1),
      'User'
    ),
    true,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- 5. Create profiles for ALL existing users who don't have one
INSERT INTO public.profiles (id, full_name, role_buyer, role_seller)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1),
    'User'
  ) as full_name,
  true as role_buyer,
  false as role_seller
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 6. Verify profiles were created
SELECT 
  COUNT(*) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  COUNT(*) - (SELECT COUNT(*) FROM public.profiles) as missing_profiles
FROM auth.users;

-- 7. Show all users and their profiles
SELECT 
  au.id,
  au.email,
  au.created_at as user_created,
  p.id as profile_id,
  p.full_name,
  p.role_buyer,
  p.role_seller,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    ELSE '✅ HAS PROFILE'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC;
