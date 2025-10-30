/*
  # Fix Template Visibility for All Users

  ## Problem
  The template SELECT policy queries user_profiles to check admin status,
  but users can't query user_profiles due to RLS restrictions causing visibility issues.

  ## Solution
  Use a simpler approach:
  1. Create a security definer function that safely checks admin status
  2. Update the template policy to use this function
  
  ## Security
  - Maintains separation: admins see all, users see only their own
  - Avoids RLS recursion issues
*/

-- Create a secure function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM user_profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Drop existing policy
DROP POLICY IF EXISTS "Template visibility based on role" ON templates;

-- Create new policy using the secure function
CREATE POLICY "Template visibility based on role"
  ON templates FOR SELECT
  TO authenticated
  USING (
    public.is_admin() = true
    OR
    auth.uid() = created_by
  );