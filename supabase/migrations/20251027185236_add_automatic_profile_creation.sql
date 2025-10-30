/*
  # Add Automatic Profile Creation

  ## Changes
  This migration adds a database trigger that automatically creates a user profile
  whenever a new user signs up via Supabase Auth.

  ## Implementation
  1. Creates a function that inserts a new profile when a user is created
  2. Adds a trigger on auth.users that calls this function
  3. Ensures all existing users have profiles

  ## Security
  - Maintains existing RLS policies
  - Uses security definer to allow profile creation
*/

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email IN ('rohatgianvesha13@gmail.com', 'sales.quickrevert@gmail.com') 
      THEN true 
      ELSE false 
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for any existing users that don't have one
INSERT INTO public.user_profiles (id, email, is_admin)
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN u.email IN ('rohatgianvesha13@gmail.com', 'sales.quickrevert@gmail.com') 
    THEN true 
    ELSE false 
  END as is_admin
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;