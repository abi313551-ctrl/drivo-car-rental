import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Zap, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCars } from '../context/CarContext.jsx';
import { useBookings } from '../context/BookingContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { computePricing } from '../services/bookingService.js';
import { applyCoupon } from '../services/couponService.js';
import { defaultRange, rentalDays } from '../utils/pricing.js';
import { pickupPoints } from '../utils/locations.js';
import { validateBookingRange, validateCustomer } from '../utils/validation.js';
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
    if (s === 2) return validateCustomer(draft.customer);
    if (s === 5 && !agreed) return { agreed: 'Accept the rental terms to continue' };
    return {};
  };

  const goTo = (n) => { setErrors({}); setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const next = async () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) { toast.error('Please fix the highlighted fields'); return; }

    if (step === 1 && car) {
      try {
        const avail = await apiRequest(`/cars/${car.id}/availability?start=${encodeURIComponent(draft.start)}&end=${encodeURIComponent(draft.end)}`);
        if (!avail.available) {
          const msg = avail.reason || 'This vehicle is already booked for these selected dates.';
          setErrors({ carId: msg });
          toast.error(msg);
          return;
        }
      } catch (err) {
        if (err.message) {
          setErrors({ carId: err.message });
          toast.error(err.message);
          return;
        }
      }
    }

    goTo(step + 1);
  };

  const confirm = async () => {
    const e = validate(5);
    if (Object.keys(e).length) { setErrors(e); return; }
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
    <div className="container-x py-10 text-[#F5F7FA]">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#75CFFF]/30 bg-[#75CFFF]/10 px-3 py-1 text-[11px] font-mono font-bold tracking-wider text-[#75CFFF] uppercase mb-2">
          <Zap size={11} className="fill-[#75CFFF]" /> Step {step} of 5
        </span>
        <h1 className="heading">Reserve Your Fleet Vehicle</h1>
        <p className="mt-2 text-xs sm:text-sm text-[#C6CDD5]/80">
          Complete verified digital handover authorization and lock in your guaranteed tariff.
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
                disabled={!done}
                onClick={() => goTo(n)}
                aria-current={n === step ? 'step' : undefined}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
                  n === step
                    ? 'bg-[#75CFFF] text-[#111318] shadow-lg shadow-[#75CFFF]/25'
                    : done
                    ? 'border border-[#75CFFF]/30 bg-[#75CFFF]/10 text-[#75CFFF]'
                    : 'border border-[rgba(198,205,213,0.12)] bg-[#1B2028] text-[#C6CDD5]/60'
                }`}
              >
                {done ? <Check size={14} className="stroke-[3]" /> : <span>0{n}</span>}
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className={`mt-8 grid gap-8 ${step === 4 ? '' : 'lg:grid-cols-3'}`}>
        <div className={`rounded-2xl border border-[rgba(198,205,213,0.14)] bg-[#1B2028] p-6 shadow-2xl ${step === 4 ? 'max-w-2xl' : 'lg:col-span-2'}`}>
          <h2 className="mb-6 font-display text-lg font-bold uppercase tracking-wider text-[#F5F7FA] border-b border-[rgba(198,205,213,0.08)] pb-3">
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
              customer={draft.customer}
              summaryProps={summaryProps}
              agreed={agreed}
              onAgree={setAgreed}
              error={errors.agreed}
              onEdit={goTo}
            />
          )}
          {step >= 4 && !pricing && (
            <p className="text-xs font-mono text-[#C6CDD5]/60">
              Please return to Step 1 and select a vehicle with valid booking dates.
            </p>
          )}

          <div className="mt-8 flex justify-between gap-3 border-t border-[rgba(198,205,213,0.08)] pt-6">
            <button
              className="btn-outline text-xs px-6 py-2.5"
              onClick={() => goTo(step - 1)}
              disabled={step === 1 || submitting}
            >
              Back
            </button>
            {step < 5 ? (
              <button className="btn-primary text-xs px-7 py-2.5" onClick={next}>
                Continue
              </button>
            ) : (
              <button
                className="btn-primary text-xs px-8 py-3"
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
  );
}
