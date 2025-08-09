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
                <h2 className="text-3xl font-bold text-center text-text-primary mb-4">سوق الوظائف</h2>
                <p className="text-center text-text-secondary max-w-2xl mx-auto mb-12">
                    ابحث عن فرصتك التالية. نعرض لك الوظائف المطابقة لك أولاً لسهولة الوصول.
                </p>
                
                 <div className="flex justify-center mb-8">
                  <div className="bg-primary-dark p-1.5 rounded-xl flex gap-2">
                    <button
                      onClick={() => setActiveJobTab('relevant')}
                      className={`px-6 py-2 rounded-lg font-bold transition-all duration-300 ${activeJobTab === 'relevant' ? 'bg-accent-gold text-primary-dark' : 'text-text-primary hover:bg-primary-surface'}`}
                    >
                      وظائف مطابقة لك
                    </button>
                    <button
                      onClick={() => setActiveJobTab('all')}
                      className={`px-6 py-2 rounded-lg font-bold transition-all duration-300 ${activeJobTab === 'all' ? 'bg-accent-gold text-primary-dark' : 'text-text-primary hover:bg-primary-surface'}`}
                    >
                      تصفح كل الوظائف
                    </button>
                  </div>
                </div>

                {jobsLoading ? (
                    <div className="text-center py-16 text-text-secondary">جاري تحميل الوظائف...</div>
                ) : jobsError ? (
                    <div className="text-center py-16 text-red-400 bg-red-900/30 rounded-xl p-6">
                        <h3 className="text-2xl font-bold">حدث خطأ</h3>
                        <p className="mt-2">{jobsError}</p>
                    </div>
                ) : (
                    <>
                        {activeJobTab === 'relevant' && (
                            matchingJobs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {matchingJobs.map(job => (
                                        <JobCard key={job.id} job={job} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-text-secondary bg-primary-surface/50 rounded-xl p-6">
                                    <h3 className="text-2xl font-bold text-text-primary">لا توجد وظائف مطابقة لك حالياً</h3>
                                    <p className="mt-2">اذهب إلى صفحة الإعدادات من القائمة العلوية لتشغيل البحث عن وظائف مطابقة لك.</p>
                                </div>
                            )
                        )}
                        {activeJobTab === 'all' && (
                             allJobs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {allJobs.map(job => (
                                        <JobPostingCard key={job.id} job={job} onViewDetails={handleViewJobDetails} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-text-secondary bg-primary-surface/50 rounded-xl p-6">
                                    <h3 className="text-2xl font-bold text-text-primary">لا توجد وظائف متاحة حالياً في المنصة</h3>
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
          <h2 className="text-3xl font-bold text-center text-text-primary mb-4">سوق المواهب المعتمدة</h2>
          <p className="text-center text-text-secondary max-w-2xl mx-auto mb-12">
          {userRole === 'candidate'
              ? 'تصفح أفضل المرشحين الذين تم تقييمهم واعتمادهم من خلال منصة مسار.'
              : (<>وظّف <span className="text-accent-gold">أسرع</span>، ووظّف <span className="text-accent-gold">أذكى</span> مع جوازات السفر المهنية.</>)
          }
          </p>

          <div className="bg-primary-surface p-4 rounded-xl mb-12 flex flex-col md:flex-row gap-4 items-center shadow-lg">
              <div className="relative flex-grow w-full md:w-auto">
              <input
                  type="text"
                  placeholder="ابحث بالاسم، المسمى الوظيفي، أو المهارة..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-style w-full"
              />
              </div>
              <select
              value={selectedSkill}
              onChange={e => setSelectedSkill(e.target.value as string)}
              className="input-style w-full md:w-auto"
              >
              <option value="all">كل المهارات</option>
              {allSkills.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
              ))}
              </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCandidates.map(candidate => (
              <TalentCard key={candidate.id} candidate={candidate} onViewPassport={handleViewPassport} />
              ))}
          </div>
          {filteredCandidates.length === 0 && (
              <div className="text-center py-16 text-text-secondary">
              <h3 className="text-2xl font-bold text-text-primary">لا توجد نتائج مطابقة</h3>
              <p className="mt-2">حاول توسيع نطاق البحث أو تغيير الفلاتر.</p>
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
