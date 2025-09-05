

import React, { useState, useEffect } from 'react';
import type { Product, IntroductoryClass, EnrichedIntroClassSession, IntroClassSession, AppData } from '../types';
import * as dataService from '../services/dataService';
import { useLanguage } from '../context/LanguageContext';
import { InstructorTag } from './InstructorTag';
import { CapacityIndicator } from './CapacityIndicator';
import { ClockIcon } from './icons/ClockIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { InfoCircleIcon } from './icons/InfoCircleIcon';
import { PaintBrushIcon } from './icons/PaintBrushIcon';
import { IntroClassWizard } from './IntroClassWizard';

interface IntroClassSelectorProps {
  onConfirm: (product: Product, session: IntroClassSession) => void;
  appData: AppData;
}

export const IntroClassSelector: React.FC<IntroClassSelectorProps> = ({ onConfirm, appData }) => {
  const { t, language } = useLanguage();
  const [introClasses, setIntroClasses] = useState<IntroductoryClass[]>([]);
  
  useEffect(() => {
    const activeIntroClasses = appData.products
        .filter(p => p.isActive && p.type === 'INTRODUCTORY_CLASS') as IntroductoryClass[];
    setIntroClasses(activeIntroClasses);
  }, [appData.products]);


  if (introClasses.length === 0) {
    return (
      <div className="text-center p-6 bg-brand-surface rounded-xl shadow-subtle">
        <h2 className="text-3xl font-semibold text-brand-text mb-2">{t('introClass.title')}</h2>
        <p className="text-brand-secondary">Actualmente no hay clases introductorias programadas. ¡Vuelve pronto!</p>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-6 bg-brand-surface rounded-xl shadow-none sm:shadow-subtle animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-brand-text mb-2">{t('introClass.title')}</h2>
        <p className="text-brand-secondary">{t('introClass.subtitle')}</p>
      </div>
      
      <div className="space-y-12">
        {introClasses.map(product => {
            const allSessions = dataService.generateIntroClassSessions(product, { bookings: appData.bookings }, { includeFull: true });
            
            return (
                 <IntroClassWizard 
                    key={product.id}
                    product={product}
                    sessions={allSessions}
                    onConfirm={onConfirm}
                    appData={appData}
                />
            );
        })}
      </div>
    </div>
  );
};
