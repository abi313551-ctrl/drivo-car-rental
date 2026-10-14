import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCars } from '../context/CarContext.jsx';
import { useBookings } from '../context/BookingContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { computePricing } from '../services/bookingService.js';
import { defaultRange, rentalDays } from '../utils/pricing.js';
import { pickupPoints } from '../utils/locations.js';
import { validateBookingRange } from '../utils/validation.js';
import { apiRequest } from '../services/api.js';
import BookingSummary from '../components/BookingSummary.jsx';
import { StepCar, StepCustomer, StepExtras, StepSummary, StepReview } from '../components/booking/BookingSteps.jsx';

const STEPS = ['Fleet & Schedule', 'Driver Identity', 'Add-ons', 'Tariff & Coupon', 'Verification'];

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { cars, getCarById } = useCars();
  const { draft, updateDraft, resetDraft, createBooking, findConflict } = useBookings();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Apply links from search / car details once on arrival, and prefill customer details from logged-in user if blank.
  useEffect(() => {
    const patch = {};
    const carId = Number(params.get('car'));
    if (getCarById(carId)) patch.carId = carId;
    ['pickup', 'dropoff', 'start', 'end'].forEach((k) => { if (params.get(k)) patch[k] = params.get(k); });
    if (!(patch.start || draft.start)) Object.assign(patch, defaultRange());
    if (user) {
      patch.customer = {
        fullName: draft.customer.fullName || user.fullName || '',
        email: draft.customer.email || user.email || '',
        phone: draft.customer.phone || user.phone || '',
        license: draft.customer.license || user.license || '',
      };
    }
    if (Object.keys(patch).length) updateDraft(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const car = getCarById(draft.carId);
  const points = car ? pickupPoints(car.location) : [];
  const pickup = points.includes(draft.pickup) ? draft.pickup : points[0] || '';
  const dropoff = points.includes(draft.dropoff) ? draft.dropoff : points[0] || '';
  const rangeErrors = validateBookingRange(draft.start, draft.end);
  const rangeOk = Object.keys(rangeErrors).length === 0;

  // Real-time server-backed smart pricing state
  const [serverPricing, setServerPricing] = useState(null);

  useEffect(() => {
    if (!car || !rangeOk) {
      setServerPricing(null);
      return;
    }
    let isCurrent = true;
    apiRequest('/pricing/calculate', {
      method: 'POST',
      body: {
        carId: car.id,
        start: draft.start,
        end: draft.end,
        extras: draft.extras || {},
        couponCode: draft.couponCode || '',
      },
    })
      .then((res) => {
        if (isCurrent && res.ok && res.pricing) {
          setServerPricing(res.pricing);
        }
      })
      .catch((err) => {
        if (draft.couponCode && err.message && isCurrent) {
          toast.error(`Coupon removed: ${err.message}`);
          updateDraft({ couponCode: '' });
        }
      });

    return () => { isCurrent = false; };
  }, [car?.id, draft.start, draft.end, JSON.stringify(draft.extras), draft.couponCode, rangeOk]);

  const localPricing = car && rangeOk ? computePricing({ car, start: draft.start, end: draft.end, extras: draft.extras, couponCode: draft.couponCode }) : null;
  const pricing = serverPricing || localPricing;
  const conflict = car && rangeOk ? findConflict(car.id, draft.start, draft.end) : null;
  const summaryProps = { car, start: draft.start, end: draft.end, pickup, dropoff, extras: draft.extras, pricing };

  const validate = (s) => {
    if (s === 1) {
      const e = { ...rangeErrors };
      if (!car) e.carId = 'Select a vehicle to continue';
      else if (!car.available) e.carId = 'This vehicle is currently unavailable';
      else if (conflict) e.carId = 'This vehicle is already booked for these dates';
      return e;
    }
    if (s === 2) {
      const e = {};
      const c = draft.customer || {};
      if (!c.fullName?.trim()) e.fullName = 'Full name is required';
      if (!c.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) e.email = 'Valid email address is required';
      if (!c.phone?.trim() || !/^\d{10}$/.test(c.phone.replace(/\D/g, ''))) e.phone = '10-digit mobile number is required';
      if (!c.license?.trim()) e.license = 'Driving licence number is required';
      return e;
    }
    if (s === 5) {
      const e = {};
      if (!agreed) e.agreed = 'You must agree to the rental terms and conditions';
      return e;
    }
    return {};
  };

  const goTo = (s) => {
    setErrors({});
    setStep(s);
  };

  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length) {
      setErrors(e);
      toast.error('Please complete all required fields');
      return;
    }
    goTo(step + 1);
  };

  const confirm = async () => {
    const e = validate(5);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    try {
      const res = await createBooking({ ...draft, pickup, dropoff }, car);
      if (!res.ok) {
        toast.error(res.error, { duration: 6000 });
        goTo(1);
        return;
      }
      resetDraft();
      toast.success('Reservation successfully confirmed!');
      navigate(`/booking/confirmation/${res.booking.ref}`);
    } finally {
      setSubmitting(false);
    }
  };

  const applyCode = async (code) => {
    if (!code || !code.trim()) return 'Enter a coupon code';
    try {
      const res = await apiRequest('/coupons/validate', {
        method: 'POST',
        body: {
          code: code.trim(),
          carId: car.id,
          start: draft.start,
          end: draft.end,
          extras: draft.extras || {},
        },
      });
      if (res.ok) {
        updateDraft({ couponCode: res.code });
        if (res.pricing) setServerPricing(res.pricing);
        toast.success(`Coupon ${res.code} applied! Saved ₹${res.discount}`);
        return '';
      }
    } catch (err) {
      return err.message || 'Invalid or expired coupon code.';
    }
    return 'Invalid coupon code.';
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-[#0F172A] py-10 sm:py-14">
      <div className="container-x">
        <div className="max-w-3xl">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1.5">
            STEP {step} OF 5
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-[#0A142F] tracking-tight">
            Reserve Your Fleet Vehicle
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Complete digital handover authorization and lock in your verified guaranteed tariff.
          </p>
        </div>

        {/* Stepper Navigation */}
        <ol className="mt-8 flex flex-wrap gap-2.5" aria-label="Booking steps">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={!done}
                  onClick={() => goTo(n)}
                  aria-current={n === step ? 'step' : undefined}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    n === step
                      ? 'bg-[#0A142F] text-white shadow-sm'
                      : done
                      ? 'border border-slate-300 bg-white text-[#0A142F] hover:bg-slate-50'
                      : 'border border-slate-200 bg-slate-100/60 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {done ? <Check size={14} className="stroke-[3] text-emerald-600" /> : <span>0{n}</span>}
                  <span>{label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className={`mt-8 grid gap-8 ${step === 4 ? '' : 'lg:grid-cols-3'}`}>
          <div className={`rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm ${step === 4 ? 'max-w-2xl' : 'lg:col-span-2'}`}>
            <h2 className="mb-6 font-display text-base font-bold uppercase tracking-wider text-[#0A142F] border-b border-slate-100 pb-3">
              {STEPS[step - 1]}
            </h2>

            {step === 1 && (
              <StepCar
                draft={draft}
                cars={cars}
                car={car}
                errors={errors}
                conflict={conflict}
                rangeOk={rangeOk}
                onChange={updateDraft}
              />
            )}
            {step === 2 && (
              <StepCustomer
                customer={draft.customer}
                points={points}
                pickup={pickup}
                dropoff={dropoff}
                city={car?.location || 'Coimbatore'}
                errors={errors}
                onCustomer={(k, v) => updateDraft({ customer: { ...draft.customer, [k]: v } })}
                onChange={updateDraft}
              />
            )}
            {step === 3 && (
              <StepExtras
                extras={draft.extras}
                days={rentalDays(draft.start, draft.end)}
                onChange={(extras) => updateDraft({ extras })}
              />
            )}
            {step === 4 && pricing && (
              <StepSummary
                summaryProps={summaryProps}
                couponCode={pricing.couponCode}
                couponError={pricing.couponError}
                onApply={applyCode}
                onRemove={() => updateDraft({ couponCode: '' })}
              />
            )}
            {step === 5 && pricing && (
              <StepReview
                summaryProps={summaryProps}
                agreed={agreed}
                onAgreed={setAgreed}
              />
            )}
            {step >= 4 && !pricing && (
              <p className="text-xs text-slate-500">
                Please return to Step 1 and select a vehicle with valid booking dates.
              </p>
            )}

            <div className="mt-8 flex justify-between gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider px-6 py-3 transition cursor-pointer"
                onClick={() => goTo(step - 1)}
                disabled={step === 1 || submitting}
              >
                Back
              </button>
              {step < 5 ? (
                <button
                  type="button"
                  className="rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white text-xs font-bold uppercase tracking-wider px-8 py-3 transition shadow-sm cursor-pointer"
                  onClick={next}
                >
                  Continue &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 transition shadow-sm cursor-pointer disabled:opacity-40"
                  onClick={confirm}
                  disabled={!pricing || submitting}
                >
                  {submitting ? 'Confirming Dispatch...' : 'Confirm Reservation'}
                </button>
              )}
            </div>
          </div>

          {step !== 4 && (
            <div className="lg:sticky lg:top-24 lg:self-start">
              <BookingSummary {...summaryProps} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
