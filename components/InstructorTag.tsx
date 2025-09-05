import React from 'react';
import type { Instructor } from '@/types';
import { PALETTE_COLORS } from '@/constants';
import { useLanguage } from '../context/LanguageContext';

interface InstructorTagProps {
  instructorId: number;
  instructors: Instructor[];
}

export const InstructorTag: React.FC<InstructorTagProps> = ({ instructorId, instructors }) => {
  const { t } = useLanguage();
  const instructor = instructors.find(i => i.id === instructorId);
  if (!instructor) {
    return null;
  }

  const color = PALETTE_COLORS.find(c => c.name === instructor.colorScheme) || PALETTE_COLORS.find(c => c.name === 'secondary');

  const tagClasses = `inline-flex items-center text-xs font-bold rounded-full ${color?.bg} ${color?.text} overflow-hidden`;

  return (
    <span className={tagClasses}>
      <span className="bg-black/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
        {t('admin.crm.instructorRole')}
      </span>
      <span className="pl-1.5 pr-2.5">
        {instructor.name}
      </span>
    </span>
  );
};