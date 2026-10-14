import { formatINR } from '../utils/pricing.js';
import { EXTRAS } from '../data/extras.js';
import CarImage from './CarImage.jsx';

const fmt = (s) => (s && !Number.isNaN(new Date(s).getTime()) ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-');

// Works for a draft (live car) and for a saved booking (car snapshot).
export default function BookingSummary({ car, start, end, pickup, dropoff, extras = {}, pricing, title = 'Booking summary' }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-card">
      <h2 className="font-bold">{title}</h2>
      {!car ? <p className="mt-3 text-sm text-neutral-500">Select a car to see your price.</p> : (
        <>
          <div className="mt-4 flex gap-3">
            <CarImage src={car.image} alt="" className="h-16 w-24 rounded-xl object-cover" />
            <div className="text-sm">
              <p className="font-bold">{car.brand} {car.model}</p>
              <p className="text-neutral-500">{car.year} · {car.category}</p>
            </div>
          </div>
          <dl className="mt-4 space-y-1 text-sm text-neutral-600">
            <div className="flex justify-between gap-4"><dt>Pickup</dt><dd className="text-right">{fmt(start)}{pickup && <><br />{pickup}</>}</dd></div>
            <div className="flex justify-between gap-4"><dt>Return</dt><dd className="text-right">{fmt(end)}{dropoff && <><br />{dropoff}</>}</dd></div>
          </dl>
          {!pricing ? <p className="mt-4 text-sm text-neutral-500">Choose valid dates to see the price.</p> : (
            <dl className="mt-4 space-y-2 border-t border-neutral-200 pt-4 text-sm">
              <div className="flex justify-between"><dt>Duration</dt><dd>{pricing.days} {pricing.days === 1 ? 'day' : 'days'}</dd></div>
              <div className="flex justify-between"><dt>Price per day</dt><dd>{formatINR(car.pricePerDay)}</dd></div>
              <div className="flex justify-between"><dt>Base rental</dt><dd>{formatINR(pricing.base)}</dd></div>
              {EXTRAS.filter((e) => extras[e.key]).map((e) => (
                <div key={e.key} className="flex justify-between"><dt>{e.label}</dt><dd>{formatINR(e.perDay * pricing.days)}</dd></div>
              ))}
              {pricing.discount > 0 && <div className="flex justify-between text-green-700"><dt>Discount{pricing.couponCode ? ` (${pricing.couponCode})` : ''}</dt><dd>-{formatINR(pricing.discount)}</dd></div>}
              <div className="flex justify-between"><dt>GST (18%)</dt><dd>{formatINR(pricing.tax)}</dd></div>
              <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-extrabold"><dt>Total estimate</dt><dd>{formatINR(pricing.total)}</dd></div>
              <div className="flex justify-between text-xs text-neutral-500"><dt>Refundable deposit (not in total)</dt><dd>{formatINR(pricing.deposit)}</dd></div>
            </dl>
          )}
        </>
      )}
    </div>
  );
}
