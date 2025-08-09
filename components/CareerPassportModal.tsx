import React, { useEffect, useState, useMemo } from 'react';
import { UserProfileData, Certificate, SocialLink, Project, SocialPlatform, HolisticAnalysisResult } from '../types';
import { getCertificates } from '../services/certificateService';
import { getSocialLinks } from '../services/socialLinkService';
import { getProjects } from '../services/projectService';
import { generateHolisticProfileAnalysis } from '../services/geminiService';
import { upsertProfile } from '../services/profileService';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis, Tooltip, Legend } from 'recharts';


interface CareerPassportModalProps {
  candidate: UserProfileData;
  onClose: () => void;
  onProfileUpdate: (profile: UserProfileData) => void;
}

const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23A8B2D1'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
const defaultProjectThumb = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%23172A46'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' /%3E%3C/svg%3E";

const CertifiedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zM9 11a1 1 0 112 0v1a1 1 0 11-2 0v-1zm1-4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;

// --- Sub-components for Readability ---
const ProfileHeader: React.FC<{candidate: UserProfileData}> = ({ candidate }) => (
    <div className="flex flex-col items-center text-center bg-primary-surface p-6 rounded-xl shadow-lg">
        <img src={candidate.photo_url || defaultAvatar} alt={candidate.full_name} className="w-32 h-32 rounded-full border-4 border-accent-gold object-cover bg-primary-dark mb-4 shadow-xl" />
        <h2 className="text-3xl font-bold text-text-primary">{candidate.full_name}</h2>
        <p className="text-lg text-text-secondary">{candidate.title}</p>
         {candidate.is_certified && (
            <div className="mt-3 bg-accent-gold/10 text-accent-gold text-sm font-bold px-4 py-1.5 rounded-full inline-flex items-center gap-2">
                <CertifiedIcon />
                معتمد من مسار
            </div>
         )}
    </div>
);

