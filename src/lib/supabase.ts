import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      folders: {
        Row: {
          id: string;
          name: string;
          company_name: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          company_name: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          company_name?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          is_admin: boolean;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id: string;
          email: string;
          is_admin?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          is_admin?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
      };
      templates: {
        Row: {
          id: string;
          name: string;
          template_name: string | null;
          language: string | null;
          category: 'Marketing' | 'Utility' | 'Authentication';
          subcategory: string;
          content: string;
          header_type: string | null;
          header_text: string | null;
          header_media_sample: string | null;
          header_media_filename: string | null;
          footer_text: string | null;
          media_url: string | null;
          has_buttons: boolean;
          button_config: any | null;
          catalogue_id: string | null;
          catalogue_format: string | null;
          validity_period: number | null;
          code_delivery_method: string | null;
          add_security_recommendation: boolean | null;
          code_expiry_minutes: number | null;
          package_name: string | null;
          signature_hash: string | null;
          status: 'draft' | 'pending' | 'approved' | 'rejected';
          created_by: string;
          created_at: string;
          updated_at: string;
          folder_id: string | null;
          company_name: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          template_name?: string | null;
          language?: string | null;
          category: 'Marketing' | 'Utility' | 'Authentication';
          subcategory: string;
          content: string;
          header_type?: string | null;
          header_text?: string | null;
          header_media_sample?: string | null;
          header_media_filename?: string | null;
          footer_text?: string | null;
          media_url?: string | null;
          has_buttons?: boolean;
          button_config?: any | null;
          catalogue_id?: string | null;
          catalogue_format?: string | null;
          validity_period?: number | null;
          code_delivery_method?: string | null;
          add_security_recommendation?: boolean | null;
          code_expiry_minutes?: number | null;
          package_name?: string | null;
          signature_hash?: string | null;
          status?: 'draft' | 'pending' | 'approved' | 'rejected';
          created_by: string;
          created_at?: string;
          updated_at?: string;
          folder_id?: string | null;
          company_name?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          template_name?: string | null;
          language?: string | null;
          category?: 'Marketing' | 'Utility' | 'Authentication';
          subcategory?: string;
          content?: string;
          header_type?: string | null;
          header_text?: string | null;
          header_media_sample?: string | null;
          header_media_filename?: string | null;
          footer_text?: string | null;
          media_url?: string | null;
          has_buttons?: boolean;
          button_config?: any | null;
          catalogue_id?: string | null;
          catalogue_format?: string | null;
          validity_period?: number | null;
          code_delivery_method?: string | null;
          add_security_recommendation?: boolean | null;
          code_expiry_minutes?: number | null;
          package_name?: string | null;
          signature_hash?: string | null;
          status?: 'draft' | 'pending' | 'approved' | 'rejected';
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          folder_id?: string | null;
          company_name?: string | null;
        };
      };
    };
  };
};