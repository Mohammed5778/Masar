
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'candidate' | 'recruiter' | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // The onAuthStateChange listener in App.tsx will handle the redirect.
            } else {
                if (!role) {
                    throw new Error('يرجى اختيار دورك لإكمال التسجيل.');
                }
                const { data, error } = await supabase.auth.signUp({ 
                    email, 
                    password,
                    options: {
                        data: {
                            role: role,
                        }
                    }
                });
                if (error) throw error;
                if (data.user && !data.session) {
                    setMessage('تم إرسال رابط التأكيد إلى بريدك الإلكتروني! يرجى التحقق منه لتسجيل الدخول.');
                }
            }
        } catch (err: any) {
            setError(err.error_description || err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleOAuthLogin = async (provider: 'google' | 'linkedin') => {
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
        // Supabase handles the redirect
    };

    const RoleSelector = () => (
        <div className="mb-8">
            <label className="block text-text-secondary text-base font-bold mb-4 text-center">اختر دورك للتسجيل</label>
            <div className="flex gap-6">
                <button
                    id="role-candidate"
                    type="button"
                    onClick={() => setRole('candidate')}
                    className={`flex-1 text-center p-4 rounded-xl border-2 transition-all duration-300 hover-lift ${role === 'candidate' ? 'btn-primary border-accent-gold text-primary-dark font-bold' : 'glass-effect border-primary-surface hover:border-accent-gold text-text-primary'}`}
                >
                    <label htmlFor="role-candidate" className="cursor-pointer">
                        <span className="block text-xl font-bold">باحث عن عمل</span>
                        <span className="text-sm opacity-80">(مرشح)</span>
                    </label>
                </button>
                <button
                    id="role-recruiter"
                    type="button"
                    onClick={() => setRole('recruiter')}
                    className={`flex-1 text-center p-4 rounded-xl border-2 transition-all duration-300 hover-lift ${role === 'recruiter' ? 'btn-primary border-accent-gold text-primary-dark font-bold' : 'glass-effect border-primary-surface hover:border-accent-gold text-text-primary'}`}
                >
                     <label htmlFor="role-recruiter" className="cursor-pointer">
                        <span className="block text-xl font-bold">باحث عن موظف</span>
                        <span className="text-sm opacity-80">(شركة)</span>
                    </label>
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary-surface to-primary-dark flex flex-col justify-center items-center p-4">
             <div className="text-4xl font-bold mb-8 animate-fade-in">
                <span className="gradient-text">مسار</span> 
                <span className="text-text-primary ml-2">Masar</span>
            </div>
            <div className="w-full max-w-lg glass-effect p-10 rounded-3xl shadow-2xl animate-slide-up">
                <h2 className="text-3xl font-bold text-text-primary text-center mb-4">{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h2>
                <p className="text-center text-text-secondary mb-10 text-lg">
                    {isLogin ? 'مرحباً بعودتك! ادخل بياناتك للمتابعة.' : 'انضم إلى سوق المواهب الأفضل في المنطقة.'}
                </p>

                {message && <div className="bg-green-900/30 border border-green-500/30 text-green-300 p-4 rounded-xl mb-6 text-center backdrop-blur-sm">{message}</div>}
                {error && <div className="bg-red-900/30 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-center backdrop-blur-sm">{error}</div>}

                {!isLogin && <RoleSelector />}

                <form onSubmit={handleAuthAction}>
                    <div className="mb-6">
                        <label className="block text-text-secondary text-base font-bold mb-3" htmlFor="email">
                            البريد الإلكتروني
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="input-style"
                            placeholder="📧 you@example.com"
                        />
                    </div>
                    <div className="mb-8">
                        <label className="block text-text-secondary text-base font-bold mb-3" htmlFor="password">
                            كلمة المرور
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="input-style"
                            placeholder="🔒 ••••••••••"
                        />
                    </div>
                    <div className="mb-8">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary text-primary-dark font-bold py-4 px-6 rounded-xl text-lg disabled:opacity-50"
                        >
                            {loading ? 'جاري...' : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')}
                        </button>
                    </div>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-primary-surface/50"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 glass-effect text-text-secondary rounded-lg">أو استمر عبر</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <button onClick={() => handleOAuthLogin('google')} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold py-4 px-6 rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 hover-lift">
                        <GoogleIcon />
                        <span>المتابعة باستخدام جوجل</span>
                    </button>
                    <button disabled={true} className="w-full flex items-center justify-center gap-3 bg-[#0A66C2] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        <LinkedInIcon />
                        <span>المتابعة باستخدام لينكد إن (قريباً)</span>
                    </button>
                </div>

                <p className="text-center text-text-secondary mt-10 text-lg">
                    {isLogin ? 'ليس لديك حساب؟' : 'هل لديك حساب بالفعل؟'}
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); setRole(null); }} className="font-bold text-accent-gold hover:text-yellow-400 transition-colors px-2">
                        {isLogin ? 'أنشئ حساباً' : 'سجل الدخول'}
                    </button>
                </p>
            </div>
        </div>
    );
};


const GoogleIcon = () => <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.012,36.49,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>;

const LinkedInIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-3.06v9.37h3.06v-4.66c0-.99.6-1.46 1.16-1.46.56 0 1.11.47 1.11 1.46v4.66h3.05M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69.75 1.68 1.68 0 0 0 0 1.88 1.68 1.68 0 0 0 1.69.74m-1.39 1.39h2.77v9.37H5.49v-9.37Z"></path></svg>;

export default AuthPage;
