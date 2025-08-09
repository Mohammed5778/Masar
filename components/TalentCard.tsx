import React from 'react';
import { UserProfileData } from '../types';

interface TalentCardProps {
  candidate: UserProfileData;
  onViewPassport: (candidate: UserProfileData) => void;
}

const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23A8B2D1'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";


const TalentCard: React.FC<TalentCardProps> = ({ candidate, onViewPassport }) => {
  return (
    <div className="glass-effect rounded-2xl shadow-lg hover-lift transition-all duration-300 flex flex-col border border-primary-surface/50 card-animated overflow-hidden">
      <div className="p-6 flex-grow">
        <div className="flex items-center mb-4">
          <img className="w-24 h-24 rounded-2xl mr-4 border-3 border-accent-gold/50 object-cover bg-primary-dark shadow-lg" src={candidate.photo_url || defaultAvatar} alt={candidate.full_name} />
          <div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">{candidate.full_name}</h3>
            <p className="text-text-secondary text-lg">{candidate.title}</p>
          </div>
        </div>

        <div className="mb-6 text-base text-text-secondary space-y-2">
            <p><strong>الهدف:</strong> {candidate.job_goal}</p>
            <p><strong>الخبرة:</strong> {candidate.experience_years} سنوات</p>
        </div>

        {candidate.is_certified && (
            <div className="mb-6 bg-gradient-to-r from-accent-gold/20 to-yellow-400/20 text-accent-gold text-sm font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2 border border-accent-gold/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zM9 11a1 1 0 112 0v1a1 1 0 11-2 0v-1zm1-4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                معتمد من مسار
            </div>
        )}

        <div className="mb-4">
          <h4 className="font-bold text-base text-text-secondary mb-3">أبرز المهارات:</h4>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.slice(0, 4).map(skill => (
              <span key={skill} className="bg-primary-dark/80 text-text-secondary text-sm font-medium px-3 py-1.5 rounded-lg border border-primary-surface/30">
                {skill}
              </span>
            ))}
            {candidate.skills.length > 4 && (
                <span className="bg-primary-dark/80 text-text-secondary text-sm font-medium px-3 py-1.5 rounded-lg border border-primary-surface/30">
                    +{candidate.skills.length - 4}
                </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-t from-primary-dark/50 to-transparent mt-auto">
        <button
          onClick={() => onViewPassport(candidate)}
          className="w-full btn-primary text-primary-dark font-bold py-3 px-6 rounded-xl text-center text-lg"
        >
          عرض جواز السفر المهني
        </button>
      </div>
    </div>
  );
};

export default TalentCard;
