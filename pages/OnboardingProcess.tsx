import React, { useState, useEffect, useCallback } from 'react';
import { getProfile, upsertProfile, uploadProfilePicture } from '../services/profileService';
import { parseCvText, generateAssessment, evaluateAssessment, parseCvPdf } from '../services/geminiService';
import type { Session } from '@supabase/supabase-js';
import type { UserProfileData, AssessmentQuestion, UserAnswer } from '../types';

interface OnboardingProcessProps {
  session: Session;
  onOnboardingComplete: (profile: UserProfileData) => void;
}

type OnboardingStep = 'profile_data' | 'photo' | 'goal' | 'assessment' | 'result';

const STEPS: { id: OnboardingStep; title: string }[] = [
    { id: 'profile_data', title: 'بياناتك الأساسية' },
    { id: 'photo', title: 'صورتك الشخصية' },
    { id: 'goal', title: 'هدفك الوظيفي' },
    { id: 'assessment', title: 'تقييم الكفاءة' },
    { id: 'result', title: 'النتيجة' },
];

// Reusable Input Component
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`input-style ${props.className || ''}`} />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className={`input-style ${props.className || ''}`} />
);

const Button: React.FC<{onClick?: () => void; children: React.ReactNode; disabled?: boolean; variant?: 'primary' | 'secondary'}> = ({ onClick, children, disabled, variant = 'primary'}) => {
    const baseClasses = "font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const primaryClasses = "bg-accent-gold text-primary-dark hover:bg-yellow-500";
    const secondaryClasses = "bg-primary-surface text-text-primary hover:bg-opacity-80";
    return (
        <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variant === 'primary' ? primaryClasses : secondaryClasses}`}>
            {children}
        </button>
    );
};


const OnboardingProcess: React.FC<OnboardingProcessProps> = ({ session, onOnboardingComplete }) => {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile_data');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profile, setProfile] = useState<Partial<UserProfileData>>({});
    const [error, setError] = useState('');
    const [assessment, setAssessment] = useState<AssessmentQuestion[]>([]);
    const [answers, setAnswers] = useState<UserAnswer[]>([]);
    
    // --- Data Fetching ---
    const fetchUserProfile = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProfile(session.user);
            if (data) {
                setProfile(data);
                // Logic to determine starting step based on fetched profile
                if (!data.full_name || !data.title || data.skills.length === 0) setCurrentStep('profile_data');
                else if (!data.photo_url) setCurrentStep('photo');
                else if (!data.job_goal) setCurrentStep('goal');
                else if (!data.is_certified) setCurrentStep('assessment');
                else setCurrentStep('result');
            }
        } catch (e: any) {
             if (e instanceof Error && e.message === 'TABLE_NOT_FOUND') {
                setError("خطأ في الإعداد: جدول 'profiles' غير موجود. يرجى مراجعة مسؤول النظام.");
            } else {
                setError('حدث خطأ أثناء جلب ملفك الشخصي.');
            }
        } finally {
            setLoading(false);
        }
    }, [session.user]);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);


    // --- State Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(Boolean);
        setProfile(prev => ({ ...prev, skills: skillsArray }));
    };

    const handleNextStep = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            // Save progress before moving to the next step
            const updatedProfile = await upsertProfile({ ...profile, id: session.user.id });
            onOnboardingComplete(updatedProfile); // Update parent state immediately
            setProfile(updatedProfile);
            
            // Move to next step
            const currentIndex = STEPS.findIndex(s => s.id === currentStep);
            if (currentIndex < STEPS.length - 1) {
                const nextStepId = STEPS[currentIndex + 1].id;
                // If moving to assessment, generate it first
                if (nextStepId === 'assessment' && assessment.length === 0) {
                   const generatedAssessment = await generateAssessment(updatedProfile as UserProfileData);
                   setAssessment(generatedAssessment);
                }
                setCurrentStep(nextStepId);
            }
        } catch (e: any) {
            setError(e.message || 'فشل حفظ البيانات.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSubmitting(true);
        setError('');
        try {
            const photoUrl = await uploadProfilePicture(session.user.id, file);
            const updatedProfile = { ...profile, photo_url: photoUrl };
            setProfile(updatedProfile);
            await upsertProfile({id: session.user.id, photo_url: photoUrl});
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleAnswerChange = (question: string, answer: string) => {
        setAnswers(prev => {
            const existing = prev.find(a => a.question === question);
            if (existing) {
                return prev.map(a => a.question === question ? { ...a, answer } : a);
            }
            return [...prev, { question, answer }];
        });
    }

    const handleSubmitAssessment = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            const { score, passed } = await evaluateAssessment(assessment, answers);
            const finalProfile = await upsertProfile({ 
                id: session.user.id,
                assessment_score: score,
                is_certified: passed,
            });
            setProfile(finalProfile);
            setCurrentStep('result');
            // Final update to parent component
            onOnboardingComplete(finalProfile);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Render Methods for Steps ---
    const renderStepContent = () => {
        switch (currentStep) {
            case 'profile_data': return <ProfileDataStep profile={profile} onInputChange={handleInputChange} onSkillsChange={handleSkillsChange} setProfile={setProfile}/>;
            case 'photo': return <PhotoStep profile={profile} onPhotoUpload={handlePhotoUpload} isSubmitting={isSubmitting} />;
            case 'goal': return <JobGoalStep profile={profile} onInputChange={handleInputChange} />;
            case 'assessment': return <AssessmentStep questions={assessment} onAnswerChange={handleAnswerChange} answers={answers} />;
            case 'result': return <ResultStep profile={profile} />;
            default: return null;
        }
    };
    
    if (loading) return (
      <div className="min-h-screen bg-primary-dark flex flex-col justify-center items-center gap-4">
          <div className="w-16 h-16 border-4 border-t-accent-gold border-primary-surface rounded-full animate-spin"></div>
          <div className="text-text-primary text-2xl font-cairo">جاري تهيئة الإعداد...</div>
      </div>
    );

    return (
        <div className="container mx-auto px-6 py-10">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    {STEPS.map(step => (
                        <div key={step.id} className="text-center w-full">
                            <span className={`text-sm ${STEPS.findIndex(s => s.id === currentStep) >= STEPS.findIndex(s => s.id === step.id) ? 'text-accent-gold' : 'text-text-secondary'}`}>{step.title}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-primary-surface rounded-full h-2.5">
                    <div className="bg-accent-gold h-2.5 rounded-full transition-all duration-500" style={{ width: `${((STEPS.findIndex(s => s.id === currentStep) + 1) / STEPS.length) * 100}%` }}></div>
                </div>
            </div>

            <div className="bg-primary-surface p-8 rounded-xl min-h-[400px] shadow-2xl">
                {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg mb-4 text-center">{error}</div>}
                
                {renderStepContent()}

                {/* Navigation Buttons */}
                <div className="mt-8 pt-4 border-t border-primary-dark flex justify-end">
                    {currentStep === 'assessment' ? (
                        <Button onClick={handleSubmitAssessment} disabled={isSubmitting || answers.length < assessment.length}>
                            {isSubmitting ? 'جاري التقييم...' : 'إنهاء وإرسال التقييم'}
                        </Button>
                    ) : currentStep !== 'result' ? (
                        <Button onClick={handleNextStep} disabled={isSubmitting}>
                            {isSubmitting ? 'جاري الحفظ...' : 'التالي'}
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};


// --- Step Components ---
type InputMethod = 'manual' | 'text' | 'pdf';

const ProfileDataStep: React.FC<{profile: Partial<UserProfileData>, onInputChange: any, onSkillsChange: any, setProfile: any}> = ({ profile, onInputChange, onSkillsChange, setProfile}) => {
    const [cvText, setCvText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState('');
    const [inputMethod, setInputMethod] = useState<InputMethod>('manual');

    const handleParseCvText = async () => {
        if (!cvText) {
            setParseError('يرجى لصق نص السيرة الذاتية أولاً.');
            return;
        }
        setIsParsing(true);
        setParseError('');
        try {
            const parsedData = await parseCvText(cvText);
            setProfile((prev: UserProfileData) => ({...prev, ...parsedData}));
        } catch (e: any) {
            setParseError(e.message);
        } finally {
            setIsParsing(false);
        }
    };
    
    const handleParseCvPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setParseError('');
        try {
            const parsedData = await parseCvPdf(file);
            setProfile((prev: UserProfileData) => ({ ...prev, ...parsedData }));
        } catch (e: any) {
            setParseError(e.message);
        } finally {
            setIsParsing(false);
        }
    };

    const TabButton: React.FC<{method: InputMethod, children: React.ReactNode}> = ({ method, children }) => (
        <button
            onClick={() => setInputMethod(method)}
            className={`flex-1 text-center p-3 font-bold rounded-t-lg transition-all duration-200 border-b-2 ${inputMethod === method ? 'text-accent-gold border-accent-gold' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
            {children}
        </button>
    );

    return (
    <div>
        <h2 className="text-2xl font-bold text-text-primary mb-6">أخبرنا عنك</h2>
        
        <div className="flex mb-4">
            <TabButton method="manual">إدخال يدوي</TabButton>
            <TabButton method="text">لصق نص</TabButton>
            <TabButton method="pdf">رفع ملف PDF</TabButton>
        </div>
        
        {parseError && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg mb-4 text-center">{parseError}</div>}
        {isParsing && <div className="text-center text-text-secondary p-4">جاري تحليل البيانات بالذكاء الاصطناعي...</div>}

        <div className={inputMethod === 'manual' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-sm font-bold text-text-secondary mb-2 block">الاسم الكامل</label>
                    <Input name="full_name" placeholder="الاسم الكامل" value={profile.full_name || ''} onChange={onInputChange} />
                </div>
                <div>
                    <label className="text-sm font-bold text-text-secondary mb-2 block">المسمى الوظيفي</label>
                    <Input name="title" placeholder="المسمى الوظيفي" value={profile.title || ''} onChange={onInputChange} />
                </div>
                <div>
                    <label className="text-sm font-bold text-text-secondary mb-2 block">سنوات الخبرة</label>
                    <Input type="number" name="experience_years" placeholder="سنوات الخبرة" value={profile.experience_years || ''} onChange={onInputChange} />
                </div>
                <div>
                    <label className="text-sm font-bold text-text-secondary mb-2 block">المهارات (افصل بفاصلة)</label>
                    <Input name="skills" placeholder="المهارات" value={profile.skills?.join(', ') || ''} onChange={onSkillsChange} />
                </div>
                <div className="md:col-span-2">
                    <label className="text-sm font-bold text-text-secondary mb-2 block">ملخص مهني</label>
                    <Textarea name="summary" placeholder="ملخص مهني..." value={profile.summary || ''} onChange={onInputChange} rows={5} />
                </div>
            </div>
        </div>

        <div className={inputMethod === 'text' ? 'block' : 'hidden'}>
             <div className="bg-primary-dark p-4 rounded-lg">
                <label className="text-sm font-bold text-text-secondary mb-2 block">الصق سيرتك الذاتية هنا للتحليل الذكي</label>
                <Textarea placeholder="الصق نص سيرتك الذاتية هنا..." value={cvText} onChange={(e) => setCvText(e.target.value)} rows={8} />
                <Button onClick={handleParseCvText} disabled={isParsing} variant="secondary">
                   {isParsing ? 'جاري التحليل...' : 'تحليل النص'}
                </Button>
            </div>
        </div>
        
         <div className={inputMethod === 'pdf' ? 'block' : 'hidden'}>
             <div className="bg-primary-dark p-6 rounded-lg text-center">
                <label htmlFor="pdf-upload" className="w-full max-w-sm mx-auto bg-accent-gold text-primary-dark font-bold py-3 px-6 rounded-lg hover:bg-yellow-500 transition-colors cursor-pointer text-center inline-block">
                    {isParsing ? 'جاري التحليل...' : 'اختر ملف PDF'}
                </label>
                <input id="pdf-upload" type="file" accept=".pdf" onChange={handleParseCvPdf} className="hidden" disabled={isParsing} />
                <p className="text-text-secondary text-sm mt-4">سنقوم بتحليل ملفك واستخلاص البيانات تلقائياً.</p>
            </div>
        </div>

    </div>
    );
};


const PhotoStep: React.FC<{profile: Partial<UserProfileData>, onPhotoUpload: any, isSubmitting: boolean}> = ({profile, onPhotoUpload, isSubmitting}) => (
    <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-6">صورتك الشخصية الاحترافية</h2>
        <div className="flex flex-col items-center gap-6">
            <img 
              src={profile.photo_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23A8B2D1'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"} 
              alt="Profile" 
              className="w-40 h-40 rounded-full object-cover bg-primary-dark border-4 border-primary-surface" 
            />
            <label htmlFor="photo-upload" className="w-full max-w-xs bg-accent-gold text-primary-dark font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors cursor-pointer text-center">
                {isSubmitting ? 'جاري الرفع...' : 'اختر صورة'}
            </label>
            <input id="photo-upload" type="file" accept="image/png, image/jpeg" onChange={onPhotoUpload} className="hidden" disabled={isSubmitting} />
            <p className="text-text-secondary text-sm">اختر صورة واضحة للوجه لزيادة فرصك.</p>
        </div>
    </div>
);

const JobGoalStep: React.FC<{profile: Partial<UserProfileData>, onInputChange: any}> = ({ profile, onInputChange}) => (
    <div className="max-w-lg mx-auto text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-4">ما هو هدفك الوظيفي؟</h2>
        <p className="text-text-secondary mb-6">ما هو المسمى الوظيفي الذي تبحث عنه؟ سنستخدم هذه المعلومة لإنشاء تقييم مخصص لك.</p>
        <Input name="job_goal" placeholder="مثال: مطور واجهة أمامية أول (Senior Frontend Developer)" value={profile.job_goal || ''} onChange={onInputChange} />
    </div>
);


const AssessmentStep: React.FC<{questions: AssessmentQuestion[], answers: UserAnswer[], onAnswerChange: any}> = ({questions, answers, onAnswerChange}) => (
    <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">تقييم الكفاءة</h2>
        <p className="text-text-secondary mb-6">أجب على الأسئلة التالية بتركيز. سيتم تقييم إجاباتك لتحديد اعتمادك.</p>
        {questions.length === 0 ? <p className="text-center">جاري إنشاء التقييم المخصص لك...</p> : (
            <div className="space-y-6">
                {questions.map((q, index) => (
                    <div key={index} className="bg-primary-dark p-4 rounded-lg">
                        <p className="font-bold mb-3">{index + 1}. {q.question}</p>
                        {q.type === 'multiple_choice' ? (
                            <div className="space-y-2">
                                {q.options?.map((opt, i) => (
                                    <label key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-primary-surface cursor-pointer">
                                        <input type="radio" name={`q_${index}`} value={opt} onChange={(e) => onAnswerChange(q.question, e.target.value)} className="form-radio text-accent-gold bg-primary-dark border-primary-surface focus:ring-accent-gold" />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <Textarea rows={4} placeholder="اكتب إجابتك هنا..." onChange={(e) => onAnswerChange(q.question, e.target.value)} />
                        )}
                    </div>
                ))}
            </div>
        )}
    </div>
);

const ResultStep: React.FC<{profile: Partial<UserProfileData>}> = ({ profile }) => (
    <div className="text-center py-10">
        {profile.is_certified ? (
            <>
                <div className="text-green-400 mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-text-primary mb-2">تهانينا! لقد تم اعتمادك.</h2>
                <p className="text-text-secondary text-lg mb-4">لقد حصلت على درجة <span className="font-bold text-accent-gold">{profile.assessment_score}%</span>.</p>
                <p className="text-text-secondary">ملفك الشخصي الآن مرئي للشركات في سوق المواهب. حظاً موفقاً!</p>
            </>
        ) : (
             <>
                <div className="text-red-400 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-text-primary mb-2">لم يتم الاعتماد هذه المرة</h2>
                <p className="text-text-secondary text-lg mb-4">لقد حصلت على درجة <span className="font-bold text-accent-gold">{profile.assessment_score}%</span>. درجة النجاح هي 70%.</p>
                <p className="text-text-secondary">لا تقلق، يمكنك تحسين ملفك الشخصي والمحاولة مرة أخرى لاحقاً.</p>
            </>
        )}
    </div>
);


export default OnboardingProcess;
