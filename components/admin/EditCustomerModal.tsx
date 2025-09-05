import React, { useState, useEffect } from 'react';
import type { UserInfo } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { COUNTRIES } from '@/constants';

interface EditCustomerModalProps {
    userInfo: UserInfo;
    onClose: () => void;
    onSave: (updatedUserInfo: UserInfo) => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ userInfo, onClose, onSave }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState<UserInfo>({ ...userInfo });

    useEffect(() => {
        setFormData({ ...userInfo });
    }, [userInfo]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName || !formData.email) {
            alert('Please fill all required fields.');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-brand-surface rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-serif text-brand-accent mb-4 text-center">{t('admin.crm.editCustomerModalTitle')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder={t('userInfoModal.firstNamePlaceholder')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder={t('userInfoModal.lastNamePlaceholder')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder={t('userInfoModal.emailPlaceholder')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                    <div className="flex gap-2">
                        <select name="countryCode" value={formData.countryCode} onChange={handleInputChange} className="border border-gray-300 rounded-lg bg-gray-50">
                             {COUNTRIES.map(c => <option key={c.name} value={c.code}>{c.flag} {c.code}</option>)}
                        </select>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder={t('userInfoModal.phonePlaceholder')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-white border border-brand-secondary text-brand-secondary font-bold py-2 px-6 rounded-lg hover:bg-gray-100">
                            {t('admin.productManager.cancelButton')}
                        </button>
                        <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-accent">
                            {t('admin.crm.saveButton')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
