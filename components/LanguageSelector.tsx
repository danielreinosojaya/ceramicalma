import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <button 
        onClick={() => setLanguage('es')}
        className={`px-2.5 py-1 rounded-md text-sm font-bold transition-all duration-200 ${language === 'es' ? 'bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/50' : 'text-brand-secondary/70 hover:bg-brand-background hover:text-brand-secondary'}`}
        aria-label="Cambiar a español"
      >
        ES
      </button>
      <button 
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-md text-sm font-bold transition-all duration-200 ${language === 'en' ? 'bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/50' : 'text-brand-secondary/70 hover:bg-brand-background hover:text-brand-secondary'}`}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
};
