
import React, { useState } from 'react';
import type { BookingDetails, UserInfo, AppData, TimeSlot, InvoiceRequest } from '../types';
import { useLanguage } from '../context/LanguageContext';
import * as dataService from '../services/dataService';
import { UserInfoModal } from './UserInfoModal';
import { PolicyModal } from './PolicyModal';
import { InstructorTag } from './InstructorTag';
import { DownloadIcon } from './icons/DownloadIcon';
import { exportScheduleToCSV } from '../services/bookingService';
import { generateBookingPDF } from '../services/pdfService';

export const BookingSummary: React.FC<{
  bookingDetails: BookingDetails;
  onBookingComplete: () => void;
  onBack: () => void;
  appData: AppData;
}> = ({ bookingDetails, onBookingComplete, onBack, appData }) => {
  const { t, language } = useLanguage();
  const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { product, slots } = bookingDetails;
  if (!product) {
    return <div>Error: No product selected.</div>;
  }
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
    return adjustedDate.toLocaleDateString(language, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleUserInfoSubmit = async (data: { userInfo: UserInfo, needsInvoice: boolean, invoiceData?: Omit<InvoiceRequest, 'id' | 'bookingId' | 'status' | 'requestedAt' | 'processedAt' | 'bookingCode' | 'userInfo'> }) => {
    setIsSubmitting(true);
    const finalBookingDetails = { 
      ...bookingDetails, 
      userInfo: data.userInfo,
      productType: product.type,
      productId: product.id,
      isPaid: false,
      price: 'price' in product ? product.price : 0,
      bookingMode: product.type === 'CLASS_PACKAGE' ? 'flexible' : 'monthly'
    };

    const payload = {
      ...finalBookingDetails,
      invoiceData: data.needsInvoice ? data.invoiceData : undefined
    };

    try {
      const result = await dataService.addBooking(payload);
      if (result.success) {
        onBookingComplete();
      } else {
        alert(t(`errors.${result.message}`) || "An unknown error occurred.");
      }
    } catch (error) {
      console.error("Booking submission failed:", error);
      alert("An error occurred while creating your booking.");
    } finally {
      setIsSubmitting(false);
      setIsUserInfoModalOpen(false);
    }
  };

  const handleDownloadCSV = () => {
    const headers = {
      mainTitle: t('csv.mainTitle'),
      packageTitle: t('csv.packageTitle'),
      date: t('csv.date'),
      day: t('csv.day'),
      time: t('csv.time'),
    };
    exportScheduleToCSV(bookingDetails, headers);
  };
  
  const handleDownloadPDF = async () => {
    const pdfTranslations = {
      title: t('pdf.title'),
      schoolName: t('pdf.schoolName'),
      customerInfoTitle: t('pdf.customerInfoTitle'),
      statusNotPaid: t('pdf.statusNotPaid'),
      bookingCode: t('pdf.bookingCode'),
      packageName: t('pdf.packageName'),
      packageDetailsTitle: t('pdf.packageDetailsTitle'),
      durationLabel: t('modal.durationLabel'),
      durationValue: product.type === 'CLASS_PACKAGE' || product.type === 'INTRODUCTORY_CLASS' ? product.details.duration : '',
      activitiesLabel: t('modal.activitiesLabel'),
      activitiesValue: product.type === 'CLASS_PACKAGE' || product.type === 'INTRODUCTORY_CLASS' ? product.details.activities : [],
      generalRecommendationsLabel: t('modal.generalRecommendationsLabel'),
      generalRecommendationsValue: product.type === 'CLASS_PACKAGE' || product.type === 'INTRODUCTORY_CLASS' ? product.details.generalRecommendations : '',
      materialsLabel: t('modal.materialsLabel'),
      materialsValue: product.type === 'CLASS_PACKAGE' || product.type === 'INTRODUCTORY_CLASS' ? product.details.materials : '',
      scheduleTitle: t('pdf.scheduleTitle'),
      dateHeader: t('pdf.dateHeader'),
      timeHeader: t('pdf.timeHeader'),
      instructorHeader: t('pdf.instructorHeader'),
      importantInfoTitle: t('pdf.importantInfoTitle'),
      policy: appData.policies,
      addressLabel: t('footer.address'),
      emailLabel: t('footer.email'),
      whatsappLabel: t('footer.whatsapp'),
      googleMapsLabel: t('footer.googleMaps'),
      instagramLabel: t('footer.instagram')
    };
    
    const tempBooking = { ...bookingDetails, id: 'temp', isPaid: false, createdAt: new Date(), price: 'price' in product ? product.price : 0, userInfo: { firstName: 'Por', lastName: 'Confirmar', email: '', phone: '', countryCode: ''} };
    
    //FIX: Add missing properties to tempBooking to satisfy the Booking type
    await generateBookingPDF({ ...tempBooking, product, productType: product.type, bookingCode: 'PREVIEW', bookingMode: 'flexible' }, pdfTranslations, appData.footerInfo, language);
  };
  
  return (
    <div className="max-w-4xl mx-auto bg-brand-surface p-6 sm:p-8 rounded-xl shadow-subtle animate-fade-in-up">
      {isUserInfoModalOpen && (
        <UserInfoModal
          onClose={() => setIsUserInfoModalOpen(false)}
          onSubmit={handleUserInfoSubmit}
          onShowPolicies={() => setIsPolicyModalOpen(true)}
        />
      )}
      {isPolicyModalOpen && (
          <PolicyModal onClose={() => setIsPolicyModalOpen(false)} policiesText={appData.policies}/>
      )}

      <button onClick={onBack} className="text-brand-secondary hover:text-brand-text mb-4 transition-colors font-semibold">
        &larr; {t('summary.backButton')}
      </button>

      <div className="text-center">
        <h2 className="text-3xl font-semibold text-brand-text mb-2">{t('summary.title')}</h2>
        <p className="text-brand-secondary mb-8">{t('summary.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-brand-background p-6 rounded-lg">
          <h3 className="text-2xl font-bold text-brand-primary mb-4">{product.name}</h3>
          <p className="text-brand-secondary mb-4">{product.description}</p>
          {'price' in product && product.price && (
            <p className="text-4xl font-bold text-brand-text">${product.price.toFixed(2)}</p>
          )}
        </div>

        <div className="bg-brand-background p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-brand-text">{t('summary.scheduleTitle')}</h3>
            <div className="flex items-center gap-2">
              <button onClick={handleDownloadCSV} title={t('summary.downloadCsv')} className="p-2 text-brand-secondary hover:text-brand-accent transition-colors"><DownloadIcon className="w-5 h-5"/></button>
              <button onClick={handleDownloadPDF} title={t('summary.downloadPdf')} className="p-2 text-brand-secondary hover:text-brand-accent transition-colors"><DownloadIcon className="w-5 h-5"/></button>
            </div>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {slots.map((slot, index) => (
              <div key={index} className="bg-white p-3 rounded-md shadow-sm">
                <p className="font-semibold text-brand-text">{formatDate(slot.date)}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-brand-secondary">{slot.time}</p>
                  <InstructorTag instructorId={slot.instructorId} instructors={appData.instructors} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-brand-border flex flex-col items-center">
        <button
          onClick={() => setIsUserInfoModalOpen(true)}
          disabled={isSubmitting}
          className="w-full max-w-sm bg-brand-primary text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-opacity duration-300 disabled:bg-gray-400"
        >
          {isSubmitting ? t('summary.submittingButton') : t('summary.confirmButton')}
        </button>
      </div>
    </div>
  );
};
