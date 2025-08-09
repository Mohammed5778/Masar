import React, { useState } from 'react';

const sqlScript = `-- SQL SETUP SCRIPT FOR MASAR APP
-- Run this entire script in your Supabase SQL Editor to set up the database.
-- Version 2.0: Adds 'profiles' INSERT policy and all storage policies.

-- Step 1: Add company-specific columns to the 'profiles' table.
-- This makes the script restart-friendly by checking if columns exist first.
DO $$
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_name') THEN
    ALTER TABLE public.profiles ADD COLUMN company_name TEXT;
  END IF;
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_website') THEN
    ALTER TABLE public.profiles ADD COLUMN company_website TEXT;
  END IF;
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_description') THEN
    ALTER TABLE public.profiles ADD COLUMN company_description TEXT;
  END IF;
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_logo_url') THEN
    ALTER TABLE public.profiles ADD COLUMN company_logo_url TEXT;
  END IF;
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_size') THEN
    ALTER TABLE public.profiles ADD COLUMN company_size TEXT;
  END IF;
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='industry') THEN
    ALTER TABLE public.profiles ADD COLUMN industry TEXT;
  END IF;
END $$;


-- Step 2: Create the 'jobs' table for company job postings.
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Enable Row Level Security (RLS) on the 'jobs' table.
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Step 4: Create Policies for the 'jobs' table.
-- This ensures the script is safe to re-run by dropping old policies first.
DROP POLICY IF EXISTS "Allow authenticated users to read jobs" ON public.jobs;
CREATE POLICY "Allow authenticated users to read jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow recruiters to insert their own jobs" ON public.jobs;
CREATE POLICY "Allow recruiters to insert their own jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = company_id AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'recruiter'
);

DROP POLICY IF EXISTS "Allow recruiters to update their own jobs" ON public.jobs;
CREATE POLICY "Allow recruiters to update their own jobs"
ON public.jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = company_id)
WITH CHECK (auth.uid() = company_id);

DROP POLICY IF EXISTS "Allow recruiters to delete their own jobs" ON public.jobs;
CREATE POLICY "Allow recruiters to delete their own jobs"
ON public.jobs
FOR DELETE
TO authenticated
USING (auth.uid() = company_id);


-- Step 5: Enable RLS and create Policies for the 'profiles' table
-- This is critical for security and for proper data visibility across the app.
-- We drop old policies to ensure a clean slate.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read and update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to access their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to see certified candidates" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to SELECT their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to SELECT certified candidates" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to UPDATE their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to INSERT their own profile" ON public.profiles;


-- More granular policies are safer.
-- 1. Users can SELECT their own profile.
CREATE POLICY "Allow users to SELECT their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Any authenticated user can SELECT any profile that is certified.
CREATE POLICY "Allow authenticated users to SELECT certified candidates"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_certified = true);

-- 3. Users can only UPDATE their own profile.
CREATE POLICY "Allow users to UPDATE their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Users can INSERT their own profile.
CREATE POLICY "Allow users to INSERT their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);


-- Step 6: Add a comment to explain the table's purpose.
COMMENT ON TABLE public.jobs IS 'Stores job postings created by companies (recruiters).';

-- Step 7: Create Storage Buckets for images and files.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, '{"image/jpeg","image/png","image/gif"}'),
  ('company-logos', 'company-logos', true, 5242880, '{"image/jpeg","image/png","image/gif","image/svg+xml"}'),
  ('project-thumbnails', 'project-thumbnails', true, 5242880, '{"image/jpeg","image/png","image/gif"}'),
  ('certificates', 'certificates', true, 10485760, '{"application/pdf", "image/jpeg", "image/png"}')
ON CONFLICT (id) DO NOTHING;


-- Step 8: Create Storage RLS Policies for security.
-- Clean up old policies before creating new ones.
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "User can CUD own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for company-logos" ON storage.objects;
DROP POLICY IF EXISTS "Recruiter can CUD own logo" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for project-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "User can CUD own project thumbnail" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for certificates" ON storage.objects;
DROP POLICY IF EXISTS "User can CUD own certificate" ON storage.objects;

-- Policies for 'avatars' bucket
CREATE POLICY "Public read access for avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "User can CUD own avatar" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid) WITH CHECK (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Policies for 'company-logos' bucket
CREATE POLICY "Public read access for company-logos" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
CREATE POLICY "Recruiter can CUD own logo" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'company-logos' AND auth.uid() = (storage.foldername(name))[1]::uuid AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'recruiter') WITH CHECK (bucket_id = 'company-logos' AND auth.uid() = (storage.foldername(name))[1]::uuid AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'recruiter');

-- Policies for 'project-thumbnails' bucket
CREATE POLICY "Public read access for project-thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'project-thumbnails');
CREATE POLICY "User can CUD own project thumbnail" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'project-thumbnails' AND auth.uid() = (storage.foldername(name))[1]::uuid) WITH CHECK (bucket_id = 'project-thumbnails' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Policies for 'certificates' bucket
CREATE POLICY "Public read access for certificates" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
CREATE POLICY "User can CUD own certificate" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'certificates' AND auth.uid() = (storage.foldername(name))[1]::uuid) WITH CHECK (bucket_id = 'certificates' AND auth.uid() = (storage.foldername(name))[1]::uuid);
`;

