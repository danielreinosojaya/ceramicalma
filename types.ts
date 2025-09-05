export type AppView = 'welcome' | 'packages' | 'intro_classes' | 'schedule' | 'group_experience' | 'couples_experience' | 'summary';

export type DayKey = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface PackageDetails {
  duration: string;
  activities: string[];
  generalRecommendations: string;
  materials: string;
  durationHours: number;
}

export interface OpenStudioDetails {
  durationDays: number;
  timeLimit: string;
  materialsLimit: string;
  howItWorks: string[];
}

export interface ClassPackage {
  id: number;
  type: 'CLASS_PACKAGE';
  name: string;
  classes: number;
  price: number;
  description: string;
  details: PackageDetails;
  isActive: boolean;
  imageUrl?: string;
}

export interface OpenStudioSubscription {
  id: number;
  type: 'OPEN_STUDIO_SUBSCRIPTION';
  name: string;
  price: number;
  description: string;
  details: OpenStudioDetails;
  isActive: boolean;
  imageUrl?: string;
}

export interface SchedulingRule {
  id: string; // Unique ID for the rule, e.g., weekday-HHMM-instructorId
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  time: string; // HH:mm (24-hour format)
  instructorId: number;
  capacity: number;
}


export interface IntroClassSession {
  id: string; // Unique ID for the session, e.g., YYYY-MM-DD-HHMM-InstructorId
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  instructorId: number;
  capacity: number;
}

export interface EnrichedIntroClassSession extends IntroClassSession {
    paidBookingsCount: number;
    totalBookingsCount: number;
    isOverride: boolean; // Flag to indicate if it comes from an override
}

export interface SessionOverride {
  date: string; // YYYY-MM-DD
  // If sessions is an array, it REPLACES the generated schedule for this day.
  // If sessions is null, it CANCELS all classes for this day.
  sessions: { time: string; instructorId: number; capacity: number }[] | null;
}

export interface IntroductoryClass {
  id: number;
  type: 'INTRODUCTORY_CLASS';
  name: string;
  price: number;
  description: string;
  details: PackageDetails;
  isActive: boolean;
  imageUrl?: string;
  schedulingRules: SchedulingRule[];
  overrides: SessionOverride[];
}

export interface GroupExperience {
    id: number;
    type: 'GROUP_EXPERIENCE';
    name: string;
    description: string;
    isActive: boolean;
    imageUrl?: string;
}

export interface CouplesExperience {
    id: number;
    type: 'COUPLES_EXPERIENCE';
    name: string;
    description: string;
    isActive: boolean;
    imageUrl?: string;
}

export type Product = ClassPackage | IntroductoryClass | OpenStudioSubscription | GroupExperience | CouplesExperience;

export interface TimeSlot {
  date: string; // YYYY-MM-DD format
  time: string;
  instructorId: number;
}

export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
}

export type BookingMode = 'flexible' | 'monthly';

export interface BookingDetails {
  product: Product;
  slots: TimeSlot[];
  userInfo?: UserInfo;
  bookingMode?: BookingMode;
}

export interface PaymentDetails {
    method: 'Cash' | 'Card' | 'Transfer' | 'Manual';
    amount: number;
    receivedAt: string; // ISO String
}

export type AttendanceStatus = 'attended' | 'no-show';

export interface BillingDetails {
  businessName: string;
  taxId: string;
  address: string;
  email: string;
}

export interface Booking {
  id: string;
  productId: number;
  productType: 'CLASS_PACKAGE' | 'INTRODUCTORY_CLASS' | 'OPEN_STUDIO_SUBSCRIPTION';
  slots: TimeSlot[];
  userInfo: UserInfo;
  createdAt: Date;
  isPaid: boolean;
  price: number;
  bookingMode?: BookingMode;
  product: Product;
  bookingCode?: string;
  paymentDetails?: PaymentDetails;
  attendance?: { [slotIdentifier: string]: AttendanceStatus }; // slotIdentifier is `${date}_${time}`
  billingDetails?: BillingDetails;
}


export type EditableBooking = Pick<Booking, 'userInfo' | 'price'>;

export interface AvailableSlot {
  time: string;
  instructorId: number;
}

export interface EnrichedAvailableSlot extends AvailableSlot {
  paidBookingsCount: number;
  totalBookingsCount: number;
  maxCapacity: number;
}

export interface Instructor {
  id: number;
  name: string;
  colorScheme: string;
}

