import React, { useState, useMemo, useCallback } from 'react';
import type { ClassPackage, TimeSlot, BookingMode, AppData, EnrichedAvailableSlot, Instructor, CapacityMessageSettings } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { BookingSidebar } from './BookingSidebar';
import { InstructorTag } from './InstructorTag';
import { CapacityIndicator } from './CapacityIndicator';
import * as dataService from '../services/dataService';

// TimeSlotModal will be needed here. I'll copy a simplified version from ManualBookingModal.
const TimeSlotModal: React.FC<{
    date: Date;
    onClose: () => void;
    onSelect: (slot: EnrichedAvailableSlot) => void;
    availableTimes: EnrichedAvailableSlot[];
    instructors: Instructor[];
    capacityMessages: CapacityMessageSettings;
}> = ({ date, onClose, onSelect, availableTimes, instructors, capacityMessages }) => {
    const { t, language } = useLanguage();

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-brand-surface rounded-xl shadow-2xl p-6 w-full max-w-sm animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-serif text-brand-text mb-2 text-center">{t('schedule.modal.title')}</h3>
                <p className="text-center text-brand-secondary mb-4">{date.toLocaleDateString(language, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-2 -mr-2">
                    {availableTimes.length > 0 ? availableTimes.map(slot => (
                        <button
                            key={`${slot.time}-${slot.instructorId}`}
                            onClick={() => onSelect(slot)}
                            className="w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 bg-brand-background hover:bg-brand-primary/20"
                        >
                            <span className="font-semibold text-brand-text">{slot.time}</span>
                            <div className="flex items-center gap-2">
                                <InstructorTag instructorId={slot.instructorId} instructors={instructors} />
                                <CapacityIndicator count={slot.paidBookingsCount} max={slot.maxCapacity} capacityMessages={capacityMessages} />
                            </div>
                        </button>
                    )) : <p className="text-center text-brand-secondary">{t('schedule.modal.noClasses')}</p>}
                </div>
            </div>
        </div>
    );
};

interface ScheduleSelectorProps {
  pkg: ClassPackage;
  initialSlots: TimeSlot[];
  onConfirm: (slots: TimeSlot[]) => void;
  onBack: () => void;
  bookingMode: BookingMode;
  appData: AppData;
}

const formatDateToYYYYMMDD = (d: Date): string => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({ pkg, initialSlots, onConfirm, onBack, bookingMode, appData }) => {
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>(initialSlots);
  const [modalState, setModalState] = useState<{ isOpen: boolean; date: Date | null }>({ isOpen: false, date: null });
  const [availableTimesForModal, setAvailableTimesForModal] = useState<EnrichedAvailableSlot[]>([]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const blanks = Array(firstDayOfMonth.getDay()).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return [...blanks, ...days];
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    date.setHours(0,0,0,0);
    const dateStr = formatDateToYYYYMMDD(date);
    const timesForDay = dataService.getAvailableTimesForDate(date, appData);
    
    if (date < today || timesForDay.length === 0) return;
    
    if (selectedSlots.some(s => s.date === dateStr)) {
      setSelectedSlots(selectedSlots.filter(s => s.date !== dateStr));
    } else if (selectedSlots.length < pkg.classes) {
        setAvailableTimesForModal(timesForDay);
        setModalState({ isOpen: true, date });
    }
  };

  const handleSlotSelect = (slot: EnrichedAvailableSlot) => {
    if (!modalState.date) return;
    const dateStr = formatDateToYYYYMMDD(modalState.date);
    const newSlot: TimeSlot = { date: dateStr, time: slot.time, instructorId: slot.instructorId };
    
    setSelectedSlots([...selectedSlots, newSlot].sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));
    setModalState({ isOpen: false, date: null });
  };
  
  const handleRemoveSlot = (slotToRemove: TimeSlot) => {
    setSelectedSlots(prevSlots => prevSlots.filter(s => s.date !== slotToRemove.date || s.time !== slotToRemove.time));
  };

  const translatedDayNames = useMemo(() => 
      [0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
        const date = new Date(2024, 0, dayIndex + 7); // An arbitrary week to get day names
        return date.toLocaleDateString(language, { weekday: 'short' });
      }), 
  [language]);


  return (
    <div className="animate-fade-in-up">
       {modalState.isOpen && modalState.date && (
            <TimeSlotModal 
                date={modalState.date} 
                onClose={() => setModalState({ isOpen: false, date: null })} 
                onSelect={handleSlotSelect} 
                availableTimes={availableTimesForModal}
                instructors={appData.instructors}
                capacityMessages={appData.capacityMessages}
            />
        )}
      <button onClick={onBack} className="text-brand-secondary hover:text-brand-text mb-4 transition-colors font-semibold">
        &larr; {t('summary.backButton')}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-brand-surface p-6 rounded-xl shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              disabled={currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()}
              className="p-2 rounded-full hover:bg-brand-background disabled:opacity-50"
            >
              &larr;
            </button>
            <h3 className="text-xl font-bold text-brand-text capitalize">
              {currentDate.toLocaleString(language, { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-2 rounded-full hover:bg-brand-background"
            >
              &rarr;
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm text-brand-secondary mb-2">
            {translatedDayNames.map(day => <div key={day} className="font-bold">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) return <div key={`blank-${index}`}></div>;
              
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              date.setHours(0,0,0,0);
              const isPast = date < today;
              const isAvailable = dataService.getAvailableTimesForDate(date, appData).length > 0;
              const dayIsSelected = selectedSlots.some(s => s.date === formatDateToYYYYMMDD(date));
              const isDisabled = isPast || !isAvailable || (selectedSlots.length >= pkg.classes && !dayIsSelected);
              
              const buttonClasses = `w-full aspect-square rounded-full text-sm font-semibold transition-all
                ${isDisabled && !dayIsSelected ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'hover:bg-brand-primary/20'}
                ${dayIsSelected ? 'bg-brand-primary text-white shadow-md' : 'bg-white'}
              `;

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  disabled={isDisabled}
                  className={buttonClasses}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-1">
          <BookingSidebar 
            product={pkg}
            selectedSlots={selectedSlots}
            onRemoveSlot={handleRemoveSlot}
            onConfirm={() => onConfirm(selectedSlots)}
            bookingMode={bookingMode}
          />
        </div>
      </div>
    </div>
  );
};
