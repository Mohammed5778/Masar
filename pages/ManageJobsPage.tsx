import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { JobPosting } from '../types';
import { getCompanyJobs, createJob, deleteJob } from '../services/jobService';

interface ManageJobsPageProps {
    session: Session;
    onNavigateBack: () => void;
}

const ManageJobsPage: React.FC<ManageJobsPageProps> = ({ session, onNavigateBack }) => {
    const [companyJobs, setCompanyJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            setLoading(true);
            getCompanyJobs(session.user.id)
                .then(setCompanyJobs)
                .catch(err => console.error("Failed to fetch company jobs:", err))
                .finally(() => setLoading(false));
        }
    }, [session.user.id]);

    const handleJobPosted = (newJob: JobPosting) => {
        setCompanyJobs(prev => [newJob, ...prev]);
        setIsPostJobModalOpen(false);
    };

    const handleJobDeleted = async (jobId: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه الوظيفة؟')) return;
        try {
            await deleteJob(jobId);
            setCompanyJobs(prev => prev.filter(job => job.id !== jobId));
        } catch (error) {
            console.error("Failed to delete job:", error);
            alert('فشل حذف الوظيفة. يرجى المحاولة مرة أخرى.');
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary">إدارة وظائفي</h1>
                <div className="flex gap-4">
                     <button onClick={() => setIsPostJobModalOpen(true)} className="bg-accent-gold text-primary-dark font-bold py-2 px-6 rounded-lg hover:bg-yellow-500 transition-colors">
                        نشر وظيفة جديدة
                    </button>
                    <button onClick={onNavigateBack} className="bg-primary-surface text-text-primary font-bold py-2 px-6 rounded-lg hover:bg-opacity-80 transition-colors">
                        العودة للوحة التحكم
                    </button>
                </div>
            </div>

            <div className="bg-primary-dark p-6 rounded-xl">
                 {loading ? <p className="text-center text-text-secondary">جاري تحميل الوظائف...</p> : 
                    companyJobs.length === 0 ? <p className="text-center text-text-secondary bg-primary-surface/30 p-8 rounded-lg">لم تقم بنشر أي وظائف بعد.</p> :
                    (
                        <div className="space-y-4">
                            {companyJobs.map(job => (
                                <div key={job.id} className="bg-primary-surface p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-text-primary font-bold text-xl">{job.title}</h3>
                                        <p className="text-text-secondary">{job.location}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {job.required_skills.map(skill => <span key={skill} className="bg-primary-dark text-text-secondary text-xs font-medium px-2 py-1 rounded-full">{skill}</span>)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 self-end sm:self-center">
                                        {/* <button className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 text-sm">تعديل</button> */}
                                        <button onClick={() => handleJobDeleted(job.id)} className="bg-red-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-900 text-sm">حذف</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                 }
            </div>

            {isPostJobModalOpen && session?.user?.id && (
                <PostJobModal 
                    onClose={() => setIsPostJobModalOpen(false)} 
                    onJobPosted={handleJobPosted}
                    companyId={session.user.id}
                />
            )}
        </div>
    );
};


// --- Post Job Modal Component ---
interface PostJobModalProps {
    onClose: () => void;
    onJobPosted: (newJob: JobPosting) => void;
    companyId: string;
}

const PostJobModal: React.FC<PostJobModalProps> = ({ onClose, onJobPosted, companyId }) => {
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [skills, setSkills] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !location) {
            setError('يرجى ملء جميع الحقول المطلوبة.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const newJob = await createJob({
                company_id: companyId,
                title,
                description,
                location,
                required_skills: skills.split(',').map(s => s.trim()).filter(Boolean),
            });
            onJobPosted(newJob);
        } catch (err: any) {
            setError(err.message || 'فشل نشر الوظيفة.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-primary-dark/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="modal-glass rounded-2xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-text-primary mb-4">نشر وظيفة جديدة</h2>
                    {error && <p className="text-red-400 bg-red-900/30 p-3 rounded-lg">{error}</p>}
                    <div>
                        <label htmlFor="title" className="block text-text-secondary mb-1">المسمى الوظيفي</label>
                        <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required className="input-style" />
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-text-secondary mb-1">الموقع</label>
                        <input id="location" type="text" value={location} onChange={e => setLocation(e.target.value)} required className="input-style" placeholder="مثال: الرياض، السعودية أو (عن بعد)"/>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-text-secondary mb-1">الوصف الوظيفي</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required rows={6} className="input-style" />
                    </div>
                    <div>
                        <label htmlFor="skills" className="block text-text-secondary mb-1">المهارات المطلوبة (افصل بينها بفاصلة)</label>
                        <input id="skills" type="text" value={skills} onChange={e => setSkills(e.target.value)} className="input-style" placeholder="React, Node.js, ..." />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-primary-surface text-text-primary font-bold py-2 px-6 rounded-lg hover:bg-opacity-80">إلغاء</button>
                        <button type="submit" disabled={isSubmitting} className="bg-accent-gold text-primary-dark font-bold py-2 px-6 rounded-lg hover:bg-yellow-500 disabled:opacity-50">
                            {isSubmitting ? 'جاري النشر...' : 'نشر الوظيفة'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default ManageJobsPage;