export interface DailyScheduleOverride {
    slots: AvailableSlot[] | null; // null represents a cancellation day
    capacity?: number;
}
export type ScheduleOverrides = Record<string, DailyScheduleOverride>;


export interface Notification {
  id: string;
  type: 'new_booking' | 'new_inquiry';
  targetId: string; // booking.id or inquiry.id
  userName: string;
  summary: string; // product name or inquiry summary
  timestamp: string | null; // ISO String or null for invalid dates
  read: boolean;
}

export type ClientNotificationType = 'PRE_BOOKING_CONFIRMATION' | 'PAYMENT_RECEIPT' | 'CLASS_REMINDER' | 'INCENTIVE_RENEWAL';

export interface ClientNotification {
  id: string;
  createdAt: string; // ISO String
  clientName: string;
  clientEmail: string;
  type: ClientNotificationType;
  channel: 'Email';
  status: 'Sent' | 'Scheduled'; // For simulation
  bookingCode?: string;
  scheduledAt?: string; // ISO String for when the notification is due
}


export type UrgencyLevel = 'info' | 'warning' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  urgency: UrgencyLevel;
  createdAt: string; // ISO String
}

export interface AddBookingResult {
  success: boolean;
  message: string;
  booking?: Booking;
}

export interface RescheduleSlotInfo {
  bookingId: string;
  slot: TimeSlot;
  attendeeName: string;
}

export interface Customer {
  email: string;
  userInfo: UserInfo;
  bookings: Booking[];
  totalBookings: number;
  totalSpent: number;
  lastBookingDate: Date;
}

export interface ScheduleReportInfo {
  period: 'today' | 'week' | 'month' | 'custom';
  startDate: string;
  endDate: string;
}

export interface ClearScheduleInfo {
  period: 'today' | 'week' | 'month' | 'custom';
  startDate: string;
  endDate: string;
}

export interface ConfirmationMessage {
  title: string;
  message: string;
}

export interface ClassCapacity {
    max: number;
}

export interface CapacityThreshold {
    level: 'available' | 'few' | 'last';
    threshold: number; // Percentage
    message: string;
}

export interface CapacityMessageSettings {
    thresholds: CapacityThreshold[];
}


export type AdminTab = 'products' | 'calendar' | 'schedule-settings' | 'financials' | 'customers' | 'settings' | 'inquiries' | 'communications';

export interface UITexts {
    [key: string]: string | any; // Allow nested objects
}

export interface FooterInfo {
    address: string;
    email: string;
    whatsapp: string;
    googleMapsLink: string;
    instagramHandle: string;
}

export type InquiryStatus = 'New' | 'Contacted' | 'Proposal Sent' | 'Confirmed' | 'Archived';

export interface GroupInquiry {
    id: string;
    name: string;
    email: string;
    phone: string;
    countryCode: string;
    participants: number;
    tentativeDate: string; // YYYY-MM-DD
    eventType?: string;
    message: string;
    status: InquiryStatus;
    createdAt: string; // ISO String
    inquiryType: 'group' | 'couple';
}

export type BlendMode = 'multiply' | 'normal';

export interface BackgroundImageSetting {
  url: string;
  opacity: number;
  blendMode: BlendMode;
}

export interface BackgroundSettings {
  topLeft: BackgroundImageSetting | null;
  bottomRight: BackgroundImageSetting | null;
}

export interface AutomationSettings {
    preBookingConfirmation: { enabled: boolean };
    paymentReceipt: { enabled: boolean };
    classReminder: { enabled: boolean; value: number; unit: 'hours' | 'days' };
    incentiveRenewal: { enabled: boolean; value: number; unit: 'classes' };
}

export interface BankDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  accountType: string;
  taxId: string; // e.g., RUT, CUIT, CBU
  details?: string; // For SWIFT, IBAN, etc.
}

export interface AppData {
  products: Product[];
  instructors: Instructor[];
  availability: Record<DayKey, AvailableSlot[]>;
  scheduleOverrides: ScheduleOverrides;
  classCapacity: ClassCapacity;
  capacityMessages: CapacityMessageSettings;
  announcements: Announcement[];
  bookings: Booking[];
  policies: string;
  confirmationMessage: ConfirmationMessage;
  footerInfo: FooterInfo;
  bankDetails: BankDetails;
}

export interface AdminData extends Omit<AppData, 'policies' | 'confirmationMessage' | 'footerInfo'> {
  inquiries: GroupInquiry[];
}