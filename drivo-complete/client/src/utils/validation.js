// Pure validation helpers (no React) so they can be reused and tested.
export function validateRange(startStr, endStr, now = new Date()) {
  const e = {};
  const start = startStr ? new Date(startStr) : null;
  const end = endStr ? new Date(endStr) : null;
  const graceMs = 60 * 1000; // pickup may be the current minute

  if (!startStr) e.start = 'Choose a pickup date and time';
  else if (Number.isNaN(start.getTime())) e.start = 'Enter a valid pickup date';
  else if (start.getTime() < now.getTime() - graceMs) e.start = 'Pickup cannot be in the past';

  if (!endStr) e.end = 'Choose a return date and time';
  else if (Number.isNaN(end.getTime())) e.end = 'Enter a valid return date';
  else if (start && !Number.isNaN(start.getTime()) && end.getTime() <= start.getTime()) e.end = 'Return must be after pickup';

  return e;
}

export function validateSearch(form, now = new Date()) {
  const e = validateRange(form.start, form.end, now);
  if (!form.pickup) e.pickup = 'Choose a pickup location';
  if (!form.dropoff) e.dropoff = 'Choose a return location';
  return e;
}

export function validateBookingRange(start, end, now = new Date()) {
  const e = validateRange(start, end, now);
  if (!e.end && start && end && (new Date(end) - new Date(start)) / 86400000 > 30) e.end = 'Rentals can be at most 30 days';
  return e;
}

export const cleanLicense = (v = '') => v.replace(/[\s-]/g, '').toUpperCase();

// Indian driving licence: state code, RTO code, year, 7-digit serial (15 characters).
export function validateCustomer(c) {
  const e = {};
  if (!c.fullName?.trim()) e.fullName = 'Enter your full name';
  else if (!/^[A-Za-z][A-Za-z .'-]{2,59}$/.test(c.fullName.trim())) e.fullName = 'Use letters only, at least 3 characters';

  if (!c.email?.trim()) e.email = 'Enter your email address';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = 'Enter a valid email address';

  const phone = (c.phone || '').replace(/[\s-]/g, '');
  if (!phone) e.phone = 'Enter your phone number';
  else if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(phone)) e.phone = 'Enter a valid 10-digit Indian mobile number';

  if (!c.license?.trim()) e.license = "Enter your driver's license number";
  else if (!/^[A-Z]{2}\d{2}(19|20)\d{2}\d{7}$/.test(cleanLicense(c.license))) e.license = 'Use the format TN37 20190012345';
  return e;
}
