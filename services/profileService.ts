

import { supabase, type Database } from './supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { UserProfileData, HolisticAnalysisResult } from '../types';

const TABLE_NOT_FOUND_ERROR_CODE = '42P01';
const UNDEFINED_COLUMN_ERROR_CODE = '42703';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const coalesceProfile = (data: ProfileRow): UserProfileData => {
  return {
    id: data.id,
    full_name: data.full_name || '',
    title: data.title || '',
    summary: data.summary || '',
    experience_years: data.experience_years ?? null,
    skills: data.skills || [],
    photo_url: data.photo_url ?? null,
    job_goal: data.job_goal ?? null,
    is_certified: data.is_certified ?? null,
    assessment_score: data.assessment_score ?? null,
    updated_at: data.updated_at ?? null,
    credly_url: data.credly_url ?? null,
    holistic_analysis: (data.holistic_analysis as unknown as HolisticAnalysisResult) ?? null,
    company_name: data.company_name ?? null,
    company_website: data.company_website ?? null,
    company_description: data.company_description ?? null,
    company_logo_url: data.company_logo_url ?? null,
    company_size: data.company_size ?? null,
    industry: data.industry ?? null,
  };
};

export const getProfile = async (user: User): Promise<UserProfileData | null> => {
  try {
    const { data, error, status } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && status !== 406) throw error;
    if (!data) {
        // Return a default profile shell if none exists, this is for new users.
        return {
            id: user.id,
            full_name: user.email || '',
            title: '',
            summary: '',
            experience_years: null,
            skills: [],
            photo_url: null,
            job_goal: null,
            is_certified: false,
            assessment_score: null,
            updated_at: null,
            credly_url: null,
            holistic_analysis: null,
            company_name: null,
            company_website: null,
            company_description: null,
            company_logo_url: null,
            company_size: null,
            industry: null,
        };
    }

    return coalesceProfile(data);
  } catch (error: any) {
    if (error?.code === TABLE_NOT_FOUND_ERROR_CODE) {
      throw new Error("TABLE_NOT_FOUND");
    }
    if (error?.code === UNDEFINED_COLUMN_ERROR_CODE) {
      console.error("A column is missing from the 'profiles' table.", error.message);
      const columnNameMatch = error.message.match(/column "(.+?)" of relation "profiles" does not exist/);
      const columnName = columnNameMatch ? `(${columnNameMatch[1]})` : '';
      throw new Error(`أحد الأعمدة ${columnName} مفقود في جدول 'profiles'. يرجى تشغيل نص SQL لتحديث قاعدة البيانات.`);
    }
    throw error;
  }
};

export const getCertifiedCandidates = async (): Promise<UserProfileData[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_certified', true)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        
        return (data || []).map(p => coalesceProfile(p as ProfileRow));

    } catch (error: any) {
        if (error?.code === TABLE_NOT_FOUND_ERROR_CODE) {
           console.warn("getCertifiedCandidates: 'profiles' table not found. Returning empty array.");
           return [];
        }
         if (error?.code === UNDEFINED_COLUMN_ERROR_CODE) {
            console.error("A column is missing from the 'profiles' table.", error.message);
            throw new Error(`أحد الأعمدة المطلوبة مفقود في جدول 'profiles'. يرجى تشغيل نص SQL لتحديث قاعدة البيانات.`);
        }
        throw error;
    }
};


export const upsertProfile = async (profile: Partial<UserProfileData> & { id: string }): Promise<UserProfileData> => {
  try {
    const profileDataToSave = {
        ...profile,
        updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileDataToSave)
      .select('*')
      .single();
    
    if (error) throw error;
    if (!data) throw new Error("Upsert operation did not return data.");

    return coalesceProfile(data);
  } catch (error: any) {
     if (error?.code === TABLE_NOT_FOUND_ERROR_CODE) {
      throw new Error("TABLE_NOT_FOUND");
    }
    console.error("Error in upsertProfile: ", error)
    throw error;
  }
};

export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

    if (uploadError) {
        console.error("Error uploading avatar:", uploadError);
        throw new Error("فشل رفع الصورة. يرجى المحاولة مرة أخرى.");
    }

    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    if (!data.publicUrl) {
        throw new Error("لم يتم العثور على رابط الصورة بعد الرفع.");
    }
    
    return data.publicUrl;
};

export const uploadCompanyLogo = async (userId: string, file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

    if (uploadError) {
        console.error("Error uploading company logo:", uploadError);
        throw new Error("فشل رفع شعار الشركة. يرجى المحاولة مرة أخرى.");
    }

    const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

    if (!data.publicUrl) {
        throw new Error("لم يتم العثور على رابط الشعار بعد الرفع.");
    }
    
    return data.publicUrl;
};