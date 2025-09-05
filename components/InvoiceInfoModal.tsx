import React, { useState } from 'react';
import type { BillingDetails } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface InvoiceInfoModalProps {
  onClose: () => void;
  onSubmit: (details: BillingDetails) => void;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-semibold text-brand-secondary mb-1">{label}</label>
        <input 
            {...props}
            className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary"
        />
    </div>
);

export const InvoiceInfoModal: React.FC<InvoiceInfoModalProps> = ({ onClose, onSubmit }) => {
    const { t } = useLanguage();
    const [details, setDetails] = useState<BillingDetails>({
        businessName: '',
        taxId: '',
        address: '',
        email: ''
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(details);
        setIsSubmitted(true);
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-brand-surface rounded-xl shadow-2xl p-8 w-full max-w-lg animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                {isSubmitted ? (
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-brand-primary mb-4">{t('confirmation.invoice.successTitle')}</h2>
                        <p className="text-brand-secondary mb-6">{t('confirmation.invoice.successMessage')}</p>
                        <button
                            onClick={onClose}
                            className="bg-brand-primary text-white font-bold py-2 px-8 rounded-lg hover:opacity-90"
                        >
                            {t('confirmation.invoice.closeButton')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-semibold text-brand-primary">{t('confirmation.invoice.title')}</h2>
                            <p className="text-brand-secondary mt-1">{t('confirmation.invoice.subtitle')}</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <InputField 
                                id="businessName" 
                                name="businessName"
                                label={t('confirmation.invoice.businessNameLabel')}
                                value={details.businessName}
                                onChange={handleChange}
                                placeholder={t('confirmation.invoice.businessNamePlaceholder')}
                                required 
                            />
                            <InputField 
                                id="taxId"
                                name="taxId" 
                                label={t('confirmation.invoice.taxIdLabel')}
                                value={details.taxId}
                                onChange={handleChange}
                                placeholder={t('confirmation.invoice.taxIdPlaceholder')}
                                required 
                            />
                            <InputField 
                                id="address"
                                name="address" 
                                label={t('confirmation.invoice.addressLabel')}
                                value={details.address}
                                onChange={handleChange}
                                placeholder={t('confirmation.invoice.addressPlaceholder')}
                                required 
                            />
                            <InputField 
                                id="email"
                                name="email" 
                                type="email"
                                label={t('confirmation.invoice.emailLabel')}
                                value={details.email}
                                onChange={handleChange}
                                placeholder={t('confirmation.invoice.emailPlaceholder')}
                                required 
                            />
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={onClose} className="bg-white border border-brand-secondary text-brand-secondary font-bold py-2 px-6 rounded-lg hover:bg-gray-100">
                                    {t('admin.productManager.cancelButton')}
                                </button>
                                <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-accent">
                                    {t('confirmation.invoice.submitButton')}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};