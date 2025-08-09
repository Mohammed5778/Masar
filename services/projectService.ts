

import { supabase, type Database } from './supabaseClient';
import type { Project } from '../types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

export const getProjects = async (userId: string): Promise<Project[]> => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        const projectRows = data || [];
        return projectRows.map(p => ({
            ...p,
            technologies: p.technologies || []
        }));
    } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
    }
};

export const uploadProjectThumbnail = async (userId: string, file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
        .from('project-thumbnails')
        .upload(filePath, file);

    if (uploadError) {
        console.error("Error uploading project thumbnail:", uploadError);
        throw new Error("فشل رفع صورة المشروع.");
    }

    const { data } = supabase.storage
        .from('project-thumbnails')
        .getPublicUrl(filePath);

    if (!data.publicUrl) {
        throw new Error("لم يتم العثور على رابط الصورة بعد الرفع.");
    }
    
    return data.publicUrl;
};

export const addProject = async (
    userId: string, 
    projectData: Omit<Project, 'id' | 'user_id' | 'created_at' | 'image_url'>,
    file?: File | null
): Promise<Project> => {
    let imageUrl: string | null = null;
    
    if (file) {
        imageUrl = await uploadProjectThumbnail(userId, file);
    }

    const projectToInsert: ProjectInsert = {
        user_id: userId,
        title: projectData.title,
        description: projectData.description,
        technologies: projectData.technologies,
        project_url: projectData.project_url,
        image_url: imageUrl,
    };

    const { data, error } = await supabase
        .from('projects')
        .insert(projectToInsert)
        .select()
        .single();
    
    if (error) {
        console.error("Error adding project:", error);
        throw new Error("فشل حفظ بيانات المشروع.");
    }
    
    if (!data) {
        throw new Error("Failed to create project record.");
    }
    
    const projectRow = data;
    return { ...projectRow, technologies: projectRow.technologies || [] };
};

export const deleteProject = async (projectId: string, imageUrl?: string | null): Promise<void> => {
    // First, delete the file from storage if it exists
    if (imageUrl) {
        try {
            const path = new URL(imageUrl).pathname.split('/project-thumbnails/')[1];
            if (path) {
                 await supabase.storage.from('project-thumbnails').remove([path]);
            }
        } catch (storageError) {
            console.error("Could not delete project thumbnail from storage, but proceeding to delete record:", storageError);
        }
    }

    // Then, delete the record from the database
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
    
    if (error) {
        console.error("Error deleting project record:", error);
        throw new Error("فشل حذف المشروع.");
    }
};