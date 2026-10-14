// Pure booking logic + localStorage persistence. Availability uses only this browser's data.
import { load, save, remove } from './storageService.js';
import { rentalDays, estimateTotal, extrasTotalFor } from '../utils/pricing.js';
import { validateBookingRange, validateCustomer, cleanLicense } from '../utils/validation.js';
import { applyCoupon } from './couponService.js';

export const ACTIVE = ['Pending', 'Confirmed'];
const DAY_MS = 24 * 60 * 60 * 1000;
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const EMPTY_DRAFT = {
  carId: null, pickup: '', dropoff: '', start: '', end: '', couponCode: '',
  customer: { fullName: '', email: '', phone: '', license: '' },
  extras: { additionalDriver: false, childSeat: false, gps: false, premiumInsurance: false },
};

const isBooking = (b) => b && typeof b.ref === 'string' && Number.isInteger(b.carId) && b.start && b.end && b.status;
export const loadBookings = () => load('bookings', [], Array.isArray).filter(isBooking);
export const saveBookings = (list) => save('bookings', list);

export function loadDraft() {
  const d = load('draft', null, (v) => v && typeof v === 'object');
  if (!d) return EMPTY_DRAFT;
  return { ...EMPTY_DRAFT, ...d, customer: { ...EMPTY_DRAFT.customer, ...d.customer }, extras: { ...EMPTY_DRAFT.extras, ...d.extras } };
}
export const saveDraft = (d) => save('draft', d);
export const clearDraft = () => remove('draft');

export function generateRef(existing = [], now = new Date()) {
  const used = new Set(existing.map((b) => b.ref));
  const d = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  let ref;
  do { ref = `DRV-${d}-${Array.from({ length: 5 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')}`; } while (used.has(ref));
  return ref;
}

// Two bookings overlap when each starts before the other ends (touching edges are allowed).
export function findConflict(bookings, carId, start, end, ignoreRef = null) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return bookings.find((b) => b.carId === carId && b.ref !== ignoreRef && ACTIVE.includes(b.status) && s < new Date(b.end).getTime() && new Date(b.start).getTime() < e) || null;
}

export const isBookedNow = (bookings, carId, now = new Date()) =>
  bookings.some((b) => b.carId === carId && ACTIVE.includes(b.status) && new Date(b.start) <= now && now < new Date(b.end));

export function computePricing({ car, start, end, extras, couponCode }) {
  const days = rentalDays(start, end);
  const base = days * car.pricePerDay;
  let discountAmount = 0, appliedCode = null, couponError = null;
  if (couponCode) {
    const r = applyCoupon(couponCode, { base, category: car.category, start });
    if (r.ok) { discountAmount = r.discount; appliedCode = r.coupon.code; } else couponError = r.error;
  }
  const pricing = estimateTotal({ pricePerDay: car.pricePerDay, start, end, discountAmount, extrasTotal: extrasTotalFor(extras, days), deposit: car.deposit });
  return { ...pricing, couponCode: appliedCode, couponError };
}

const fmt = (s) => new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

// Validates again and re-checks availability against the bookings passed in.
export function createBookingRecord({ draft, car, bookings, now = new Date() }) {
  if (!car) return { ok: false, error: 'Select a car first.' };
  if (!car.available) return { ok: false, error: `${car.brand} ${car.model} is currently unavailable.` };
  const rangeErr = validateBookingRange(draft.start, draft.end, now);
  if (Object.keys(rangeErr).length) return { ok: false, error: Object.values(rangeErr)[0] };
  const custErr = validateCustomer(draft.customer);
  if (Object.keys(custErr).length) return { ok: false, error: 'Please fix your details before confirming.' };
  const conflict = findConflict(bookings, car.id, draft.start, draft.end);
  if (conflict) return { ok: false, error: `${car.brand} ${car.model} is already booked from ${fmt(conflict.start)} to ${fmt(conflict.end)} in this browser's demo data.` };

  const c = draft.customer;
  const booking = {
    ref: generateRef(bookings, now),
    carId: car.id,
    car: { brand: car.brand, model: car.model, year: car.year, image: car.image, category: car.category, pricePerDay: car.pricePerDay, location: car.location },
    start: draft.start, end: draft.end, pickup: draft.pickup, dropoff: draft.dropoff,
    customer: { fullName: c.fullName.trim(), email: c.email.trim().toLowerCase(), phone: c.phone.trim(), license: cleanLicense(c.license) },
    extras: { ...draft.extras },
    pricing: computePricing({ car, start: draft.start, end: draft.end, extras: draft.extras, couponCode: draft.couponCode }),
    status: 'Confirmed',
    paymentStatus: 'Pending',
    paymentMethod: null,
    createdAt: now.toISOString(),
    demo: true,
  };
  return { ok: true, booking };
}

export const isCancellable = (b, now = new Date()) => ACTIVE.includes(b.status) && new Date(b.start).getTime() - now.getTime() >= DAY_MS;

export function cancelBooking(bookings, ref, now = new Date()) {
  const b = bookings.find((x) => x.ref === ref);
  if (!b) return { ok: false, error: 'Booking not found.' };
  if (!isCancellable(b, now)) return { ok: false, error: 'Only active bookings starting in 24+ hours can be cancelled.' };
  const next = bookings.map((x) => (x.ref === ref ? { ...x, status: 'Cancelled', cancelledAt: now.toISOString(), paymentStatus: x.paymentStatus === 'Paid' ? 'Refunded' : x.paymentStatus } : x));
  return { ok: true, bookings: next };
}

export const updatePayment = (bookings, ref, patch) => bookings.map((b) => (b.ref === ref ? { ...b, ...patch } : b));
