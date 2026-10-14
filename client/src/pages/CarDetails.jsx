import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Heart, Star, Fuel, Settings2, Users, MapPin, Check, CalendarDays, Gauge, Tag, ShieldCheck, AlertTriangle, ArrowLeftRight, Zap } from 'lucide-react';
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

const policies = [
  'Valid driving licence and government-issued photo ID required at handover.',
  'Minimum driver age is 21. Fuel/battery state is returned at equivalent departure level.',
  'Complimentary cancellation up to 24 hours before pickup time.',
  '24/7 Digital Concierge and comprehensive roadside cover included.',
];

const Stars = ({ value }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={14}
        className={n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-[#C6CDD5]/30'}
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
  const [active, setActive] = useState(0);
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

  const estimate = useMemo(() => estimateTotal({ pricePerDay: car.pricePerDay, ...range, deposit: car.deposit }), [car, range]);
  const [verifiedReviews, setVerifiedReviews] = useState([]);
  useEffect(() => {
    if (car?.id) {
      apiRequest(`/cars/${car.id}/reviews`)
        .then((res) => setVerifiedReviews(res.reviews || []))
        .catch(() => setVerifiedReviews([]));
    }
  }, [car?.id]);
  const demoReviews = getReviews(car.id);
  const similar = useMemo(() => {
    const sameCat = cars.filter((c) => c.id !== car.id && c.category === car.category);
    const rest = cars.filter((c) => c.id !== car.id && c.category !== car.category).sort((a, b) => b.rating - a.rating);
    return [...sameCat, ...rest].slice(0, 3);
  }, [cars, car]);
  const fav = isFavorite(car.id);
  const now = toLocalInput(new Date());

  const book = () => {
    if (Object.keys(errors).length) { toast.error(errors.start || errors.end); return; }
    if (liveConflict) {
      toast.error('This vehicle is already booked for the selected dates. Please pick other dates.');
      return;
    }
    navigate(`/booking?${new URLSearchParams({ car: car.id, pickup, dropoff: ret, start: range.start, end: range.end })}`);
  };

  const specs = [
    [CalendarDays, 'Model Year', car.year],
    [Tag, 'Class', car.category],
    [Fuel, 'Powertrain', car.fuel],
    [Settings2, 'Transmission', car.transmission],
    [Users, 'Capacity', `${car.seats} Seats`],
    [MapPin, 'Base Hub', car.location],
  ];

  return (
    <div className="container-x py-8 text-[#F5F7FA]">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 text-xs font-mono text-[#C6CDD5]/60 flex items-center gap-2" aria-label="Breadcrumb">
        <Link to="/cars" className="text-[#75CFFF] hover:underline">FLEET</Link>
        <span>/</span>
        <span className="text-[#C6CDD5] uppercase">{car.category}</span>
        <span>/</span>
        <span className="text-[#F5F7FA] font-bold">{car.brand} {car.model}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main Vehicle Showcase */}
        <div className="space-y-10 lg:col-span-2">
          {/* Gallery Section */}
          <section aria-label="Vehicle Gallery">
            {(() => {
              const gallery = Array.isArray(car.images) && car.images.length > 0 ? car.images : [car.image].filter(Boolean);
              const activeIndex = Math.min(active, Math.max(0, gallery.length - 1));
              return (
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[rgba(198,205,213,0.14)] bg-[#1B2028] shadow-2xl">
                    <CarImage
                      eager
                      src={gallery[activeIndex]}
                      alt={`${car.brand} ${car.model} photo ${activeIndex + 1}`}
                      className="h-full w-full object-cover transition-all duration-500"
                    />
                    <div className="absolute left-4 top-4 rounded-md border border-white/10 bg-[#111318]/80 px-3 py-1 text-xs font-mono text-[#75CFFF] backdrop-blur-md">
                      {car.category}
                    </div>
                  </div>
                  {gallery.length > 1 && (
                    <div className="mt-3.5 grid grid-cols-4 gap-3">
                      {gallery.map((src, i) => (
                        <button
                          key={src || i}
                          onClick={() => setActive(i)}
                          aria-label={`Show photo ${i + 1}`}
                          aria-pressed={active === i}
                          className={`aspect-[16/10] overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                            active === i
                              ? 'border-[#75CFFF] shadow-[0_0_15px_rgba(117,207,255,0.3)]'
                              : 'border-[rgba(198,205,213,0.12)] opacity-70 hover:opacity-100 hover:border-[rgba(198,205,213,0.3)]'
                          }`}
                        >
                          <CarImage src={src} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </section>

          {/* Title & Quick Actions */}
          <section>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#75CFFF] block mb-1">
                  {car.brand} Flagship Series
                </span>
                <h1 className="heading text-3xl sm:text-5xl">{car.brand} {car.model}</h1>
                <p className="mt-2 flex items-center gap-2.5 text-xs sm:text-sm text-[#C6CDD5]/80">
                  <Stars value={car.rating} />
                  <span className="font-mono font-bold text-[#F5F7FA]">{car.rating}</span>
                  <span>·</span>
                  <span>{car.year}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-[#75CFFF]">
                    <MapPin size={13} /> {car.location}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => toggleCompare(car.id)}
                  aria-pressed={compared}
                  className={`btn-outline text-xs py-2 px-3.5 ${
                    compared ? 'border-[#75CFFF] bg-[#75CFFF]/15 text-[#75CFFF]' : ''
                  }`}
                >
                  <ArrowLeftRight size={14} className={compared ? 'text-[#75CFFF]' : ''} />
                  {compared ? 'In Comparison' : 'Compare'}
                </button>
                <button
                  onClick={() => toggleFavorite(car.id)}
                  aria-pressed={fav}
                  className="btn-outline text-xs py-2 px-3.5"
                >
                  <Heart size={14} className={fav ? 'fill-[#75CFFF] text-[#75CFFF]' : ''} />
                  {fav ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-[#C6CDD5]/90 border-t border-[rgba(198,205,213,0.1)] pt-6">
              {car.description}
            </p>
          </section>

          {/* Specifications Matrix */}
          <section>
            <h2 className="mb-4 font-display text-lg font-bold text-[#F5F7FA] flex items-center gap-2">
              <Zap size={16} className="text-[#75CFFF]" /> Engineering Specifications
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {specs.map(([Icon, label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[rgba(198,205,213,0.1)] bg-[#161A22] p-4 transition hover:border-[#75CFFF]/30"
                >
                  <dt className="flex items-center gap-2 text-xs font-mono text-[#C6CDD5]/60">
                    <Icon size={14} className="text-[#75CFFF]" />
                    {label}
                  </dt>
                  <dd className="mt-1.5 font-display text-sm font-bold text-[#F5F7FA]">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Features and Amenities */}
          <section>
            <h2 className="mb-4 font-display text-lg font-bold text-[#F5F7FA]">Included Amenities & Technology</h2>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {car.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2.5 rounded-xl border border-[rgba(198,205,213,0.08)] bg-[#161A22] px-4 py-3 text-xs text-[#C6CDD5]"
                >
                  <Check size={14} className="text-[#75CFFF] shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Rental Policies */}
          <section>
            <h2 className="mb-4 font-display text-lg font-bold text-[#F5F7FA]">Rental Terms & Verification</h2>
            <div className="rounded-xl border border-[rgba(198,205,213,0.1)] bg-[#161A22] p-5">
              <ul className="space-y-2.5 text-xs text-[#C6CDD5]/80">
                {policies.map((p) => (
                  <li key={p} className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#75CFFF] mt-1.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Customer Reviews Section */}
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-[#F5F7FA]">Driver Impressions & Verification</h2>
              {verifiedReviews.length > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-[#75CFFF]/30 bg-[#75CFFF]/10 px-2.5 py-0.5 text-xs font-mono font-bold text-[#75CFFF]">
                  <ShieldCheck size={12} /> {verifiedReviews.length} Verified Reviews
                </span>
              ) : (
                <span className="text-xs font-mono text-[#C6CDD5]/50">Verified Fleet Ratings</span>
              )}
            </div>

            <ul className="space-y-3.5">
              {verifiedReviews.length > 0
                ? verifiedReviews.map((r) => (
                    <li key={r.id} className="rounded-xl border border-[#75CFFF]/20 bg-[#161A22] p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#F5F7FA]">{r.userName}</span>
                          <span className="inline-flex items-center gap-0.5 rounded bg-[#75CFFF]/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#75CFFF]">
                            <ShieldCheck size={10} /> Verified Renter
                          </span>
                        </div>
                        <Stars value={r.rating} />
                      </div>
                      {r.title && <p className="mt-1.5 font-bold text-xs text-[#F5F7FA]">{r.title}</p>}
                      <p className="mt-1 text-xs text-[#C6CDD5]/80">{r.comment}</p>
                      <p className="mt-2 text-[10px] font-mono text-[#C6CDD5]/40">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Recent'}
                      </p>
                    </li>
                  ))
                : demoReviews.map((r) => (
                    <li key={r.id} className="rounded-xl border border-[rgba(198,205,213,0.1)] bg-[#161A22] p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#F5F7FA]">{r.name}</span>
                        <Stars value={r.rating} />
                      </div>
                      <p className="mt-2 text-xs text-[#C6CDD5]/80">{r.text}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#C6CDD5]/40">
                        <span>{new Date(r.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                        <span>Certified Fleet Review</span>
                      </div>
                    </li>
                  ))}
            </ul>
          </section>
        </div>

        {/* Sticky Booking Drawer Panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-[rgba(198,205,213,0.15)] bg-[#1B2028] p-6 shadow-2xl backdrop-blur-2xl">
            <div className="border-b border-[rgba(198,205,213,0.1)] pb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C6CDD5]/60 block">Daily Rate</span>
              <p className="font-mono text-3xl font-extrabold text-[#F5F7FA]">
                {formatINR(car.pricePerDay)}
                <span className="text-xs font-normal text-[#C6CDD5]/60 font-sans"> / day</span>
              </p>
            </div>

            <div className="mt-5 space-y-3.5">
              <div>
                <label htmlFor="d-pickup" className="mb-1 block text-xs font-mono font-medium text-[#C6CDD5]">
                  Pickup Hub
                </label>
                <select
                  id="d-pickup"
                  className="field text-xs bg-[#161A22]"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                >
                  {points.map((p) => (
                    <option key={p} value={p} className="bg-[#161A22] text-[#F5F7FA]">{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="d-return" className="mb-1 block text-xs font-mono font-medium text-[#C6CDD5]">
                  Return Hub
                </label>
                <select
                  id="d-return"
                  className="field text-xs bg-[#161A22]"
                  value={ret}
                  onChange={(e) => setRet(e.target.value)}
                >
                  {points.map((p) => (
                    <option key={p} value={p} className="bg-[#161A22] text-[#F5F7FA]">{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="d-start" className="mb-1 block text-xs font-mono font-medium text-[#C6CDD5]">
                  Pickup Schedule
                </label>
                <input
                  id="d-start"
                  type="datetime-local"
                  className="field text-xs bg-[#161A22]"
                  min={now}
                  value={range.start}
                  onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
                />
                {errors.start && <p className="field-error" role="alert">{errors.start}</p>}
              </div>

              <div>
                <label htmlFor="d-end" className="mb-1 block text-xs font-mono font-medium text-[#C6CDD5]">
                  Return Schedule
                </label>
                <input
                  id="d-end"
                  type="datetime-local"
                  className="field text-xs bg-[#161A22]"
                  min={range.start || now}
                  value={range.end}
                  onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
                />
                {errors.end && <p className="field-error" role="alert">{errors.end}</p>}
              </div>
            </div>

            {liveConflict && (
              <div className="mt-4 rounded-xl bg-red-950/60 p-3.5 border border-red-500/30 text-xs text-red-200" role="alert">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-red-300">Unavailable for Selected Dates</p>
                    <p className="text-[11px] text-red-300/80 mt-1">
                      Already reserved from {new Date(liveConflict.start).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} to {new Date(liveConflict.end).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Smart Pricing Breakdown */}
            <div className="mt-5 rounded-xl bg-[#161A22] p-4 border border-[rgba(198,205,213,0.1)] text-xs">
              <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold text-[#F5F7FA]">
                <Gauge size={14} className="text-[#75CFFF]" /> Smart Pricing Estimate
              </h3>
              {estimate.days > 0 ? (
                <dl className="space-y-2 text-[#C6CDD5]/80">
                  <div className="flex justify-between">
                    <dt>Duration</dt>
                    <dd className="font-mono font-bold text-[#F5F7FA]">
                      {estimate.days} {estimate.days === 1 ? 'day' : 'days'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Base Tariff ({estimate.days}d x {formatINR(car.pricePerDay)})</dt>
                    <dd className="font-mono text-[#F5F7FA]">{formatINR(estimate.base)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>GST (18% Statutory Tax)</dt>
                    <dd className="font-mono text-[#F5F7FA]">{formatINR(estimate.tax)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-[rgba(198,205,213,0.1)] pt-2 text-sm font-extrabold text-[#F5F7FA]">
                    <dt>Estimated Total</dt>
                    <dd className="font-mono text-[#75CFFF] text-base">{formatINR(estimate.total)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-[rgba(198,205,213,0.1)] pt-2 text-[11px] text-[#C6CDD5]/60">
                    <dt>Refundable Security Deposit</dt>
                    <dd className="font-mono">{formatINR(car.deposit)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-[#C6CDD5]/60 text-xs">Choose pickup and return dates to compute pricing.</p>
              )}
            </div>

            <button
              className="btn-primary mt-5 w-full py-3.5 text-xs font-mono font-bold tracking-wider"
              onClick={book}
              disabled={!car.available || Boolean(liveConflict) || checkingAvailability || Object.keys(errors).length > 0}
            >
              {!car.available
                ? 'CURRENTLY UNAVAILABLE'
                : liveConflict
                ? 'BOOKED FOR DATES'
                : checkingAvailability
                ? 'CHECKING DISPATCH...'
                : 'PROCEED TO RESERVATION'}
            </button>

            <button
              type="button"
              onClick={() => toggleCompare(car.id)}
              className={`btn-outline mt-2.5 w-full py-2.5 text-xs ${
                compared ? 'border-[#75CFFF] bg-[#75CFFF]/10 text-[#75CFFF]' : ''
              }`}
            >
              <ArrowLeftRight size={14} className={compared ? 'text-[#75CFFF]' : ''} />
              {compared ? 'In Comparison (Click to Remove)' : 'Compare with Other Cars'}
            </button>

            {compared && (
              <Link
                to={`/compare?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`}
                className="mt-2 block text-center text-xs font-mono font-semibold text-[#75CFFF] hover:underline"
              >
                Open Vehicle Comparison ({compareIds.length}/3) &rarr;
              </Link>
            )}
          </div>
        </aside>
      </div>

      {/* Similar Vehicles Carousel/Grid */}
      <section className="mt-16 border-t border-[rgba(198,205,213,0.1)] pt-12">
        <h2 className="mb-6 font-display text-2xl font-bold text-[#F5F7FA]">Alternative Fleet Choices</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {similar.map((c) => (
            <CarCard key={c.id} car={c} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function CarDetails() {
  const { id } = useParams();
  const { getCarById } = useCars();
  const car = getCarById(id);

  if (!car) {
    return (
      <section className="container-x grid min-h-[60vh] place-items-center py-20 text-center text-[#F5F7FA]">
        <div>
          <h1 className="heading">Vehicle Not Found</h1>
          <p className="mt-3 text-xs sm:text-sm text-[#C6CDD5]/70">This car specification does not exist or has been decommissioned.</p>
          <Link to="/cars" className="btn-primary mt-6 text-xs">Return to Fleet</Link>
        </div>
      </section>
    );
  }

  return <CarDetailsView key={car.id} car={car} />;
}
