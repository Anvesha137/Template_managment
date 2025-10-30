/*
  # Add Folder Functionality to Templates

  ## Overview
  This migration adds folder and company organization capabilities to the template management system.
  
  ## Changes
  
  ### New Tables
  ### `folders`
  - `id` (uuid, primary key) - Folder identifier
  - `name` (text) - Folder name
  - `company_name` (text) - Associated company name
  - `created_by` (uuid) - User who created the folder
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### Modified Tables
  ### `templates`
  - Added `folder_id` (uuid, foreign key) - Reference to folder
  - Added `company_name` (text) - Company associated with template

  ## Security
  ### RLS Policies for folders
  - Authenticated users can view folders they created
  - Authenticated users can create folders
  - Users can update/delete their own folders
*/

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add folder_id and company_name columns to templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS company_name text;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON folders(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_folder_id ON templates(folder_id);
CREATE INDEX IF NOT EXISTS idx_templates_company_name ON templates(company_name);

-- Enable Row Level Security on folders table
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for folders

-- Users can view folders they created
CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- Users can create folders
CREATE POLICY "Users can create folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own folders
CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own folders
CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Update templates RLS policies to maintain existing behavior
-- (No changes needed as templates are already accessible by all authenticated users)

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_folders_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on folders
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_folders_updated_at_column();

-- Insert a default "generalized" folder for all existing users
-- This will be created programmatically in the app to ensure each user gets one