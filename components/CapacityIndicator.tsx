

import React, { useState, useMemo, useRef } from 'react';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { CapacityTooltip } from './CapacityTooltip';
import type { CapacityMessageSettings } from '../types';

interface CapacityIndicatorProps {
    count: number;
    max: number;
    // FIX: Accept settings as a prop
    capacityMessages: CapacityMessageSettings;
}

export const CapacityIndicator: React.FC<CapacityIndicatorProps> = ({ count, max, capacityMessages }) => {
    const indicatorRef = useRef<HTMLDivElement>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    
    const percentage = max > 0 ? (count / max) * 100 : 0;
    
    const { colorClasses, message } = useMemo(() => {
        const sortedThresholds = [...(capacityMessages?.thresholds || [])].sort((a, b) => b.threshold - a.threshold);
        
        if (sortedThresholds.length === 0) {
            return { colorClasses: 'bg-green-100 text-green-800', message: '' };
        }

        let activeThreshold = sortedThresholds[sortedThresholds.length - 1]; // Default to lowest
        for (const t of sortedThresholds) {
            if (percentage >= t.threshold) {
                activeThreshold = t;
                break;
            }
        }

        let colors = 'bg-green-100 text-green-800'; // Default 'available' color
        if (activeThreshold.level === 'last') {
            colors = 'bg-red-100 text-red-800 animate-pulse';
        } else if (activeThreshold.level === 'few') {
            colors = 'bg-amber-100 text-amber-800';
        }

        return { colorClasses: colors, message: activeThreshold.message };
    }, [percentage, capacityMessages]);

    const handleMouseEnter = () => {
        if (indicatorRef.current) {
            const rect = indicatorRef.current.getBoundingClientRect();
            setTooltipPosition({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
            });
        }
    };
    
    const handleMouseLeave = () => {
        setTooltipPosition(null);
    };

    return (
        <>
            <div 
                ref={indicatorRef}
                className="relative flex-shrink-0"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${colorClasses}`}>
                    <UserGroupIcon className="w-4 h-4" />
                    <span>{count}/{max}</span>
                </div>
            </div>
            <CapacityTooltip message={message} position={tooltipPosition} />
        </>
    );
};