import React from 'react';
import type { JobPostingWithCompany } from '../types';

const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;
const defaultLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23A8B2D1'%3E%3Cpath d='M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2l-.01-12zM12 11H4V6h8v5zm8-5h-6V6h6v5zm-8 6H4v5h8v-5zm8 5h-6v-5h6v5z'/%3E%3C/svg%3E";

interface JobPostingCardProps {
  job: JobPostingWithCompany;
  onViewDetails: (job: JobPostingWithCompany) => void;
}

const JobPostingCard: React.FC<JobPostingCardProps> = ({ job, onViewDetails }) => {
  const companyName = job.profiles?.company_name || 'شركة غير محددة';
  const companyLogo = job.profiles?.company_logo_url || defaultLogo;

  return (
    <div 
      onClick={() => onViewDetails(job)}
      className="bg-primary-surface rounded-xl overflow-hidden shadow-lg transform hover:-translate-y-1 transition-transform duration-300 flex flex-col h-full cursor-pointer border border-primary-surface/50 card-animated"
    >
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex items-center mb-4">
          <div className="w-14 h-14 bg-primary-dark rounded-lg flex items-center justify-center flex-shrink-0 mr-4 p-1">
            <img src={companyLogo} alt={`${companyName} logo`} className="w-full h-full object-contain" />
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-bold text-text-primary leading-tight">{job.title}</h3>
            <p className="text-sm text-text-secondary">{companyName}</p>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-text-secondary mb-4">
          <LocationIcon />
          <span className="mr-2">{job.location || 'غير محدد'}</span>
        </div>

        <div className="flex-grow"></div> 
      </div>
      <div className="p-3 bg-primary-dark/30 mt-auto">
        <div className="w-full bg-accent-gold text-primary-dark font-bold py-2 px-4 rounded-lg text-center text-sm">
          عرض التفاصيل
        </div>
      </div>
    </div>
  );
};

export default JobPostingCard;
