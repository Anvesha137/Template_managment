/*
  # Add Header Media Filename Field

  1. Changes
    - Add `header_media_filename` column to store original uploaded filename
    - This allows proper display of document names in preview instead of timestamp-based names

  2. Notes
    - Field is optional (nullable) as not all templates have media
    - Used primarily for document type headers to show user-friendly filenames
*/

ALTER TABLE templates
ADD COLUMN IF NOT EXISTS header_media_filename text;

COMMENT ON COLUMN templates.header_media_filename IS 'Original filename of uploaded header media';