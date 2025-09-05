import React from 'react';
import type { Customer, Booking, Instructor, ClassPackage } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { MailIcon } from '../icons/MailIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { ActivePackageCard } from './ActivePackageCard';

interface CustomerDetailViewProps {
    customer: Customer;
    instructors: Instructor[];
    onBack: () => void;
    onDataChange: () => void;
    onEditBooking: (booking: Booking) => void;
    onDeleteBooking: (booking: Booking) => void;
}

const SimpleBookingCard: React.FC<{
    booking: Booking;
    onEditBooking: (booking: Booking) => void;
    onDeleteBooking: (booking: Booking) => void;
}> = ({ booking, onEditBooking, onDeleteBooking }) => {
    const { t, language } = useLanguage();
    
    const formatDate = (dateInput: Date | string) => {
        const date = new Date(dateInput);
        return date.toLocaleDateString(language, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };
    
    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-brand-text">{booking.product.name}</h4>
                    <p className="text-xs text-brand-secondary">
                        {t('admin.crm.bookedOn', { date: formatDate(booking.createdAt) })}
                    </p>
                    <p className="text-xs font-mono text-brand-accent mt-1">{booking.bookingCode}</p>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => onEditBooking(booking)} className="p-2 rounded-md text-brand-secondary hover:bg-gray-100" title={t('admin.crm.editBooking')}><EditIcon className="w-4 h-4" /></button>
                    <button onClick={() => onDeleteBooking(booking)} className="p-2 rounded-md text-red-500 hover:bg-red-50" title={t('admin.crm.deleteBooking')}><TrashIcon className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${booking.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {booking.isPaid ? t('admin.crm.paid') : t('admin.crm.unpaid')}
                </span>
                <span className="ml-2 font-semibold text-brand-text">${booking.price.toFixed(2)}</span>
            </div>
        </div>
    );
};


export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ customer, instructors, onBack, onEditBooking, onDeleteBooking }) => {
    const { t } = useLanguage();

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="text-brand-secondary hover:text-brand-accent mb-4 transition-colors font-semibold">
                &larr; {t('admin.crm.backToList')}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Customer Info */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-subtle border border-brand-border/50">
                        <h2 className="text-2xl font-bold text-brand-text">{customer.userInfo.firstName} {customer.userInfo.lastName}</h2>
                        <div className="mt-4 space-y-2 text-sm">
                            <p className="flex items-center gap-3 text-brand-secondary">
                                <MailIcon className="w-4 h-4 flex-shrink-0" />
                                <a href={`mailto:${customer.userInfo.email}`} className="text-brand-accent hover:underline break-all">{customer.userInfo.email}</a>
                            </p>
                            <p className="flex items-center gap-3 text-brand-secondary">
                                <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                                <span>{customer.userInfo.countryCode} {customer.userInfo.phone}</span>
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-subtle border border-brand-border/50">
                        <h3 className="font-bold text-brand-text mb-3">{t('admin.crm.statistics')}</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-semibold text-brand-secondary">{t('admin.crm.totalBookings')}</span>
                                <span className="font-bold text-lg text-brand-text">{customer.totalBookings}</span>
                            </div>
                             <div className="flex justify-between items-baseline">
                                <span className="text-sm font-semibold text-brand-secondary">{t('admin.crm.totalSpent')}</span>
                                <span className="font-bold text-lg text-brand-text">${customer.totalSpent.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between items-baseline">
                                <span className="text-sm font-semibold text-brand-secondary">{t('admin.crm.lastBooking')}</span>
                                <span className="font-semibold text-sm text-brand-text">{new Date(customer.lastBookingDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Bookings */}
                <div className="md:col-span-2">
                    <h3 className="text-xl font-bold text-brand-text mb-4">{t('admin.crm.bookingHistory')}</h3>
                    <div className="space-y-4">
                        {customer.bookings.length > 0 ? customer.bookings.map(booking => {
                            if (booking.product.type === 'CLASS_PACKAGE') {
                                return <ActivePackageCard key={booking.id} booking={booking as Booking & { product: ClassPackage }} instructors={instructors} />;
                            }
                            return <SimpleBookingCard key={booking.id} booking={booking} onEditBooking={onEditBooking} onDeleteBooking={onDeleteBooking} />;
                        }) : (
                            <div className="text-center py-12 text-brand-secondary bg-brand-background rounded-lg">
                                <p>{t('admin.crm.noBookings')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
