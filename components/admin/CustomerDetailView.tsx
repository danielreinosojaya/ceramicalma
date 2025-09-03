import React, { useMemo, useState, useEffect } from 'react';
import type { Customer, Booking, ClassPackage, TimeSlot } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import * as dataService from '../../services/dataService';
import { MailIcon } from '../icons/MailIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { KeyIcon } from '../icons/KeyIcon';
import { CurrencyDollarIcon } from '../icons/CurrencyDollarIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { UserIcon } from '../icons/UserIcon';

const KPICard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-brand-background p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-brand-secondary">{title}</h3>
        <p className="text-2xl font-bold text-brand-text mt-1">{value}</p>
    </div>
);

const getSlotDateTime = (slot: TimeSlot) => {
    const time24h = new Date(`1970-01-01 ${slot.time}`).toTimeString().slice(0, 5);
    const [hours, minutes] = time24h.split(':').map(Number);
    const [year, month, day] = slot.date.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
};


export const CustomerDetailView: React.FC<{ customer: Customer; onBack: () => void; }> = ({ customer, onBack }) => {
    const { t, language } = useLanguage();
    
    const [localCustomer, setLocalCustomer] = useState(customer);
    const [now, setNow] = useState(new Date());
    const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

    useEffect(() => {
        const timerId = setInterval(() => {
            setNow(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        setLocalCustomer(customer);
    }, [customer]);
    
    const formatDate = (dateInput: Date | string | undefined) => {
        if (!dateInput) return '---';
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            return '---';
        }
        return date.toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const { userInfo, totalSpent, lastBookingDate } = localCustomer;

    const handleTogglePaidStatus = async (booking: Booking) => {
        if (booking.isPaid) {
            await dataService.markBookingAsUnpaid(booking.id);
        } else {
            // In this view, we don't have a modal, so we'll use a default "Manual" payment method.
            await dataService.markBookingAsPaid(booking.id, { method: 'Manual', amount: booking.price });
        }
        
        const allBookings = await dataService.getBookings();
        const updatedBookings = allBookings.filter(b => b.userInfo.email === customer.userInfo.email);
        const updatedCustomer = {
            ...customer,
            bookings: updatedBookings,
            totalSpent: updatedBookings.reduce((sum, b) => sum + (b.isPaid ? b.price : 0), 0)
        };
        setLocalCustomer(updatedCustomer);
    };

    const totalClassesBooked = useMemo(() => {
        return localCustomer.bookings
            .filter(b => b.productType === 'CLASS_PACKAGE' || b.productType === 'INTRODUCTORY_CLASS')
            .reduce((sum, booking) => sum + booking.slots.length, 0);
    }, [localCustomer.bookings]);

    const noShowRate = useMemo(() => {
        let totalPastSlots = 0;
        let noShowCount = 0;
        
        localCustomer.bookings.forEach(booking => {
            booking.slots.forEach(slot => {
                if (getSlotDateTime(slot) < now) {
                    totalPastSlots++;
                    const slotIdentifier = `${slot.date}_${slot.time}`;
                    if (booking.attendance?.[slotIdentifier] === 'no-show') {
                        noShowCount++;
                    }
                }
            });
        });

        if (totalPastSlots === 0) return 'N/A';
        return `${((noShowCount / totalPastSlots) * 100).toFixed(0)}%`;
    }, [localCustomer.bookings, now]);
    
    const activeProducts = useMemo(() => {
        return localCustomer.bookings.filter(booking => {
            if ((booking.product.type !== 'CLASS_PACKAGE' && booking.product.type !== 'INTRODUCTORY_CLASS') || booking.slots.length === 0) {
                return false;
            }

            const hasFutureClasses = booking.slots.some(slot => getSlotDateTime(slot) > now);
            if (!hasFutureClasses) return false;

            if (booking.product.type === 'CLASS_PACKAGE') {
                const firstClassDate = booking.slots.map(getSlotDateTime).sort((a, b) => a.getTime() - b.getTime())[0];
                const expiryDate = new Date(firstClassDate);
                expiryDate.setDate(expiryDate.getDate() + 30);
                return now < expiryDate;
            }

            return true;
        });
    }, [localCustomer.bookings, now]);
    
    const activeSubscriptions = useMemo(() => {
        return localCustomer.bookings.filter(b => {
            if (b.product.type !== 'OPEN_STUDIO_SUBSCRIPTION') return false;
            const startDate = new Date(b.createdAt);
            const expiryDate = new Date(startDate);
            expiryDate.setDate(startDate.getDate() + b.product.details.durationDays);
            return expiryDate > now;
        });
    }, [localCustomer.bookings, now]);

    const paidBookings = useMemo(() => localCustomer.bookings.filter(b => b.isPaid), [localCustomer.bookings]);

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="text-brand-secondary hover:text-brand-accent mb-4 transition-colors font-semibold">
                &larr; {t('admin.crm.backToList')}
            </button>
            <div className="bg-brand-background p-6 rounded-lg mb-6">
                <h3 className="text-2xl font-serif text-brand-accent">{userInfo.firstName} {userInfo.lastName}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-brand-secondary">
                    <a href={`mailto:${userInfo.email}`} className="flex items-center gap-2 hover:text-brand-accent">
                        <MailIcon className="w-4 h-4" /> {userInfo.email}
                    </a>
                    <div className="flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4" /> {userInfo.countryCode} {userInfo.phone}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <KPICard title={t('admin.crm.lifetimeValue')} value={`$${totalSpent.toFixed(2)}`} />
                <KPICard title={t('admin.crm.totalClassesBooked')} value={totalClassesBooked} />
                {/* FIX: Cannot find name 'y'. Used lastBookingDate directly. */}
                <KPICard title={t('admin.crm.lastBooking')} value={formatDate(lastBookingDate)} />
                <KPICard title={t('admin.crm.noShowRate')} value={noShowRate} />
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h3 className="font-bold text-brand-text mb-4">{t('admin.crm.subscriptions')}</h3>
                {activeSubscriptions.length > 0 ? (
                    <div className="space-y-3">
                        {activeSubscriptions.map(booking => {
                             if (booking.product.type !== 'OPEN_STUDIO_SUBSCRIPTION') return null;
                             const startDate = new Date(booking.createdAt);
                             const expiryDate = new Date(startDate);
                             expiryDate.setDate(startDate.getDate() + booking.product.details.durationDays);
                             const isActive = expiryDate > now;

                             return (
                                <div key={booking.id} className={`p-4 rounded-lg border-l-4 ${isActive ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                                    <div className="flex items-center justify-between">
                                       <div>
                                            <p className="font-bold text-brand-text flex items-center gap-2"><KeyIcon className="w-4 h-4" />{booking.product.name}</p>
                                            <p className="text-xs text-brand-secondary mt-1">{t('admin.crm.purchasedOn')}: {startDate.toLocaleDateString(language)}</p>
                                       </div>
                                       <div>
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                                {isActive ? t('admin.crm.statusActive') : t('admin.crm.statusExpired')}
                                            </span>
                                            <p className="text-xs text-brand-secondary mt-1 text-right">{isActive ? t('admin.crm.expiresOn') : t('admin.crm.expiredOn')}: {expiryDate.toLocaleDateString(language)}</p>
                                       </div>
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-4 text-brand-secondary flex flex-col items-center gap-2">
                        <KeyIcon className="w-8 h-8 text-gray-300" />
                        <p className="text-sm">{t('admin.crm.noSubscriptions')}</p>
                    </div>
                )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h3 className="font-bold text-brand-text mb-4">{t('admin.crm.activePackages')}</h3>
                {activeProducts.length > 0 ? (
                     <div className="space-y-3">
                        {activeProducts.map((booking) => {
                            const isExpanded = expandedBookingId === booking.id;

                            if (booking.product.type === 'CLASS_PACKAGE') {
                                const product = booking.product as ClassPackage;

                                const allSlotDateTimes = booking.slots.map(slot => ({ ...slot, startDateTime: getSlotDateTime(slot) }))
                                .sort((a,b) => a.startDateTime.getTime() - b.startDateTime.getTime());
                                
                                const firstClassDate = allSlotDateTimes.length > 0 ? allSlotDateTimes[0].startDateTime : new Date();
                                const expiryDate = new Date(firstClassDate);
                                expiryDate.setDate(expiryDate.getDate() + 30);

                                const completedClasses = allSlotDateTimes.filter(slot => slot.startDateTime < now).length;
                                const totalClasses = product.classes;

                                return (
                                    <div key={booking.id} className="bg-brand-background rounded-lg border border-gray-200 overflow-hidden transition-all duration-300">
                                        <button 
                                            onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                                            className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                                            aria-expanded={isExpanded}
                                            aria-controls={`package-details-${booking.id}`}
                                        >
                                            <div>
                                                <p className="font-bold text-brand-text">{product.name}</p>
                                                <p className="text-xs text-brand-secondary mt-1">
                                                    {t('admin.crm.expiresOn')}: {expiryDate.toLocaleDateString(language)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-brand-text">{t('admin.crm.progress')}</p>
                                                    <p className="text-xs text-brand-secondary">{completedClasses} / {totalClasses}</p>
                                                </div>
                                                <ChevronDownIcon className={`w-5 h-5 text-brand-secondary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>
                                        {isExpanded && (
                                            <div id={`package-details-${booking.id}`} className="p-4 border-t border-gray-200 animate-fade-in-fast">
                                                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                                    <CalendarIcon className="w-4 h-4 text-brand-secondary"/>
                                                    {t('admin.crm.scheduledClasses')}
                                                </h4>
                                                <div className="max-h-64 overflow-y-auto pr-2">
                                                    <ul className="space-y-2">
                                                        {allSlotDateTimes.map((slot, index) => {
                                                            const isCompleted = slot.startDateTime < now;
                                                            return (
                                                                <li key={index} className={`flex justify-between items-center text-sm p-2 rounded-md ${isCompleted ? 'bg-gray-100' : 'bg-white'}`}>
                                                                    <div>
                                                                        <p className={`font-semibold ${isCompleted ? 'text-gray-400 line-through' : 'text-brand-text'}`}>
                                                                            {new Date(slot.date + 'T00:00:00').toLocaleDateString(language, { weekday: 'long', month: 'short', day: 'numeric' })}
                                                                        </p>
                                                                        <p className={`text-xs ${isCompleted ? 'text-gray-400' : 'text-brand-secondary'}`}>{slot.time}</p>
                                                                    </div>
                                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${isCompleted ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-800'}`}>
                                                                        {isCompleted ? t('admin.crm.classStatusCompleted') : t('admin.crm.classStatusUpcoming')}
                                                                    </span>
                                                                </li>
                                                            )
                                                        })}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            } else if (booking.product.type === 'INTRODUCTORY_CLASS') {
                                const product = booking.product;
                                const slot = booking.slots[0];
                                if (!slot) return null;

                                return (
                                    <div key={booking.id} className="bg-brand-background rounded-lg border border-gray-200 overflow-hidden transition-all duration-300">
                                        <div className="w-full text-left p-4 flex justify-between items-center">
                                             <div>
                                                <p className="font-bold text-brand-text">{product.name}</p>
                                                <p className="text-xs text-brand-secondary mt-1">
                                                   {t('admin.crm.classDate')}: {new Date(slot.date + 'T00:00:00').toLocaleDateString(language, { weekday: 'long', month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                 <p className="text-sm font-semibold text-brand-text">{t('admin.crm.classStatusUpcoming')}</p>
                                                 <p className="text-xs text-brand-secondary">{slot.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                ) : (
                    <div className="text-center py-4 text-brand-secondary flex flex-col items-center gap-2">
                        <CalendarIcon className="w-8 h-8 text-gray-300" />
                        <p className="text-sm">{t('admin.crm.noActivePackages')}</p>
                    </div>
                )}
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h3 className="font-bold text-brand-text mb-4">{t('admin.crm.paymentHistory')}</h3>
                <div className="overflow-x-auto">
                    {paidBookings.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-brand-background">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-brand-secondary uppercase">{t('admin.crm.date')}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-brand-secondary uppercase">{t('admin.crm.package')}</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-brand-secondary uppercase">{t('admin.crm.amount')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paidBookings.map(b => (
                                    <tr key={b.id}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-text">{formatDate(b.createdAt)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-text">{b.product?.name || 'N/A'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-semibold text-brand-text">${b.price.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-sm text-brand-secondary text-center py-4">{t('admin.crm.noPaymentsFound')}</p>
                    )}
                </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-brand-text mb-4">{t('admin.crm.bookingHistory')}</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-brand-background">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.date')}</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.package')}</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.bookingCode')}</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.amount')}</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.status')}</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.productManager.actionsLabel')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {localCustomer.bookings.map(b => (
                                <tr key={b.id}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-text">{formatDate(b.createdAt)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-text">{b.product?.name || 'N/A'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-brand-secondary">{b.bookingCode || '---'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-semibold text-brand-text">${b.price.toFixed(2)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${b.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {b.isPaid ? t('admin.bookingModal.paidStatus') : t('admin.bookingModal.unpaidStatus')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                        <button
                                            onClick={() => handleTogglePaidStatus(b)}
                                            title={t('admin.bookingModal.togglePaid')}
                                            className={`p-2 rounded-full transition-colors ${b.isPaid ? 'text-brand-success hover:bg-green-100' : 'text-gray-400 hover:bg-gray-200'}`}
                                        >
                                            <CurrencyDollarIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};