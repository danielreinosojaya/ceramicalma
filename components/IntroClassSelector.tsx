

import React, { useState, useEffect, useMemo } from 'react';
import type { Product, IntroductoryClass, EnrichedIntroClassSession, IntroClassSession, AppData } from '../types';
import * as dataService from '../services/dataService';
import { useLanguage } from '../context/LanguageContext';
import { InstructorTag } from './InstructorTag';
import { CapacityIndicator } from './CapacityIndicator';
import { ClockIcon } from './icons/ClockIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { InfoCircleIcon } from './icons/InfoCircleIcon';
import { PaintBrushIcon } from './icons/PaintBrushIcon';

interface IntroClassSelectorProps {
  onConfirm: (product: Product, session: IntroClassSession) => void;
  // FIX: Add appData prop
  appData: AppData;
}

export const IntroClassSelector: React.FC<IntroClassSelectorProps> = ({ onConfirm, appData }) => {
  const { t, language } = useLanguage();
  const [introClasses, setIntroClasses] = useState<IntroductoryClass[]>([]);
  const [selectedSession, setSelectedSession] = useState<EnrichedIntroClassSession | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<IntroductoryClass | null>(null);

  useEffect(() => {
    const activeIntroClasses = appData.products
        .filter(p => p.isActive && p.type === 'INTRODUCTORY_CLASS') as IntroductoryClass[];
    setIntroClasses(activeIntroClasses);
  }, [appData.products]);

  const handleSessionSelect = (product: IntroductoryClass, session: EnrichedIntroClassSession) => {
    if (selectedSession?.id === session.id) {
        setSelectedSession(null);
        setSelectedProduct(null);
    } else {
        setSelectedSession(session);
        setSelectedProduct(product);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedProduct && selectedSession) {
      onConfirm(selectedProduct, selectedSession);
    }
  };
  
  if (introClasses.length === 0) {
    return (
      <div className="text-center p-6 bg-brand-surface rounded-xl shadow-subtle">
        <h2 className="text-3xl font-semibold text-brand-text mb-2">{t('introClass.title')}</h2>
        <p className="text-brand-secondary">Actualmente no hay clases introductorias programadas. ¡Vuelve pronto!</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-brand-surface rounded-xl shadow-subtle animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-brand-text mb-2">{t('introClass.title')}</h2>
        <p className="text-brand-secondary">{t('introClass.subtitle')}</p>
      </div>
      
      <div className="space-y-12">
        {introClasses.map(product => {
            // FIX: Use dataService utility with appData
            const availableSessions = dataService.generateIntroClassSessions(product, { bookings: appData.bookings }, { includeFull: true });

            return (
              <div key={product.id} className="grid md:grid-cols-2 gap-8 items-start">
                {/* Product Info */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-brand-primary">{product.name}</h3>
                  <p className="text-brand-secondary">{product.description}</p>
                  <div className="text-4xl font-bold text-brand-text">${product.price}</div>
                  
                  <div className="space-y-4 text-sm">
                      <div className="flex items-start"><ClockIcon className="w-5 h-5 mr-3 mt-0.5 text-brand-primary flex-shrink-0" /> {product.details.duration}</div>
                      <div className="flex items-start"><InfoCircleIcon className="w-5 h-5 mr-3 mt-0.5 text-brand-primary flex-shrink-0" /> {product.details.generalRecommendations}</div>
                      <div className="flex items-start"><PaintBrushIcon className="w-5 h-5 mr-3 mt-0.5 text-brand-primary flex-shrink-0" /> {product.details.materials}</div>
                  </div>
                </div>

                {/* Session Selection */}
                <div className="bg-brand-background p-4 rounded-lg">
                    <h4 className="font-bold text-center text-brand-text mb-3">Fechas Disponibles</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2 -mr-2">
                        {availableSessions.length > 0 ? availableSessions.map(session => {
                            const isFull = session.paidBookingsCount >= session.capacity;
                            const isSelected = selectedSession?.id === session.id;

                            return (
                                <button
                                    key={session.id}
                                    onClick={() => {
                                        if (!isFull) {
                                          handleSessionSelect(product, session);
                                        }
                                    }}
                                    disabled={isFull}
                                    className={`relative w-full flex flex-col sm:flex-row items-center justify-between p-3 rounded-lg text-left transition-all duration-200 overflow-hidden ${
                                        isSelected ? 'bg-brand-primary text-white shadow-md' : 'bg-white hover:shadow-subtle'
                                    } ${isFull ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    {isFull && (
                                        <div className="absolute -top-1 -right-7 bg-red-600 text-white text-[10px] font-bold px-6 py-0.5 transform rotate-45">
                                            {t('app.soldOut')}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold">{new Date(session.date + 'T00:00:00').toLocaleDateString(language, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                        <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-brand-secondary'}`}>{session.time}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                        <InstructorTag instructorId={session.instructorId} instructors={appData.instructors} />
                                        <CapacityIndicator count={session.totalBookingsCount} max={session.capacity} capacityMessages={appData.capacityMessages} />
                                    </div>
                                </button>
                            )
                        }) : <p className="text-sm text-center py-4 text-brand-secondary">{t('admin.introClassModal.noSessions')}</p>}
                    </div>
                     {selectedSession && selectedProduct?.id === product.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={handleConfirmSelection}
                          className="w-full bg-brand-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-accent transition-colors duration-300 animate-fade-in"
                        >
                          {t('introClass.continueButton')}
                        </button>
                      </div>
                    )}
                </div>
              </div>
            )
        })}
      </div>
    </div>
  );
};