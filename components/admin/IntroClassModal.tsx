import React, { useState, useEffect, useRef } from 'react';
import type { IntroductoryClass, Instructor, SchedulingRule, SessionOverride } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import * as dataService from '../../services/dataService';
import { CubeIcon } from '../icons/CubeIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { DAY_NAMES } from '@/constants';
import { IntroClassCalendar } from './IntroClassCalendar';

interface IntroClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pkgData: Omit<IntroductoryClass, 'id' | 'isActive' | 'type'>, id?: number) => void;
  classToEdit: IntroductoryClass | null;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-bold text-brand-secondary mb-1">{label}</label>
        <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary" />
    </div>
);

const TextareaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-bold text-brand-secondary mb-1">{label}</label>
        <textarea {...props} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"/>
    </div>
);

export const IntroClassModal: React.FC<IntroClassModalProps> = ({ isOpen, onClose, onSave, classToEdit }) => {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Omit<IntroductoryClass, 'id' | 'isActive' | 'type'>>({
    name: '', price: 0, description: '', imageUrl: '', schedulingRules: [], overrides: [],
    details: { duration: '', durationHours: 0, activities: [], generalRecommendations: '', materials: '' },
  });
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [newRule, setNewRule] = useState({ dayOfWeek: 1, time: '', instructorId: 0, capacity: 8 });

  useEffect(() => {
    const initialize = async () => {
      const currentInstructors = await dataService.getInstructors();
      setInstructors(currentInstructors);
      if (currentInstructors.length > 0) {
          setNewRule(s => ({...s, instructorId: currentInstructors[0].id }));
      }

      if (classToEdit) {
        setFormData({
          name: classToEdit.name,
          price: classToEdit.price,
          description: classToEdit.description,
          imageUrl: classToEdit.imageUrl || '',
          schedulingRules: classToEdit.schedulingRules || [],
          overrides: classToEdit.overrides || [],
          details: {
            duration: classToEdit.details.duration,
            durationHours: classToEdit.details.durationHours || 0,
            activities: classToEdit.details.activities || [],
            generalRecommendations: classToEdit.details.generalRecommendations,
            materials: classToEdit.details.materials,
          },
        });
      } else {
        setFormData({
          name: '', price: 0, description: '', imageUrl: '', schedulingRules: [], overrides: [],
          details: { duration: '', durationHours: 0, activities: [], generalRecommendations: '', materials: '' },
        });
      }
    };
    if (isOpen) {
      initialize();
    }
  }, [classToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isActivity = name === 'activities';
    setFormData(prev => ({
        ...prev,
        details: {
            ...prev.details,
            [name]: isActivity ? value.split('\n').filter(line => line.trim() !== '') : value
        }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) { alert("Image too large (max 2MB)"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };
  
  const handleAddRule = () => {
    if (!newRule.time || !newRule.instructorId) {
        alert("Please fill time and instructor for the new rule.");
        return;
    }
    const ruleToAdd: SchedulingRule = {
      ...newRule,
      id: `${newRule.dayOfWeek}-${newRule.time.replace(':', '')}-${newRule.instructorId}`,
    };
    
    if(formData.schedulingRules.some(r => r.id === ruleToAdd.id)) {
        alert("This exact rule already exists.");
        return;
    }

    setFormData(prev => ({ ...prev, schedulingRules: [...prev.schedulingRules, ruleToAdd] }));
  };

  const handleRemoveRule = (ruleId: string) => {
    setFormData(prev => ({ ...prev, schedulingRules: prev.schedulingRules.filter(r => r.id !== ruleId)}));
  };
  
  const handleOverridesChange = (newOverrides: SessionOverride[]) => {
      setFormData(prev => ({ ...prev, overrides: newOverrides }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, classToEdit?.id);
  };
  
  if (!isOpen) return null;
  
  const translatedDayNames = DAY_NAMES.map((dayKey, index) => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + index);
    return date.toLocaleDateString(language, { weekday: 'long' });
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-brand-surface rounded-xl shadow-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-serif text-brand-accent mb-4 text-center">
          {classToEdit ? t('admin.introClassModal.editTitle') : t('admin.introClassModal.createTitle')}
        </h2>
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label={t('admin.packageModal.nameLabel')} id="name" name="name" value={formData.name} onChange={handleChange} required />
                <InputField label={t('admin.packageModal.priceLabel')} id="price" name="price" type="number" value={formData.price} onChange={handleChange} required />
                <div className="md:col-span-2"><TextareaField label={t('admin.packageModal.descriptionLabel')} id="description" name="description" value={formData.description} onChange={handleChange} /></div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-brand-secondary mb-1">{t('admin.packageModal.imageLabel')}</label>
                    <div className="mt-1 flex items-center gap-4 p-2 border-2 border-dashed border-gray-300 rounded-lg">
                        {formData.imageUrl ? <img src={formData.imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded-md" /> : <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center text-gray-400"><CubeIcon className="w-10 h-10" /></div>}
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white border border-brand-secondary text-brand-secondary font-bold py-2 px-4 rounded-lg hover:bg-gray-100">{t('admin.packageModal.uploadImageButton')}</button>
                    </div>
                </div>
                <InputField label={t('admin.packageModal.durationLabel')} id="duration" name="duration" value={formData.details.duration} onChange={handleDetailChange} />
                <InputField label={t('admin.packageModal.durationHoursLabel')} id="durationHours" name="durationHours" type="number" step="0.5" value={formData.details.durationHours} onChange={handleDetailChange} required />
                <div className="md:col-span-2"><TextareaField label={t('admin.packageModal.activitiesLabel')} id="activities" name="activities" value={Array.isArray(formData.details.activities) ? formData.details.activities.join('\n') : ''} onChange={handleDetailChange} /></div>
                <TextareaField label={t('admin.packageModal.generalRecommendationsLabel')} id="generalRecommendations" name="generalRecommendations" value={formData.details.generalRecommendations} onChange={handleDetailChange} />
                <TextareaField label={t('admin.packageModal.materialsLabel')} id="materials" name="materials" value={formData.details.materials} onChange={handleDetailChange} />
                
                <div className="md:col-span-2 bg-brand-background p-4 rounded-lg">
                    <h3 className="font-bold text-brand-accent mb-3">{t('admin.introClassModal.schedulingRulesTitle')}</h3>
                    <div className="space-y-2 mb-4">
                        {formData.schedulingRules.length > 0 ? formData.schedulingRules.map(rule => (
                            <div key={rule.id} className="flex items-center justify-between bg-white p-2 rounded-md">
                                <div>
                                    <p className="font-semibold text-sm">
                                        {translatedDayNames[rule.dayOfWeek]} @ {new Date(`1970-01-01T${rule.time}`).toLocaleTimeString(language, { hour: 'numeric', minute: '2-digit', hour12: true })}
                                    </p>
                                    <p className="text-xs text-brand-secondary">
                                      {t('admin.introClassModal.instructorLabel')}: {instructors.find(i=>i.id === rule.instructorId)?.name}, {t('admin.introClassModal.capacityLabel')}: {rule.capacity}
                                    </p>
                                </div>
                                <button type="button" onClick={() => handleRemoveRule(rule.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        )) : <p className="text-sm text-center text-brand-secondary py-2">{t('admin.introClassModal.noSchedulingRules')}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 p-2 border-t border-gray-200">
                        <select value={newRule.dayOfWeek} onChange={e => setNewRule({...newRule, dayOfWeek: Number(e.target.value)})} className="p-1 border rounded-md text-sm">
                            {translatedDayNames.map((day, index) => <option key={index} value={index}>{day}</option>)}
                        </select>
                        <input type="time" value={newRule.time} onChange={e => setNewRule({...newRule, time: e.target.value})} className="p-1 border rounded-md text-sm"/>
                        <select value={newRule.instructorId} onChange={e => setNewRule({...newRule, instructorId: Number(e.target.value)})} className="p-1 border rounded-md text-sm">
                            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                        <input type="number" min="1" value={newRule.capacity} onChange={e => setNewRule({...newRule, capacity: Number(e.target.value)})} className="p-1 border rounded-md text-sm w-20" placeholder={t('admin.introClassModal.capacityLabel')}/>
                        <button type="button" onClick={handleAddRule} className="p-2 bg-brand-primary text-white rounded-md hover:bg-brand-accent disabled:bg-gray-400" disabled={!newRule.time || instructors.length === 0}>
                            <PlusIcon className="w-4 h-4"/>
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 bg-brand-background p-4 rounded-lg">
                    <IntroClassCalendar 
                        product={{...formData, id: classToEdit?.id || 0, type: 'INTRODUCTORY_CLASS', isActive: true}} 
                        onOverridesChange={handleOverridesChange} 
                    />
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="bg-white border border-brand-secondary text-brand-secondary font-bold py-2 px-6 rounded-lg hover:bg-gray-100">{t('admin.productManager.cancelButton')}</button>
                <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-accent">{t('admin.packageModal.saveButton')}</button>
            </div>
        </form>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden"/>
      </div>
    </div>
  );
};
