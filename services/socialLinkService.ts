

import { supabase, type Database } from './supabaseClient';
import type { SocialLink, SocialPlatform } from '../types';

type SocialLinkRow = Database['public']['Tables']['social_links']['Row'];
type SocialLinkInsert = Database['public']['Tables']['social_links']['Insert'];

export const getSocialLinks = async (userId: string): Promise<SocialLink[]> => {
    try {
        const { data, error } = await supabase
            .from('social_links')
            .select('*')
            .eq('user_id', userId);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching social links:", error);
        return [];
    }
};

export const addOrUpdateLink = async (userId: string, platform: SocialPlatform, url: string): Promise<SocialLink> => {
    const linkToUpsert: SocialLinkInsert = {
        user_id: userId,
        platform,
        url,
    };

    const { data, error } = await supabase
        .from('social_links')
        .upsert(linkToUpsert, { onConflict: 'user_id, platform' })
        .select()
        .single();
    
    if (error) {
        console.error("Error upserting social link:", error);
        throw new Error("فشل إضافة أو تحديث الرابط.");
    }
    if (!data) {
        throw new Error("Upsert operation did not return data.");
    }

    return data;
};

export const deleteLink = async (linkId: string): Promise<void> => {
    const { error } = await supabase
        .from('social_links')
        .delete()
        .eq('id', linkId);
    
    if (error) {
        console.error("Error deleting social link:", error);
        throw new Error("فشل حذف الرابط.");
    }
};