import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

import Header from './components/Header';
import HowItWorks from './components/HowItWorks';
import TalentMarketplace from './components/TalentMarketplace';
import Footer from './components/Footer';
import OnboardingProcess from './pages/OnboardingProcess';
import SettingsPage from './pages/SettingsPage';
import CompanySettingsPage from './pages/CompanySettingsPage';
import LandingPage from './pages/LandingPage';
import RecruiterDashboard from './pages/RecruiterDashboard';
import ManageJobsPage from './pages/ManageJobsPage';
import { getProfile, getCertifiedCandidates } from './services/profileService';
import type { UserProfileData } from './types';
import SchemaErrorPage from './pages/SchemaErrorPage';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [certifiedCandidates, setCertifiedCandidates] = useState<UserProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState(false);
  const [view, setView] = useState<'dashboard' | 'marketplace' | 'settings' | 'manage_jobs'>('marketplace');

  const fetchUserData = async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setProfile(null);
      setCertifiedCandidates([]);
      setLoading(false);
      setSchemaError(false);
      return;
    }
    setError(null);
    setSchemaError(false);

    try {
      const userProfile = await getProfile(currentSession.user);
      setProfile(userProfile);

      const candidates = await getCertifiedCandidates();
      setCertifiedCandidates(candidates);

    } catch (e: any) {
      if (e?.message?.includes("يرجى تشغيل نص SQL")) {
        console.error("Database schema mismatch detected:", e.message);
        setSchemaError(true);
      } else {
        console.error("Error fetching user data:", e.message || e);
        setError(`فشل تحميل بيانات المستخدم: ${e.message || 'خطأ غير معروف'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setSchemaError(false);
    setLoading(true);
    fetchUserData(session);
  };

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        const role = data.session?.user?.user_metadata?.role;
        setView(role === 'recruiter' ? 'dashboard' : 'marketplace');
        fetchUserData(data.session);
    }).catch(console.error);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        const role = newSession?.user?.user_metadata?.role;
        setView(role === 'recruiter' ? 'dashboard' : 'marketplace'); // Reset view on auth change
        fetchUserData(newSession);
    });

    return () => {
        subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };
  
  const handleProfileUpdate = (updatedProfile: UserProfileData) => {
      setProfile(updatedProfile);
      // Optimistically add/update certified list
      if (updatedProfile.is_certified) {
        setCertifiedCandidates(prev => {
          const existing = prev.find(c => c.id === updatedProfile.id);
          if (existing) {
            return prev.map(c => c.id === updatedProfile.id ? updatedProfile : c);
          }
          return [...prev, updatedProfile];
        });
      }
  }

  const navigateToSettings = () => {
    const role = session?.user.user_metadata.role;
    if ((role === 'candidate' && profile?.is_certified) || role === 'recruiter') {
      setView('settings');
    }
  };
  
  const navigateToMarketplace = () => setView('marketplace');
  const navigateToDashboard = () => setView('dashboard');
  const navigateToManageJobs = () => setView('manage_jobs');


  if (schemaError) {
    return <SchemaErrorPage onRetry={handleRetry} />;
  }

  if (loading) {
     return (
        <div className="min-h-screen bg-primary-dark flex flex-col justify-center items-center gap-4">
            <div className="w-16 h-16 border-4 border-t-accent-gold border-primary-surface rounded-full animate-spin"></div>
            <div className="text-text-primary text-2xl font-cairo">جاري تحميل المنصة...</div>
        </div>
     );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-primary-dark flex flex-col justify-center items-center text-center p-4">
            <h1 className="text-2xl font-bold text-red-400">حدث خطأ في التطبيق</h1>
            <p className="text-text-secondary mt-2 max-w-lg">{error}</p>
            <button 
                onClick={() => { setLoading(true); fetchUserData(session); }} 
                className="mt-6 bg-accent-gold text-primary-dark font-bold py-2 px-6 rounded-lg hover:bg-yellow-500"
            >
                حاول مرة أخرى
            </button>
        </div>
    );
  }

  // If no session, show the new smart landing page
  if (!session) {
    return <LandingPage />;
  }
  
  const userRole = session.user?.user_metadata?.role;

  // Routing Logic for logged-in users
  const renderContent = () => {
    // Candidate routing
    if (userRole === 'candidate') {
        if (!profile?.is_certified) {
            return <OnboardingProcess session={session} onOnboardingComplete={handleProfileUpdate} />;
        }
        if (view === 'settings') {
            if (!profile) {
                return (
                    <div className="min-h-screen bg-primary-dark flex justify-center items-center">
                        <div className="text-white text-2xl font-cairo">جاري تحميل...</div>
                    </div>
                );
            }
            return <SettingsPage session={session} profile={profile} onProfileUpdate={handleProfileUpdate} onNavigateBack={navigateToMarketplace} />;
        }
        return (
            <main>
                <TalentMarketplace 
                    profile={profile}
                    candidates={certifiedCandidates} 
                    userRole={userRole}
                    onProfileUpdate={handleProfileUpdate}
                    session={session}
                />
                <HowItWorks />
            </main>
        );
    }
    
    // Recruiter routing
    if (userRole === 'recruiter') {
        switch(view) {
            case 'dashboard':
                return <RecruiterDashboard session={session} onNavigateToMarketplace={navigateToMarketplace} onNavigateToManageJobs={navigateToManageJobs} />;
            case 'marketplace':
                return <TalentMarketplace profile={profile} candidates={certifiedCandidates} userRole={userRole} onProfileUpdate={handleProfileUpdate} session={session} />;
            case 'manage_jobs':
                return <ManageJobsPage session={session} onNavigateBack={navigateToDashboard} />;
            case 'settings':
                 if (!profile) {
                    return (
                        <div className="min-h-screen bg-primary-dark flex justify-center items-center">
                            <div className="text-white text-2xl font-cairo">جاري تحميل...</div>
                        </div>
                    );
                 }
                 return <CompanySettingsPage session={session} profile={profile} onProfileUpdate={handleProfileUpdate} onNavigateBack={navigateToDashboard} />;
            default:
                // Fallback to dashboard for recruiter
                return <RecruiterDashboard session={session} onNavigateToMarketplace={navigateToMarketplace} onNavigateToManageJobs={navigateToManageJobs} />;
        }
    }

    // Fallback for any other roles or if role is not defined
    return (
        <main>
            <TalentMarketplace profile={profile} candidates={certifiedCandidates} userRole={userRole} onProfileUpdate={handleProfileUpdate} session={session}/>
            <HowItWorks />
        </main>
    );
  };
  
  return (
    <div className="min-h-screen bg-primary-dark text-text-primary">
      <Header 
        session={session} 
        onLogout={handleLogout} 
        role={userRole} 
        isCertified={profile?.is_certified}
        profile={profile}
        onNavigateToSettings={navigateToSettings}
        onNavigateToDashboard={navigateToDashboard}
        onNavigateToMarketplace={navigateToMarketplace}
        onNavigateToManageJobs={navigateToManageJobs}
        currentView={view}
      />
      {renderContent()}
      <Footer />
    </div>
  );
}

export default App;
