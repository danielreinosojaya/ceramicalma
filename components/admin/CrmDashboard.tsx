import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Customer, Booking, ClassPackage, TimeSlot, UserInfo, EditableBooking, PaymentDetails, Instructor } from '../../types';
import * as dataService from '../../services/dataService';
import { useLanguage } from '../../context/LanguageContext';
import { CustomerList } from './CustomerList';
import { CustomerDetailView } from './CustomerDetailView';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { OpenStudioView } from './OpenStudioView';
import { EditCustomerModal } from './EditCustomerModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { AcceptPaymentModal } from './AcceptPaymentModal';
import { EditBookingModal } from './EditBookingModal';


interface CrmDashboardProps {
    navigateToEmail?: string;
    bookings: Booking[];
    instructors: Instructor[];
    onDataChange: () => void;
    onNavigationComplete: () => void;
}

export type FilterType = 'all' | '1-left' | '2-left' | 'completed';

export interface RemainingClassesInfo {
    remaining: number;
    status: 'active' | 'completed';
}

export interface AugmentedCustomer extends Customer {
    remainingClassesInfo: RemainingClassesInfo | null;
}

const getSlotDateTime = (slot: TimeSlot) => {
    const [time, modifier] = slot.time.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier && modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (modifier && modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
    const startDateTime = new Date(slot.date + 'T00:00:00');
    startDateTime.setHours(hours, minutes, 0, 0);
    return startDateTime;
};

const getRemainingClassesInfo = (customer: Customer): RemainingClassesInfo | null => {
    const now = new Date();
    
    const validPackages = customer.bookings.filter(booking => {
        if (booking.productType !== 'CLASS_PACKAGE' || !booking.slots || booking.slots.length === 0) return false;
        
        const firstClassDate = booking.slots.map(getSlotDateTime).sort((a,b) => a.getTime() - b.getTime())[0];
        if (!firstClassDate) return false;
        
        const expiryDate = new Date(firstClassDate);
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        return now < expiryDate;

    }).sort((a, b) => {
        const expiryA = new Date(a.slots.map(getSlotDateTime).sort((c, d) => c.getTime() - d.getTime())[0]);
        expiryA.setDate(expiryA.getDate() + 30);
        const expiryB = new Date(b.slots.map(getSlotDateTime).sort((c, d) => c.getTime() - d.getTime())[0]);
        expiryB.setDate(expiryB.getDate() + 30);
        return expiryA.getTime() - expiryB.getTime();
    });
    
    if (validPackages.length === 0) return null;

    const mostRelevantPackage = validPackages[0];
    if (mostRelevantPackage.product.type !== 'CLASS_PACKAGE') return null;

    const product = mostRelevantPackage.product as ClassPackage;
    const completedClasses = mostRelevantPackage.slots.filter(slot => getSlotDateTime(slot) < now).length;
    const remaining = product.classes - completedClasses;

    return {
        remaining,
        status: remaining > 0 ? 'active' : 'completed'
    };
};


const CrmDashboard: React.FC<CrmDashboardProps> = ({ navigateToEmail, bookings, instructors, onDataChange, onNavigationComplete }) => {
    const { t } = useLanguage();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterByClassesRemaining, setFilterByClassesRemaining] = useState<FilterType>('all');
    const [activeTab, setActiveTab] = useState<'all' | 'openStudio'>('all');

    // Modal States
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
    const [bookingToPay, setBookingToPay] = useState<Booking | null>(null);

    const loadCustomers = useCallback(async () => {
        const allBookings = await dataService.getBookings();
        setCustomers(dataService.getCustomers(allBookings));
    }, []);

    useEffect(() => {
        loadCustomers();
        setLoading(false);
    }, [loadCustomers, bookings]);
    
    useEffect(() => {
        if (navigateToEmail) {
            const customer = customers.find(c => c.userInfo.email === navigateToEmail);
            if (customer) {
                setSelectedCustomer(customer);
                setSearchTerm('');
            }
            onNavigationComplete();
        }
    }, [navigateToEmail, customers, onNavigationComplete]);

    useEffect(() => {
      if (selectedCustomer) {
        const updatedCustomer = dataService.getCustomers(bookings).find(c => c.email === selectedCustomer.email);
        setSelectedCustomer(updatedCustomer || null);
      }
    }, [bookings, selectedCustomer]);

    // --- Modal Handlers ---
    const handleEditCustomer = (customer: Customer) => setCustomerToEdit(customer);
    const handleSaveCustomer = async (updatedUserInfo: UserInfo) => {
        if (!customerToEdit) return;
        await dataService.updateCustomer(customerToEdit.email, updatedUserInfo);
        onDataChange();
        setCustomerToEdit(null);
    };
    
    const handleDeleteCustomer = (customer: Customer) => setCustomerToDelete(customer);
    const handleConfirmDeleteCustomer = async () => {
        if (!customerToDelete) return;
        await dataService.deleteCustomer(customerToDelete.email);
        onDataChange();
        setCustomerToDelete(null);
    };

    const handleEditBooking = (booking: Booking) => setBookingToEdit(booking);
    const handleSaveBooking = async (updatedData: EditableBooking) => {
        if (!bookingToEdit) return;
        await dataService.updateBooking({ ...bookingToEdit, ...updatedData });
        onDataChange();
        setBookingToEdit(null);
    };
    
    const handleDeleteBooking = (booking: Booking) => setBookingToDelete(booking);
    const handleConfirmDeleteBooking = async () => {
        if (!bookingToDelete) return;
        await dataService.deleteBooking(bookingToDelete.id);
        setBookingToDelete(null);
        onDataChange();
    };
    
    const handleAcceptPayment = (booking: Booking) => setBookingToPay(booking);
    const handleConfirmPayment = async (details: Omit<PaymentDetails, 'receivedAt'>) => {
        if (bookingToPay) {
            await dataService.markBookingAsPaid(bookingToPay.id, details);
            onDataChange();
            setBookingToPay(null);
        }
    };

    const augmentedAndFilteredCustomers = useMemo((): AugmentedCustomer[] => {
        const augmented = customers.map(c => ({
            ...c,
            remainingClassesInfo: getRemainingClassesInfo(c)
        }));

        let filtered = augmented;
        
        if (filterByClassesRemaining !== 'all') {
            filtered = filtered.filter(c => {
                if (!c.remainingClassesInfo) return false;
                if (filterByClassesRemaining === '1-left') return c.remainingClassesInfo.remaining === 1 && c.remainingClassesInfo.status === 'active';
                if (filterByClassesRemaining === '2-left') return c.remainingClassesInfo.remaining === 2 && c.remainingClassesInfo.status === 'active';
                if (filterByClassesRemaining === 'completed') return c.remainingClassesInfo.status === 'completed';
                return false;
            });
        }
        
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(c => 
                c.userInfo.firstName.toLowerCase().includes(lowercasedTerm) ||
                c.userInfo.lastName.toLowerCase().includes(lowercasedTerm) ||
                c.userInfo.email.toLowerCase().includes(lowercasedTerm) ||
                c.bookings.some(b => b.bookingCode?.toLowerCase().includes(lowercasedTerm))
            );
        }

        return filtered;
    }, [customers, searchTerm, filterByClassesRemaining]);

    const handleSelectCustomer = (customer: Customer) => setSelectedCustomer(customer);
    const handleNavigateToCustomer = (email: string) => {
        const customer = customers.find(c => c.userInfo.email === email);
        if (customer) {
            setSelectedCustomer(customer);
        }
    };
    const handleBackToList = useCallback(() => {
        setSelectedCustomer(null);
    }, []);
    
    const FilterButton: React.FC<{ filter: FilterType; children: React.ReactNode; }> = ({ filter, children }) => (
        <button
            onClick={() => setFilterByClassesRemaining(filter)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${filterByClassesRemaining === filter ? 'bg-brand-primary text-white' : 'bg-brand-background hover:bg-brand-primary/20'}`}
        >
            {children}
        </button>
    );

    if (loading) {
        return <div>Loading customers...</div>
    }

    return (
        <div>
             {customerToEdit && (
                <EditCustomerModal 
                    userInfo={customerToEdit.userInfo}
                    onClose={() => setCustomerToEdit(null)}
                    onSave={handleSaveCustomer}
                />
            )}
            {customerToDelete && (
                 <DeleteConfirmationModal
                    isOpen={!!customerToDelete}
                    onClose={() => setCustomerToDelete(null)}
                    onConfirm={handleConfirmDeleteCustomer}
                    title={t('admin.crm.deleteCustomerConfirmTitle')}
                    message={t('admin.crm.deleteCustomerConfirmMessage', { name: `${customerToDelete.userInfo.firstName} ${customerToDelete.userInfo.lastName}`})}
                />
            )}
            {bookingToEdit && (
                <EditBookingModal 
                    booking={bookingToEdit}
                    onClose={() => setBookingToEdit(null)}
                    onSave={handleSaveBooking}
                />
            )}
            {bookingToDelete && (
                 <DeleteConfirmationModal
                    isOpen={!!bookingToDelete}
                    onClose={() => setBookingToDelete(null)}
                    onConfirm={handleConfirmDeleteBooking}
                    title={t('admin.crm.deleteBookingTitle')}
                    message={t('admin.crm.deleteBookingMessage', { code: bookingToDelete.bookingCode || 'N/A' })}
                />
            )}
            {bookingToPay && (
                <AcceptPaymentModal
                    isOpen={!!bookingToPay}
                    onClose={() => setBookingToPay(null)}
                    onConfirm={handleConfirmPayment}
                    booking={bookingToPay}
                />
            )}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-serif text-brand-text mb-2 flex items-center gap-3">
                        <UserGroupIcon className="w-6 h-6 text-brand-accent" />
                        {t('admin.crm.title')}
                    </h2>
                    <p className="text-brand-secondary">{t('admin.crm.subtitle')}</p>
                </div>
            </div>

            {selectedCustomer ? (
                <CustomerDetailView 
                    customer={selectedCustomer} 
                    instructors={instructors}
                    onBack={handleBackToList} 
                    onDataChange={onDataChange} 
                    onEditBooking={handleEditBooking}
                    onDeleteBooking={handleDeleteBooking}
                />
            ) : (
              <>
                <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-1 py-3 text-sm font-semibold border-b-2 ${activeTab === 'all' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('admin.crm.allCustomersTab')}
                        </button>
                        <button
                            onClick={() => setActiveTab('openStudio')}
                            className={`px-1 py-3 text-sm font-semibold border-b-2 ${activeTab === 'openStudio' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('admin.crm.openStudioTab')}
                        </button>
                    </nav>
                </div>
                
                {activeTab === 'all' && (
                    <div className="animate-fade-in">
                        <div className="md:flex justify-between items-center mb-4 gap-4">
                            <input 
                                type="text"
                                placeholder={t('admin.crm.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
                            />
                            <div className="bg-white p-2 rounded-lg border border-gray-200 flex items-center gap-2 flex-wrap mt-4 md:mt-0">
                                <span className="text-sm font-bold text-brand-secondary mr-2">{t('admin.crm.filters.title')}:</span>
                                <FilterButton filter="all">{t('admin.crm.filters.all')}</FilterButton>
                                <FilterButton filter="2-left">{t('admin.crm.filters.2left')}</FilterButton>
                                <FilterButton filter="1-left">{t('admin.crm.filters.1left')}</FilterButton>
                                <FilterButton filter="completed">{t('admin.crm.filters.completed')}</FilterButton>
                            </div>
                        </div>
                        <CustomerList 
                            customers={augmentedAndFilteredCustomers} 
                            onSelectCustomer={handleSelectCustomer} 
                            onEditCustomer={handleEditCustomer}
                            onDeleteCustomer={handleDeleteCustomer}
                        />
                    </div>
                )}
                
                {activeTab === 'openStudio' && (
                    <OpenStudioView 
                        bookings={bookings} 
                        onNavigateToCustomer={handleNavigateToCustomer}
                        onAcceptPayment={handleAcceptPayment}
                        onEditBooking={handleEditBooking}
                        onDeleteBooking={handleDeleteBooking}
                    />
                )}
              </>
            )}
        </div>
    );
};

export default CrmDashboard;