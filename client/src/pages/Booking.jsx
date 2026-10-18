import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Loader2,
  Info,
  Tag,
  Car as CarIcon,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCars } from '../context/CarContext.jsx';
import { useBookings } from '../context/BookingContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { computePricing } from '../services/bookingService.js';
import { defaultRange, formatINR, rentalDays, toLocalInput } from '../utils/pricing.js';
import { pickupPoints, getLocationByName, isSupportedLocation, SERVICE_NOTICE, UNSUPPORTED_LOCATION_ERROR } from '../utils/locations.js';
import { validateBookingRange, validateCustomer } from '../utils/validation.js';
import { apiRequest } from '../services/api.js';
import { EXTRAS } from '../data/extras.js';
import CarImage from '../components/CarImage.jsx';
import BookingSummary from '../components/BookingSummary.jsx';

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { cars, getCarById } = useCars();
  const { draft, updateDraft, resetDraft, createBooking, findConflict } = useBookings();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [errors, setErrors] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showExtrasAccordion, setShowExtrasAccordion] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [serverPricing, setServerPricing] = useState(null);
  const [returnSameLocation, setReturnSameLocation] = useState(true);

  const now = toLocalInput(new Date());

  // Redirect to login if user is not authenticated, preserving current booking query
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast('Please log in or register to complete your reservation.', { icon: '🔐' });
      const currentBookingPath = `${location.pathname}${location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(currentBookingPath)}`, {
        replace: true,
        state: { from: currentBookingPath },
      });
    }
  }, [authLoading, isAuthenticated, location.pathname, location.search, navigate]);

  // Initialize draft from URL params or defaults
  useEffect(() => {
    const patch = {};
    const carIdFromParam = Number(params.get('car'));
    if (carIdFromParam && cars.some((c) => c.id === carIdFromParam)) {
      patch.carId = carIdFromParam;
    } else if (!draft.carId && cars.length > 0) {
      patch.carId = cars[0].id;
    }

    ['pickup', 'dropoff', 'start', 'end'].forEach((k) => {
      const v = params.get(k);
      if (v) patch[k] = v;
    });

    if (!(patch.start || draft.start)) {
      Object.assign(patch, defaultRange());
    }

    if (user) {
      patch.customer = {
        fullName: draft.customer?.fullName || user.fullName || '',
        email: draft.customer?.email || user.email || '',
        phone: draft.customer?.phone || user.phone || '',
        license: draft.customer?.license || user.license || '',
      };
    }

    if (Object.keys(patch).length > 0) {
      updateDraft(patch);
    }
  }, [user, cars, params]);

  const car = getCarById(draft.carId) || (cars.length > 0 ? cars[0] : null);
  const points = car ? pickupPoints(car.location) : [];
  const pickup = points.includes(draft.pickup) ? draft.pickup : points[0] || (car ? `${car.location} Hub` : 'Nagercoil Hub');
  const dropoff = returnSameLocation ? pickup : (points.includes(draft.dropoff) ? draft.dropoff : points[0] || pickup);
  const isPickupValid = isSupportedLocation(pickup);
  const isDropoffValid = isSupportedLocation(dropoff);
  const locationError = (!isPickupValid || !isDropoffValid) ? UNSUPPORTED_LOCATION_ERROR : null;

  const rangeErrors = validateBookingRange(draft.start, draft.end);
  const rangeOk = Object.keys(rangeErrors).length === 0;
  const conflict = car && rangeOk ? findConflict(car.id, draft.start, draft.end) : null;
  const days = rangeOk ? rentalDays(draft.start, draft.end) : 0;

  // Real-time authoritative server pricing calculation
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
          setCouponError('');
        }
      })
      .catch((err) => {
        if (isCurrent) {
          if (draft.couponCode) {
            setCouponError(err.message || 'Invalid coupon');
            updateDraft({ couponCode: '' });
          }
        }
      });

    return () => { isCurrent = false; };
  }, [car?.id, draft.start, draft.end, JSON.stringify(draft.extras), draft.couponCode, rangeOk]);

  const localPricing = car && rangeOk ? computePricing({
    car,
    start: draft.start,
    end: draft.end,
    extras: draft.extras,
    couponCode: draft.couponCode,
  }) : null;

  const pricing = serverPricing || localPricing;

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setCouponApplying(true);
    setCouponError('');
    try {
      const res = await apiRequest('/coupons/validate', {
        method: 'POST',
        body: {
          code,
          carId: car.id,
          start: draft.start,
          end: draft.end,
          extras: draft.extras || {},
        },
      });
      if (res.ok) {
        updateDraft({ couponCode: res.code });
        if (res.pricing) setServerPricing(res.pricing);
        setCouponInput('');
        toast.success(`Coupon ${res.code} applied! Saved ₹${res.discount}`);
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid or expired coupon code.');
      toast.error(err.message || 'Invalid coupon code');
    } finally {
      setCouponApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    updateDraft({ couponCode: '' });
    setCouponError('');
    toast('Coupon removed', { icon: 'ℹ️' });
  };

  const handleConfirmBooking = async (e) => {
    if (e) e.preventDefault();

    // 1. Mandatory validations
    const nextErrors = {};

    if (!car) {
      nextErrors.carId = 'Please select a vehicle to book';
    } else if (!car.available) {
      nextErrors.carId = `${car.brand} ${car.model} is currently marked unavailable`;
    }

    const rErrors = validateBookingRange(draft.start, draft.end);
    Object.assign(nextErrors, rErrors);

    if (conflict) {
      nextErrors.dates = `${car.brand} ${car.model} is already booked for these dates`;
    }

    const cErrors = validateCustomer(draft.customer || {});
    Object.assign(nextErrors, cErrors);

    if (!isPickupValid || !isDropoffValid) {
      nextErrors.pickup = UNSUPPORTED_LOCATION_ERROR;
    }

    if (!agreed) {
      nextErrors.agreed = 'You must accept the rental terms and conditions to proceed';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstError = Object.values(nextErrors)[0];
      toast.error(firstError);
      return;
    }

    if (!isAuthenticated) {
      toast.error('Authentication required. Please log in to complete your booking.');
      const currentBookingPath = `${location.pathname}${location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(currentBookingPath)}`, {
        state: { from: currentBookingPath },
      });
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const res = await createBooking(
        {
          ...draft,
          pickup,
          dropoff,
        },
        car
      );

      if (!res.ok) {
        toast.error(res.error || 'Failed to complete booking. Please try again.', { duration: 6000 });
        return;
      }

      resetDraft();
      toast.success('Reservation registered! Review details & complete payment.');
      navigate(`/payment?ref=${res.booking.ref}`);
    } catch (err) {
      toast.error(err.message || 'An unexpected booking error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const summaryProps = {
    car,
    start: draft.start,
    end: draft.end,
    pickup,
    dropoff,
    extras: draft.extras,
    pricing,
    title: 'Booking Summary',
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F8F9FA] text-[#0A142F] p-6">
        <Loader2 size={36} className="animate-spin text-[#1E3A8A]" />
        <p className="mt-4 font-heading text-sm font-bold text-slate-700">Verifying customer account...</p>
        <p className="text-xs text-slate-400 mt-1">Preparing your vehicle reservation details</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-[#0F172A] py-10 sm:py-14">
      <div className="container-x">
        {/* Page Header */}
        <div className="max-w-3xl">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1.5">
            OFFICIAL RESERVATION DESK
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-[#0A142F] tracking-tight">
            Reserve Your Fleet Vehicle
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Confirm your booking details below. Tariffs and vehicle availability are authoritatively verified in real time.
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] items-start">
          {/* Main Booking Form */}
          <form onSubmit={handleConfirmBooking} noValidate className="space-y-6">
            {/* Section 1: Selected Car Details Card */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <CarIcon size={18} className="text-[#0A142F]" />
                  <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#0A142F]">
                    1. Selected Vehicle
                  </h2>
                </div>
                {car && (
                  <Link
                    to="/cars"
                    className="text-xs font-bold text-blue-900 hover:text-blue-950 hover:underline transition"
                  >
                    Change Vehicle
                  </Link>
                )}
              </div>

              {car ? (
                <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                  <div className="relative aspect-[16/10] w-full sm:w-56 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/80 shrink-0">
                    <CarImage
                      src={car.image}
                      alt={`${car.brand} ${car.model}`}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur-md">
                      {car.category}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-lg sm:text-xl font-bold text-[#0A142F]">
                          {car.brand} {car.model}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {car.year} Model · {car.location} Hub
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-xl font-black text-[#0A142F]">
                          {formatINR(car.pricePerDay)}
                        </p>
                        <span className="text-[11px] text-slate-400 font-medium">per day</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                      <span>⚙️ {car.transmission}</span>
                      <span>•</span>
                      <span>👥 {car.seats} Seats</span>
                      <span>•</span>
                      <span>⛽ {car.fuel}</span>
                      <span>•</span>
                      <span className="font-semibold text-amber-600">★ {car.rating}</span>
                    </div>

                    {/* Car Availability Status Alert */}
                    {!car.available ? (
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-200">
                        <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                        <span>This car is currently marked unavailable in the fleet. Please choose another vehicle.</span>
                      </div>
                    ) : conflict ? (
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900 border border-amber-200">
                        <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                        <span>Already booked for the chosen period. Please adjust your dates or pick another car.</span>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                        <span>Verified available in live inventory for your dates.</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="b-car-select" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select a Vehicle from Fleet
                  </label>
                  <select
                    id="b-car-select"
                    value={draft.carId || ''}
                    onChange={(e) => updateDraft({ carId: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="">Select a car...</option>
                    {cars.map((c) => (
                      <option key={c.id} value={c.id} disabled={!c.available}>
                        {c.brand} {c.model} ({c.category}) — {formatINR(c.pricePerDay)}/day
                      </option>
                    ))}
                  </select>
                  {errors.carId && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.carId}</p>}
                </div>
              )}
            </div>

            {/* Section 2: Rental Location & Dates */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-[#0A142F]" />
                  <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#0A142F]">
                    2. Rental Location & Schedule
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/80 px-3 py-1 text-[11px] font-bold text-blue-900">
                  <MapPin size={12} className="text-blue-700" />
                  <span>Currently serving Kanniyakumari district only.</span>
                </div>
              </div>

              {locationError && (
                <div className="mb-5 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs font-semibold text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{locationError}</p>
                    <p className="font-normal text-amber-800 mt-0.5">Please select a supported pickup station within Kanniyakumari district.</p>
                  </div>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Pickup Location */}
                <div>
                  <label htmlFor="b-pickup" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <MapPin size={14} className="text-[#0A142F]" /> Pickup Location (Kanniyakumari Dist.)
                  </label>
                  <select
                    id="b-pickup"
                    value={pickup}
                    onChange={(e) => {
                      const nextPickup = e.target.value;
                      const patch = { pickup: nextPickup };
                      if (returnSameLocation) patch.dropoff = nextPickup;
                      updateDraft(patch);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition cursor-pointer"
                  >
                    {points.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Return Location */}
                <div>
                  <label htmlFor="b-dropoff" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <MapPin size={14} className="text-[#0A142F]" /> Return Location (Kanniyakumari Dist.)
                  </label>
                  <select
                    id="b-dropoff"
                    disabled={returnSameLocation}
                    value={dropoff}
                    onChange={(e) => updateDraft({ dropoff: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition disabled:opacity-60 cursor-pointer"
                  >
                    {points.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <label className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={returnSameLocation}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setReturnSameLocation(checked);
                        if (checked) updateDraft({ dropoff: pickup });
                      }}
                      className="rounded accent-[#0A142F] h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>Return to same location</span>
                  </label>
                </div>

                {/* Pickup Date and Time */}
                <div>
                  <label htmlFor="b-start" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Clock size={14} className="text-[#0A142F]" /> Pickup Date & Time
                  </label>
                  <input
                    id="b-start"
                    type="datetime-local"
                    min={now}
                    value={draft.start}
                    onChange={(e) => updateDraft({ start: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition cursor-pointer ${
                      errors.start ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 bg-slate-50/70'
                    }`}
                  />
                  {errors.start && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.start}</p>}
                </div>

                {/* Return Date and Time */}
                <div>
                  <label htmlFor="b-end" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Clock size={14} className="text-[#0A142F]" /> Return Date & Time
                  </label>
                  <input
                    id="b-end"
                    type="datetime-local"
                    min={draft.start || now}
                    value={draft.end}
                    onChange={(e) => updateDraft({ end: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition cursor-pointer ${
                      errors.end ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 bg-slate-50/70'
                    }`}
                  />
                  {errors.end && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.end}</p>}
                </div>
              </div>

              {/* Number of Rental Days & Live Duration Feedback */}
              {rangeOk && (
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-blue-50/80 p-3.5 border border-blue-100 text-xs">
                  <div className="flex items-center gap-2 text-blue-950 font-bold">
                    <Calendar size={15} className="text-blue-800" />
                    <span>Duration: {days} {days === 1 ? 'Day' : 'Days'}</span>
                  </div>
                  <span className="text-blue-800 font-medium">
                    Calculated authoritatively on 24-hour cycle
                  </span>
                </div>
              )}
            </div>

            {/* Section 3: Driver Details */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <UserIcon size={18} className="text-[#0A142F]" />
                  <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#0A142F]">
                    3. Driver Identity
                  </h2>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Verified Handover Credentials</span>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Full Name */}
                <div>
                  <label htmlFor="c-name" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Primary Driver Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="c-name"
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={draft.customer?.fullName || ''}
                    onChange={(e) =>
                      updateDraft({ customer: { ...draft.customer, fullName: e.target.value } })
                    }
                    className={`w-full rounded-xl border px-3.5 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition ${
                      errors.fullName ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 bg-slate-50/70'
                    }`}
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="c-email" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Digital Invoice Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    placeholder="e.g. rahul@example.com"
                    value={draft.customer?.email || ''}
                    onChange={(e) =>
                      updateDraft({ customer: { ...draft.customer, email: e.target.value } })
                    }
                    className={`w-full rounded-xl border px-3.5 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition ${
                      errors.email ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 bg-slate-50/70'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="c-phone" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Mobile Contact Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="c-phone"
                    type="tel"
                    placeholder="e.g. 9876543210 (10 digits)"
                    value={draft.customer?.phone || ''}
                    onChange={(e) =>
                      updateDraft({ customer: { ...draft.customer, phone: e.target.value } })
                    }
                    className={`w-full rounded-xl border px-3.5 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition ${
                      errors.phone ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 bg-slate-50/70'
                    }`}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.phone}</p>}
                </div>

                {/* Driving License */}
                <div>
                  <label htmlFor="c-license" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Driving Licence Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="c-license"
                    type="text"
                    placeholder="e.g. TN37 20210045678"
                    value={draft.customer?.license || ''}
                    onChange={(e) =>
                      updateDraft({ customer: { ...draft.customer, license: e.target.value.toUpperCase() } })
                    }
                    className={`w-full rounded-xl border px-3.5 py-3 text-xs font-semibold text-[#0F172A] uppercase focus:border-[#0A142F] focus:bg-white focus:outline-none transition ${
                      errors.license ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 bg-slate-50/70'
                    }`}
                  />
                  {errors.license ? (
                    <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.license}</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400 font-medium">Standard Indian DL format (e.g. TN37 20210045678)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Optional Add-ons & Privilege Coupon Accordion */}
            <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setShowExtrasAccordion(!showExtrasAccordion)}
                className="w-full flex items-center justify-between p-6 sm:p-7 text-left hover:bg-slate-50/60 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Tag size={18} className="text-[#0A142F]" />
                  <div>
                    <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#0A142F]">
                      4. Optional Extras & Privilege Coupon
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Insurance, Child Seat, GPS & Discount Codes</p>
                  </div>
                </div>
                {showExtrasAccordion ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {showExtrasAccordion && (
                <div className="p-6 sm:p-7 border-t border-slate-100 space-y-6">
                  {/* Extras List */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {EXTRAS.map((e) => (
                      <label
                        key={e.key}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition ${
                          draft.extras?.[e.key]
                            ? 'border-[#0A142F] bg-blue-50/30 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(draft.extras?.[e.key])}
                          onChange={(ev) =>
                            updateDraft({
                              extras: { ...draft.extras, [e.key]: ev.target.checked },
                            })
                          }
                          className="mt-1 h-4 w-4 rounded accent-[#0A142F] cursor-pointer"
                        />
                        <div>
                          <span className="block font-display font-bold text-xs text-[#0A142F]">{e.label}</span>
                          <span className="block text-[11px] text-slate-500">{e.description}</span>
                          <span className="mt-1.5 block font-bold text-xs text-[#0A142F]">
                            {formatINR(e.perDay)}/day
                            {days > 0 && (
                              <span className="font-normal text-slate-400"> ({formatINR(e.perDay * days)} total)</span>
                            )}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Coupon Code Section */}
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Privilege Coupon Code
                    </label>
                    {draft.couponCode ? (
                      <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900">
                        <div className="flex items-center gap-2">
                          <Sparkles size={15} className="text-emerald-600" />
                          <span>Coupon <strong>{draft.couponCode}</strong> applied</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. WELCOME10"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold uppercase text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={couponApplying}
                          onClick={handleApplyCoupon}
                          className="rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-5 py-2.5 text-xs font-bold uppercase transition disabled:opacity-50 cursor-pointer"
                        >
                          {couponApplying ? 'Applying...' : 'Apply'}
                        </button>
                      </div>
                    )}
                    {couponError && <p className="mt-1.5 text-xs text-rose-600 font-medium">{couponError}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: Terms Agreement & Confirm Button */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm">
              <label className="flex items-start gap-3 cursor-pointer text-xs leading-relaxed text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-[#0A142F] cursor-pointer"
                />
                <span>
                  I declare that I possess a valid driving licence and official government ID, and agree to the DRIVO rental agreement, fuel deposit policy, and cancellation terms. <span className="text-rose-500">*</span>
                </span>
              </label>
              {errors.agreed && <p className="mt-2 text-xs text-rose-600 font-semibold">{errors.agreed}</p>}

              {/* Main Submit Button */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  <span>Authoritative Total: </span>
                  <strong className="text-base font-black text-[#0A142F]">
                    {pricing ? formatINR(pricing.total) : '—'}
                  </strong>
                  {rangeOk && <span className="text-slate-400"> ({days} {days === 1 ? 'day' : 'days'})</span>}
                </div>

                <button
                  type="submit"
                  disabled={submitting || !car?.available || Boolean(conflict)}
                  className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-8 py-3.5 text-xs font-bold tracking-wider uppercase transition shadow-sm disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Confirming Booking...</span>
                    </>
                  ) : (
                    <span>Confirm Booking</span>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Right Column: Sticky Summary & Breakdown */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <BookingSummary {...summaryProps} />

            {/* Quick Confirm Action in Summary */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm text-center">
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={submitting || !car?.available || Boolean(conflict)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white py-3.5 text-xs font-bold tracking-wider uppercase transition shadow-xs disabled:opacity-40 cursor-pointer active:scale-95"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Confirming Booking...</span>
                  </>
                ) : (
                  <span>Confirm Booking</span>
                )}
              </button>
              <p className="mt-2.5 text-[11px] text-slate-400">
                🔒 Guaranteed tariff locked directly in MySQL database
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