const AiAnalysisSection: React.FC<{onAnalyze: () => void; isLoading: boolean; result: HolisticAnalysisResult | null; error: string}> = ({ onAnalyze, isLoading, result, error }) => {
    const chartData = useMemo(() => {
        if (!result) return [];
        return [
            { name: 'وضوح الهدف', value: result.goal_clarity_score, fill: '#b8901e' },
            { name: 'الاتساق', value: result.consistency_score, fill: '#cfa021' },
            { name: 'الاكتمال', value: result.completeness_score, fill: '#E6B325' },
        ].sort((a, b) => b.value - a.value);
    }, [result]);

    return (
        <div className="bg-primary-surface p-5 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold text-accent-gold mb-4">تحليل جواز السفر بالذكاء الاصطناعي</h3>
            {isLoading ? (
                <div className="text-center p-8">
                    <div className="w-8 h-8 border-2 border-t-accent-gold border-primary-dark rounded-full animate-spin mx-auto"></div>
                    <p className="text-text-secondary mt-2">جاري التحليل...</p>
                </div>
            ) : error ? (
                 <div className="text-center p-4 bg-red-900/20 rounded-lg">
                    <p className="text-red-400">{error}</p>
                    <button onClick={onAnalyze} className="mt-2 bg-accent-gold text-primary-dark font-bold py-1 px-4 rounded-md text-sm">حاول مرة أخرى</button>
                </div>
            ) : result ? (
                 <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/3 h-52">
                        <ResponsiveContainer>
                             <RadialBarChart 
                                innerRadius="30%" 
                                outerRadius="100%" 
                                data={chartData} 
                                startAngle={180} 
                                endAngle={0}
                                barSize={10}
                            >
                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                <RadialBar background dataKey='value' angleAxisId={0} cornerRadius={5} />
                                <Legend iconSize={10} wrapperStyle={{fontSize: '12px', color: '#A8B2D1'}} layout="vertical" verticalAlign="middle" align="right"/>
                                <Tooltip contentStyle={{backgroundColor: '#0A192F', border: '1px solid #E6B325', borderRadius: '0.5rem'}}/>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-2/3">
                        <h4 className="font-bold text-text-primary mb-2">ملخص لمسؤول التوظيف</h4>
                        <p className="text-sm text-text-secondary mb-4 italic">"{result.recruiter_summary}"</p>
                        <h4 className="font-bold text-text-primary mb-2">أبرز نقاط القوة</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                            {result.key_strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                    </div>
                 </div>
            ) : (
                <div className="text-center p-4">
                    <p className="text-text-secondary mb-3">قم بتوليد تحليل شامل للملف الشخصي باستخدام الذكاء الاصطناعي.</p>
                    <button onClick={onAnalyze} className="bg-accent-gold text-primary-dark font-bold py-2 px-6 rounded-lg text-sm">
                        بدء التحليل
                    </button>
                </div>
            )}
        </div>
    );
};


const InfoSection: React.FC<{title: string, content: string | null | undefined}> = ({ title, content }) => (
    <div className="bg-primary-surface p-5 rounded-xl shadow-lg">
        <h3 className="text-lg font-bold text-accent-gold mb-3">{title}</h3>
        <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">{content || `لا يوجد ${title}.`}</p>
    </div>
);

const SkillsSection: React.FC<{skills: string[]}> = ({ skills }) => (
    <div className="bg-primary-surface p-5 rounded-xl shadow-lg">
        <h3 className="text-lg font-bold text-accent-gold mb-4">المهارات التقنية</h3>
        <div className="flex flex-wrap gap-3">
            {skills.map(skill => (
                <span key={skill} className="bg-primary-dark text-text-primary text-sm font-medium px-3 py-1.5 rounded-lg">{skill}</span>
            ))}
            {skills.length === 0 && <p className="text-text-secondary">لا توجد مهارات مدرجة.</p>}
        </div>
    </div>
);

const SocialLinksSection: React.FC<{links: SocialLink[], credlyUrl: string | null}> = ({ links, credlyUrl }) => {
    const ICONS: Record<SocialPlatform, React.ReactNode> = {
        github: <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>,
        linkedin: <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>LinkedIn</title><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>,
        behance: <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Behance</title><path d="M8.273 11.365c.484 0 .88-.396.88-.88s-.396-.88-.88-.88-.88.396-.88.88.396.88.88.88zm8.303.844h-2.14a.5.5 0 0 1 0-1h2.14a.5.5 0 0 1 0 1zm1.748-4.325h3.676V6.01h-3.676zm-.002 4.363c-.88 0-2.583-.1-3.486-.1s-1.46.03-1.84.03c-1.385 0-2.61-.92-2.61-2.732s1.17-2.715 2.627-2.715c1.78 0 2.51 1.29 2.51 1.29s.9-1.29 2.77-1.29c1.455 0 2.592 1.15 2.592 2.713s-1.12 2.73-2.564 2.73zm-.001-1.002c.983 0 1.56-.63 1.56-1.73s-.578-1.714-1.56-1.714c-.982 0-1.56.63-1.56 1.714s.592 1.73 1.56 1.73zm-3.484 0c.983 0 1.56-.63 1.56-1.73s-.578-1.714-1.56-1.714c-.982 0-1.56.63-1.56 1.714s.592 1.73 1.56 1.73zM24 .25H0v23.5h24ZM9.153 15.39H4.275V8.835h4.636c1.61 0 2.84 1.076 2.84 2.775 0 1.69-1.23 2.78-2.84 2.78zm0-1.026c1.08 0 1.83-.71 1.83-1.758s-.75-1.756-1.83-1.756H5.285v3.514h3.868z"/></svg>,
        huggingface: <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M22.022 13.52a2.33 2.33 0 0 1-.49 1.15l-1.01 1.51a2.29 2.29 0 0 1-1.43 1.01l-1.8.49a2.33 2.33 0 0 1-1.8-.02l-1.66-.6a2.3 2.3 0 0 1-1.66-.6l-1.15-1.01a2.31 2.31 0 0 1-.6-1.66l-.02-1.8a2.3 2.3 0 0 1 .49-1.43l1.01-1.51a2.29 2.29 0 0 1 1.43-1.01l1.8-.49a2.3 2.3 0 0 1 1.8.02l1.66.6a2.3 2.3 0 0 1 1.66.6l1.15 1.01a2.32 2.32 0 0 1 .6 1.66l.02 1.8zM4.61 11.23a1.13 1.13 0 1 1-2.26 0 1.13 1.13 0 0 1 2.26 0zm2.26-2.26a1.13 1.13 0 1 1-2.26 0 1.13 1.13 0 0 1 2.26 0zm-2.26-2.26a1.13 1.13 0 1 1-2.26 0 1.13 1.13 0 0 1 2.26 0zm11.3 6.78c-.62.62-1.45.93-2.26.93s-1.64-.3-2.26-.93a.56.56 0 0 1 0-.8c.22-.22.58-.22.8 0 .4.4.93.62 1.46.62s1.05-.22 1.46-.62a.56.56 0 0 1 .8 0c.22.22.22.58 0 .8zM17.06 9.53h-2.83a.56.56 0 1 1 0-1.13h2.83a.56.56 0 1 1 0 1.13zm-5.65 0h-2.83a.56.56 0 1 1 0-1.13h2.83a.56.56 0 1 1 0 1.13z" /></svg>,
        portfolio: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l1.41 1.41.59.59H20v10z" /></svg>,
        other: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" /></svg>,
    };

    if (links.length === 0 && !credlyUrl) return null;

    return (
        <div className="bg-primary-surface p-5 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold text-accent-gold mb-4">روابط احترافية</h3>
            <div className="flex flex-wrap items-center gap-4">
                {links.map(link => (
                    <a href={link.url} key={link.id} target="_blank" rel="noopener noreferrer" title={link.platform}
                       className="text-text-secondary hover:text-accent-gold transition-colors fill-current w-8 h-8">
                       {ICONS[link.platform] || ICONS.other}
                    </a>
                ))}
                {credlyUrl && (
                    <a href={credlyUrl} target="_blank" rel="noopener noreferrer"
                       className="bg-white text-[#FF6B00] font-bold text-sm px-3 py-1.5 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" className="w-5 h-5"><path fill="#ff6b00" d="M121.4 56.1c0-4.2-3.4-7.6-7.6-7.6H74.3c-2.8 0-5.3 1.5-6.6 3.8L54 75.9c-1 1.8-3.5 1.8-4.5 0L35.8 52.3c-1.3-2.3-3.8-3.8-6.6-3.8H14.2c-4.2 0-7.6 3.4-7.6 7.6v15.8c0 4.2 3.4 7.6 7.6 7.6h15.1c2.8 0 5.3-1.5 6.6-3.8l13.7-23.6c1-1.8 3.5-1.8 4.5 0l13.7 23.6c1.3 2.3 3.8 3.8 6.6 3.8h15.1c4.2 0 7.6-3.4 7.6-7.6V56.1z"></path></svg>
                        Credly
                    </a>
                )}
            </div>
        </div>
    );
};

const ProjectsSection: React.FC<{projects: Project[], isLoading: boolean}> = ({ projects, isLoading }) => {
    if (isLoading) return <div className="text-center text-text-secondary">جاري تحميل المشاريع...</div>;
    if (projects.length === 0) return null;

    return (
        <div className="bg-primary-surface p-5 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold text-accent-gold mb-4">معرض المشاريع</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(proj => (
                    <div key={proj.id} className="bg-primary-dark rounded-lg overflow-hidden flex flex-col border border-primary-surface/30">
                        <img src={proj.image_url || defaultProjectThumb} alt={proj.title} className="w-full h-40 object-cover" />
                        <div className="p-4 flex flex-col flex-grow">
                            <h4 className="font-bold text-text-primary">{proj.title}</h4>
                            <p className="text-sm text-text-secondary mt-1 flex-grow">{proj.description}</p>
                            {proj.technologies && proj.technologies.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {proj.technologies.slice(0, 3).map(tech => (
                                        <span key={tech} className="bg-primary-surface text-accent-gold text-xs font-medium px-2 py-1 rounded">{tech}</span>
                                    ))}
                                </div>
                            )}
                            {proj.project_url && (
                                <a href={proj.project_url} target="_blank" rel="noopener noreferrer" className="text-accent-gold font-bold text-sm mt-3 self-start hover:underline">
                                    عرض المشروع &rarr;
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CertificatesSection: React.FC<{certificates: Certificate[], isLoading: boolean}> = ({ certificates, isLoading }) => {
    if (isLoading) return <div className="text-center text-text-secondary">جاري تحميل الشهادات...</div>;
    if (certificates.length === 0) return null;

    return (
        <div className="bg-primary-surface p-5 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold text-accent-gold mb-4">الشهادات والاعتمادات</h3>
            <div className="space-y-3">
                {certificates.map(cert => (
                    <div key={cert.id} className="bg-primary-dark p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-text-primary">{cert.name}</p>
                            <p className="text-sm text-text-secondary">{cert.issuing_organization}</p>
                        </div>
                        {cert.file_url && (
                            <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="text-accent-gold hover:underline text-sm font-bold">
                                عرض الشهادة
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const CareerPassportModal: React.FC<CareerPassportModalProps> = ({ candidate, onClose, onProfileUpdate }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [analysisData, setAnalysisData] = useState<HolisticAnalysisResult | null>(candidate.holistic_analysis as unknown as HolisticAnalysisResult | null);

  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  useEffect(() => {
    const fetchAllData = async () => {
      if (!candidate.id) return;
      try {
        setLoading(true);
        const [certs, links, projs] = await Promise.all([
            getCertificates(candidate.id),
            getSocialLinks(candidate.id),
            getProjects(candidate.id)
        ]);
        setCertificates(certs);
        setSocialLinks(links);
        setProjects(projs);
      } catch (error) {
        console.error("Error fetching passport data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [candidate.id]);

  const handleAiAnalysis = async () => {
      setAnalysisLoading(true);
      setAnalysisError('');
      try {
          const result = await generateHolisticProfileAnalysis(candidate, certificates, projects, socialLinks);
          setAnalysisData(result);
          const updatedProfile = await upsertProfile({ id: candidate.id, holistic_analysis: result });
          onProfileUpdate(updatedProfile);
      } catch (e: any) {
          setAnalysisError(e.message || "فشل الحصول على التحليل.");
      } finally {
          setAnalysisLoading(false);
      }
  };

  return (
    <div
      className="fixed inset-0 bg-primary-dark z-50 p-0"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-accent-gold scrollbar-track-primary-dark">
        {/* Modal Header */}
        <div className="bg-primary-surface/50 backdrop-blur-sm sticky top-0 z-10 p-4 flex justify-between items-center border-b border-primary-surface">
            <h2 className="text-xl font-bold text-text-primary">جواز السفر المهني</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-accent-gold transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
            <ProfileHeader candidate={candidate} />
            <AiAnalysisSection 
                onAnalyze={handleAiAnalysis} 
                isLoading={analysisLoading} 
                result={analysisData}
                error={analysisError} 
            />
            <InfoSection title="الملخص المهني" content={candidate.summary} />
            <SkillsSection skills={candidate.skills} />
            <SocialLinksSection links={socialLinks} credlyUrl={candidate.credly_url} />
            <ProjectsSection projects={projects} isLoading={loading} />
            <CertificatesSection certificates={certificates} isLoading={loading} />

             <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4 border-t border-primary-surface pt-6">
                <button 
                    className="bg-primary-surface text-text-primary font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={true}
                    title="قريباً"
                >
                    طلب مقابلة
                </button>
                <button 
                    className="bg-accent-gold text-primary-dark font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={true}
                    title="قريباً"
                >
                    إرسال عرض وظيفي
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CareerPassportModal;
