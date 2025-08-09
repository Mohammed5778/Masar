
import React, { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { upsertProfile, uploadCompanyLogo } from '../services/profileService';
import type { UserProfileData } from '../types';

interface CompanySettingsPageProps {
  session: Session;
  profile: UserProfileData;
  onProfileUpdate: (profile: UserProfileData) => void;
  onNavigateBack: () => void;
}

// --- Reusable Components ---
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`input-style ${props.className || ''}`} />
);
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className={`input-style ${props.className || ''}`} />
);
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...props} className={`input-style ${props.className || ''}`} />
);
const Button: React.FC<{onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; type?: 'button' | 'submit'; children: React.ReactNode; disabled?: boolean; variant?: 'primary' | 'secondary'}> = ({ onClick, type = 'button', children, disabled, variant = 'primary'}) => {
    const base = "font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base";
    const styles = {
        primary: "bg-accent-gold text-primary-dark hover:bg-yellow-500",
        secondary: "bg-primary-surface text-text-primary hover:bg-opacity-80",
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
            {children}
        </button>
    );
};
const SectionCard: React.FC<{title: string; children: React.ReactNode; className?: string}> = ({ title, children, className = '' }) => (
    <div className={`bg-primary-surface p-6 rounded-xl shadow-lg ${className}`}>
        <h3 className="text-xl font-bold text-text-primary mb-4 border-b border-primary-dark pb-2">{title}</h3>
        {children}
    </div>
);


const CompanySettingsPage: React.FC<CompanySettingsPageProps> = ({ session, profile: initialProfile, onProfileUpdate, onNavigateBack }) => {
    const [profile, setProfile] = useState(initialProfile);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(p => ({ ...p, [name]: value }));
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        setError('');
        setSuccess('');
        try {
            const logoUrl = await uploadCompanyLogo(session.user.id, file);
            // Save immediately after upload
            await handleSave({ company_logo_url: logoUrl }); 
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleSave = async (extraData: Partial<UserProfileData> = {}) => {
        setIsSubmitting(true);
        setError('');
        setSuccess('');
        try {
            const dataToSave = { ...profile, ...extraData, id: session.user.id };
            const updatedProfile = await upsertProfile(dataToSave);
            setProfile(updatedProfile); // Update local state with the saved data
            onProfileUpdate(updatedProfile); // Update parent state
            setSuccess("تم حفظ التغييرات بنجاح!");
            setTimeout(() => setSuccess(''), 3000);
        } catch (e: any) {
            setError(e.message || "فشل حفظ الملف الشخصي.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const companySizeOptions = [
        '1-10 موظفين', '11-50 موظف', '51-200 موظف', '201-500 موظف',
        '501-1000 موظف', '1001-5000 موظف', '5001+ موظف'
    ];
    
    const defaultLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23172A46'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z'/%3E%3C/svg%3E";


    return (
        <div className="container mx-auto px-4 sm:px-6 py-10">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-3xl font-bold text-text-primary">إعدادات الشركة</h2>
                <Button onClick={onNavigateBack} variant="secondary">العودة للوحة التحكم</Button>
            </div>
            
            {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg text-center mb-4">{error}</div>}
            {success && <div className="bg-green-900/50 text-green-300 p-3 rounded-lg text-center mb-4">{success}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                    <SectionCard title="شعار الشركة">
                        <div className="flex flex-col items-center gap-4">
                            <img 
                                src={profile.company_logo_url || defaultLogo} 
                                alt="Company Logo" 
                                className="w-40 h-40 rounded-full object-contain bg-primary-dark p-2 border-4 border-accent-gold" 
                            />
                            <label htmlFor="logo-upload" className="w-full bg-accent-gold text-primary-dark font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors cursor-pointer text-center">
                                {isUploading ? 'جاري الرفع...' : 'تغيير الشعار'}
                            </label>
                            <input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoUpload} className="hidden" disabled={isUploading} />
                        </div>
                    </SectionCard>
                </div>

                <div className="lg:col-span-2">
                    <SectionCard title="معلومات الشركة">
                        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-text-secondary block mb-1">اسم الشركة</label>
                                    <Input name="company_name" value={profile.company_name || ''} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label className="text-sm text-text-secondary block mb-1">المجال</label>
                                    <Input name="industry" placeholder="مثال: تكنولوجيا المعلومات" value={profile.industry || ''} onChange={handleChange} />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-text-secondary block mb-1">الموقع الإلكتروني</label>
                                <Input type="url" name="company_website" placeholder="https://example.com" value={profile.company_website || ''} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="text-sm text-text-secondary block mb-1">حجم الشركة</label>
                                <Select name="company_size" value={profile.company_size || ''} onChange={handleChange}>
                                    <option value="">-- اختر الحجم --</option>
                                    {companySizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm text-text-secondary block mb-1">وصف الشركة</label>
                                <Textarea name="company_description" value={profile.company_description || ''} onChange={handleChange} rows={5} placeholder="نبذة تعريفية عن شركتك وأهدافها..." />
                            </div>
                            <div className="text-right pt-2">
                                <Button type="submit" disabled={isSubmitting || isUploading}>
                                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                </Button>
                            </div>
                        </form>
                    </SectionCard>
                </div>
            </div>
        </div>
    );
};

export default CompanySettingsPage;
