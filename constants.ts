import type { Product, AvailableSlot, Instructor, ConfirmationMessage, ClassCapacity, CapacityMessageSettings, DayKey, FooterInfo, AutomationSettings } from './types';

export const PALETTE_COLORS = [
    { name: 'sky', bg: 'bg-sky-200', text: 'text-sky-800' },
    { name: 'teal', bg: 'bg-teal-200', text: 'text-teal-800' },
    { name: 'rose', bg: 'bg-rose-200', text: 'text-rose-800' },
    { name: 'indigo', bg: 'bg-indigo-200', text: 'text-indigo-800' },
    { name: 'amber', bg: 'bg-amber-200', text: 'text-amber-800' },
    { name: 'secondary', bg: 'bg-gray-200', text: 'text-gray-600' }
];

export const COUNTRIES = [
    { name: 'Peru', code: '+51', flag: '🇵🇪' },
    { name: 'Argentina', code: '+54', flag: '🇦🇷' },
    { name: 'Australia', code: '+61', flag: '🇦🇺' },
    { name: 'Austria', code: '+43', flag: '🇦🇹' },
    { name: 'Belgium', code: '+32', flag: '🇧🇪' },
    { name: 'Bolivia', code: '+591', flag: '🇧🇴' },
    { name: 'Brazil', code: '+55', flag: '🇧🇷' },
    { name: 'Canada', code: '+1', flag: '🇨🇦' },
    { name: 'Chile', code: '+56', flag: '🇨🇱' },
    { name: 'China', code: '+86', flag: '🇨🇳' },
    { name: 'Colombia', code: '+57', flag: '🇨🇴' },
    { name: 'Costa Rica', code: '+506', flag: '🇨🇷' },
    { name: 'Denmark', code: '+45', flag: '🇩🇰' },
    { name: 'Ecuador', code: '+593', flag: '🇪🇨' },
    { name: 'Finland', code: '+358', flag: '🇫🇮' },
    { name: 'France', code: '+33', flag: '🇫🇷' },
    { name: 'Germany', code: '+49', flag: '🇩🇪' },
    { name: 'Greece', code: '+30', flag: '🇬🇷' },
    { name: 'India', code: '+91', flag: '🇮🇳' },
    { name: 'Ireland', code: '+353', flag: '🇮🇪' },
    { name: 'Italy', code: '+39', flag: '🇮🇹' },
    { name: 'Japan', code: '+81', flag: '🇯🇵' },
    { name: 'Mexico', code: '+52', flag: '🇲🇽' },
    { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
    { name: 'New Zealand', code: '+64', flag: '🇳🇿' },
    { name: 'Norway', code: '+47', flag: '🇳🇴' },
    { name: 'Panama', code: '+507', flag: '🇵🇦' },
    { name: 'Paraguay', code: '+595', flag: '🇵🇾' },
    { name: 'Portugal', code: '+351', flag: '🇵🇹' },
    { name: 'South Korea', code: '+82', flag: '🇰🇷' },
    { name: 'Spain', code: '+34', flag: '🇪🇸' },
    { name: 'Sweden', code: '+46', flag: '🇸🇪' },
    { name: 'Switzerland', code: '+41', flag: '🇨🇭' },
    { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
    { name: 'USA', code: '+1', flag: '🇺🇸' },
    { name: 'Uruguay', code: '+598', flag: '🇺🇾' },
    { name: 'Venezuela', code: '+58', flag: '🇻🇪' },
];

export const DAY_NAMES: DayKey[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 1,
    type: 'CLASS_PACKAGE',
    name: "Torno para Principiantes",
    classes: 4,
    price: 250,
    description: "Una introducción perfecta a los conceptos básicos del torno de alfarero.",
    imageUrl: "https://images.unsplash.com/photo-1554203198-0c19e710032b?q=80&w=1974&auto=format&fit=crop",
    details: {
      duration: "2 horas por clase",
      durationHours: 2,
      activities: ["Amasado y preparación de la arcilla", "Centrado de la pella en el torno", "Creación de cilindros y cuencos básicos", "Técnicas de retoque y acabado"],
      generalRecommendations: "Traer ropa cómoda que se pueda ensuciar, uñas cortas y el pelo recogido. ¡Muchas ganas de aprender!",
      materials: "Incluye toda la arcilla necesaria para las clases y el uso de herramientas del taller."
    },
    isActive: true
  },
  {
    id: 2,
    type: 'CLASS_PACKAGE',
    name: "Paquete de 8 Clases Libres",
    classes: 8,
    price: 450,
    description: "Perfecciona tu técnica y desarrolla proyectos personales con más tiempo en el torno.",
    imageUrl: "https://images.unsplash.com/photo-1605416325121-875b3d3f925c?q=80&w=2070&auto=format&fit=crop",
    details: {
      duration: "2.5 horas por clase",
      durationHours: 2.5,
      activities: ["Desarrollo de proyectos personales", "Técnicas avanzadas de torneado", "Retorneado de piezas complejas", "Introducción al esmaltado"],
      generalRecommendations: "Ideal para alumnos que ya completaron el curso de principiantes. Traer ideas y bocetos.",
      materials: "Incluye 1 bolsa de arcilla y acceso a una variedad de esmaltes del taller."
    },
    isActive: true
  },
  {
    id: 3,
    type: 'OPEN_STUDIO_SUBSCRIPTION',
    name: "Acceso a Estudio Abierto",
    price: 150,
    description: "Tu espacio para crear. Accede al taller y a todas las herramientas para tus proyectos personales.",
    imageUrl: "https://images.unsplash.com/photo-1548897501-195b095e72b4?q=80&w=1939&auto=format&fit=crop",
    details: {
      durationDays: 30,
      timeLimit: "Hasta 10 horas por semana durante el horario de estudio abierto.",
      materialsLimit: "La primera bolsa de arcilla está incluida. Las adicionales tienen costo extra.",
      howItWorks: ["Reserva tu horario en el torno vía WhatsApp.", "Acceso a todas las herramientas y estanterías.", "Quemas de piezas se coordinan y pagan por separado."]
    },
    isActive: true
  },
  {
    id: 4,
    type: 'INTRODUCTORY_CLASS',
    name: "Clase Introductoria al Torno",
    price: 75,
    description: "Una experiencia única para un primer contacto con la arcilla y el torno. ¡Ideal para principiantes!",
    imageUrl: "https://images.unsplash.com/photo-1578701925695-8a0327f495e0?q=80&w=1968&auto=format&fit=crop",
    details: {
      duration: "2.5 horas",
      durationHours: 2.5,
      activities: ["Demostración de amasado y centrado.", "Práctica guiada para crear tu primera pieza.", "Decoración básica con engobes.", "La pieza será esmaltada por el taller y estará lista en 3 semanas."],
      generalRecommendations: "¡Solo trae tu curiosidad! Nosotros nos encargamos del resto.",
      materials: "Todo incluido: arcilla, herramientas, delantal y la quema de una pieza."
    },
    isActive: true,
    schedulingRules: [
        { id: '6-1000-1', dayOfWeek: 6, time: '10:00', instructorId: 1, capacity: 6 },
        { id: '6-1500-2', dayOfWeek: 6, time: '15:00', instructorId: 2, capacity: 6 }
    ],
    overrides: []
  },
   {
    id: 5,
    type: 'GROUP_EXPERIENCE',
    name: "Experiencia Grupal en Cerámica",
    description: "Celebra un cumpleaños, un evento de team building o simplemente una reunión creativa con amigos. Una experiencia privada y memorable.",
    imageUrl: "https://images.unsplash.com/photo-1516592673884-4a382d112b03?q=80&w=2070&auto=format&fit=crop",
    isActive: true
  },
  {
    id: 6,
    type: 'COUPLES_EXPERIENCE',
    name: "Experiencia en Pareja",
// FIX: Added isActive property and completed the description.
    description: "Una cita creativa y diferente. Moldeen una pieza juntos en el torno o creen piezas individuales uno al lado del otro.",
    isActive: true
  }
];
// FIX: Added missing default exports to be used by the API layer.
export const DEFAULT_INSTRUCTORS: Instructor[] = [
  { id: 1, name: 'Ana', colorScheme: 'sky' },
  { id: 2, name: 'Carlos', colorScheme: 'teal' },
];

export const DEFAULT_AVAILABLE_SLOTS_BY_DAY: Record<DayKey, AvailableSlot[]> = {
  Monday: [
    { time: '10:00 AM', instructorId: 1 },
    { time: '03:00 PM', instructorId: 2 },
  ],
  Tuesday: [
    { time: '10:00 AM', instructorId: 1 },
    { time: '03:00 PM', instructorId: 2 },
  ],
  Wednesday: [
    { time: '10:00 AM', instructorId: 1 },
    { time: '03:00 PM', instructorId: 2 },
  ],
  Thursday: [
    { time: '10:00 AM', instructorId: 1 },
    { time: '03:00 PM', instructorId: 2 },
  ],
  Friday: [
    { time: '10:00 AM', instructorId: 1 },
    { time: '03:00 PM', instructorId: 2 },
  ],
  Saturday: [
    { time: '10:00 AM', instructorId: 1 },
    { time: '02:00 PM', instructorId: 2 },
  ],
  Sunday: [],
};

export const DEFAULT_POLICIES_TEXT: string = `
Políticas de Cancelación:
- Cancelaciones con más de 48 horas de antelación: Reembolso completo o reprogramación.
- Cancelaciones con menos de 48 horas: No hay reembolso. Se puede reprogramar con un cargo del 50%.
- No presentarse (no-show) resultará en la pérdida total de la clase.

Recomendaciones Generales:
- Por favor, llega 10 minutos antes de tu clase.
- Usa ropa cómoda que no te importe ensuciar.
- Mantén las uñas cortas para una mejor experiencia en el torno.
`;

export const DEFAULT_CONFIRMATION_MESSAGE: ConfirmationMessage = {
  title: '¡Pre-reserva completada!',
  message: 'Hemos recibido tu solicitud. Para confirmar tu cupo, por favor realiza el pago y envía el comprobante por WhatsApp.'
};

export const DEFAULT_CLASS_CAPACITY: ClassCapacity = {
  max: 8,
};

export const DEFAULT_CAPACITY_MESSAGES: CapacityMessageSettings = {
    thresholds: [
        { level: 'available', threshold: 0, message: 'Espacios disponibles' },
        { level: 'few', threshold: 50, message: 'Quedan pocos cupos' },
        { level: 'last', threshold: 85, message: '¡Último cupo!' }
    ]
};

export const DEFAULT_FOOTER_INFO: FooterInfo = {
    address: 'Av. Principal 123, Miraflores, Lima',
    email: 'hola@ceramic-alma.com',
    whatsapp: '+51 987 654 321',
    googleMapsLink: 'https://maps.google.com',
    instagramHandle: '@ceramic_alma'
};

export const DEFAULT_AUTOMATION_SETTINGS: AutomationSettings = {
    preBookingConfirmation: { enabled: true },
    paymentReceipt: { enabled: true },
    classReminder: { enabled: true, value: 24, unit: 'hours' },
    incentiveRenewal: { enabled: false, value: 1, unit: 'classes' }
};
