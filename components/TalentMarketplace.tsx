import React, { useState, useMemo, useEffect } from 'react';
import type { UserProfileData, JobPostingWithCompany, Job } from '../types';
import { getAllActiveJobsWithCompany, getMatchingJobs } from '../services/jobService';
import TalentCard from './TalentCard';
import CareerPassportModal from './CareerPassportModal';
import JobPostingCard from './JobPostingCard';
import JobDetailsModal from './JobDetailsModal';
import JobCard from './JobCard';
import type { Session } from '@supabase/supabase-js';

interface TalentMarketplaceProps {
  candidates: UserProfileData[];
  profile: UserProfileData | null;
  userRole?: 'candidate' | 'recruiter';
  onProfileUpdate: (profile: UserProfileData) => void;
  session?: Session | null;
}

const TalentMarketplace: React.FC<TalentMarketplaceProps> = ({ candidates, profile, userRole, onProfileUpdate, session }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<UserProfileData | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPostingWithCompany | null>(null);

  // State for the new job market feature
  const [allJobs, setAllJobs] = useState<JobPostingWithCompany[]>([]);
  const [matchingJobs, setMatchingJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');
  const [activeJobTab, setActiveJobTab] = useState<'relevant' | 'all'>('relevant');

  useEffect(() => {
    if (userRole === 'candidate') {
        setJobsLoading(true);
        setJobsError('');
        const promises = [];
        
        promises.push(
            getAllActiveJobsWithCompany()
                .then(setAllJobs)
                .catch(err => {
                    console.error("Failed to fetch jobs:", err);
                    setJobsError("فشل في جلب الوظائف. يرجى المحاولة مرة أخرى.");
                })
        );

        if (session?.user?.id) {
            promises.push(
                getMatchingJobs(session.user.id)
                    .then(setMatchingJobs)
                    .catch(err => {
                        console.error("Failed to fetch matching jobs:", err);
                    })
            );
        }

        Promise.all(promises).finally(() => setJobsLoading(false));

    } else {
        setJobsLoading(false);
    }
  }, [userRole, session]);

  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    candidates.forEach(c => c.skills.forEach(s => skillSet.add(s)));
    return Array.from(skillSet).sort();
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      if (!candidate.is_certified) return false;
      const matchesSkill = selectedSkill === 'all' || candidate.skills.includes(selectedSkill);
      const matchesSearch = 
        candidate.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSkill && matchesSearch;
    });
  }, [searchQuery, selectedSkill, candidates]);

  const handleViewPassport = (candidate: UserProfileData) => {
    setSelectedCandidate(candidate);
  };
  
  const handleViewJobDetails = (job: JobPostingWithCompany) => {
    setSelectedJob(job);
  };

  const handleCloseModal = () => {
    setSelectedCandidate(null);
    setSelectedJob(null);
  };
  
  return (
    <>
      {userRole === 'candidate' && (
        <section id="job-market" className="py-16 bg-primary-dark">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="text-center mb-16 animate-fade-in">
                  <h2 className="text-4xl lg:text-5xl font-bold text-text-primary mb-6">سوق <span className="gradient-text">الوظائف</span></h2>
                  <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                    ابحث عن فرصتك التالية. نعرض لك الوظائف المطابقة لك أولاً لسهولة الوصول.
                  </p>
                </div>
                
                 <div className="flex justify-center mb-8">
                  <div className="glass-effect p-2 rounded-2xl flex gap-3 shadow-lg">
                    <button
                      onClick={() => setActiveJobTab('relevant')}
                      className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 text-lg ${activeJobTab === 'relevant' ? 'btn-primary text-primary-dark' : 'text-text-primary hover:bg-primary-surface/50'}`}
                    >
                      وظائف مطابقة لك
                    </button>
                    <button
                      onClick={() => setActiveJobTab('all')}
                      className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 text-lg ${activeJobTab === 'all' ? 'btn-primary text-primary-dark' : 'text-text-primary hover:bg-primary-surface/50'}`}
                    >
                      تصفح كل الوظائف
                    </button>
                  </div>
                </div>

                {jobsLoading ? (
                    <div className="text-center py-20">
                      <div className="w-16 h-16 border-4 border-t-accent-gold border-primary-surface rounded-full animate-spin mx-auto mb-4"></div>
                      <div className="text-text-secondary text-xl">جاري تحميل الوظائف...</div>
                    </div>
                ) : jobsError ? (
                    <div className="text-center py-20">
                      <div className="glass-effect p-8 rounded-2xl max-w-md mx-auto">
                        <h3 className="text-2xl font-bold text-red-400 mb-4">حدث خطأ</h3>
                        <p className="text-text-secondary">{jobsError}</p>
                      </div>
                    </div>
                ) : (
                    <>
                        {activeJobTab === 'relevant' && (
                            matchingJobs.length > 0 ? (
                                <div className="desktop-grid">
                                    {matchingJobs.map(job => (
                                        <JobCard key={job.id} job={job} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                  <div className="glass-effect p-12 rounded-2xl max-w-2xl mx-auto">
                                    <h3 className="text-3xl font-bold text-text-primary mb-4">لا توجد وظائف مطابقة لك حالياً</h3>
                                    <p className="text-text-secondary text-lg">اذهب إلى صفحة الإعدادات من القائمة العلوية لتشغيل البحث عن وظائف مطابقة لك.</p>
                                  </div>
                                </div>
                            )
                        )}
                        {activeJobTab === 'all' && (
                             allJobs.length > 0 ? (
                                <div className="desktop-grid">
                                    {allJobs.map(job => (
                                        <JobPostingCard key={job.id} job={job} onViewDetails={handleViewJobDetails} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                  <div className="glass-effect p-12 rounded-2xl max-w-2xl mx-auto">
                                    <h3 className="text-3xl font-bold text-text-primary mb-4">لا توجد وظائف متاحة حالياً في المنصة</h3>
                                  </div>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>
        </section>
      )}

      <section id="marketplace" className="py-16 bg-primary-dark">
          <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl lg:text-5xl font-bold text-text-primary mb-6">سوق <span className="gradient-text">المواهب</span> المعتمدة</h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            {userRole === 'candidate'
                ? 'تصفح أفضل المرشحين الذين تم تقييمهم واعتمادهم من خلال منصة مسار.'
                : (<>وظّف <span className="text-accent-gold">أسرع</span>، ووظّف <span className="text-accent-gold">أذكى</span> مع جوازات السفر المهنية.</>)
            }
            </p>
          </div>

          <div className="glass-effect p-6 rounded-2xl mb-16 flex flex-col lg:flex-row gap-6 items-center shadow-lg">
              <div className="relative flex-grow w-full md:w-auto">
              <input
                  type="text"
                  placeholder="🔍 ابحث بالاسم، المسمى الوظيفي، أو المهارة..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-style w-full text-lg py-4"
              />
              </div>
              <select
              value={selectedSkill}
              onChange={e => setSelectedSkill(e.target.value as string)}
              className="input-style w-full lg:w-auto text-lg py-4"
              >
              <option value="all">كل المهارات</option>
              {allSkills.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
              ))}
              </select>
          </div>

          <div className="desktop-grid">
              {filteredCandidates.map(candidate => (
              <TalentCard key={candidate.id} candidate={candidate} onViewPassport={handleViewPassport} />
              ))}
          </div>
          {filteredCandidates.length === 0 && (
              <div className="text-center py-20">
                <div className="glass-effect p-12 rounded-2xl max-w-2xl mx-auto">
                  <h3 className="text-3xl font-bold text-text-primary mb-4">لا توجد نتائج مطابقة</h3>
                  <p className="text-text-secondary text-lg">حاول توسيع نطاق البحث أو تغيير الفلاتر.</p>
                </div>
              </div>
          )}
          </div>
      </section>

      {selectedCandidate && (
        <CareerPassportModal
          candidate={selectedCandidate}
          onClose={handleCloseModal}
          onProfileUpdate={onProfileUpdate}
        />
      )}
      
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};


export default TalentMarketplace;
