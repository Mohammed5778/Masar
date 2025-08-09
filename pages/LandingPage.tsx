
import React, { useState } from 'react';
import AuthPage from './AuthPage';
import HowItWorks from '../components/HowItWorks';
import Footer from '../components/Footer';
import { generateLandingTeaser } from '../services/geminiService';

// Particle component for background effect
const ParticleBackground: React.FC = () => {
  React.useEffect(() => {
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 8 + 's';
      particle.style.animationDuration = (Math.random() * 10 + 8) + 's';
      document.querySelector('.particles')?.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 18000);
    };
    
    const interval = setInterval(createParticle, 300);
    return () => clearInterval(interval);
  }, []);
  
  return <div className="particles"></div>;
};

// A simplified header for the landing page
const LandingHeader: React.FC<{ onAuthNavigate: () => void; }> = ({ onAuthNavigate }) => (
    <header className="glass-effect sticky top-0 z-50 border-b border-primary-surface/30">
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-3xl font-bold">
          <span className="gradient-text">مسار</span> 
          <span className="text-text-primary ml-2">Masar</span>
        </div>
        <div className="flex items-center space-x-6 space-x-reverse">
          <button onClick={onAuthNavigate} className="text-text-secondary hover:text-accent-gold transition-all duration-300 font-medium">
            تسجيل الدخول
          </button>
          <button onClick={onAuthNavigate} className="btn-primary text-primary-dark font-bold py-3 px-6 rounded-xl">
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
            <ParticleBackground />
            <LandingHeader onAuthNavigate={() => setView('auth')} />
            <main>
                <section className="desktop-hero py-20 sm:py-32 relative overflow-hidden">
                    <div className="container mx-auto px-6 relative z-10">
                        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                            <div className="text-center lg:text-right animate-slide-up">
                                <h1 className="text-5xl md:text-7xl font-extrabold text-text-primary leading-tight mb-6">
                                    اكتشف <span className="gradient-text">مسارك</span> المهني
                                    <br />
                                    <span className="text-accent-teal">بذكاء.</span>
                                </h1>
                                <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                                    سواء كنت موهبة تبحث عن فرصة أو شركة تبحث عن الأفضل، دع الذكاء الاصطناعي يرشدك للخطوة التالية.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <button onClick={() => setView('auth')} className="btn-primary text-primary-dark font-bold py-4 px-8 rounded-xl text-lg">
                                        ابدأ رحلتك المهنية
                                    </button>
                                    <button onClick={() => setView('auth')} className="glass-effect text-text-primary font-bold py-4 px-8 rounded-xl text-lg hover-lift">
                                        تصفح المواهب
                                    </button>
                                </div>
                            </div>
                            
                            <div className="animate-fade-in">
                                <div className="glass-effect p-8 rounded-2xl shadow-2xl">
                                    <h3 className="text-2xl font-bold text-text-primary mb-6 text-center">جرب الذكاء الاصطناعي الآن</h3>
                                    <textarea
                                        className="input-style mb-4"
                                        rows={4}
                                        placeholder="مثال: أنا مطور واجهة أمامية بخبرة في React و TypeScript وأبحث عن فرصة عمل عن بعد..."
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={handleAiInteraction}
                                        disabled={isLoading}
                                        className="btn-primary w-full text-primary-dark font-bold py-3 px-6 rounded-xl text-lg disabled:opacity-50"
                                    >
                                        {isLoading ? 'لحظات من فضلك...' : 'اكتشف الإمكانيات'}
                                    </button>
                                    {error && <p className="text-red-400 mt-4 text-center" role="alert">{error}</p>}
                                    {aiResponse && (
                                        <div className="mt-6 p-6 glass-effect rounded-xl">
                                            <p className="text-text-primary whitespace-pre-wrap leading-relaxed">{aiResponse}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Features Section */}
                <section className="py-20 bg-gradient-to-b from-primary-dark to-primary-surface">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16 animate-fade-in">
                            <h2 className="text-4xl font-bold text-text-primary mb-4">لماذا <span className="gradient-text">مسار</span>؟</h2>
                            <p className="text-xl text-text-secondary max-w-3xl mx-auto">منصة شاملة تجمع بين التكنولوجيا المتقدمة والخبرة البشرية لتقديم تجربة توظيف استثنائية</p>
                        </div>
                        
                        <div className="desktop-grid">
                            <div className="glass-effect p-8 rounded-2xl hover-lift card-animated">
                                <div className="w-16 h-16 bg-gradient-to-br from-accent-gold to-yellow-400 rounded-2xl flex items-center justify-center mb-6 animate-float">
                                    <svg className="w-8 h-8 text-primary-dark" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-text-primary mb-4">تقييم معتمد</h3>
                                <p className="text-text-secondary leading-relaxed">نظام تقييم شامل يضمن جودة المرشحين ويوفر للشركات الثقة في اختياراتها</p>
                            </div>
                            
                            <div className="glass-effect p-8 rounded-2xl hover-lift card-animated">
                                <div className="w-16 h-16 bg-gradient-to-br from-accent-teal to-blue-400 rounded-2xl flex items-center justify-center mb-6 animate-float" style={{animationDelay: '1s'}}>
                                    <svg className="w-8 h-8 text-primary-dark" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-text-primary mb-4">ذكاء اصطناعي متقدم</h3>
                                <p className="text-text-secondary leading-relaxed">خوارزميات ذكية تحلل المهارات وتطابق المرشحين مع الوظائف المناسبة بدقة عالية</p>
                            </div>
                            
                            <div className="glass-effect p-8 rounded-2xl hover-lift card-animated">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 animate-float" style={{animationDelay: '2s'}}>
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-text-primary mb-4">جواز سفر مهني</h3>
                                <p className="text-text-secondary leading-relaxed">ملف شخصي شامل يعرض المهارات والخبرات والمشاريع بطريقة احترافية وجذابة</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Stats Section */}
                <section className="py-20 bg-primary-dark">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="text-center animate-fade-in">
                                <div className="text-4xl lg:text-5xl font-bold gradient-text mb-2">1000+</div>
                                <div className="text-text-secondary">مرشح معتمد</div>
                            </div>
                            <div className="text-center animate-fade-in">
                                <div className="text-4xl lg:text-5xl font-bold gradient-text mb-2">500+</div>
                                <div className="text-text-secondary">شركة موثوقة</div>
                            </div>
                            <div className="text-center animate-fade-in">
                                <div className="text-4xl lg:text-5xl font-bold gradient-text mb-2">95%</div>
                                <div className="text-text-secondary">معدل نجاح التوظيف</div>
                            </div>
                            <div className="text-center animate-fade-in">
                                <div className="text-4xl lg:text-5xl font-bold gradient-text mb-2">24/7</div>
                                <div className="text-text-secondary">دعم فني</div>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* CTA Section */}
                <section className="py-20 bg-gradient-to-r from-primary-surface to-primary-dark">
                    <div className="container mx-auto px-6 text-center">
                        <div className="max-w-4xl mx-auto animate-slide-up">
                            <h2 className="text-4xl lg:text-5xl font-bold text-text-primary mb-6">
                                ابدأ رحلتك المهنية اليوم
                        </h1>
                        <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
                            انضم إلى آلاف المحترفين والشركات الذين وثقوا بمسار لتحقيق أهدافهم المهنية
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <button onClick={() => setView('auth')} className="btn-primary text-primary-dark font-bold py-4 px-10 rounded-xl text-xl">
                                إنشاء حساب مجاني
                            </button>
                            <button onClick={() => setView('auth')} className="glass-effect text-text-primary font-bold py-4 px-10 rounded-xl text-xl hover-lift">
                                تسجيل الدخول
                            </button>
                        </div>
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
