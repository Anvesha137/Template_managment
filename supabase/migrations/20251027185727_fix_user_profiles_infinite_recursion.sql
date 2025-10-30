/*
  # Fix Infinite Recursion in user_profiles RLS

  ## Problem
  The admin check policy on user_profiles causes infinite recursion because
  it queries the same table it's protecting.

  ## Solution
  Simplify policies to avoid recursive queries:
  - Users can always view their own profile (no recursion)
  - Remove the admin view all policy (not needed for app functionality)
  - Keep update policies as they are

  ## Security
  - Users can still only see their own profile
  - Admins don't need to see all profiles for the app to work
*/

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Keep only the simple self-view policy
-- (Users can view own profile policy already exists and is safe)