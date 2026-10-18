import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as svc from '../services/bookingService.js';
import { apiRequest } from '../services/api.js';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState(svc.loadBookings);
  const [draft, setDraft] = useState(svc.loadDraft);
  const [loading, setLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/bookings');
      if (Array.isArray(data.bookings)) {
        // Merge backend bookings with any local-only bookings
        const local = svc.loadBookings();
        const serverRefs = new Set(data.bookings.map((b) => b.ref));
        const merged = [...data.bookings, ...local.filter((b) => !serverRefs.has(b.ref))];
        setBookings(merged);
        svc.saveBookings(merged);
      }
    } catch {
      // Backend offline fallback uses localStorage bookings
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => { svc.saveBookings(bookings); }, [bookings]);
  useEffect(() => { svc.saveDraft(draft); }, [draft]);

  useEffect(() => {
    const onStorage = (e) => { if (e.key === 'drivo:bookings') setBookings(svc.loadBookings()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateDraft = useCallback((patch) => setDraft((d) => ({ ...d, ...patch })), []);
  const resetDraft = useCallback(() => { svc.clearDraft(); setDraft(svc.EMPTY_DRAFT); }, []);

  const createBooking = useCallback(async (finalDraft, car) => {
    // First validate locally
    const fresh = svc.loadBookings();
    const localCheck = svc.createBookingRecord({ draft: finalDraft, car, bookings: fresh });
    if (!localCheck.ok) {
      setBookings(fresh);
      return localCheck;
    }

    try {
      const data = await apiRequest('/bookings', {
        method: 'POST',
        body: {
          carId: car.id,
          pickup: finalDraft.pickup,
          dropoff: finalDraft.dropoff,
          start: finalDraft.start,
          end: finalDraft.end,
          couponCode: finalDraft.couponCode || '',
          customer: finalDraft.customer,
          extras: finalDraft.extras || {},
        },
      });
      const next = [data.booking, ...fresh];
      setBookings(next);
      return { ok: true, booking: data.booking };
    } catch (err) {
      return { ok: false, error: err.message || 'Failed to complete booking on server.' };
    }
  }, []);

  const cancelBooking = useCallback(async (ref) => {
    try {
      const data = await apiRequest(`/bookings/${ref}/cancel`, { method: 'POST' });
      const next = bookings.map((b) => (b.ref === ref ? data.booking : b));
      setBookings(next);
      return { ok: true, bookings: next };
    } catch (err) {
      if (err.status && err.status >= 400 && err.status < 500 && err.status !== 404) {
        return { ok: false, error: err.message };
      }
      const res = svc.cancelBooking(svc.loadBookings(), ref);
      if (res.ok) setBookings(res.bookings);
      return res;
    }
  }, [bookings]);

  const updatePayment = useCallback(async (ref, patch) => {
    try {
      const data = await apiRequest(`/bookings/${ref}/payment`, {
        method: 'POST',
        body: {
          paymentMethod: patch.paymentMethod || 'Card',
          paymentStatus: patch.paymentStatus || 'Paid',
        },
      });
      setBookings((list) => list.map((b) => (b.ref === ref ? data.booking : b)));
      return { ok: true, booking: data.booking };
    } catch {
      setBookings((list) => svc.updatePayment(list, ref, patch));
      return { ok: true };
    }
  }, []);

  const value = useMemo(() => ({
    bookings,
    loading,
    refreshBookings: fetchBookings,
    draft,
    updateDraft,
    resetDraft,
    createBooking,
    cancelBooking,
    updatePayment,
    getBooking: (ref) => bookings.find((b) => b.ref === ref),
    findConflict: (carId, start, end) => svc.findConflict(bookings, carId, start, end),
    isBookedNow: (carId) => svc.isBookedNow(bookings, carId),
  }), [bookings, loading, fetchBookings, draft, updateDraft, resetDraft, createBooking, cancelBooking, updatePayment]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBookings must be used inside <BookingProvider>');
  return ctx;
}
