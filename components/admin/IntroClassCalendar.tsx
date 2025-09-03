import React, { useState, useMemo } from 'react';
import type { IntroductoryClass, SessionOverride } from '../../types';
import * as dataService from '../../services/dataService';
import { useLanguage } from '../../context/LanguageContext';
import { SessionEditorPanel } from './SessionEditorPanel';

interface IntroClassCalendarProps {
  product: IntroductoryClass;
  onOverridesChange: (newOverrides: SessionOverride[]) => void;
}

const formatDateToYYYYMMDD = (d: Date): string => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatTimeForDisplay = (time24h: string): string => {
    if (!time24h) return '';
    const [hours, minutes] = time24h.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHours = h % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
};

const formatTimeForInput = (time12h: string): string => {
    const date = new Date(`1970-01-01 ${time12h}`);
    return date.toTimeString().slice(0, 5);
};

export const IntroClassCalendar: React.FC<IntroClassCalendarProps> = ({ product, onOverridesChange }) => {
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const generatedSessionsByDate = useMemo(() => {
    const sessions = dataService.generateIntroClassSessions(product, { bookings: [] }, { generationLimitInDays: 60 }); // Generate for 2 months for viewing
    const map: Record<string, any[]> = {};
    for (const session of sessions) {
        if (!map[session.date]) map[session.date] = [];
        map[session.date].push(session);
    }
    return map;
  }, [product, currentDate.getMonth(), currentDate.getFullYear()]);

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
    const selectedDateStr = selectedDate ? formatDateToYYYYMMDD(selectedDate) : null;
    const clickedDateStr = formatDateToYYYYMMDD(date);
    if(selectedDateStr === clickedDateStr) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  const handleSaveOverride = (date: string, sessions: { time: string; instructorId: number; capacity: number }[] | null) => {
      const newOverrides = [...product.overrides.filter(ov => ov.date !== date)];
      const generatedSessionsForDay = dataService.generateIntroClassSessions(product, { bookings: [] }, {})
          .filter(s => s.date === date)
          .map(({ time, instructorId, capacity }) => ({ time: formatTimeForInput(time), instructorId, capacity }));
      
      const areSessionsSameAsGenerated = 
        sessions && sessions.length === generatedSessionsForDay.length &&
        sessions.every(s => generatedSessionsForDay.some(gs => gs.time === s.time && gs.instructorId === s.instructorId && gs.capacity === s.capacity));

      if (!areSessionsSameAsGenerated) {
        newOverrides.push({ date, sessions });
      }

      onOverridesChange(newOverrides);
  };
  
  const translatedDayNames = useMemo(() => 
      [0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
        const date = new Date(2024, 0, dayIndex + 7);
        return date.toLocaleDateString(language, { weekday: 'short' });
      }), 
  [language]);

  return (
    <div>
      <h3 className="font-bold text-brand-accent mb-1">{t('admin.introClassModal.calendarTitle')}</h3>
      <p className="text-sm text-brand-secondary mb-4">{t('admin.introClassModal.calendarSubtitle')}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-200">&larr;</button>
            <h4 className="text-md font-bold text-brand-text capitalize">
              {currentDate.toLocaleString(language, { month: 'long', year: 'numeric' })}
            </h4>
            <button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-200">&rarr;</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-brand-secondary">
            {translatedDayNames.map(day => <div key={day} className="font-semibold">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 mt-1">
            {calendarDays.map((day, index) => {
              if (!day) return <div key={`blank-${index}`}></div>;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dateStr = formatDateToYYYYMMDD(date);
              const hasClasses = !!generatedSessionsByDate[dateStr];
              const isSelected = selectedDate && dateStr === formatDateToYYYYMMDD(selectedDate);
              
              // FIX: Extracted className to a variable to simplify JSX and resolve a potential parsing error.
              const buttonClassName = `w-full aspect-square rounded-full text-xs font-semibold transition-all relative ${
                isSelected ? 'bg-brand-primary text-white ring-2 ring-brand-accent' : 'bg-white hover:bg-gray-100'
              }`;

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={buttonClassName}
                >
                  {day}
                  {/* FIX: Made the indicator div self-closing for cleaner code. */}
                  {hasClasses && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-accent rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-2">
          {selectedDate && (
              <SessionEditorPanel
                key={formatDateToYYYYMMDD(selectedDate)} // Force re-mount on date change
                selectedDate={selectedDate}
                product={product}
                onSave={handleSaveOverride}
              />
          )}
        </div>
      </div>
    </div>
  );
};