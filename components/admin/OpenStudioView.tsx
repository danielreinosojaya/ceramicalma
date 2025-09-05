import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Booking, OpenStudioSubscription } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { CurrencyDollarIcon } from '../icons/CurrencyDollarIcon';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';

// Define a consistent type for the status
export type SubscriptionStatus = 'Active' | 'Expired' | 'Pending Payment';

// Define the shape of an augmented subscription object
export interface AugmentedOpenStudioSubscription extends Booking {
    product: OpenStudioSubscription;
    status: SubscriptionStatus;
    startDate: Date | null;
    expiryDate: Date | null;
}

// Robust timestamp formatting utility to prevent "Invalid Date" errors
const formatTimestamp = (dateInput: Date | string | null | undefined, locale: string): string => {
    if (!dateInput) {
        return '---';
    }
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
        return '---';
    }
    return date.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Countdown Timer Component: Calculates and displays remaining time
const CountdownTimer: React.FC<{ expiryDate: Date | null }> = ({ expiryDate }) => {
    const { t } = useLanguage();

    const calculateTimeLeft = useCallback(() => {
        if (!expiryDate) return null;
        const difference = +new Date(expiryDate) - +new Date();
        if (difference > 0) {
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }, [expiryDate]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        if (!timeLeft || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0)) {
            return;
        }
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft, timeLeft]);

    if (!timeLeft) return <span>-</span>;
    const pad = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className="font-mono text-sm tracking-tighter text-brand-text">
            <span>{pad(timeLeft.days)}{t('admin.crm.openStudio.d')} </span>
            <span className="tabular-nums">{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
        </div>
    );
};

// Main OpenStudioView Component
interface OpenStudioViewProps {
    bookings: Booking[];
    onNavigateToCustomer: (email: string) => void;
    onAcceptPayment: (booking: Booking) => void;
    onEditBooking: (booking: Booking) => void;
    onDeleteBooking: (booking: Booking) => void;
}

export const OpenStudioView: React.FC<OpenStudioViewProps> = ({ bookings, onNavigateToCustomer, onAcceptPayment, onEditBooking, onDeleteBooking }) => {
    const { t, language } = useLanguage();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000 * 30);
        return () => clearInterval(timer);
    }, []);

    const augmentedSubscriptions = useMemo((): AugmentedOpenStudioSubscription[] => {
        const openStudioBookings = bookings.filter(
            (b): b is Booking & { product: OpenStudioSubscription } => b.productType === 'OPEN_STUDIO_SUBSCRIPTION'
        );

        return openStudioBookings.map(booking => {
            let status: SubscriptionStatus = 'Pending Payment';
            let startDate: Date | null = null;
            let expiryDate: Date | null = null;

            if (booking.isPaid && booking.paymentDetails?.receivedAt) {
                const potentialStartDate = new Date(booking.paymentDetails.receivedAt);
                if (!isNaN(potentialStartDate.getTime())) {
                    startDate = potentialStartDate;
                    expiryDate = new Date(startDate.getTime());
                    expiryDate.setTime(startDate.getTime() + booking.product.details.durationDays * 24 * 60 * 60 * 1000);
                    status = now < expiryDate ? 'Active' : 'Expired';
                } else {
                    status = 'Expired';
                }
            }

            return { ...booking, status, startDate, expiryDate };
        }).sort((a, b) => {
            const statusOrder: Record<SubscriptionStatus, number> = { 'Active': 1, 'Pending Payment': 2, 'Expired': 3 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
            }
            if (a.status === 'Active') {
                return (a.expiryDate?.getTime() || 0) - (b.expiryDate?.getTime() || 0);
            }
            return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
        });
    }, [bookings, now]);
    
    const STATUS_COLORS: Record<SubscriptionStatus, string> = {
        Active: 'bg-green-100 text-green-800',
        Expired: 'bg-gray-100 text-gray-800',
        'Pending Payment': 'bg-yellow-100 text-yellow-800',
    };
    
    return (
        <div className="overflow-x-auto animate-fade-in">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-brand-background">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.customer')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.openStudio.status')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.openStudio.startDate')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.openStudio.remainingTime')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.openStudio.purchaseDate')}</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.actions')}</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {augmentedSubscriptions.length > 0 ? augmentedSubscriptions.map((sub) => (
                        <tr key={sub.id} onClick={() => onNavigateToCustomer(sub.userInfo.email)} className="hover:bg-brand-background cursor-pointer">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-bold text-brand-text">{sub.userInfo.firstName} {sub.userInfo.lastName}</div>
                                <div className="text-sm text-brand-secondary">{sub.userInfo.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[sub.status]}`}>
                                    {t(`admin.crm.openStudio.status${sub.status.replace(/ /g, '')}`)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text">
                                {formatTimestamp(sub.startDate, language)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {sub.status === 'Active' ? <CountdownTimer expiryDate={sub.expiryDate} /> : '---'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text">
                                {formatTimestamp(sub.createdAt, language)}
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                <div className="flex items-center justify-end gap-1">
                                    {sub.status === 'Pending Payment' && (
                                        <button onClick={(e) => { e.stopPropagation(); onAcceptPayment(sub); }} className="p-2 rounded-md text-green-600 hover:bg-green-100" title={t('admin.crm.acceptPayment')}>
                                            <CurrencyDollarIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); onEditBooking(sub); }} className="p-2 rounded-md text-brand-secondary hover:text-brand-accent hover:bg-gray-100" title={t('admin.crm.editBooking')}>
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteBooking(sub); }} className="p-2 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50" title={t('admin.crm.deleteBooking')}>
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={6} className="text-center py-10 text-brand-secondary">
                                {t('admin.crm.openStudio.noSubscriptions')}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};