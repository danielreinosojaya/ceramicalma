import React from 'react';
import type { Instructor } from '@/types';
import { PALETTE_COLORS } from '@/constants';

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

  const tagClasses = `px-2 py-0.5 text-xs font-bold rounded-full ${color?.bg} ${color?.text}`;

  return (
    <span className={tagClasses}>
      {instructor.name}
    </span>
  );
};
