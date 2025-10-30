/*
  # Update Template Visibility Policies

  ## Changes
  This migration updates the Row Level Security policies for the templates table to implement
  the following access control rules:
  
  1. Admin users (rohatgianvesha13@gmail.com and sales.quickrevert@gmail.com) can see ALL templates
  2. Regular users can ONLY see templates they created themselves
  
  ## Security
  - Drops the existing "Users can view all templates" policy
  - Creates new policy that checks if user is admin OR template creator
  - Admins are identified by their email addresses
*/

-- Drop the existing policy that allowed all users to see all templates
DROP POLICY IF EXISTS "Users can view all templates" ON templates;

-- Create new policy: Admins see all templates, users see only their own
CREATE POLICY "Users can view templates based on role"
  ON templates FOR SELECT
  TO authenticated
  USING (
    -- User can see their own templates
    auth.uid() = created_by
    OR
    -- OR user is an admin (check by email in user_profiles)
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );