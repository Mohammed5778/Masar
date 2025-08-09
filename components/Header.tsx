import React from 'react';
import type { Session } from '@supabase/supabase-js';
import type { UserProfileData } from '../types';

interface HeaderProps {
    session: Session;
    onLogout: () => void;
    role?: 'candidate' | 'recruiter';
    isCertified?: boolean;
    profile: UserProfileData | null;
    onNavigateToSettings: () => void;
    onNavigateToDashboard: () => void;
    onNavigateToMarketplace: () => void;
    onNavigateToManageJobs: () => void;
    currentView: 'dashboard' | 'marketplace' | 'settings' | 'manage_jobs';
}

const Header: React.FC<HeaderProps> = ({ 
    session, 
    onLogout, 
    role, 
    isCertified, 
    profile,
    onNavigateToSettings,
    onNavigateToDashboard,
    onNavigateToMarketplace,
    currentView
}) => {
  const canNavigateToSettings = (role === 'candidate' && isCertified) || role === 'recruiter';
  const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23A8B2D1'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
  const userImage = profile?.photo_url || (role === 'recruiter' ? profile?.company_logo_url : null) || defaultAvatar;

  const handleLogoClick = () => {
    if (role === 'recruiter') {
        onNavigateToDashboard();
    } else {
        onNavigateToMarketplace();
    }
  }

  return (
    <header className="glass-effect sticky top-0 z-50 border-b border-primary-surface/30">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button
                disabled={!canNavigateToSettings}
                onClick={onNavigateToSettings}
                className={`flex items-center gap-3 rounded-2xl transition-all duration-300 ${canNavigateToSettings ? 'cursor-pointer hover:bg-primary-surface/50 p-2' : 'cursor-default p-2'}`}
            >
                <img src={userImage} alt="Profile" className="w-10 h-10 rounded-full object-cover bg-primary-dark border-2 border-accent-gold/30" />
                <span className="hidden sm:block text-text-primary font-bold text-lg">{profile?.company_name || profile?.full_name}</span>
            </button>
        </div>

        <div 
            className="text-3xl font-bold cursor-pointer"
            onClick={handleLogoClick}
        >
          <span className="gradient-text">مسار</span>
        </div>
        
        <div className="flex items-center">
            <button onClick={onLogout} className="text-text-secondary hover:text-accent-gold p-3 rounded-xl transition-all duration-300 hover:bg-primary-surface/30" title="تسجيل الخروج">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
        </div>
      </div>
      
      {/* Mobile-style Navigation for Recruiters */}
      {role === 'recruiter' && (
        <div className="glass-effect border-t border-primary-surface/30">
          <div className="container mx-auto px-4 sm:px-6 flex justify-around">
            <NavButton label="التحكم" onClick={onNavigateToDashboard} isActive={currentView === 'dashboard'} />
            <NavButton label="السوق" onClick={onNavigateToMarketplace} isActive={currentView === 'marketplace'} />
          </div>
        </div>
      )}
    </header>
  );
};

const NavButton: React.FC<{label: string; onClick: () => void; isActive: boolean}> = ({label, onClick, isActive}) => (
    <button 
      onClick={onClick}
      className={`py-4 px-6 font-bold text-base w-full transition-all duration-300 border-b-3 rounded-t-lg
      ${isActive ? 'text-accent-gold border-accent-gold bg-primary-surface/30' : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-primary-surface/20'}`}
    >
      {label}
    </button>
);


export default Header;
