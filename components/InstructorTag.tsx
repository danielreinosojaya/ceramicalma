import React from 'react';
import type { Instructor } from '@/types';
import { PALETTE_COLORS } from '@/constants';
import { AcademicCapIcon } from './icons/AcademicCapIcon';

interface InstructorTagProps {
  instructorId: number;
  instructors: Instructor[];
}

export const InstructorTag: React.FC<InstructorTagProps> = ({ instructorId, instructors }) => {
  const instructor = instructors.find(i => i.id === instructorId);
  if (!instructor) {
    return null;
  }

  const color = PALETTE_COLORS.find(c => c.name === instructor.colorScheme) || PALETTE_COLORS.find(c => c.name === 'secondary');

  const tagClasses = `inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold rounded-full ${color?.bg} ${color?.text}`;

  return (
    <span className={tagClasses}>
      <AcademicCapIcon className="w-3.5 h-3.5" />
      {instructor.name}
    </span>
  );
};
