/*
  # Fix Template Visibility Policy

  1. Changes
    - Drop the existing template visibility policy
    - Create a new policy that properly checks admin status using EXISTS subquery
    - This ensures admins can see all templates and users can see their own templates
  
  2. Security
    - Maintains RLS protection
    - Admin users can view all templates
    - Regular users can only view their own templates
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Template visibility based on role" ON templates;

-- Create new policy with proper admin check
CREATE POLICY "Template visibility based on role"
  ON templates
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by 
    OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );