import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { seedDatabase, ensureTablesExist } from './db.js';
import type { 
    Product, Booking, ScheduleOverrides, Notification, Announcement, Instructor, 
    ConfirmationMessage, ClassCapacity, CapacityMessageSettings, UITexts, FooterInfo, 
    GroupInquiry, AddBookingResult, PaymentDetails, AttendanceStatus,
    InquiryStatus, DayKey, AvailableSlot, AutomationSettings, UserInfo
} from '../types.js';
// FIX: Corrected import names for default data.
import { 
    DEFAULT_PRODUCTS, DEFAULT_AVAILABLE_SLOTS_BY_DAY, DEFAULT_INSTRUCTORS, 
    DEFAULT_POLICIES_TEXT, DEFAULT_CONFIRMATION_MESSAGE, DEFAULT_CLASS_CAPACITY, 
    DEFAULT_CAPACITY_MESSAGES, DEFAULT_FOOTER_INFO, DEFAULT_AUTOMATION_SETTINGS 
} from '../constants.js';


// Helper to convert snake_case keys from DB to camelCase for the app
const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            acc[camelKey] = toCamelCase(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
};

const generateBookingCode = (): string => {
    const prefix = 'C-ALMA';
    const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${prefix}-${timestamp}${randomPart}`;
};

// Main handler for all API requests
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust in production
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await ensureTablesExist();
        await seedDatabase();

        if (req.method === 'GET') {
            await handleGet(req, res);
        } else if (req.method === 'POST') {
            await handlePost(req, res);
        } else {
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('API Error:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'An internal server error occurred.';
        res.status(500).json({ error: errorMessage });
    }
}

// Handler for GET requests
async function handleGet(req: VercelRequest, res: VercelResponse) {
    const { key } = req.query;
    
    if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'A "key" query parameter is required.' });
    }

    let data;
    switch (key) {
        case 'products':
            const { rows: products } = await sql`SELECT * FROM products ORDER BY id ASC`;
            data = toCamelCase(products);
            break;
        case 'bookings':
            const { rows: bookings } = await sql`SELECT * FROM bookings ORDER BY created_at DESC`;
            data = toCamelCase(bookings);
            break;
        case 'instructors':
            const { rows: instructors } = await sql`SELECT * FROM instructors ORDER BY id ASC`;
            data = toCamelCase(instructors);
            break;
        case 'groupInquiries':
            const { rows: inquiries } = await sql`SELECT * FROM inquiries ORDER BY created_at DESC`;
            data = toCamelCase(inquiries);
            break;
        case 'notifications':
             const { rows: notifications } = await sql`SELECT * FROM notifications ORDER BY timestamp DESC`;
            data = toCamelCase(notifications);
            break;
        default:
            const { rows: settings } = await sql`SELECT value FROM settings WHERE key = ${key}`;
            if (settings.length > 0) {
                data = settings[0].value;
            } else {
                return res.status(404).json({ error: `Setting with key "${key}" not found.` });
            }
    }
    return res.status(200).json(data);
}

// Handler for POST requests (updates and actions)
async function handlePost(req: VercelRequest, res: VercelResponse) {
    const { key, action } = req.query;

    if (action) {
        return handleAction(action as string, req, res);
    }
    
    if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'A "key" query parameter is required for data updates.' });
    }

    const value = req.body;
    switch (key) {
        case 'products':
            await sql`BEGIN`;
            await sql`DELETE FROM products`;
            for (const p of value) {
                 await sql`
                    INSERT INTO products (id, type, name, classes, price, description, image_url, details, is_active, scheduling_rules, overrides) 
                    VALUES (
                        ${p.id}, 
                        ${p.type}, 
                        ${p.name}, 
                        ${p.classes || null}, 
                        ${p.price || null}, 
                        ${p.description || null}, 
                        ${p.imageUrl || null}, 
                        ${p.details ? JSON.stringify(p.details) : null}, 
                        ${p.isActive}, 
                        ${p.schedulingRules ? JSON.stringify(p.schedulingRules) : null}, 
                        ${p.overrides ? JSON.stringify(p.overrides) : null}
                    )
                ON CONFLICT (id) DO NOTHING;
            `;
            }
            await sql`COMMIT`;
            break;
        case 'instructors':
            await sql`BEGIN`;
            await sql`DELETE FROM instructors`;
            for (const i of value) {
                await sql`INSERT INTO instructors (id, name, color_scheme) VALUES (${i.id}, ${i.name}, ${i.colorScheme});`;
            }
            await sql`COMMIT`;
            break;
        default:
            await sql`INSERT INTO settings (key, value) VALUES (${key}, ${JSON.stringify(value)}) 
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`;
    }

    return res.status(200).json({ success: true });
}

// Handler for specific actions
async function handleAction(action: string, req: VercelRequest, res: VercelResponse) {
    const body = req.body;
    let result: any = { success: true };

    switch (action) {
        case 'addBooking':
            result = await addBookingAction(body);
            break;
        case 'updateBooking':
             await sql`UPDATE bookings SET user_info = ${JSON.stringify(body.userInfo)}, price = ${body.price} WHERE id = ${body.id}`;
            break;
        case 'removeBookingSlot':
            const { bookingId: removeId, slotToRemove } = body;
            const { rows: [bookingToRemoveFrom] } = await sql`SELECT slots FROM bookings WHERE id = ${removeId}`;
            if (bookingToRemoveFrom) {
                const updatedSlots = bookingToRemoveFrom.slots.filter((s: any) => s.date !== slotToRemove.date || s.time !== slotToRemove.time);
                await sql`UPDATE bookings SET slots = ${JSON.stringify(updatedSlots)} WHERE id = ${removeId}`;
            }
            break;
        case 'markBookingAsPaid':
            const { bookingId: paidId, details } = body;
            const paymentDetails: PaymentDetails = { ...details, receivedAt: new Date().toISOString() };
            await sql`UPDATE bookings SET is_paid = true, payment_details = ${JSON.stringify(paymentDetails)} WHERE id = ${paidId}`;
            break;
        case 'markBookingAsUnpaid':
            await sql`UPDATE bookings SET is_paid = false, payment_details = NULL WHERE id = ${body.bookingId}`;
            break;
        case 'rescheduleBookingSlot':
            const { bookingId: rescheduleId, oldSlot, newSlot } = body;
            const { rows: [bookingToReschedule] } = await sql`SELECT slots FROM bookings WHERE id = ${rescheduleId}`;
            if (bookingToReschedule) {
                const otherSlots = bookingToReschedule.slots.filter((s: any) => s.date !== oldSlot.date || s.time !== oldSlot.time);
                const updatedSlots = [...otherSlots, newSlot];
                await sql`UPDATE bookings SET slots = ${JSON.stringify(updatedSlots)} WHERE id = ${rescheduleId}`;
            }
            break;
        case 'deleteBookingsInDateRange':
            const { startDate, endDate } = body;
            const { rows: bookingsInRange } = await sql`SELECT id, slots FROM bookings`;
            for (const booking of bookingsInRange) {
                const remainingSlots = booking.slots.filter((s: any) => {
                    const slotDate = new Date(s.date);
                    return slotDate < new Date(startDate) || slotDate > new Date(endDate);
                });
                if (remainingSlots.length < booking.slots.length) {
                    if (remainingSlots.length === 0) {
                        await sql`DELETE FROM bookings WHERE id = ${booking.id}`;
                    } else {
                        await sql`UPDATE bookings SET slots = ${JSON.stringify(remainingSlots)} WHERE id = ${booking.id}`;
                    }
                }
            }
            break;
        case 'updateAttendanceStatus':
            const { bookingId: attendanceId, slot, status } = body;
            const slotIdentifier = `${slot.date}_${slot.time}`;
            await sql`UPDATE bookings SET attendance = COALESCE(attendance, '{}'::jsonb) || ${JSON.stringify({ [slotIdentifier]: status })}::jsonb WHERE id = ${attendanceId}`;
            break;
        case 'addGroupInquiry':
            const newInquiry = { ...body, status: 'New', createdAt: new Date().toISOString() };
            const { rows: [insertedInquiry] } = await sql`INSERT INTO inquiries (name, email, phone, country_code, participants, tentative_date, event_type, message, status, created_at, inquiry_type)
            VALUES (${newInquiry.name}, ${newInquiry.email}, ${newInquiry.phone}, ${newInquiry.countryCode}, ${newInquiry.participants}, ${newInquiry.tentativeDate || null}, ${newInquiry.eventType}, ${newInquiry.message}, ${newInquiry.status}, ${newInquiry.createdAt}, ${newInquiry.inquiryType})
            RETURNING *;`;
            // Create notification
            await sql`INSERT INTO notifications (type, target_id, user_name, summary) VALUES ('new_inquiry', ${insertedInquiry.id}, ${insertedInquiry.name}, ${insertedInquiry.inquiry_type});`;
            result = toCamelCase(insertedInquiry);
            break;
        case 'updateGroupInquiry':
            await sql`UPDATE inquiries SET status = ${body.status} WHERE id = ${body.id}`;
            break;
        case 'reassignAndDeleteInstructor':
            const { instructorIdToDelete, replacementInstructorId } = body;
            await sql`BEGIN`;
            // This is a simplified version. A real app might need to update bookings, etc.
            // For now, we update the rules in products.
            const { rows: introClasses } = await sql`SELECT id, scheduling_rules FROM products WHERE type = 'INTRODUCTORY_CLASS'`;
            for (const p of introClasses) {
                const updatedRules = p.scheduling_rules.map((r: any) => r.instructorId === instructorIdToDelete ? { ...r, instructorId: replacementInstructorId } : r);
                await sql`UPDATE products SET scheduling_rules = ${JSON.stringify(updatedRules)} WHERE id = ${p.id}`;
            }
            await sql`DELETE FROM instructors WHERE id = ${instructorIdToDelete}`;
            await sql`COMMIT`;
            break;
        case 'deleteInstructor':
             await sql`DELETE FROM instructors WHERE id = ${body.id}`;
             break;
        case 'markAllNotificationsAsRead':
            await sql`UPDATE notifications SET read = true`;
            const { rows: notifications } = await sql`SELECT * FROM notifications ORDER BY timestamp DESC`;
            result = toCamelCase(notifications);
            break;
        default:
            return res.status(400).json({ error: `Unknown action: ${action}` });
    }
    
    return res.status(200).json(result);
}


async function addBookingAction(body: Omit<Booking, 'id' | 'createdAt' | 'bookingCode'>): Promise<AddBookingResult> {
    const { productId, slots, userInfo, productType } = body;

    // Server-side validation
    if (productType === 'INTRODUCTORY_CLASS' || productType === 'CLASS_PACKAGE') {
        const { rows: existingBookings } = await sql`SELECT slots FROM bookings WHERE user_info->>'email' = ${userInfo.email}`;
        for (const existing of existingBookings) {
            for (const existingSlot of existing.slots) {
                for (const newSlot of slots) {
                    if (existingSlot.date === newSlot.date && existingSlot.time === newSlot.time) {
                        return { success: false, message: 'DUPLICATE_BOOKING_ERROR' };
                    }
                }
            }
        }
    }
    
    // Create new booking
    const newBooking: Omit<Booking, 'id'> = {
      ...body,
      bookingCode: generateBookingCode(),
      createdAt: new Date(),
    };

    const { rows: [insertedRow] } = await sql`
        INSERT INTO bookings (product_id, product_type, slots, user_info, created_at, is_paid, price, booking_mode, product, booking_code)
        VALUES (${newBooking.productId}, ${newBooking.productType}, ${JSON.stringify(newBooking.slots)}, ${JSON.stringify(newBooking.userInfo)}, 
        ${newBooking.createdAt.toISOString()}, ${newBooking.isPaid}, ${newBooking.price}, ${newBooking.bookingMode}, ${JSON.stringify(newBooking.product)}, ${newBooking.bookingCode})
        RETURNING *;
    `;
    
    // Create notification
    await sql`
      INSERT INTO notifications (type, target_id, user_name, summary)
      VALUES ('new_booking', ${insertedRow.id}, ${`${userInfo.firstName} ${userInfo.lastName}`}, ${newBooking.product.name});
    `;

    return { success: true, message: 'Booking added.', booking: toCamelCase(insertedRow) };
}