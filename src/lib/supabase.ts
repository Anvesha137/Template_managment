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
          category: 'Marketing' | 'Utility' | 'Authentication';
          subcategory: string;
          content: string;
          media_url: string | null;
          has_buttons: boolean;
          button_config: any | null;
          status: 'draft' | 'pending' | 'approved' | 'rejected';
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: 'Marketing' | 'Utility' | 'Authentication';
          subcategory: string;
          content: string;
          media_url?: string | null;
          has_buttons?: boolean;
          button_config?: any | null;
          status?: 'draft' | 'pending' | 'approved' | 'rejected';
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: 'Marketing' | 'Utility' | 'Authentication';
          subcategory?: string;
          content?: string;
          media_url?: string | null;
          has_buttons?: boolean;
          button_config?: any | null;
          status?: 'draft' | 'pending' | 'approved' | 'rejected';
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
