/*
  # Simplify Template Visibility Rules

  ## Changes
  Updates RLS policies to implement simple visibility rules:
  1. Admins can see ALL templates (their own + everyone else's)
  2. Normal users can ONLY see templates they created

  ## Security
  - Drops existing complex policies
  - Creates new straightforward SELECT policy
  - Maintains data security with clear role-based access
*/

-- Drop existing template visibility policies
DROP POLICY IF EXISTS "Users can view templates based on role" ON templates;

-- Create simple visibility policy
CREATE POLICY "Template visibility based on role"
  ON templates FOR SELECT
  TO authenticated
  USING (
    -- Admins see everything
    (EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    ))
    OR
    -- Normal users only see their own
    (auth.uid() = created_by)
  );