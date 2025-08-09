
import React, { useState, useEffect, useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getCompanyJobs } from '../services/jobService';
import { getCertifiedCandidates } from '../services/profileService';
import { suggestCandidatesForRecruiter } from '../services/geminiService';
import type { JobPosting, UserProfileData, AISuggestion } from '../types';
import TalentCard from '../components/TalentCard';
import CareerPassportModal from '../components/CareerPassportModal';


interface RecruiterDashboardProps {
    session: Session;
    onNavigateToMarketplace: () => void;
    onNavigateToManageJobs: () => void;
}

type SuggestedCandidateWithProfile = UserProfileData & { justification: string };

const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ session, onNavigateToMarketplace, onNavigateToManageJobs }) => {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [candidates, setCandidates] = useState<UserProfileData[]>([]);
    const [suggestedCandidates, setSuggestedCandidates] = useState<SuggestedCandidateWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState('');
    const [aiError, setAiError] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState<UserProfileData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');
                const [companyJobs, certifiedCandidates] = await Promise.all([
                    getCompanyJobs(session.user.id),
                    getCertifiedCandidates()
                ]);
                setJobs(companyJobs);
                setCandidates(certifiedCandidates);
            } catch (err: any) {
                console.error("Failed to load recruiter dashboard data:", err);
                setError(err.message || 'فشل في تحميل بيانات لوحة التحكم. يرجى تحديث الصفحة.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [session.user.id]);
    
    const handleGetAiSuggestions = async () => {
        if (aiLoading) return;
        setAiLoading(true);
        setAiError('');
        try {
            const suggestions = await suggestCandidatesForRecruiter(jobs, candidates);
            const suggestionsWithProfiles = suggestions
                .map((suggestion: AISuggestion) => {
                    const candidateProfile = candidates.find(c => c.id === suggestion.candidate_id);
                    if (!candidateProfile) return null;
                    return { ...candidateProfile, justification: suggestion.justification };
                })
                .filter((c): c is SuggestedCandidateWithProfile => c !== null);
            setSuggestedCandidates(suggestionsWithProfiles);
        } catch (err: any) {
            setAiError(err.message || "فشل الحصول على اقتراحات. يرجى المحاولة مرة أخرى.");
        } finally {
            setAiLoading(false);
        }
    };
    
    // Automatically fetch AI suggestions if jobs and candidates are loaded
    useEffect(() => {
        if (jobs.length > 0 && candidates.length > 0) {
            handleGetAiSuggestions();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobs, candidates]);

    const stats = useMemo(() => [
        { title: 'الوظائف النشطة', value: jobs.length, icon: <BriefcaseIcon /> },
        { title: 'إجمالي المرشحين', value: candidates.length, icon: <UsersIcon /> },
        { title: 'مقابلات مجدولة', value: '0', icon: <CalendarIcon /> },
    ], [jobs, candidates]);

    if (loading) {
        return (
            <div className="min-h-screen bg-primary-dark flex flex-col justify-center items-center gap-4">
                <div className="w-16 h-16 border-4 border-t-accent-gold border-primary-surface rounded-full animate-spin"></div>
                <div className="text-text-primary text-2xl font-cairo">جاري تحميل لوحة التحكم...</div>
            </div>
        );
    }

    if (error) {
         return <div className="text-center p-10 text-red-400 bg-red-900/20 rounded-lg container mx-auto">{error}</div>;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-3xl font-bold text-text-primary mb-2">مرحباً بك في لوحة تحكم <span className="text-accent-gold">مسار</span></h1>
            <p className="text-text-secondary mb-8">هنا يمكنك إدارة وظائفك واكتشاف أفضل المواهب لمنظمتك.</p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map(stat => (
                    <div key={stat.title} className="bg-primary-surface p-6 rounded-xl flex items-center gap-6 shadow-lg">
                        <div className="bg-primary-dark p-4 rounded-full">{stat.icon}</div>
                        <div>
                            <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
                            <p className="text-text-secondary">{stat.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Suggestions Section */}
            <div className="bg-primary-dark p-6 rounded-xl mb-8">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold text-text-primary">مرشحون مقترحون لك بالذكاء الاصطناعي</h2>
                    <button onClick={handleGetAiSuggestions} disabled={aiLoading || jobs.length === 0} className="bg-accent-gold text-primary-dark font-bold py-2 px-6 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {aiLoading ? 'جاري التحليل...' : 'تحديث الاقتراحات'}
                    </button>
                </div>
                {aiError && <p className="text-red-400 text-center">{aiError}</p>}
                {!aiLoading && !aiError && suggestedCandidates.length === 0 && (
                    <p className="text-center text-text-secondary py-8">
                        {jobs.length === 0 ? "لاقتراح مرشحين، يرجى إضافة وظيفة واحدة على الأقل." : "لا توجد اقتراحات حالياً. حاول تحديث القائمة."}
                    </p>
                )}
                 {suggestedCandidates.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {suggestedCandidates.map(c => (
                            <div key={c.id} className="bg-primary-surface/50 rounded-lg p-4 flex flex-col">
                                <TalentCard candidate={c} onViewPassport={setSelectedCandidate} />
                                <div className="mt-2 p-3 bg-primary-dark rounded-md">
                                    <p className="text-sm text-text-secondary"><strong className="text-accent-gold">لماذا هو مناسب؟</strong> {c.justification}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions & Recent Jobs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-primary-surface p-6 rounded-xl">
                        <h3 className="text-xl font-bold text-text-primary mb-4">إجراءات سريعة</h3>
                        <div className="flex flex-col gap-4">
                            <button onClick={onNavigateToManageJobs} className="w-full bg-accent-gold text-primary-dark font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors">نشر وظيفة جديدة</button>
                            <button onClick={onNavigateToMarketplace} className="w-full bg-primary-dark text-text-primary font-bold py-3 rounded-lg hover:bg-opacity-80 transition-colors">تصفح سوق المواهب</button>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-primary-dark p-6 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-text-primary">أحدث وظائفك</h3>
                        <button onClick={onNavigateToManageJobs} className="text-accent-gold hover:underline">إدارة كل الوظائف</button>
                    </div>
                     <div className="space-y-4">
                        {jobs.length > 0 ? jobs.slice(0, 3).map(job => (
                            <div key={job.id} className="bg-primary-surface p-4 rounded-lg">
                                <h4 className="font-bold text-text-primary">{job.title}</h4>
                                <p className="text-sm text-text-secondary">{job.location}</p>
                            </div>
                        )) : (
                            <p className="text-text-secondary text-center py-4">لم تقم بنشر أي وظائف بعد.</p>
                        )}
                    </div>
                </div>
            </div>
             {selectedCandidate && (
                <CareerPassportModal
                candidate={selectedCandidate}
                onClose={() => setSelectedCandidate(null)}
                onProfileUpdate={() => {}} // Recruiters don't update profiles
                />
            )}
        </div>
    );
};

// --- Icons ---
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm6-11a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

export default RecruiterDashboard;
