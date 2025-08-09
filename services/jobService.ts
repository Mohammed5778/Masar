

import { supabase, type Database } from './supabaseClient';
import type { Job, JobPosting, JobPostingWithCompany } from '../types';

type JobRow = Database['public']['Tables']['jobs']['Row'];
type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type UserJobRow = Database['public']['Tables']['user_jobs']['Row'];

export const getMatchingJobs = async (userId: string): Promise<Job[]> => {
    const { data, error } = await supabase
        .from('user_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('inserted_at', { ascending: false });

    if (error) {
        console.error("Error fetching matching jobs:", error);
        throw error;
    }

    return data || [];
};

export const getAllActiveJobsWithCompany = async (): Promise<JobPostingWithCompany[]> => {
    const { data, error } = await supabase
        .from('jobs')
        .select(`
            *,
            profiles (
              company_name,
              company_logo_url,
              industry
            )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching all active jobs with company info:", error);
        throw new Error('فشل في جلب الوظائف من قاعدة البيانات.');
    }

    return (data as any[]) || [];
};


// --- Functions for Company Job Postings ---

export const getCompanyJobs = async (companyId: string): Promise<JobPosting[]> => {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching company jobs:", error.message);
         if (error.code === '42P01') { // relation "public.jobs" does not exist
            throw new Error('جدول "الوظائف" (jobs) غير موجود في قاعدة بياناتك. يرجى تشغيل نص الإعداد SQL.');
        }
        throw error;
    }
    
    const jobRows = data || [];
    return jobRows.map(job => ({
        ...job,
        required_skills: job.required_skills || [],
    }));
};

type JobCreationData = Omit<JobPosting, 'id' | 'created_at' | 'is_active'>;

export const createJob = async (jobData: JobCreationData): Promise<JobPosting> => {
    const jobToInsert: JobInsert = {
        company_id: jobData.company_id,
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        required_skills: jobData.required_skills,
    };

    const { data, error } = await supabase
        .from('jobs')
        .insert(jobToInsert)
        .select()
        .single();
    
    if (error) {
        console.error("Error creating job:", error);
        if (error.code === '42501') { // permission_denied
            throw new Error('فشل إنشاء الوظيفة: ليس لديك الصلاحية اللازمة. قد يكون السبب هو أن سياسات أمان قاعدة البيانات (RLS) غير محدّثة. يرجى التأكد من تشغيل أحدث نص برمجي SQL من صفحة إصلاح الأخطاء.');
        }
        throw new Error(`فشل في إنشاء الوظيفة: ${error.message}`);
    }
    
    if (!data) {
        throw new Error('Create operation did not return data.');
    }

    const newJobData = data;
    return { ...newJobData, required_skills: newJobData.required_skills || [] };
};

export const deleteJob = async (jobId: string): Promise<void> => {
    const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);
    
    if (error) {
        console.error("Error deleting job:", error);
        throw new Error('فشل في حذف الوظيفة.');
    }
};