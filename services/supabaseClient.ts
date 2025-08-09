

import { createClient } from '@supabase/supabase-js';
import type { Json, SocialPlatform } from '../types';

// Add database type definitions to provide type-safety to the client.
// In a real project, this could be generated via `supabase gen types typescript`.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          full_name: string | null
          title: string | null
          summary: string | null
          experience_years: number | null
          skills: string[] | null
          photo_url: string | null
          job_goal: string | null
          is_certified: boolean | null
          assessment_score: number | null
          credly_url: string | null
          holistic_analysis: any | null
          company_name: string | null
          company_website: string | null
          company_description: string | null
          company_logo_url: string | null
          company_size: string | null
          industry: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          full_name?: string | null
          title?: string | null
          summary?: string | null
          experience_years?: number | null
          skills?: string[] | null
          photo_url?: string | null
          job_goal?: string | null
          is_certified?: boolean | null
          assessment_score?: number | null
          credly_url?: string | null
          holistic_analysis?: any | null
          company_name?: string | null
          company_website?: string | null
          company_description?: string | null
          company_logo_url?: string | null
          company_size?: string | null
          industry?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          full_name?: string | null
          title?: string | null
          summary?: string | null
          experience_years?: number | null
          skills?: string[] | null
          photo_url?: string | null
          job_goal?: string | null
          is_certified?: boolean | null
          assessment_score?: number | null
          credly_url?: string | null
          holistic_analysis?: any | null
          company_name?: string | null
          company_website?: string | null
          company_description?: string | null
          company_logo_url?: string | null
          company_size?: string | null
          industry?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          id: string
          user_id: string
          name: string
          issuing_organization: string
          issue_date: string | null
          description: string | null
          file_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          issuing_organization: string
          issue_date?: string | null
          description?: string | null
          file_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          issuing_organization?: string
          issue_date?: string | null
          description?: string | null
          file_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      social_links: {
        Row: {
          id: string
          user_id: string
          platform: SocialPlatform
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: SocialPlatform
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: SocialPlatform
          url?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
            id: string
            user_id: string
            title: string
            description: string | null
            technologies: string[] | null
            project_url: string | null
            image_url: string | null
            created_at: string
        }
        Insert: {
            id?: string
            user_id: string
            title: string
            description?: string | null
            technologies?: string[] | null
            project_url?: string | null
            image_url?: string | null
            created_at?: string
        }
        Update: {
            id?: string
            user_id?: string
            title?: string
            description?: string | null
            technologies?: string[] | null
            project_url?: string | null
            image_url?: string | null
            created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_jobs: {
        Row: {
          id: string
          user_id: string
          title: string
          location: string | null
          url: string
          inserted_at: string | null
          logo: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          location?: string | null
          url: string
          inserted_at?: string | null
          logo?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          location?: string | null
          url?: string
          inserted_at?: string | null
          logo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      jobs: {
        Row: {
          id: string
          created_at: string
          company_id: string
          title: string
          description: string
          location: string
          required_skills: string[]
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          company_id: string
          title: string
          description: string
          location: string
          required_skills: string[]
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          company_id?: string
          title?: string
          description?: string
          location?: string
          required_skills?: string[]
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}


// هام: يرجى استبدال هذه القيم بالـ URL والـ Anon Key الفعليين لمشروعك في Supabase.
// يفضل تخزين هذه البيانات في متغيرات البيئة (environment variables) في تطبيق حقيقي.
const supabaseUrl = 'https://lsfjxtrqggogkzefudry.supabase.co'; //  استبدل هذا بـ Supabase URL الخاص بك
const supabaseAnonKey = 'sb_publishable_by8JGHGe6kAvmIn02_3ZSg_5ZVFy5lz'; // استبدل هذا بـ Supabase Anon Key الخاص بك

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);