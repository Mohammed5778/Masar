
import React from 'react';
import type { Job } from '../types';

const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;


const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  return (
    <div className="bg-primary-surface rounded-xl overflow-hidden shadow-lg transform hover:-translate-y-1 transition-transform duration-300 flex flex-col h-full border border-primary-surface/50 card-animated">
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-primary-dark rounded-lg flex items-center justify-center flex-shrink-0 p-1">
                {job.logo ? (
                    <img src={job.logo} alt={`${job.title} logo`} className="w-full h-full object-contain" />
                ) : (
                    <BriefcaseIcon />
                )}
            </div>
            <div className="flex-grow">
                 <h3 className="text-xl font-bold text-text-primary mb-1">{job.title}</h3>
                <div className="flex items-center text-text-secondary text-sm">
                    <LocationIcon />
                    <span className="mr-2">{job.location || 'غير محدد'}</span>
                </div>
            </div>
        </div>
        
        <div className="flex-grow"></div> 
      </div>
      <div className="p-4 bg-primary-dark/30 mt-auto">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-accent-gold text-primary-dark font-bold py-2.5 px-4 rounded-lg hover:bg-yellow-500 transition-colors text-center shadow-md"
        >
          عرض التفاصيل
        </a>
      </div>
    </div>
  );
};

export default JobCard;
