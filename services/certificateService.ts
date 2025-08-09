

import { supabase, type Database } from './supabaseClient';
import type { Certificate } from '../types';

const TABLE_NOT_FOUND_ERROR_CODE = '42P01';
type CertificateRow = Database['public']['Tables']['certificates']['Row'];
type CertificateInsert = Database['public']['Tables']['certificates']['Insert'];

export const getCertificates = async (userId: string): Promise<Certificate[]> => {
    try {
        const { data, error } = await supabase
            .from('certificates')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error: any) {
        if (error?.code === TABLE_NOT_FOUND_ERROR_CODE) {
            console.warn("getCertificates: 'certificates' table not found. Returning empty array.");
            return [];
        }
        throw error;
    }
};

export const addCertificate = async (
    userId: string, 
    certData: Omit<Certificate, 'id' | 'user_id' | 'created_at' | 'file_url'>,
    file?: File | null
): Promise<Certificate> => {
    let fileUrl: string | null = null;
    
    if (file) {
        const fileExtension = file.name.split('.').pop();
        const filePath = `${userId}/${Date.now()}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
            .from('certificates')
            .upload(filePath, file);
        
        if (uploadError) {
            console.error("Error uploading certificate file:", uploadError);
            throw new Error("فشل رفع ملف الشهادة.");
        }

        const { data: urlData } = supabase.storage
            .from('certificates')
            .getPublicUrl(filePath);
        
        fileUrl = urlData.publicUrl;
    }

    const certToInsert: CertificateInsert = {
        user_id: userId,
        name: certData.name,
        issuing_organization: certData.issuing_organization,
        issue_date: certData.issue_date,
        description: certData.description,
        file_url: fileUrl,
    };

    const { data, error } = await supabase
        .from('certificates')
        .insert(certToInsert)
        .select()
        .single();
    
    if (error) {
        console.error("Error adding certificate record:", error);
        throw new Error("فشل حفظ بيانات الشهادة.");
    }
    
    if (!data) {
        throw new Error("Failed to create certificate record.");
    }

    return data;
};

export const deleteCertificate = async (certificateId: string, fileUrl?: string | null): Promise<void> => {
    // First, delete the file from storage if it exists
    if (fileUrl) {
        try {
            const fileName = fileUrl.split('/').pop();
            const userId = fileUrl.split('/')[fileUrl.split('/').length - 2];
            if (fileName && userId) {
                 await supabase.storage.from('certificates').remove([`${userId}/${fileName}`]);
            }
        } catch (storageError) {
            console.error("Could not delete certificate file from storage, but proceeding to delete record:", storageError);
        }
    }

    // Then, delete the record from the database
    const { error } = await supabase
        .from('certificates')
        .delete()
        .eq('id', certificateId);
    
    if (error) {
        console.error("Error deleting certificate record:", error);
        throw new Error("فشل حذف الشهادة.");
    }
};