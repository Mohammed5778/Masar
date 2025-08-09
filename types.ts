
export type SocialPlatform = 'github' | 'linkedin' | 'behance' | 'huggingface' | 'portfolio' | 'other';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface UserProfileData {
  id: string; // user_id from Supabase auth
  full_name: string; // For both: candidate name or recruiter contact name
  title: string; // Candidate title
  summary:string; // Candidate summary
  experience_years: number | null; // Candidate experience
  skills: string[]; // Stored as an array of strings
  photo_url: string | null; // For both: candidate photo or recruiter photo
  job_goal: string | null; // Candidate goal
  is_certified: boolean | null; // Candidate status
  assessment_score: number | null; // Candidate score
  updated_at: string | null;
  credly_url: string | null; // Candidate credly
  holistic_analysis: HolisticAnalysisResult | null; // Candidate analysis

  // Company-specific fields for recruiters
  company_name?: string | null;
  company_website?: string | null;
  company_description?: string | null;
  company_logo_url?: string | null;
  company_size?: string | null;
  industry?: string | null;
}

export interface HolisticAnalysisResult {
    completeness_score: number;
    consistency_score: number;
    goal_clarity_score: number;
    recruiter_summary: string;
    key_strengths: string[];
}

export interface AssessmentQuestion {
    question: string;
    type: 'multiple_choice' | 'text';
    options?: string[];
}

export interface UserAnswer {
    question: string;
    answer: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  name: string;
  issuing_organization: string;
  issue_date: string | null;
  description: string | null;
  file_url: string | null;
  created_at: string;
}

export interface SocialLink {
    id: string;
    user_id: string;
    platform: SocialPlatform;
    url: string;
    created_at: string;
}

export interface Project {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    technologies: string[];
    project_url: string | null;
    image_url: string | null;
    created_at: string;
}

// This type is for jobs matched to a candidate
export interface Job {
    id: string;
    user_id: string;
    title: string;
    location: string | null;
    url: string;
    inserted_at: string | null;
    logo: string | null;
}

// This type is for jobs posted by a company
export interface JobPosting {
    id: string;
    company_id: string;
    title: string;
    description: string;
    location: string;
    required_skills: string[];
    is_active: boolean;
    created_at: string;
}

// This type represents a job posting with company details joined.
export interface JobPostingWithCompany extends JobPosting {
    profiles: {
        company_name: string | null;
        company_logo_url: string | null;
        industry: string | null;
    } | null;
}


// This type is for the raw AI response for candidate suggestions
export interface AISuggestion {
    candidate_id: string;
    justification: string;
}
