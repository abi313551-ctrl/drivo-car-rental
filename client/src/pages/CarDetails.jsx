import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Heart,
  Star,
  Fuel,
  Settings2,
  Users,
  MapPin,
  Check,
  CalendarDays,
  Gauge,
  Tag,
  ShieldCheck,
  AlertTriangle,
  ArrowLeftRight,
  Zap,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCars } from '../context/CarContext.jsx';
import { useBookings } from '../context/BookingContext.jsx';
import CarImage from '../components/CarImage.jsx';
import CarCard from '../components/CarCard.jsx';
import { getReviews } from '../data/reviews.js';
import { defaultRange, estimateTotal, formatINR, toLocalInput } from '../utils/pricing.js';
import { validateRange } from '../utils/validation.js';
import { pickupPoints } from '../utils/locations.js';
import { apiRequest } from '../services/api.js';

const rentalPolicies = [
  'Valid driving licence and government-issued photo ID required at vehicle handover.',
  'Minimum driver age is 21. Fuel/battery state is returned at equivalent departure level.',
  'Complimentary cancellation up to 24 hours prior to scheduled pickup time.',
  '24/7 Digital Concierge assistance and comprehensive roadside protection included.',
  'Doorstep vehicle delivery and sanitization verified across 150+ checkpoints.',
];

const RatingStars = ({ value }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={14}
        className={n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
      />
    ))}
  </span>
);

function CarDetailsView({ car }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { cars, isFavorite, toggleFavorite, isInCompare, toggleCompare, compareIds } = useCars();
  const compared = isInCompare(car.id);
  const { findConflict } = useBookings();
  const points = pickupPoints(car.location);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [pickup, setPickup] = useState(points.includes(params.get('pickup')) ? params.get('pickup') : points[0]);
  const [ret, setRet] = useState(points.includes(params.get('dropoff')) ? params.get('dropoff') : points[0]);
  const [range, setRange] = useState(() => {
    const d = defaultRange();
    const ok = (s) => s && !Number.isNaN(new Date(s).getTime());
    return ok(params.get('start')) && ok(params.get('end')) ? { start: params.get('start'), end: params.get('end') } : d;
  });

  const errors = validateRange(range.start, range.end);
  const [liveConflict, setLiveConflict] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Gallery array normalization
  const gallery = useMemo(() => {
    const list = Array.isArray(car.images) && car.images.length > 0 ? car.images : [car.image].filter(Boolean);
    return list.filter(Boolean);
  }, [car.images, car.image]);

  const activeImage = gallery[Math.min(activeImageIdx, Math.max(0, gallery.length - 1))] || car.image;

  // Live conflict checking
  useEffect(() => {
    if (!car?.id || !range.start || !range.end || Object.keys(errors).length > 0) {
      setLiveConflict(null);
      return;
    }
    const localConflict = findConflict(car.id, range.start, range.end);
    if (localConflict) {
      setLiveConflict(localConflict);
    }
    setCheckingAvailability(true);
    apiRequest(`/cars/${car.id}/availability?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`)
      .then((res) => {
        if (!res.available && res.conflict) {
          setLiveConflict(res.conflict);
        } else if (res.available) {
          setLiveConflict(null);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAvailability(false));
  }, [car?.id, range.start, range.end, Object.keys(errors).length]);

  // Pricing estimate
  const estimate = useMemo(
    () => estimateTotal({ pricePerDay: car.pricePerDay, ...range, deposit: car.deposit }),
    [car, range]
  );

  // Verified reviews from backend
  const [verifiedReviews, setVerifiedReviews] = useState([]);
  useEffect(() => {
    if (car?.id) {
      apiRequest(`/cars/${car.id}/reviews`)
        .then((res) => setVerifiedReviews(res.reviews || []))
        .catch(() => setVerifiedReviews([]));
    }
  }, [car?.id]);

  const demoReviews = getReviews(car.id);

  // Similar vehicles from inventory
  const similar = useMemo(() => {
    const sameCat = cars.filter((c) => c.id !== car.id && c.category === car.category);
    const rest = cars.filter((c) => c.id !== car.id && c.category !== car.category).sort((a, b) => b.rating - a.rating);
    return [...sameCat, ...rest].slice(0, 3);
  }, [cars, car]);

  const fav = isFavorite(car.id);
  const now = toLocalInput(new Date());

  const handleBooking = () => {
    if (Object.keys(errors).length) {
      toast.error(errors.start || errors.end);
      return;
    }
    if (liveConflict) {
      toast.error('This vehicle is already booked for the selected dates. Please choose alternative dates.');
      return;
    }
    navigate(`/booking?${new URLSearchParams({ car: car.id, pickup, dropoff: ret, start: range.start, end: range.end })}`);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `DRIVO — ${car.brand} ${car.model}`,
          text: `Rent ${car.brand} ${car.model} starting at ${formatINR(car.pricePerDay)}/day on DRIVO.`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Vehicle link copied to clipboard!');
      }
    } catch {
      toast.success('Vehicle link copied to clipboard!');
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setActiveImageIdx((i) => (i + 1) % gallery.length);
      if (e.key === 'ArrowLeft') setActiveImageIdx((i) => (i - 1 + gallery.length) % gallery.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, gallery.length]);

  const specs = [
    [CalendarDays, 'Model Year', car.year],
    [Tag, 'Class / Segment', car.category],
    [Fuel, 'Powertrain', car.fuel],
    [Settings2, 'Transmission', car.transmission],
    [Users, 'Seating Capacity', `${car.seats} Adult Passengers`],
    [MapPin, 'Operational Hub', car.location],
    [ShieldCheck, 'Security Deposit', formatINR(car.deposit)],
    [Clock, 'Booking Confirmation', 'Instant Dispatch'],
  ];

  return (
    <div className="bg-[#FAFCFE] min-h-screen text-[#0B1528] py-8 sm:py-12">
      <div className="container-x">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center justify-between text-xs font-semibold text-slate-500" aria-label="Breadcrumb">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-[#0B1528] transition">HOME</Link>
            <span>/</span>
            <Link to="/cars" className="hover:text-[#0B1528] transition">FLEET</Link>
            <span>/</span>
            <Link to={`/cars?category=${encodeURIComponent(car.category)}`} className="text-slate-400 hover:text-[#0B1528] transition uppercase">
              {car.category}
            </Link>
            <span>/</span>
            <span className="text-[#0B1528] font-bold">{car.brand} {car.model}</span>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0B1528] transition bg-white border border-slate-200/80 rounded-full px-3 py-1 shadow-2xs cursor-pointer"
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>
        </nav>

        {/* Main Grid: Left Vehicle Details & Right Sticky Reservation Card */}
        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* Left Column: Gallery, Specs, Amenities, Reviews (Span 8) */}
          <div className="space-y-10 lg:col-span-8">
            {/* 1. Vehicle Gallery Section */}
            <section aria-label="Vehicle Gallery" className="relative">
              {/* Primary Large Vehicle Image */}
              <div className="group relative aspect-[16/10] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
                <CarImage
                  eager
                  src={activeImage}
                  alt={`${car.brand} ${car.model}`}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-103 cursor-pointer"
                />

                {/* Top Category Badge */}
                <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3.5 py-1 text-xs font-bold text-[#0B1528] shadow-sm backdrop-blur-md">
                  {car.category}
                </div>

                {/* Top Right Quick Actions (Lightbox & Wishlist) */}
                <div className="absolute right-4 top-4 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm backdrop-blur-md hover:bg-white hover:scale-105 transition cursor-pointer"
                    title="View Fullscreen Lightbox"
                    aria-label="Expand image"
                  >
                    <Maximize2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(car.id)}
                    aria-pressed={fav}
                    aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm backdrop-blur-md hover:bg-white hover:scale-105 transition cursor-pointer"
                  >
                    <Heart size={16} className={fav ? 'fill-red-500 text-red-500' : 'text-slate-600'} />
                  </button>
                </div>

                {/* Multi-image Arrow Controls on Main Image */}
                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveImageIdx((i) => (i - 1 + gallery.length) % gallery.length)}
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImageIdx((i) => (i + 1) % gallery.length)}
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Clickable Gallery Thumbnails */}
              {gallery.length > 1 && (
                <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {gallery.map((src, i) => (
                    <button
                      key={src || i}
                      type="button"
                      onClick={() => setActiveImageIdx(i)}
                      aria-label={`Show photo ${i + 1}`}
                      aria-pressed={activeImageIdx === i}
                      className={`relative aspect-[16/10] overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                        activeImageIdx === i
                          ? 'border-[#0B1528] shadow-md ring-2 ring-[#0B1528]/20'
                          : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-400'
                      }`}
                    >
                      <CarImage src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* 2. Vehicle Title & Highlights Header */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1.5">
                    {car.brand} OFFICIAL FLEET
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B1528] tracking-tight">
                    {car.brand} {car.model}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 px-2.5 py-1 rounded-md">
                      <RatingStars value={car.rating} />
                      <span className="font-bold text-[#0B1528] ml-0.5">{car.rating}</span>
                    </div>
                    <span>·</span>
                    <span className="font-semibold text-slate-700">{car.year} Model</span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-slate-700 font-semibold">
                      <MapPin size={14} className="text-[#0B1528]" /> {car.location} Hub
                    </span>
                  </div>
                </div>

                {/* Quick Action Badges */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCompare(car.id)}
                    aria-pressed={compared}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition shadow-2xs cursor-pointer ${
                      compared
                        ? 'bg-[#0B1528] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <ArrowLeftRight size={13} />
                    <span>{compared ? 'In Comparison' : 'Compare'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(car.id)}
                    aria-pressed={fav}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition shadow-2xs cursor-pointer ${
                      fav
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Heart size={14} className={fav ? 'fill-red-500' : ''} />
                    <span>{fav ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Vehicle Overview
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-slate-600">
                  {car.description}
                </p>
              </div>
            </section>

            {/* 3. Engineering Specifications Matrix */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1">
                    TECHNICAL DATA
                  </span>
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#0B1528]">
                    Engineering Specifications
                  </h2>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0B1528]">
                  <Gauge size={20} />
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                {specs.map(([Icon, label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-white hover:border-slate-200 hover:shadow-xs"
                  >
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <Icon size={14} className="text-[#0B1528]" />
                      <span>{label}</span>
                    </dt>
                    <dd className="mt-1.5 font-display text-sm font-bold text-[#0B1528] truncate">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* 4. Included Amenities & Technology */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1">
                    CABIN &amp; DRIVER ASSISTANCE
                  </span>
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#0B1528]">
                    Included Features &amp; Equipment
                  </h2>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0B1528]">
                  <Sparkles size={20} />
                </div>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {car.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-xs sm:text-sm font-medium text-slate-700"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 5. Rental Policies & Handover Terms */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <div className="mb-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1">
                  TRANSPARENCY &amp; SAFETY
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#0B1528]">
                  Rental Terms &amp; Verification
                </h2>
              </div>

              <div className="space-y-3">
                {rentalPolicies.map((policy) => (
                  <div key={policy} className="flex items-start gap-3 text-xs sm:text-sm text-slate-600">
                    <ShieldCheck size={16} className="text-blue-600 mt-0.5 shrink-0" />
                    <span>{policy}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 6. Customer Reviews & Driver Ratings */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1">
                    VERIFIED EXPERIENCES
                  </span>
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#0B1528]">
                    Driver Impressions
                  </h2>
                </div>
                {verifiedReviews.length > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                    <ShieldCheck size={13} /> {verifiedReviews.length} Verified Reviews
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">Certified Fleet Rating</span>
                )}
              </div>

              <div className="space-y-4">
                {verifiedReviews.length > 0
                  ? verifiedReviews.map((r) => (
                      <div key={r.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#0B1528]">{r.userName}</span>
                            <span className="rounded-full bg-emerald-100/70 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              Verified Renter
                            </span>
                          </div>
                          <RatingStars value={r.rating} />
                        </div>
                        {r.title && <p className="mt-2 font-bold text-sm text-[#0B1528]">{r.title}</p>}
                        <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">{r.comment}</p>
                        <p className="mt-3 text-[10px] font-mono text-slate-400">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Recent'}
                        </p>
                      </div>
                    ))
                  : demoReviews.map((r) => (
                      <div key={r.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-[#0B1528]">{r.name}</span>
                          <RatingStars value={r.rating} />
                        </div>
                        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{r.text}</p>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{new Date(r.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                          <span className="font-medium">Certified Guest Review</span>
                        </div>
                      </div>
                    ))}
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Reservation Panel (Span 4) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xl shadow-slate-900/5">
              {/* Daily Rate Header */}
              <div className="border-b border-slate-100 pb-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Daily Rental Tariff
                </span>
                <p className="font-display text-3xl sm:text-4xl font-black text-[#0B1528]">
                  {formatINR(car.pricePerDay)}
                  <span className="text-xs font-normal text-slate-500 font-sans"> / day</span>
                </p>
              </div>

              {/* Booking Form Controls */}
              <div className="mt-5 space-y-4">
                {/* Pickup Hub */}
                <div>
                  <label htmlFor="d-pickup" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Pickup Location
                  </label>
                  <select
                    id="d-pickup"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-[#0B1528] focus:border-[#0B1528] focus:outline-none focus:bg-white transition"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                  >
                    {points.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Return Hub */}
                <div>
                  <label htmlFor="d-return" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Return Location
                  </label>
                  <select
                    id="d-return"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-[#0B1528] focus:border-[#0B1528] focus:outline-none focus:bg-white transition"
                    value={ret}
                    onChange={(e) => setRet(e.target.value)}
                  >
                    {points.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pickup Schedule */}
                <div>
                  <label htmlFor="d-start" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Pickup Schedule
                  </label>
                  <input
                    id="d-start"
                    type="datetime-local"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-[#0B1528] focus:border-[#0B1528] focus:outline-none focus:bg-white transition cursor-pointer"
                    min={now}
                    value={range.start}
                    onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
                  />
                  {errors.start && <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.start}</p>}
                </div>

                {/* Return Schedule */}
                <div>
                  <label htmlFor="d-end" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Return Schedule
                  </label>
                  <input
                    id="d-end"
                    type="datetime-local"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-[#0B1528] focus:border-[#0B1528] focus:outline-none focus:bg-white transition cursor-pointer"
                    min={range.start || now}
                    value={range.end}
                    onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
                  />
                  {errors.end && <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.end}</p>}
                </div>
              </div>

              {/* Conflict / Unavailability Warning */}
              {liveConflict && (
                <div className="mt-4 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-900" role="alert">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-amber-900">Unavailable for Selected Dates</p>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        Already reserved from {new Date(liveConflict.start).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} to {new Date(liveConflict.end).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Smart Pricing Breakdown */}
              <div className="mt-5 rounded-2xl bg-slate-50/80 p-4 border border-slate-100 text-xs">
                <h3 className="mb-3 font-display font-bold text-[#0B1528] flex items-center gap-1.5">
                  <Zap size={14} className="text-[#0B1528]" /> Pricing Computation
                </h3>
                {estimate.days > 0 ? (
                  <dl className="space-y-2 text-slate-600">
                    <div className="flex justify-between">
                      <dt>Rental Duration</dt>
                      <dd className="font-bold text-[#0B1528]">
                        {estimate.days} {estimate.days === 1 ? 'day' : 'days'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Base Tariff ({estimate.days}d × {formatINR(car.pricePerDay)})</dt>
                      <dd className="font-bold text-[#0B1528]">{formatINR(estimate.base)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Statutory GST (18%)</dt>
                      <dd className="font-bold text-[#0B1528]">{formatINR(estimate.tax)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-[#0B1528]">
                      <dt>Estimated Total</dt>
                      <dd className="text-base text-[#0B1528]">{formatINR(estimate.total)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-[11px] text-slate-500">
                      <dt>Refundable Security Deposit</dt>
                      <dd className="font-semibold">{formatINR(car.deposit)}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-slate-500 text-xs">Select dates above to view total tariff.</p>
                )}
              </div>

              {/* Main Action Button */}
              <button
                type="button"
                className="mt-5 w-full rounded-full bg-[#0B1528] hover:bg-[#1E293B] text-white py-3.5 text-xs sm:text-sm font-bold tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                onClick={handleBooking}
                disabled={!car.available || Boolean(liveConflict) || checkingAvailability || Object.keys(errors).length > 0}
              >
                {!car.available
                  ? 'CURRENTLY UNAVAILABLE'
                  : liveConflict
                  ? 'BOOKED FOR DATES'
                  : checkingAvailability
                  ? 'CHECKING DISPATCH...'
                  : 'PROCEED TO RESERVATION →'}
              </button>

              {/* Compare Button */}
              <button
                type="button"
                onClick={() => toggleCompare(car.id)}
                className={`mt-2.5 w-full rounded-full border py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  compared
                    ? 'border-[#0B1528] bg-slate-100 text-[#0B1528]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ArrowLeftRight size={14} />
                <span>{compared ? 'Remove from Comparison' : 'Compare with Other Cars'}</span>
              </button>

              {compared && (
                <Link
                  to={`/compare?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`}
                  className="mt-2 block text-center text-xs font-bold text-blue-900 hover:underline"
                >
                  Open Comparison ({compareIds.length}/3) &rarr;
                </Link>
              )}
            </div>
          </aside>
        </div>

        {/* Alternative Fleet Choices Section */}
        <section className="mt-16 sm:mt-24 border-t border-slate-200/80 pt-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1">
                YOU MIGHT ALSO LIKE
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B1528]">
                Alternative Fleet Models
              </h2>
            </div>
            <Link to="/cars" className="text-xs font-bold text-[#0B1528] hover:underline">
              View All {cars.length} Cars &rarr;
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
        </section>
      </div>

      {/* Lightbox Modal for Fullscreen Image Viewing */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-entrance-1">
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition cursor-pointer"
            aria-label="Close fullscreen view"
          >
            <X size={20} />
          </button>

          {/* Image Counter */}
          <div className="absolute top-5 left-5 z-20 rounded-full bg-white/10 px-3.5 py-1 text-xs font-mono font-bold text-white backdrop-blur-md">
            {activeImageIdx + 1} / {gallery.length}
          </div>

          {/* Navigation Arrows */}
          {gallery.length > 1 && (
            <>
              <button
                onClick={() => setActiveImageIdx((i) => (i - 1 + gallery.length) % gallery.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition cursor-pointer"
                aria-label="Previous photo"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={() => setActiveImageIdx((i) => (i + 1) % gallery.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition cursor-pointer"
                aria-label="Next photo"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Main Fullscreen Image */}
          <div className="max-w-5xl max-h-[85vh] w-full flex items-center justify-center">
            <CarImage
              src={activeImage}
              alt={`${car.brand} ${car.model}`}
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CarDetails() {
  const { id } = useParams();
  const { getCarById, loading } = useCars();
  const [car, setCar] = useState(() => getCarById(id));
  const [fetching, setFetching] = useState(!car);

  useEffect(() => {
    const existing = getCarById(id);
    if (existing) {
      setCar(existing);
      setFetching(false);
      return;
    }
    setFetching(true);
    apiRequest(`/cars/${id}`)
      .then((data) => {
        if (data.car) {
          setCar(data.car);
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [id, getCarById]);

  if (fetching || (loading && !car)) {
    return (
      <section className="container-x grid min-h-[60vh] place-items-center py-20 text-center text-[#0B1528]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-[#0B1528]" />
          <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
            Loading Vehicle Specifications...
          </p>
        </div>
      </section>
    );
  }

  if (!car) {
    return (
      <section className="container-x grid min-h-[60vh] place-items-center py-20 text-center text-[#0B1528]">
        <div className="max-w-md">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-[#0B1528]">
            <Tag size={24} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-[#0B1528]">Vehicle Not Found</h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            This car specification does not exist in the active catalogue or has been reassigned.
          </p>
          <Link
            to="/cars"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0B1528] text-white px-6 py-3 text-xs font-bold transition hover:bg-[#1E293B]"
          >
            Return to Fleet Directory &rarr;
          </Link>
        </div>
      </section>
    );
  }

  return <CarDetailsView key={car.id} car={car} />;
}
