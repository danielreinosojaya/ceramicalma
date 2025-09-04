


import React, { useMemo } from 'react';
import type { Instructor } from '../types';
import { PALETTE_COLORS } from '../constants';
import { UserIcon } from './icons/UserIcon';

interface InstructorTagProps {
  instructorId: number;
  // FIX: Pass instructors directly
  instructors: Instructor[];
}

const colorMap = PALETTE_COLORS.reduce((acc, color) => {
    acc[color.name] = { bg: color.bg, text: color.text };
    return acc;
}, {} as Record<string, { bg: string, text: string }>);
const defaultColors = { bg: 'bg-gray-200', text: 'text-gray-600' };

export const InstructorTag: React.FC<InstructorTagProps> = ({ instructorId, instructors }) => {
  const instructor = useMemo(() => {
    return instructors.find(i => i.id === instructorId);
  }, [instructorId, instructors]);

  if (!instructor) {
    return null; // or a placeholder
  }
  
  const colors = colorMap[instructor.colorScheme] || defaultColors;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} flex-shrink-0`}>
      <UserIcon className="w-3 h-3" />
      <span>{instructor.name}</span>
    </div>
  );
};