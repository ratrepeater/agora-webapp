-- Check if profile exists for the user
SELECT * FROM public.profiles 
WHERE id = '330090c9-2d94-4545-be19-ef1a731bac90';

-- Check if there are duplicate profiles
SELECT id, COUNT(*) as count
FROM public.profiles
GROUP BY id
HAVING COUNT(*) > 1;

-- Check all profiles for this user
SELECT * FROM public.profiles 
WHERE id = '330090c9-2d94-4545-be19-ef1a731bac90';

-- Check the trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check the function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
