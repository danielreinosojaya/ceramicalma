
import React, { useState, useEffect } from 'react';
import type { Product, OpenStudioSubscription, ClassPackage } from '../types';
import { useLanguage } from '../context/LanguageContext';
import * as dataService from '../services/dataService';
import { KeyIcon } from './icons/KeyIcon';

interface PackageSelectorProps {
  onSelect: (pkg: Product) => void;
}

export const PackageSelector: React.FC<PackageSelectorProps> = ({ onSelect }) => {
  const { t } = useLanguage();
  const [packages, setPackages] = useState<Product[]>([]);

  useEffect(() => {
    const fetchPackages = async () => {
      const allProducts = await dataService.getProducts();
      const activePackages = allProducts.filter(p => p.isActive && (p.type === 'CLASS_PACKAGE' || p.type === 'OPEN_STUDIO_SUBSCRIPTION'));
      setPackages(activePackages);
    };
    fetchPackages();
  }, []);

  return (
    <div className="text-center p-6 bg-brand-surface rounded-xl shadow-subtle">
      <h2 className="text-3xl font-semibold text-brand-text mb-2">{t('packages.title')}</h2>
      <p className="text-brand-secondary mb-8">{t('packages.subtitle')}</p>
      <div className="grid md:grid-cols-3 gap-8">
        {packages.map((pkg) => {
          if (pkg.type === 'OPEN_STUDIO_SUBSCRIPTION') {
            const openStudioPkg = pkg as OpenStudioSubscription;
            return (
              <div
                key={openStudioPkg.id}
                className="bg-brand-surface rounded-xl shadow-subtle hover:shadow-lifted transition-all duration-300 cursor-pointer flex flex-col transform hover:-translate-y-1 group"
                onClick={() => onSelect(openStudioPkg)}
              >
                <div className="flex-grow flex">
                  {/* Accent Panel */}
                  <div className="w-1/4 bg-brand-primary bg-brushed-clay flex flex-col items-center justify-center p-4 rounded-l-xl">
                    <KeyIcon className="w-12 h-12 text-white/80 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  
                  {/* Main Content */}
                  <div className="w-3/4 p-6 flex flex-col text-left">
                     <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-brand-background text-brand-secondary self-start">
                       {t('admin.productManager.openStudioSubscription')}
                     </span>
                    <h3 className="text-2xl font-semibold text-brand-text mt-2">{openStudioPkg.name}</h3>
                    <p className="text-brand-secondary/90 mt-2 text-sm flex-grow">{openStudioPkg.description}</p>
                    <div className="mt-4 pt-4 border-t border-brand-border/60">
                      <p className="text-4xl font-bold text-brand-text">${openStudioPkg.price}<span className="text-base font-normal text-brand-secondary"> / {t('packages.perMonth')}</span></p>
                    </div>
                  </div>
                </div>
                 {/* Footer Button */}
                <div className="p-4 border-t border-brand-border/60">
                   <button className="w-full border-2 border-brand-primary text-brand-primary font-bold py-2 px-5 rounded-lg group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
                      {t('packages.selectSubscriptionButton')}
                    </button>
                </div>
              </div>
            );
          } else if (pkg.type === 'CLASS_PACKAGE') {
            return (
              <div 
                key={pkg.id} 
                className="bg-brand-surface rounded-xl overflow-hidden shadow-subtle hover:shadow-lifted transition-all duration-300 cursor-pointer flex flex-col transform hover:-translate-y-1"
                onClick={() => onSelect(pkg)}
              >
                <div className="aspect-[4/3] w-full bg-brand-background overflow-hidden group">
                  {pkg.imageUrl ? (
                    <img 
                      src={pkg.imageUrl} 
                      alt={pkg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-semibold text-brand-accent">{t('header.title')}</span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex-grow flex flex-col text-left">
                  <h3 className="text-2xl font-semibold text-brand-primary">{pkg.name}</h3>
                  <p className="text-4xl font-bold text-brand-text my-4">${pkg.price}</p>
                  
                  <p className="text-brand-secondary font-semibold">{pkg.classes} {t('packages.classes')}</p>
                  
                  <p className="text-brand-secondary mt-2 text-sm flex-grow min-h-[3.5rem]">{pkg.description}</p>
                  <button className="mt-6 bg-brand-primary text-white font-bold py-3 px-6 rounded-lg w-full hover:opacity-90 transition-opacity duration-300">
                    {t('packages.selectButton')}
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};
