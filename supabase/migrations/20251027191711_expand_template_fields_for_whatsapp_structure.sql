/*
  # Expand Template Fields for WhatsApp Template Structure

  ## Changes
  This migration expands the templates table to support comprehensive WhatsApp template fields:
  
  1. Template Identification
    - `template_name` - Official template name
    - `language` - Template language (default 'en')
  
  2. Header Configuration
    - `header_type` - none, text, image, video, document
    - `header_text` - Header text content (60 char limit)
    - `header_media_sample` - Sample media URL
  
  3. Body & Footer
    - Existing `content` field serves as body
    - `footer_text` - Footer text (60 char limit)
  
  4. Button Configuration
    - Enhanced `button_config` JSON structure for:
      - Quick reply buttons
      - Call to action buttons (visit website, call phone, call WhatsApp)
      - Copy offer code buttons
  
  5. Catalogue Support (Marketing Catalogue)
    - `catalogue_id` - Connected catalogue ID
    - `catalogue_format` - 'full' or 'multi_product'
  
  6. Validity Period (Utility & Authentication)
    - `validity_period` - Message validity in seconds
  
  7. Authentication Fields
    - `code_delivery_method` - 'zero_tap', 'one_tap', 'copy_code'
    - `add_security_recommendation` - Boolean
    - `code_expiry_minutes` - Code expiration time
    - `package_name` - App package name
    - `signature_hash` - App signature hash

  ## Security
  - All existing RLS policies remain in effect
*/

-- Add new columns for comprehensive WhatsApp template structure
ALTER TABLE templates
ADD COLUMN IF NOT EXISTS template_name text,
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS header_type text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS header_text text,
ADD COLUMN IF NOT EXISTS header_media_sample text,
ADD COLUMN IF NOT EXISTS footer_text text,
ADD COLUMN IF NOT EXISTS catalogue_id text,
ADD COLUMN IF NOT EXISTS catalogue_format text,
ADD COLUMN IF NOT EXISTS validity_period integer,
ADD COLUMN IF NOT EXISTS code_delivery_method text,
ADD COLUMN IF NOT EXISTS add_security_recommendation boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS code_expiry_minutes integer,
ADD COLUMN IF NOT EXISTS package_name text,
ADD COLUMN IF NOT EXISTS signature_hash text;

-- Add constraints
ALTER TABLE templates
ADD CONSTRAINT valid_header_type 
  CHECK (header_type IN ('none', 'text', 'image', 'video', 'document')),
ADD CONSTRAINT valid_catalogue_format
  CHECK (catalogue_format IS NULL OR catalogue_format IN ('full', 'multi_product')),
ADD CONSTRAINT valid_code_delivery
  CHECK (code_delivery_method IS NULL OR code_delivery_method IN ('zero_tap', 'one_tap', 'copy_code'));

-- Add comments for documentation
COMMENT ON COLUMN templates.template_name IS 'Official WhatsApp template name';
COMMENT ON COLUMN templates.language IS 'Template language code (e.g., en, es)';
COMMENT ON COLUMN templates.header_type IS 'Type of header: none, text, image, video, document';
COMMENT ON COLUMN templates.header_text IS 'Header text content (max 60 characters)';
COMMENT ON COLUMN templates.footer_text IS 'Footer text content (max 60 characters)';
COMMENT ON COLUMN templates.validity_period IS 'Message validity period in seconds';