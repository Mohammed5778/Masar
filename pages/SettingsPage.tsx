import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { upsertProfile, uploadProfilePicture, getProfile } from '../services/profileService';
import { getCertificates, addCertificate, deleteCertificate } from '../services/certificateService';
import { getSocialLinks, addOrUpdateLink, deleteLink } from '../services/socialLinkService';
import { getProjects, addProject, deleteProject } from '../services/projectService';
import { getMatchingJobs } from '../services/jobService';
import type { Session } from '@supabase/supabase-js';
import type { UserProfileData, Certificate, SocialLink, Project, SocialPlatform, Job } from '../types';

interface SettingsPageProps {
  session: Session;
  profile: UserProfileData;
  onProfileUpdate: (profile: UserProfileData) => void;
  onNavigateBack: () => void;
}

type SettingsSection = 'profile' | 'links' | 'projects' | 'certificates' | 'matching_jobs';

// --- Reusable Components ---
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`input-style ${props.className || ''}`} />
);
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className={`input-style ${props.className || ''}`} />
);
const Button: React.FC<{onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; type?: 'button' | 'submit'; children: React.ReactNode; disabled?: boolean; variant?: 'primary' | 'secondary' | 'danger'}> = ({ onClick, type = 'button', children, disabled, variant = 'primary'}) => {
    const base = "font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base";
    const styles = {
        primary: "bg-accent-gold text-primary-dark hover:bg-yellow-500",
        secondary: "bg-primary-surface text-text-primary hover:bg-opacity-80",
        danger: "bg-red-600 text-white hover:bg-red-700"
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


const SettingsPage: React.FC<SettingsPageProps> = ({ session, profile: initialProfile, onProfileUpdate, onNavigateBack }) => {
    const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isFindingJobs, setIsFindingJobs] = useState(false);
    const [findJobsMessage, setFindJobsMessage] = useState(''); // Can be success or error message
    
    const handleFindMatchingJobs = async () => {
        setIsFindingJobs(true);
        setFindJobsMessage('');

        try {
            const userId = session.user.id;
            const [profileData, certificates, projects, socialLinks] = await Promise.all([
                getProfile(session.user),
                getCertificates(userId),
                getProjects(userId),
                getSocialLinks(userId),
            ]);

            if (!profileData) {
                throw new Error("لم نتمكن من العثور على ملفك الشخصي لإجراء المطابقة.");
            }

            const linkedinLink = socialLinks.find(link => link.platform === 'linkedin');

            const payload = {
                id: userId,
                role: session.user.user_metadata.role,
                linkedin_url: linkedinLink ? linkedinLink.url : null,
                cv_data: {
                    profile: profileData,
                    certificates,
                    projects,
                },
                assessments: {
                    assessment_score: profileData.assessment_score,
                },
            };

            const webhookUrl = 'https://mabda724mm.app.n8n.cloud/webhook/139ce48c-51ed-4bcf-b493-4e58ce0a6e55';
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('فشل إرسال طلب المطابقة. يرجى المحاولة مرة أخرى.');
            }

            setFindJobsMessage('تم إرسال طلبك بنجاح! يمكنك الآن تفقد قسم "الوظائف المطابقة" وتحديثه لرؤية النتائج.');
            setTimeout(() => setFindJobsMessage(''), 5000);

        } catch (error: any) {
            console.error("Error finding matching jobs:", error);
            setFindJobsMessage(`حدث خطأ: ${error.message}`);
        } finally {
            setIsFindingJobs(false);
        }
    };


    const renderActiveSection = () => {
        switch (activeSection) {
            case 'profile':
                return <ProfileSectionManager session={session} initialProfile={initialProfile} onProfileUpdate={onProfileUpdate} />;
            case 'links':
                return <SocialLinksManager userId={session.user.id} />;
            case 'projects':
                return <ProjectManager userId={session.user.id} />;
            case 'certificates':
                return <CertificateManager userId={session.user.id} />;
            case 'matching_jobs':
                return <MatchingJobsManager userId={session.user.id} />;
            default:
                return null;
        }
    };
    
    const Sidebar = () => {
        const navItems: {id: SettingsSection, label: string, icon: React.ReactNode}[] = [
            { id: 'profile', label: 'الملف الشخصي الأساسي', icon: <UserIcon/> },
            { id: 'links', label: 'الروابط الاحترافية', icon: <LinkIcon/> },
            { id: 'projects', label: 'معرض المشاريع', icon: <BriefcaseIcon/> },
            { id: 'certificates', label: 'الشهادات', icon: <CertificateIcon/> },
            { id: 'matching_jobs', label: 'الوظائف المطابقة', icon: <JobsIcon/> },
        ];
        
        return (
             <aside className={`bg-primary-surface rounded-xl p-4 transition-all duration-300 ${isSidebarOpen ? 'block' : 'hidden'} md:block md:w-64 flex-shrink-0`}>
                <nav className="flex flex-col gap-2">
                    {navItems.map(item => (
                         <button
                            key={item.id}
                            onClick={() => { setActiveSection(item.id); setIsSidebarOpen(false); }}
                            className={`flex items-center gap-3 w-full text-right p-3 rounded-lg transition-colors ${activeSection === item.id ? 'bg-accent-gold text-primary-dark font-bold' : 'text-text-secondary hover:bg-primary-dark hover:text-text-primary'}`}
                        >
                           {item.icon}
                           <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 py-10">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-3xl font-bold text-text-primary">إعدادات جواز السفر</h2>
                <div className="flex items-center gap-4">
                     <button className="md:hidden p-2 bg-primary-surface rounded-lg" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <MenuIcon/>
                    </button>
                     {initialProfile.is_certified && (
                         <Button
                            onClick={handleFindMatchingJobs}
                            disabled={isFindingJobs}
                            variant="primary"
                        >
                            {isFindingJobs ? 'جاري البحث...' : 'البحث عن وظائف مطابقة'}
                        </Button>
                    )}
                    <Button onClick={onNavigateBack} variant="secondary">العودة للسوق</Button>
                </div>
            </div>
            
            {findJobsMessage && (
                 <div className={`p-3 rounded-lg text-center mb-6 ${findJobsMessage.startsWith('حدث خطأ') ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                    {findJobsMessage}
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-8 items-start">
               <Sidebar/>
               <main className="flex-grow w-full">
                   {renderActiveSection()}
               </main>
            </div>
        </div>
    );
};

// --- Section Components ---

const ProfileSectionManager: React.FC<{ session: Session, initialProfile: UserProfileData, onProfileUpdate: (p: UserProfileData) => void }> = ({ session, initialProfile, onProfileUpdate }) => {
    const [profile, setProfile] = useState(initialProfile);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const handleSave = async () => {
        setIsSubmitting(true);
        setError('');
        setSuccess('');
        try {
            const updatedProfile = await upsertProfile(profile);
            onProfileUpdate(updatedProfile);
            setSuccess("تم حفظ التغييرات بنجاح!");
            setTimeout(() => setSuccess(''), 3000);
        } catch (e: any) {
            setError(e.message || "فشل حفظ الملف الشخصي.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
         <div className="space-y-6">
            {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg text-center">{error}</div>}
            {success && <div className="bg-green-900/50 text-green-300 p-3 rounded-lg text-center">{success}</div>}
            
            <ProfilePhotoEditor profile={profile} onProfileUpdate={(p) => { setProfile(p); onProfileUpdate(p); }} userId={session.user.id}/>
            <BasicInfoManager profile={profile} setProfile={setProfile} onSave={handleSave} isSubmitting={isSubmitting} />
            <CredlyBadgeManager profile={profile} setProfile={setProfile} onSave={handleSave} />
        </div>
    );
}


// --- Sub-components for each settings section ---

const BasicInfoManager: React.FC<{profile: UserProfileData, setProfile: React.Dispatch<React.SetStateAction<UserProfileData>>, onSave: () => void, isSubmitting: boolean}> = ({ profile, setProfile, onSave, isSubmitting }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile(p => ({ ...p, [name]: value }));
    };
    const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(Boolean);
        setProfile(p => ({ ...p, skills: skillsArray }));
    };

    return (
        <SectionCard title="المعلومات الأساسية">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm text-text-secondary">الاسم الكامل</label><Input name="full_name" value={profile.full_name || ''} onChange={handleChange} /></div>
                <div><label className="text-sm text-text-secondary">المسمى الوظيفي</label><Input name="title" value={profile.title || ''} onChange={handleChange} /></div>
                <div><label className="text-sm text-text-secondary">سنوات الخبرة</label><Input type="number" name="experience_years" value={profile.experience_years || ''} onChange={handleChange} /></div>
                <div><label className="text-sm text-text-secondary">المهارات (افصل بفاصلة)</label><Input name="skills" value={profile.skills?.join(', ') || ''} onChange={handleSkillsChange} /></div>
                <div className="md:col-span-2"><label className="text-sm text-text-secondary">الملخص المهني</label><Textarea name="summary" value={profile.summary || ''} onChange={handleChange} rows={4} /></div>
            </div>
             <div className="mt-4 text-right">
                 <Button onClick={onSave} disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : 'حفظ المعلومات الأساسية'}</Button>
             </div>
        </SectionCard>
    );
};

const ProfilePhotoEditor: React.FC<{profile: UserProfileData, onProfileUpdate: (p: UserProfileData) => void, userId: string}> = ({ profile, onProfileUpdate, userId }) => {
    const [isUploading, setIsUploading] = useState(false);
    
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const photoUrl = await uploadProfilePicture(userId, file);
            const updatedProfile = await upsertProfile({ id: userId, photo_url: photoUrl });
            onProfileUpdate(updatedProfile);
        } catch (e) {
            console.error(e);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <SectionCard title="الصورة الشخصية">
            <div className="flex flex-col items-center gap-4">
                <img 
                    src={profile.photo_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23A8B2D1'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"} 
                    alt="Profile" 
                    className="w-40 h-40 rounded-full object-cover bg-primary-dark border-4 border-accent-gold" 
                />
                <label htmlFor="photo-upload-settings" className="w-full max-w-xs bg-accent-gold text-primary-dark font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors cursor-pointer text-center">
                    {isUploading ? 'جاري الرفع...' : 'تغيير الصورة'}
                </label>
                <input id="photo-upload-settings" type="file" accept="image/png, image/jpeg" onChange={handlePhotoUpload} className="hidden" disabled={isUploading} />
            </div>
        </SectionCard>
    );
}

const CredlyBadgeManager: React.FC<{profile: UserProfileData, setProfile: React.Dispatch<React.SetStateAction<UserProfileData>>, onSave: () => void}> = ({ profile, setProfile, onSave }) => (
    <SectionCard title="شارة Credly">
        <label className="text-sm text-text-secondary block mb-2">رابط ملف Credly العام</label>
        <Input 
            name="credly_url" 
            placeholder="https://www.credly.com/users/your-profile" 
            value={profile.credly_url || ''} 
            onChange={(e) => setProfile(p => ({ ...p, credly_url: e.target.value }))}
        />
        <div className="mt-4 text-right">
            <Button onClick={onSave}>حفظ رابط Credly</Button>
        </div>
    </SectionCard>
);

const CertificateManager: React.FC<{ userId: string }> = ({ userId }) => {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [newCert, setNewCert] = useState({ name: '', issuing_organization: '', issue_date: '', description: '' });
    const [file, setFile] = useState<File | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    
    useEffect(() => {
        getCertificates(userId).then(setCertificates);
    }, [userId]);

    const handleCertChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewCert(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null);
    
    const handleAddCert = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            const added = await addCertificate(userId, newCert, file);
            setCertificates(prev => [added, ...prev]);
            setNewCert({ name: '', issuing_organization: '', issue_date: '', description: '' });
            setFile(null);
            (e.target as HTMLFormElement).reset();
        } catch (e) { console.error(e); } finally { setIsAdding(false); }
    };

    const handleDelete = async (certId: string, fileUrl?: string | null) => {
        if (!window.confirm("هل أنت متأكد؟")) return;
        await deleteCertificate(certId, fileUrl);
        setCertificates(prev => prev.filter(c => c.id !== certId));
    };

    return (
        <SectionCard title="الشهادات الاحترافية">
            <form onSubmit={handleAddCert} className="space-y-4 mb-6">
                <h4 className="font-bold text-lg text-text-secondary">إضافة شهادة جديدة</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="name" placeholder="اسم الشهادة" value={newCert.name} onChange={handleCertChange} required />
                    <Input name="issuing_organization" placeholder="الجهة المانحة" value={newCert.issuing_organization} onChange={handleCertChange} required />
                 </div>
                 <Input type="date" name="issue_date" value={newCert.issue_date} onChange={handleCertChange} />
                 <Textarea name="description" placeholder="وصف (اختياري)" value={newCert.description} onChange={handleCertChange} rows={2} />
                 <div>
                    <label className="text-sm text-text-secondary block mb-2">إرفاق ملف (اختياري)</label>
                    <Input type="file" onChange={handleFileChange} />
                 </div>
                 <div className="text-right"><Button type="submit" disabled={isAdding}>{isAdding ? 'جاري...' : 'إضافة شهادة'}</Button></div>
            </form>
            <div className="space-y-4 border-t border-primary-dark pt-4">
                {certificates.map(cert => (
                    <div key={cert.id} className="bg-primary-dark p-3 rounded-lg flex justify-between items-center">
                        <div>
                            <h5 className="font-bold text-text-primary">{cert.name}</h5>
                            <p className="text-sm text-text-secondary">{cert.issuing_organization}</p>
                        </div>
                        <Button onClick={() => handleDelete(cert.id, cert.file_url)} variant="danger">حذف</Button>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
};

const SocialLinksManager: React.FC<{ userId: string }> = ({ userId }) => {
    const [links, setLinks] = useState<SocialLink[]>([]);
    const [newLink, setNewLink] = useState<{ platform: SocialPlatform, url: string }>({ platform: 'github', url: '' });
    const [isAdding, setIsAdding] = useState(false);

    const platformOptions: { value: SocialPlatform; label: string }[] = [
        { value: 'github', label: 'GitHub' }, { value: 'linkedin', label: 'LinkedIn' },
        { value: 'behance', label: 'Behance' }, { value: 'huggingface', label: 'Hugging Face' },
        { value: 'portfolio', label: 'Portfolio' }, { value: 'other', label: 'Other' },
    ];
    
    useEffect(() => {
        getSocialLinks(userId).then(setLinks);
    }, [userId]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            const added = await addOrUpdateLink(userId, newLink.platform, newLink.url);
            setLinks(prev => {
                const existing = prev.find(l => l.platform === added.platform);
                return existing ? prev.map(l => l.platform === added.platform ? added : l) : [added, ...prev];
            });
            setNewLink({ platform: 'github', url: '' });
        } catch(e) { console.error(e) } finally { setIsAdding(false); }
    };
    
    const handleDelete = async (linkId: string) => {
        await deleteLink(linkId);
        setLinks(prev => prev.filter(l => l.id !== linkId));
    };
    
    return (
        <SectionCard title="الروابط الاحترافية">
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-6">
                <select value={newLink.platform} onChange={e => setNewLink(p => ({...p, platform: e.target.value as SocialPlatform}))} className="input-style flex-shrink-0 sm:w-1/3">
                    {platformOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <Input type="url" placeholder="https://..." value={newLink.url} onChange={e => setNewLink(p => ({...p, url: e.target.value}))} required className="flex-grow" />
                <Button type="submit" disabled={isAdding}>{isAdding ? '...' : 'إضافة/تحديث'}</Button>
            </form>
            <div className="space-y-2">
                {links.map(link => (
                    <div key={link.id} className="bg-primary-dark p-3 rounded-lg flex justify-between items-center">
                       <div>
                            <span className="font-bold text-text-primary capitalize">{link.platform}</span>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary block truncate max-w-xs hover:underline">{link.url}</a>
                        </div>
                        <Button onClick={() => handleDelete(link.id)} variant="danger">حذف</Button>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
};

const ProjectManager: React.FC<{ userId: string }> = ({ userId }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [newProj, setNewProj] = useState({ title: '', description: '', technologies: '', project_url: '' });
    const [file, setFile] = useState<File | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        getProjects(userId).then(setProjects);
    }, [userId]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewProj(p => ({...p, [e.target.name]: e.target.value}));
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            const technologiesArray = newProj.technologies.split(',').map(t => t.trim()).filter(Boolean);
            const added = await addProject(userId, {...newProj, technologies: technologiesArray}, file);
            setProjects(p => [added, ...p]);
            setNewProj({ title: '', description: '', technologies: '', project_url: '' });
            setFile(null);
             (e.target as HTMLFormElement).reset();
        } catch(e) { console.error(e) } finally { setIsAdding(false); }
    };
    
    const handleDelete = async (proj: Project) => {
        if (!window.confirm("هل أنت متأكد؟")) return;
        await deleteProject(proj.id, proj.image_url);
        setProjects(p => p.filter(pr => pr.id !== proj.id));
    };

    return (
        <SectionCard title="معرض المشاريع">
            <form onSubmit={handleAdd} className="space-y-4 mb-6">
                <h4 className="font-bold text-lg text-text-secondary">إضافة مشروع جديد</h4>
                <Input name="title" placeholder="عنوان المشروع" value={newProj.title} onChange={handleChange} required />
                <Textarea name="description" placeholder="وصف المشروع" value={newProj.description} onChange={handleChange} rows={3} />
                <Input name="technologies" placeholder="التقنيات المستخدمة (افصل بفاصلة)" value={newProj.technologies} onChange={handleChange} />
                <Input type="url" name="project_url" placeholder="رابط المشروع (اختياري)" value={newProj.project_url} onChange={handleChange} />
                <div>
                    <label className="text-sm text-text-secondary block mb-2">صورة مصغرة للمشروع (اختياري)</label>
                    <Input type="file" accept="image/*" onChange={handleFileChange} />
                </div>
                <div className="text-right"><Button type="submit" disabled={isAdding}>{isAdding ? 'جاري...' : 'إضافة مشروع'}</Button></div>
            </form>
            <div className="space-y-4 border-t border-primary-dark pt-4">
                 {projects.map(proj => (
                    <div key={proj.id} className="bg-primary-dark p-3 rounded-lg flex justify-between items-center">
                       <div className="flex items-center gap-4">
                            <img src={proj.image_url || undefined} alt={proj.title} className="w-16 h-16 object-cover rounded-md bg-primary-dark"/>
                            <div>
                                <h5 className="font-bold text-text-primary">{proj.title}</h5>
                                <p className="text-sm text-text-secondary truncate max-w-xs">{proj.description}</p>
                            </div>
                       </div>
                        <Button onClick={() => handleDelete(proj)} variant="danger">حذف</Button>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
};

const MatchingJobsManager: React.FC<{ userId: string }> = ({ userId }) => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchJobs = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await getMatchingJobs(userId);
            setJobs(data);
        } catch (e: any) {
            setError("فشل في جلب الوظائف المطابقة.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);
    
    return (
        <SectionCard title="الوظائف المطابقة">
            <div className="flex justify-end mb-4">
                <Button onClick={fetchJobs} disabled={isLoading} variant="secondary">
                    {isLoading ? 'جاري التحديث...' : 'تحديث القائمة'}
                </Button>
            </div>

            {isLoading && <p className="text-center p-8 text-text-secondary">جاري تحميل الوظائف...</p>}
            {error && <p className="text-red-400 text-center p-8">{error}</p>}
            
            {!isLoading && !error && jobs.length === 0 && (
                <div className="text-center py-8 text-text-secondary bg-primary-dark rounded-lg">
                    <h4 className="text-xl font-bold text-text-primary">لا توجد وظائف مطابقة حالياً</h4>
                    <p className="mt-2 max-w-md mx-auto">اضغط على زر "البحث عن وظائف مطابقة" لبدء العملية، ثم قم بتحديث هذه القائمة لرؤية النتائج.</p>
                </div>
            )}
            
            {!isLoading && jobs.length > 0 && (
                 <div className="space-y-4">
                    {jobs.map(job => (
                        <div key={job.id} className="bg-primary-dark p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-l-4 border-accent-gold">
                            <div>
                                <h5 className="font-bold text-text-primary text-lg">{job.title}</h5>
                                <p className="text-sm text-text-secondary flex items-center gap-2 mt-1">
                                    <LocationIcon />
                                    {job.location || 'غير محدد'}
                                </p>
                            </div>
                            <a href={job.url} target="_blank" rel="noopener noreferrer" className="bg-accent-gold text-primary-dark font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors w-full sm:w-auto text-center shrink-0">
                                عرض التفاصيل
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </SectionCard>
    );
};

// --- Icons ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v1H6a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2V4a2 2 0 00-2-2zM8 5h4v1H8V5z" clipRule="evenodd" /></svg>;
const CertificateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2H10zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2H10z" clipRule="evenodd" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const JobsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v1H6a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2V4a2 2 0 00-2-2zM8 5h4v1H8V5z" clipRule="evenodd" /></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;

export default SettingsPage;
