import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Heart, Star, Fuel, Settings2, Users, MapPin, Check, CalendarDays, Gauge, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCars } from '../context/CarContext.jsx';
import CarImage from '../components/CarImage.jsx';
import CarCard from '../components/CarCard.jsx';
import { getReviews } from '../data/reviews.js';
import { defaultRange, estimateTotal, formatINR, toLocalInput } from '../utils/pricing.js';
import { validateRange } from '../utils/validation.js';
import { pickupPoints } from '../utils/locations.js';

const policies = [
  'Valid driving licence and a government photo ID are required at pickup.',
  'Minimum driver age is 21. Fuel is returned at the level it was handed over.',
  'Free cancellation up to 24 hours before pickup. See the cancellation policy.',
  'Late returns are billed per started 24-hour block.',
];

const Stars = ({ value }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} className={n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'} />)}
  </span>
);

function CarDetailsView({ car }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { cars, isFavorite, toggleFavorite } = useCars();
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
  const estimate = useMemo(() => estimateTotal({ pricePerDay: car.pricePerDay, ...range, deposit: car.deposit }), [car, range]);
  const reviews = getReviews(car.id);
  const similar = useMemo(() => {
    const sameCat = cars.filter((c) => c.id !== car.id && c.category === car.category);
    const rest = cars.filter((c) => c.id !== car.id && c.category !== car.category).sort((a, b) => b.rating - a.rating);
    return [...sameCat, ...rest].slice(0, 3);
  }, [cars, car]);
  const fav = isFavorite(car.id);
  const now = toLocalInput(new Date());

  const book = () => {
    if (Object.keys(errors).length) { toast.error(errors.start || errors.end); return; }
    navigate(`/booking?${new URLSearchParams({ car: car.id, pickup, dropoff: ret, start: range.start, end: range.end })}`);
  };

  const specs = [
    [CalendarDays, 'Year', car.year], [Tag, 'Category', car.category], [Fuel, 'Fuel', car.fuel],
    [Settings2, 'Transmission', car.transmission], [Users, 'Seats', car.seats], [MapPin, 'Location', car.location],
  ];

  return (
    <div className="container-x py-8">
      <nav className="mb-5 text-sm text-neutral-500" aria-label="Breadcrumb">
        <Link to="/cars" className="hover:text-ink">Cars</Link> / <span className="text-ink">{car.brand} {car.model}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section aria-label="Gallery">
            <div className="aspect-[3/2] overflow-hidden rounded-3xl bg-neutral-100">
              <CarImage eager src={car.images[active]} alt={`${car.brand} ${car.model} photo ${active + 1}`} className="h-full w-full object-cover" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {car.images.map((src, i) => (
                <button key={src} onClick={() => setActive(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={active === i} className={`aspect-[3/2] overflow-hidden rounded-2xl border-2 ${active === i ? 'border-accent' : 'border-transparent'}`}>
                  <CarImage src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="heading">{car.brand} {car.model}</h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-neutral-600"><Stars value={car.rating} /> {car.rating} · {car.year} · {car.location}</p>
              </div>
              <button onClick={() => toggleFavorite(car.id)} aria-pressed={fav} className="btn-outline">
                <Heart size={16} className={fav ? 'fill-red-500 text-red-500' : ''} /> {fav ? 'Saved' : 'Add to favorites'}
              </button>
            </div>
            <p className="mt-4 leading-relaxed text-neutral-700">{car.description}</p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold">Specifications</h2>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {specs.map(([Icon, label, value]) => (
                <div key={label} className="rounded-2xl border border-neutral-200 p-4">
                  <dt className="flex items-center gap-2 text-xs text-neutral-500"><Icon size={14} />{label}</dt>
                  <dd className="mt-1 font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold">Features and amenities</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {car.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm"><Check size={16} className="text-accent" />{f}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold">Rental policies</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-neutral-700">{policies.map((p) => <li key={p}>{p}</li>)}</ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold">Customer reviews</h2>
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl border border-neutral-200 p-4">
                  <div className="flex items-center justify-between"><span className="font-semibold">{r.name}</span><Stars value={r.rating} /></div>
                  <p className="mt-2 text-sm text-neutral-700">{r.text}</p>
                  <p className="mt-2 text-xs text-neutral-500">{new Date(r.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-card">
            <p className="text-3xl font-extrabold">{formatINR(car.pricePerDay)}<span className="text-sm font-medium text-neutral-500"> / day</span></p>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="d-pickup" className="mb-1 block text-xs font-semibold text-neutral-600">Pickup location</label>
                <select id="d-pickup" className="field" value={pickup} onChange={(e) => setPickup(e.target.value)}>{points.map((p) => <option key={p}>{p}</option>)}</select>
              </div>
              <div>
                <label htmlFor="d-return" className="mb-1 block text-xs font-semibold text-neutral-600">Return location</label>
                <select id="d-return" className="field" value={ret} onChange={(e) => setRet(e.target.value)}>{points.map((p) => <option key={p}>{p}</option>)}</select>
              </div>
              <div>
                <label htmlFor="d-start" className="mb-1 block text-xs font-semibold text-neutral-600">Pickup date and time</label>
                <input id="d-start" type="datetime-local" className="field" min={now} value={range.start} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} />
                {errors.start && <p className="field-error" role="alert">{errors.start}</p>}
              </div>
              <div>
                <label htmlFor="d-end" className="mb-1 block text-xs font-semibold text-neutral-600">Return date and time</label>
                <input id="d-end" type="datetime-local" className="field" min={range.start || now} value={range.end} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} />
                {errors.end && <p className="field-error" role="alert">{errors.end}</p>}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-neutral-50 p-4 text-sm">
              <h2 className="mb-2 flex items-center gap-2 font-bold"><Gauge size={15} /> Price estimate</h2>
              {estimate.days > 0 ? (
                <dl className="space-y-1.5">
                  <div className="flex justify-between"><dt>{formatINR(car.pricePerDay)} x {estimate.days} {estimate.days === 1 ? 'day' : 'days'}</dt><dd>{formatINR(estimate.base)}</dd></div>
                  <div className="flex justify-between"><dt>GST (18%)</dt><dd>{formatINR(estimate.tax)}</dd></div>
                  <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-extrabold"><dt>Estimated total</dt><dd>{formatINR(estimate.total)}</dd></div>
                  <p className="pt-1 text-xs text-neutral-500">Plus a refundable deposit of {formatINR(car.deposit)}. Extras and coupons are added during booking. Demo estimate only.</p>
                </dl>
              ) : <p className="text-neutral-500">Choose valid dates to see an estimate.</p>}
            </div>

            <button className="btn-primary mt-5 w-full" onClick={book} disabled={!car.available}>{car.available ? 'Book now' : 'Currently unavailable'}</button>
          </div>
        </aside>
      </div>

      <section className="mt-16">
        <h2 className="mb-6 text-2xl font-bold">Similar cars</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{similar.map((c) => <CarCard key={c.id} car={c} />)}</div>
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
      <section className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
        <div>
          <h1 className="heading">Car not found</h1>
          <p className="mt-3 text-neutral-600">This car does not exist or is no longer listed.</p>
          <Link to="/cars" className="btn-dark mt-6">Browse all cars</Link>
        </div>
      </section>
    );
  }
  // key resets gallery/date state when navigating between cars
  return <CarDetailsView key={car.id} car={car} />;
}
