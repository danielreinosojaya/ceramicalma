import React, { useMemo, useState, useEffect } from 'react';
import type { Customer, Booking, ClassPackage, TimeSlot, OpenStudioSubscription } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import * as dataService from '../../services/dataService';
import { MailIcon } from '../icons/MailIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { KeyIcon } from '../icons/KeyIcon';
import { CurrencyDollarIcon } from '../icons/CurrencyDollarIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

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


export const CustomerDetailView: React.FC<{ customer: Customer; onBack: () => void; onDataChange: () => void; }> = ({ customer, onBack, onDataChange }) => {
    const { t, language } = useLanguage();
    
    const [now, setNow] = useState(new Date());
    const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

    // State for pagination
    const [paymentsPage, setPaymentsPage] = useState(1);
    const [bookingsPage, setBookingsPage] = useState(1);
    const recordsPerPage = 5;

    // State for deletion modal
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

    useEffect(() => {
        const timerId = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timerId);
    }, []);

    const formatDate = (dateInput: Date | string | undefined) => {
        if (!dateInput) return '---';
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            if(typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                const dateOnly = new Date(dateInput + 'T00:00:00');
                 if (!isNaN(dateOnly.getTime())) {
                     return dateOnly.toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' });
                 }
            }
            return '---';
        }
        return date.toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const handleTogglePaidStatus = async (booking: Booking) => {
        if (booking.isPaid) {
            await dataService.markBookingAsUnpaid(booking.id);
        } else {
            await dataService.markBookingAsPaid(booking.id, { method: 'Manual', amount: booking.price });
        }
        onDataChange();
    };
    
    const handleDeleteRequest = (booking: Booking) => {
        setBookingToDelete(booking);
    };

    const handleDeleteConfirm = async () => {
        if (bookingToDelete) {
            await dataService.deleteBooking(bookingToDelete.id);
            setBookingToDelete(null);
            onDataChange();
        }
    };

    const { userInfo, totalSpent, lastBookingDate, bookings } = customer;

    const paidSubscriptions = useMemo(() => 
        bookings
            .filter(b => b.isPaid && b.productType === 'OPEN_STUDIO_SUBSCRIPTION')
            .sort((a,b) => new Date(b.paymentDetails!.receivedAt).getTime() - new Date(a.paymentDetails!.receivedAt).getTime()),
        [bookings]
    );

    const nonSubscriptionBookings = useMemo(() => 
        bookings.filter(b => b.productType !== 'OPEN_STUDIO_SUBSCRIPTION'),
        [bookings]
    );

    const paidBookings = useMemo(() => bookings.filter(b => b.isPaid), [bookings]);

    // Pagination calculations
    const totalPaymentPages = Math.ceil(paidBookings.length / recordsPerPage);
    const paginatedPaidBookings = paidBookings.slice((paymentsPage - 1) * recordsPerPage, paymentsPage * recordsPerPage);

    const totalBookingPages = Math.ceil(nonSubscriptionBookings.length / recordsPerPage);
    const paginatedBookings = nonSubscriptionBookings.slice((bookingsPage - 1) * recordsPerPage, bookingsPage * recordsPerPage);

    return (
        <div className="animate-fade-in">
            {bookingToDelete && (
                <DeleteConfirmationModal
                    isOpen={!!bookingToDelete}
                    onClose={() => setBookingToDelete(null)}
                    onConfirm={handleDeleteConfirm}
                    title={t('admin.crm.deleteBookingTitle')}
                    message={t('admin.crm.deleteBookingMessage', { code: bookingToDelete.bookingCode || 'N/A' })}
                />
            )}
            <button onClick={onBack} className="text-brand-secondary hover:text-brand-accent mb-4 transition-colors font-semibold">
                &larr; {t('admin.crm.backToList')}
            </button>
            <div className="bg-brand-background p-6 rounded-lg mb-6">
                <h3 className="text-2xl font-serif text-brand-accent">{userInfo.firstName} {userInfo.lastName}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-brand-secondary">
                    <a href={`mailto:${userInfo.email}`} className="flex items-center gap-2 hover:text-brand-accent"><MailIcon className="w-4 h-4" /> {userInfo.email}</a>
                    <div className="flex items-center gap-2"><PhoneIcon className="w-4 h-4" /> {userInfo.countryCode} {userInfo.phone}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <KPICard title={t('admin.crm.lifetimeValue')} value={`$${totalSpent.toFixed(2)}`} />
                <KPICard title={t('admin.crm.totalBookings')} value={customer.totalBookings} />
                <KPICard title={t('admin.crm.lastBooking')} value={formatDate(lastBookingDate)} />
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h3 className="font-bold text-brand-text mb-4">{t('admin.crm.subscriptions')}</h3>
                {paidSubscriptions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-brand-background">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-brand-secondary uppercase">{t('admin.crm.package')}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-brand-secondary uppercase">{t('admin.crm.purchasedOn')}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-brand-secondary uppercase">{t('admin.crm.expiresOn')}</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-brand-secondary uppercase">{t('admin.crm.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paidSubscriptions.map(sub => {
                                    const startDate = new Date(sub.paymentDetails!.receivedAt);
                                    const expiryDate = new Date(startDate);
                                    const durationDays = (sub.product as OpenStudioSubscription).details.durationDays;
                                    expiryDate.setDate(startDate.getDate() + durationDays);
                                    const isActive = now < expiryDate;

                                    return (
                                        <tr key={sub.id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-text">{sub.product.name}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-text">{formatDate(startDate)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-text">{formatDate(expiryDate)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-center">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {isActive ? t('admin.crm.statusActive') : t('admin.crm.statusExpired')}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-brand-secondary text-center py-4">{t('admin.crm.noSubscriptions')}</p>
                )}
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h3 className="font-bold text-brand-text mb-4">{t('admin.crm.paymentHistory')}</h3>
                <div className="overflow-x-auto">
                    {paidBookings.length > 0 ? (
                        <>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-brand-background">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-brand-secondary uppercase">{t('admin.crm.date')}</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-brand-secondary uppercase">{t('admin.crm.package')}</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-brand-secondary uppercase">{t('admin.crm.amount')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedPaidBookings.map(b => (
                                        <tr key={b.id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-text">{formatDate(b.paymentDetails?.receivedAt)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-text">{b.product?.name || 'N/A'}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-semibold text-brand-text">${b.price.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {totalPaymentPages > 1 && (
                                <div className="mt-4 flex justify-between items-center text-sm">
                                    <button onClick={() => setPaymentsPage(p => Math.max(1, p - 1))} disabled={paymentsPage === 1} className="font-semibold disabled:text-gray-400">&larr; {t('admin.crm.previous')}</button>
                                    <span>{t('admin.crm.page')} {paymentsPage} {t('admin.crm.of')} {totalPaymentPages}</span>
                                    <button onClick={() => setPaymentsPage(p => Math.min(totalPaymentPages, p + 1))} disabled={paymentsPage === totalPaymentPages} className="font-semibold disabled:text-gray-400">{t('admin.crm.next')} &rarr;</button>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-brand-secondary text-center py-4">{t('admin.crm.noPaymentsFound')}</p>
                    )}
                </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-brand-text mb-4">{t('admin.crm.bookingHistory')}</h3>
                <div className="overflow-x-auto">
                     {nonSubscriptionBookings.length > 0 ? (
                        <>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-brand-background">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.date')}</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.package')}</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.bookingCode')}</th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.crm.status')}</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-brand-secondary uppercase tracking-wider">{t('admin.productManager.actionsLabel')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedBookings.map(b => (
                                        <tr key={b.id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-text">{formatDate(b.createdAt)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-text">{b.product?.name || 'N/A'}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-brand-secondary">{b.bookingCode || '---'}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${b.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{b.isPaid ? t('admin.bookingModal.paidStatus') : t('admin.bookingModal.unpaidStatus')}</span>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                                <div className="flex items-center justify-end">
                                                    <button onClick={() => handleTogglePaidStatus(b)} title={t('admin.bookingModal.togglePaid')} className={`p-2 rounded-full transition-colors ${b.isPaid ? 'text-brand-success hover:bg-green-100' : 'text-gray-400 hover:bg-gray-200'}`}><CurrencyDollarIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => handleDeleteRequest(b)} title="Delete Booking" className="p-2 rounded-full text-red-500 hover:bg-red-100"><TrashIcon className="w-5 h-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {totalBookingPages > 1 && (
                                <div className="mt-4 flex justify-between items-center text-sm">
                                    <button onClick={() => setBookingsPage(p => Math.max(1, p - 1))} disabled={bookingsPage === 1} className="font-semibold disabled:text-gray-400">&larr; {t('admin.crm.previous')}</button>
                                    <span>{t('admin.crm.page')} {bookingsPage} {t('admin.crm.of')} {totalBookingPages}</span>
                                    <button onClick={() => setBookingsPage(p => Math.min(totalBookingPages, p + 1))} disabled={bookingsPage === totalBookingPages} className="font-semibold disabled:text-gray-400">{t('admin.crm.next')} &rarr;</button>
                                </div>
                            )}
                        </>
                    ) : (
                         <p className="text-sm text-brand-secondary text-center py-4">{t('admin.crm.noCustomers')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};