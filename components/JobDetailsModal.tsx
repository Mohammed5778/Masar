import React from 'react';
import type { JobPostingWithCompany } from '../types';

const defaultLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23A8B2D1'%3E%3Cpath d='M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2l-.01-12zM12 11H4V6h8v5zm8-5h-6V6h6v5zm-8 6H4v5h8v-5zm8 5h-6v-5h6v5z'/%3E%3C/svg%3E";
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;

interface JobDetailsModalProps {
  job: JobPostingWithCompany;
  onClose: () => void;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, onClose }) => {
  const companyName = job.profiles?.company_name || 'شركة غير محددة';
  const companyLogo = job.profiles?.company_logo_url || defaultLogo;

  return (
    <div
      className="fixed inset-0 bg-primary-dark/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="modal-glass rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-accent-gold scrollbar-track-primary-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-accent-gold transition-colors z-10" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          {/* Header */}
          <div className="flex items-start gap-5 mb-6 pb-6 border-b border-primary-surface">
            <img src={companyLogo} alt={`${companyName} logo`} className="w-20 h-20 rounded-lg object-contain bg-primary-dark p-2" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">{job.title}</h2>
              <p className="text-lg text-text-secondary">{companyName}</p>
              <div className="flex items-center text-sm text-text-secondary mt-2">
                <LocationIcon />
                <span className="mr-2">{job.location || 'غير محدد'}</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-accent-gold mb-2">الوصف الوظيفي</h3>
              <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </div>
            {job.required_skills && job.required_skills.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-accent-gold mb-3">المهارات المطلوبة</h3>
                <div className="flex flex-wrap gap-2">
                    {job.required_skills.map(skill => (
                        <span key={skill} className="bg-primary-dark text-text-primary text-sm font-medium px-3 py-1.5 rounded-md">{skill}</span>
                    ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4 border-t border-primary-surface pt-6">
            <button
                className="bg-accent-gold text-primary-dark font-bold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={true}
                title="قريباً"
            >
                التقديم على الوظيفة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;
