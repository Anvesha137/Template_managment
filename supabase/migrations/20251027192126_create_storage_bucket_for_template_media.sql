/*
  # Create Storage Bucket for Template Media

  ## Changes
  1. Create storage bucket for template media files
    - Bucket name: 'template-media'
    - Public access enabled for uploaded files
  
  2. Security Policies
    - Authenticated users can upload files
    - Everyone can view files (public bucket)
    - Users can delete their own files
*/

-- Create storage bucket for template media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'template-media',
  'template-media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload template media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view template media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own template media" ON storage.objects;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload template media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'template-media');

-- Allow everyone to view files (public bucket)
CREATE POLICY "Anyone can view template media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'template-media');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own template media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'template-media' AND auth.uid() = owner);