const SchemaErrorPage: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
    const [copySuccess, setCopySuccess] = useState('');

    const handleCopy = () => {
        navigator.clipboard.writeText(sqlScript).then(() => {
            setCopySuccess('تم نسخ النص بنجاح!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('فشل النسخ.');
        });
    };

    return (
        <div className="min-h-screen bg-primary-dark flex flex-col justify-center items-center text-center p-4 font-cairo">
            <div className="bg-primary-surface p-8 rounded-2xl shadow-2xl max-w-4xl w-full">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-800/50 text-red-400 rounded-full flex items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h1 className="text-2xl font-bold text-red-400">خطأ في الاتصال بقاعدة البيانات</h1>
                <p className="text-text-secondary mt-2 max-w-2xl mx-auto">
                    يبدو أن بنية قاعدة البيانات لديك غير محدّثة. يحتاج التطبيق إلى جداول وأعمدة جديدة لتشغيل أحدث الميزات.
                </p>

                <div className="my-6 text-left">
                    <h2 className="text-lg font-bold text-text-primary mb-2">الحل: تحديث قاعدة البيانات</h2>
                    <ol className="list-decimal list-inside text-text-secondary space-y-1">
                        <li>انتقل إلى مشروعك في <a href="https://app.supabase.com/" target="_blank" rel="noopener noreferrer" className="text-accent-gold underline">Supabase</a>.</li>
                        <li>من القائمة الجانبية، اختر "SQL Editor".</li>
                        <li>اضغط على زر "Copy Script" أدناه لنسخ نص الإعداد.</li>
                        <li>الصق النص بالكامل في محرر SQL وقم بتشغيله.</li>
                        <li>بعد نجاح التنفيذ، عد إلى هنا واضغط على "إعادة محاولة الاتصال".</li>
                    </ol>
                </div>
                
                <div className="bg-primary-dark p-4 rounded-lg text-left relative">
                     <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 bg-accent-gold text-primary-dark font-bold py-1 px-3 rounded-md text-sm hover:bg-yellow-500"
                    >
                        {copySuccess || 'نسخ النص'}
                    </button>
                    <pre className="text-gray-300 text-xs whitespace-pre-wrap max-h-48 overflow-auto scrollbar-thin scrollbar-thumb-accent-gold scrollbar-track-primary-dark">
                        <code>
                            {sqlScript}
                        </code>
                    </pre>
                </div>
               
                <button 
                    onClick={onRetry} 
                    className="mt-8 bg-accent-gold text-primary-dark font-bold py-3 px-8 rounded-lg hover:bg-yellow-500 text-lg"
                >
                    إعادة محاولة الاتصال
                </button>
            </div>
        </div>
    );
};

export default SchemaErrorPage;