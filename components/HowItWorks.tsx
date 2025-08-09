import React, { useState } from 'react';

const StepCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="glass-effect p-8 rounded-2xl text-center flex flex-col items-center shadow-lg border border-primary-surface/50 card-animated hover-lift">
    <div className="bg-gradient-to-br from-accent-gold to-yellow-400 rounded-2xl p-5 mb-6 inline-flex shadow-lg animate-float">{icon}</div>
    <h3 className="text-2xl font-bold text-text-primary mb-4">{title}</h3>
    <p className="text-text-secondary leading-relaxed text-lg">{description}</p>
  </div>
);

const HowItWorks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'companies' | 'candidates'>('companies');

  const companySteps = [
    { icon: <SearchIcon />, title: "تصفح المواهب المعتمدة", description: "استخدم فلاتر البحث الذكية للعثور على المرشحين المثاليين في سوق المواهب لدينا." },
    { icon: <PassportIcon />, title: "راجع جواز السفر المهني", description: "احصل على رؤى عميقة من خلال تقييمات المهارات والمقابلات المسجلة والتحليلات." },
    { icon: <HireIcon />, title: "وظّف مباشرة", description: "أرسل عرضًا وظيفيًا أو قم بإجراء مقابلة نهائية قصيرة. اختصر 90% من وقت التوظيف." },
  ];

  const candidateSteps = [
    { icon: <AssessIcon />, title: "تقييم شامل لمرة واحدة", description: "أجرِ سلسلة من المقابلات والاختبارات الموحدة التي تقيّم مهاراتك بشكل كامل." },
    { icon: <CertifiedIcon />, title: "احصل على جوازك المهني", description: "ملف شخصي موثق يعرض نقاط قوتك ونتائجك التفصيلية لزيادة جاذبيتك للشركات." },
    { icon: <OfferIcon />, title: "استقبل عروض وظيفية", description: "اجعل ملفك متاحًا لمئات الشركات ودع الفرص تأتي إليك دون عناء البحث." },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-primary-dark to-primary-surface">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-text-primary mb-6">كيف يعمل <span className="gradient-text">مسار</span>؟</h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
          نحن نغير عملية التوظيف من خلال التركيز على النتائج، وليس فقط الإجراءات.
          </p>
        </div>

        <div className="flex justify-center mb-16">
          <div className="glass-effect p-2 rounded-2xl flex gap-3 shadow-lg">
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 text-lg ${activeTab === 'companies' ? 'btn-primary text-primary-dark shadow-lg' : 'text-text-primary hover:bg-primary-surface/50'}`}
            >
              للشركات
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 text-lg ${activeTab === 'candidates' ? 'btn-primary text-primary-dark shadow-lg' : 'text-text-primary hover:bg-primary-surface/50'}`}
            >
              للمرشحين
            </button>
          </div>
        </div>

        <div className="desktop-grid">
          {(activeTab === 'companies' ? companySteps : candidateSteps).map((step, index) => (
            <StepCard key={index} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
};


// SVG Icons
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const PassportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4z" /></svg>;
const HireIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.97l-1.9 3.8z" /></svg>;
const AssessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const CertifiedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
const OfferIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;

export default HowItWorks;
