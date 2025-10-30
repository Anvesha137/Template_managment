/*
  # Fix Security and Performance Issues

  ## Changes

  1. Add Missing Index
    - Add index on `user_profiles.created_by` foreign key

  2. Optimize RLS Policies
    - Replace `auth.uid()` with `(select auth.uid())` in all policies
    - This prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale

  3. Remove Unused Indexes
    - Drop `idx_templates_category` (unused)
    - Drop `idx_templates_status` (unused)

  4. Fix Multiple Permissive Policies
    - Combine UPDATE policies for user_profiles into single policy with OR logic

  5. Fix Function Search Path
    - Set immutable search_path for `update_updated_at_column` function

  ## Security Impact
  All changes maintain the same security guarantees while improving performance.
*/

-- 1. Add missing index on foreign key
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_by ON user_profiles(created_by);

-- 2. Drop unused indexes
DROP INDEX IF EXISTS idx_templates_category;
DROP INDEX IF EXISTS idx_templates_status;

-- 3. Drop existing policies to recreate with optimized auth checks
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can create templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;
DROP POLICY IF EXISTS "Template visibility based on role" ON templates;

-- 4. Recreate user_profiles policies with optimized auth checks

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert user profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- 5. Combine UPDATE policies into single policy to fix multiple permissive policies issue
CREATE POLICY "Users can update profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = id 
    OR 
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    (select auth.uid()) = id 
    OR 
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- 6. Recreate templates policies with optimized auth checks

CREATE POLICY "Users can create templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can delete own templates"
  ON templates FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

CREATE POLICY "Template visibility based on role"
  ON templates FOR SELECT
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- 7. Fix function search path for update_updated_at_column
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();