import { EXTRAS } from '../data/extras.js';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const formatINR = (n) => inr.format(Number(n) || 0);

export const GST_RATE = 0.18;
const DAY_MS = 24 * 60 * 60 * 1000;

export const toLocalInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

// Default range: tomorrow 10:00 for 3 days.
export function defaultRange() {
  const s = new Date();
  s.setDate(s.getDate() + 1);
  s.setHours(10, 0, 0, 0);
  return { start: toLocalInput(s), end: toLocalInput(new Date(s.getTime() + 3 * DAY_MS)) };
}

// Rentals are billed per started 24-hour block.
export function rentalDays(start, end) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms > 0 ? Math.ceil(ms / DAY_MS) : 0;
}

// Sum of selected extras for the whole rental.
export function extrasTotalFor(extras = {}, days = 0) {
  const perDay = EXTRAS.filter((e) => extras[e.key]).reduce((sum, e) => sum + e.perDay, 0);
  return perDay * days;
}

// discountAmount (absolute) wins over discountPercent when provided.
export function estimateTotal({ pricePerDay, start, end, discountPercent = 0, discountAmount = null, extrasTotal = 0, deposit = 0 }) {
  const days = rentalDays(start, end);
  const base = days * pricePerDay;
  const discount = discountAmount != null ? Math.min(Math.round(discountAmount), base) : Math.round((base * discountPercent) / 100);
  const taxable = base + extrasTotal - discount;
  const tax = Math.round(taxable * GST_RATE);
  return { days, base, extras: extrasTotal, discount, tax, deposit, total: taxable + tax };
}
