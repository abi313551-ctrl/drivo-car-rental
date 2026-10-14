import { load } from './storageService.js';
import { coupons as seed } from '../data/coupons.js';

export const getCoupons = () => load('coupons', seed, Array.isArray);

// Returns { ok, coupon, discount } or { ok: false, error }.
export function applyCoupon(code, { base, category, start }, list = getCoupons()) {
  const entered = String(code || '').trim().toUpperCase();
  if (!entered) return { ok: false, error: 'Enter a coupon code.' };
  const c = list.find((x) => x.code === entered);
  if (!c) return { ok: false, error: 'This coupon code is not valid.' };
  if (!c.active) return { ok: false, error: 'This coupon is no longer active.' };
  if (c.category && c.category !== category) return { ok: false, error: `This coupon works on ${c.category} cars only.` };
  if (c.weekendOnly && ![5, 6].includes(new Date(start).getDay())) return { ok: false, error: 'This coupon needs a Friday or Saturday pickup.' };
  const discount = c.type === 'percent' ? Math.round((base * c.value) / 100) : Math.min(c.value, base);
  return { ok: true, coupon: c, discount };
}
