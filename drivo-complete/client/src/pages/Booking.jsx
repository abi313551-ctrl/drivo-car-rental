import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCars } from '../context/CarContext.jsx';
import { useBookings } from '../context/BookingContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { computePricing } from '../services/bookingService.js';
import { applyCoupon } from '../services/couponService.js';
import { defaultRange, rentalDays } from '../utils/pricing.js';
import { pickupPoints } from '../utils/locations.js';
import { validateBookingRange, validateCustomer } from '../utils/validation.js';
import BookingSummary from '../components/BookingSummary.jsx';
import { StepCar, StepCustomer, StepExtras, StepSummary, StepReview } from '../components/booking/BookingSteps.jsx';

const STEPS = ['Car and dates', 'Your details', 'Extras', 'Summary', 'Confirm'];

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
  const pricing = car && rangeOk ? computePricing({ car, start: draft.start, end: draft.end, extras: draft.extras, couponCode: draft.couponCode }) : null;
  const conflict = car && rangeOk ? findConflict(car.id, draft.start, draft.end) : null;
  const summaryProps = { car, start: draft.start, end: draft.end, pickup, dropoff, extras: draft.extras, pricing };

  const validate = (s) => {
    if (s === 1) {
      const e = { ...rangeErrors };
      if (!car) e.carId = 'Select a car';
      else if (!car.available) e.carId = 'This car is unavailable';
      else if (conflict) e.carId = 'This car is already booked for these dates';
      return e;
    }
    if (s === 2) return validateCustomer(draft.customer);
    if (s === 5 && !agreed) return { agreed: 'Accept the rental terms to continue' };
    return {};
  };

  const goTo = (n) => { setErrors({}); setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) { toast.error('Please fix the highlighted fields'); return; }
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
      toast.success('Booking confirmed!');
      navigate(`/booking/confirmation/${res.booking.ref}`);
    } finally {
      setSubmitting(false);
    }
  };

  const applyCode = (code) => {
    const r = applyCoupon(code, { base: pricing.base, category: car.category, start: draft.start });
    if (!r.ok) return r.error;
    updateDraft({ couponCode: r.coupon.code });
    toast.success(`${r.coupon.code} applied`);
    return '';
  };

  return (
    <div className="container-x py-10">
      <h1 className="heading">Book your car</h1>
      <p className="mt-2 text-sm text-neutral-600">Complete the steps below to reserve your vehicle and lock in your rate.</p>

      <ol className="mt-6 flex flex-wrap gap-2" aria-label="Booking steps">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          return (
            <li key={label}>
              <button disabled={!done} onClick={() => goTo(n)} aria-current={n === step ? 'step' : undefined}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${n === step ? 'bg-ink text-white' : done ? 'bg-accent-soft text-accent' : 'bg-neutral-100 text-neutral-500'}`}>
                {done ? <Check size={14} /> : <span>{n}</span>} {label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className={`mt-8 grid gap-8 ${step === 4 ? '' : 'lg:grid-cols-3'}`}>
        <div className={`rounded-3xl border border-neutral-200 p-6 ${step === 4 ? 'max-w-2xl' : 'lg:col-span-2'}`}>
          <h2 className="mb-5 text-xl font-bold">{STEPS[step - 1]}</h2>
          {step === 1 && <StepCar draft={draft} cars={cars} car={car} errors={errors} conflict={conflict} rangeOk={rangeOk} onChange={updateDraft} />}
          {step === 2 && <StepCustomer customer={draft.customer} points={points} pickup={pickup} dropoff={dropoff} errors={errors} onCustomer={(k, v) => updateDraft({ customer: { ...draft.customer, [k]: v } })} onChange={updateDraft} />}
          {step === 3 && <StepExtras extras={draft.extras} days={rentalDays(draft.start, draft.end)} onChange={(extras) => updateDraft({ extras })} />}
          {step === 4 && pricing && <StepSummary summaryProps={summaryProps} couponCode={pricing.couponCode} couponError={pricing.couponError} onApply={applyCode} onRemove={() => updateDraft({ couponCode: '' })} />}
          {step === 5 && pricing && <StepReview customer={draft.customer} summaryProps={summaryProps} agreed={agreed} onAgree={setAgreed} error={errors.agreed} onEdit={goTo} />}
          {step >= 4 && !pricing && <p className="text-sm text-neutral-600">Go back to step 1 and choose a car and valid dates.</p>}

          <div className="mt-8 flex justify-between gap-3">
            <button className="btn-outline" onClick={() => goTo(step - 1)} disabled={step === 1 || submitting}>Back</button>
            {step < 5 ? (
              <button className="btn-primary" onClick={next}>Continue</button>
            ) : (
              <button className="btn-primary" onClick={confirm} disabled={!pricing || submitting}>
                {submitting ? 'Confirming...' : 'Confirm booking'}
              </button>
            )}
          </div>
        </div>
        {step !== 4 && <div className="lg:sticky lg:top-24 lg:self-start"><BookingSummary {...summaryProps} /></div>}
      </div>
    </div>
  );
}
