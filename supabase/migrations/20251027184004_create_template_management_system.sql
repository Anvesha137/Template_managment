/*
  # WhatsApp Template Management System

  ## Overview
  This migration creates a comprehensive template management system similar to Meta's WhatsApp templates,
  with admin controls and multi-user support.

  ## 1. New Tables

  ### `user_profiles`
  Extended user profile information linked to Supabase auth
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text, unique) - User email address
  - `is_admin` (boolean) - Admin flag for user management permissions
  - `created_at` (timestamptz) - Account creation timestamp
  - `created_by` (uuid) - Reference to admin who added this user

  ### `templates`
  Stores WhatsApp message templates
  - `id` (uuid, primary key) - Template identifier
  - `name` (text) - Template name
  - `category` (text) - Main category: Marketing, Utility, or Authentication
  - `subcategory` (text) - Subcategory type (Default, Catalogue, Calling permissions request, One-time passcode)
  - `content` (text) - Template message content
  - `media_url` (text, optional) - URL for media attachments
  - `has_buttons` (boolean) - Whether template includes buttons
  - `button_config` (jsonb, optional) - Button configuration data
  - `status` (text) - Template status: draft, pending, approved, rejected
  - `created_by` (uuid) - User who created the template
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with restrictive policies:
  
  #### user_profiles policies:
  - Authenticated users can view their own profile
  - Admins can view all profiles
  - Admins can insert new user profiles
  - Users can update their own profile (non-admin fields only)
  - Admins can update any profile
  
  #### templates policies:
  - Authenticated users can view all templates
  - Authenticated users can create templates
  - Users can update their own templates
  - Users can delete their own templates

  ## 3. Important Notes
  - The first user to sign up should be manually set as admin via SQL
  - All timestamps use UTC timezone
  - Template status workflow: draft → pending → approved/rejected
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Marketing', 'Utility', 'Authentication')),
  subcategory text NOT NULL,
  content text NOT NULL,
  media_url text,
  has_buttons boolean DEFAULT false,
  button_config jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_status ON templates(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Admins can insert new user profiles
CREATE POLICY "Admins can insert user profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Users can update their own profile (except is_admin field)
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_admin = (SELECT is_admin FROM user_profiles WHERE id = auth.uid())
  );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- RLS Policies for templates

-- Authenticated users can view all templates
CREATE POLICY "Users can view all templates"
  ON templates FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create templates
CREATE POLICY "Users can create templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
  ON templates FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on templates
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();