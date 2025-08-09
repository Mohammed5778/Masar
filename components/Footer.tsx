
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-surface border-t border-primary-dark/50">
      <div className="container mx-auto px-6 py-6 text-center text-text-secondary">
        <p>&copy; {new Date().getFullYear()} شركة مسار. جميع الحقوق محفوظة.</p>
        <p className="text-sm mt-2">
            صُمم ليساعدك في إيجاد <span className="text-accent-gold">مسارك</span> المهني بذكاء.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
