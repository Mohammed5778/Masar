
import React, { useState } from 'react';
import AuthPage from './AuthPage';
import HowItWorks from '../components/HowItWorks';
import Footer from '../components/Footer';
import { generateLandingTeaser } from '../services/geminiService';

// A simplified header for the landing page
const LandingHeader: React.FC<{ onAuthNavigate: () => void; }> = ({ onAuthNavigate }) => (
    <header className="bg-primary-dark/80 backdrop-blur-sm sticky top-0 z-50 border-b border-primary-surface/50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-text-primary">
          <span className="text-accent-gold">مسار</span> Masar
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <button onClick={onAuthNavigate} className="text-text-secondary hover:text-accent-gold transition-colors">تسجيل الدخول</button>
          <button onClick={onAuthNavigate} className="bg-accent-gold text-primary-dark font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors">
            إنشاء حساب
          </button>
        </div>
      </nav>
    </header>
);

const LandingPage: React.FC = () => {
    const [view, setView] = useState<'landing' | 'auth'>('landing');
    const [userInput, setUserInput] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAiInteraction = async () => {
        if (!userInput) {
            setError('يرجى كتابة ما تبحث عنه أولاً.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAiResponse('');
        try {
            const response = await generateLandingTeaser(userInput);
            setAiResponse(response);
        } catch (e: any) {
            setError(e.message || 'عذراً، حدث خطأ أثناء التواصل مع الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    if (view === 'auth') {
        // AuthPage handles both login and signup internally
        return <AuthPage />;
    }

    return (
        <div className="bg-primary-dark text-text-secondary font-cairo">
            <LandingHeader onAuthNavigate={() => setView('auth')} />
            <main>
                <section className="bg-primary-dark py-20 sm:py-32 relative overflow-hidden">
                    {/* Animated Background from index.html will be applied */}
                    <div className="container mx-auto px-6 text-center relative z-10">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary leading-tight">
                            اكتشف <span className="text-accent-gold">مسارك</span> المهني. بذكاء.
                        </h1>
                        <p className="mt-4 text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
                            سواء كنت موهبة تبحث عن فرصة أو شركة تبحث عن الأفضل، دع الذكاء الاصطناعي يرشدك للخطوة التالية.
                        </p>
                        <div className="mt-12 max-w-2xl mx-auto bg-primary-surface/50 p-6 rounded-xl shadow-lg border border-primary-surface">
                             <textarea
                                className="input-style"
                                rows={3}
                                placeholder="مثال: أنا مطور واجهة أمامية بخبرة في React و TypeScript وأبحث عن فرصة عمل عن بعد..."
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                disabled={isLoading}
                                aria-label="اكتب ما تبحث عنه"
                            />
                            <button
                                onClick={handleAiInteraction}
                                disabled={isLoading}
                                className="mt-4 w-full bg-accent-gold text-primary-dark font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-500 transition-colors transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isLoading ? 'لحظات من فضلك...' : 'اكتشف الإمكانيات'}
                            </button>
                            {error && <p className="text-red-400 mt-4" role="alert">{error}</p>}
                            {aiResponse && (
                                <div className="mt-6 p-4 bg-primary-dark rounded-lg text-right text-text-primary">
                                    <p className="whitespace-pre-wrap">{aiResponse}</p>
                                </div>
                            )}
                        </div>
                         <div className="mt-8 flex justify-center gap-4 flex-col sm:flex-row">
                            <button onClick={() => setView('auth')} className="bg-accent-gold text-primary-dark font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-500 transition-colors transform hover:scale-105">
                                ابدأ الآن (إنشاء حساب)
                            </button>
                            <button onClick={() => setView('auth')} className="bg-primary-surface text-text-primary font-bold py-3 px-8 rounded-lg text-lg hover:bg-opacity-80 transition-colors transform hover:scale-105">
                                لدي حساب بالفعل
                            </button>
                        </div>
                    </div>
                </section>
                <HowItWorks />
            </main>
            <Footer />
        </div>
    );
};
export default LandingPage;
