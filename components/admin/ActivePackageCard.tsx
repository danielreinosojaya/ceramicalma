import React, { useMemo } from 'react';
import type { Booking, ClassPackage, TimeSlot, Instructor } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { InstructorTag } from '../InstructorTag';
import { CalendarIcon } from '../icons/CalendarIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';

interface ActivePackageCardProps {
  booking: Booking & { product: ClassPackage };
  instructors: Instructor[];
}

const getSlotDateTime = (slot: TimeSlot): Date => {
  const time24h = new Date(`1970-01-01 ${slot.time}`).toTimeString().slice(0, 5);
  const [hours, minutes] = time24h.split(':').map(Number);
  // Important: Use UTC to avoid timezone issues when comparing dates
  const [year, month, day] = slot.date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes));
};

export const ActivePackageCard: React.FC<ActivePackageCardProps> = ({ booking, instructors }) => {
  const { t, language } = useLanguage();
  const now = new Date();

  const { completedSlots, upcomingSlots, expiryDate } = useMemo(() => {
    const sortedSlots = [...booking.slots].sort((a, b) => getSlotDateTime(a).getTime() - getSlotDateTime(b).getTime());
    const firstDate = sortedSlots.length > 0 ? getSlotDateTime(sortedSlots[0]) : null;
    
    let expiry: Date | null = null;
    if (firstDate) {
      expiry = new Date(firstDate);
      expiry.setUTCDate(expiry.getUTCDate() + 30);
    }

    return {
      completedSlots: sortedSlots.filter(s => getSlotDateTime(s) < now),
      upcomingSlots: sortedSlots.filter(s => getSlotDateTime(s) >= now),
      expiryDate: expiry
    };
  }, [booking.slots, now]);

  const totalClasses = booking.product.classes;
  const completedCount = completedSlots.length;
  const remainingCount = totalClasses - completedCount;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language, {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC' // Match UTC date from getSlotDateTime
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-subtle border border-brand-border/50 overflow-hidden transform transition-all duration-300 hover:shadow-lifted hover:-translate-y-1">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-brand-primary">{booking.product.name}</h3>
            {expiryDate && (
              <p className="text-xs font-semibold text-brand-secondary flex items-center gap-1 mt-1">
                <ClockIcon className="w-4 h-4" />
                {t('admin.crm.expiresOn', { date: formatDate(expiryDate) })}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-brand-text">{remainingCount}</p>
            <p className="text-sm font-semibold text-brand-secondary -mt-1">{t('admin.crm.filters.classesRemaining')}</p>
          </div>
        </div>
        
        <div className="w-full bg-brand-background rounded-full h-2.5 mt-4">
          <div 
            className="bg-brand-primary h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${(completedCount / totalClasses) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <div className="bg-brand-background/70 p-4 max-h-60 overflow-y-auto">
        <h4 className="font-bold text-brand-secondary text-sm mb-2 px-2">{t('admin.crm.scheduledClasses')}</h4>
        <div className="space-y-2">
          {upcomingSlots.map((slot, index) => (
            <div key={`upcoming-${index}`} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-brand-primary flex-shrink-0" />
                <div>
                  <p className="font-semibold text-brand-text text-sm">{formatDate(getSlotDateTime(slot))}</p>
                  <p className="text-xs text-brand-secondary">{slot.time}</p>
                </div>
              </div>
              <InstructorTag instructorId={slot.instructorId} instructors={instructors} />
            </div>
          ))}
          {completedSlots.map((slot, index) => (
             <div key={`completed-${index}`} className="flex items-center justify-between p-2 bg-white rounded-lg opacity-60">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-500 text-sm line-through">{formatDate(getSlotDateTime(slot))}</p>
                  <p className="text-xs text-gray-400 line-through">{slot.time}</p>
                </div>
              </div>
              <InstructorTag instructorId={slot.instructorId} instructors={instructors} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
