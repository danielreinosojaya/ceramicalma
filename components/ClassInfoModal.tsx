
import React from 'react';
import type { ClassPackage, IntroductoryClass } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ClockIcon } from './icons/ClockIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { InfoCircleIcon } from './icons/InfoCircleIcon';
import { PaintBrushIcon } from './icons/PaintBrushIcon';

export const ClassInfoModal: React.FC<{
  pkg: ClassPackage | IntroductoryClass;
  onClose: () => void;
}> = ({ pkg, onClose }) => {
  const { t } = useLanguage();

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-brand-surface rounded-xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h2 className="text-3xl font-semibold text-brand-primary">{pkg.name}</h2>
          <p className="text-brand-secondary mt-2">{pkg.description}</p>
        </div>

        <div className="flex-grow overflow-y-auto pr-4 -mr-4 text-brand-secondary space-y-4">
          <div className="flex items-start">
            <ClockIcon className="w-5 h-5 mr-3 mt-1 text-brand-primary flex-shrink-0" />
            <div>
              <span className="font-bold text-brand-text">{t('modal.durationLabel')}:</span> {pkg.details.duration}
            </div>
          </div>
          <div className="flex items-start">
            <SparklesIcon className="w-5 h-5 mr-3 mt-1 text-brand-primary flex-shrink-0" />
            <div>
              <span className="font-bold text-brand-text">{t('modal.activitiesLabel')}:</span>
              <ul className="list-disc list-inside ml-1">
                {pkg.details.activities.map((activity, index) => (
                  <li key={index}>{activity}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-start">
            <InfoCircleIcon className="w-5 h-5 mr-3 mt-1 text-brand-primary flex-shrink-0" />
            <div>
              <span className="font-bold text-brand-text">{t('modal.generalRecommendationsLabel')}:</span> {pkg.details.generalRecommendations}
            </div>
          </div>
          <div className="flex items-start">
            <PaintBrushIcon className="w-5 h-5 mr-3 mt-1 text-brand-primary flex-shrink-0" />
            <div>
              <span className="font-bold text-brand-text">{t('modal.materialsLabel')}:</span> {pkg.details.materials}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-brand-border flex justify-end">
          <button
            onClick={onClose}
            className="bg-brand-primary text-white font-bold py-2 px-8 rounded-lg hover:bg-brand-accent transition-colors"
          >
            {t('modal.closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
};
