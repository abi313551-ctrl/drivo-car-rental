import { formatINR } from '../utils/pricing.js';
import { EXTRAS } from '../data/extras.js';
import CarImage from './CarImage.jsx';
import { getLocationByName } from '../utils/locations.js';

const fmt = (s) => (s && !Number.isNaN(new Date(s).getTime()) ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-');

// Works for a draft (live car) and for a saved booking (car snapshot).
export default function BookingSummary({ car, start, end, pickup, dropoff, extras = {}, pricing, title = 'Booking Summary' }) {
  const pickupLoc = getLocationByName(pickup);
  const dropoffLoc = getLocationByName(dropoff);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm text-[#0F172A]">
      <h2 className="font-display text-xs font-bold tracking-wider uppercase text-[#0A142F] border-b border-slate-100 pb-3">
        {title}
      </h2>
      {!car ? (
        <p className="mt-3 text-xs text-slate-500">Select a vehicle to calculate tariff.</p>
      ) : (
        <>
          <div className="mt-4 flex gap-3.5 items-center">
            <div className="h-14 w-20 overflow-hidden rounded-xl bg-slate-100 border border-slate-200 shrink-0">
              <CarImage src={car.image} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="text-xs">
              <p className="font-display font-bold text-sm text-[#0A142F]">{car.brand} {car.model}</p>
              <p className="text-slate-500">{car.year} · {car.category}</p>
            </div>
          </div>

          <dl className="mt-4 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 font-bold text-slate-700">Pickup Hub</dt>
              <dd className="text-right">
                <span className="font-bold text-[#0A142F]">{fmt(start)}</span>
                {pickup && (
                  <span className="block text-[11px] text-blue-900 mt-0.5">
                    <strong>{pickup}</strong>
                    {pickupLoc?.address && <span className="block text-[10px] text-slate-400 truncate max-w-[200px]">{pickupLoc.address}</span>}
                  </span>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 font-bold text-slate-700">Return Hub</dt>
              <dd className="text-right">
                <span className="font-bold text-[#0A142F]">{fmt(end)}</span>
                {dropoff && (
                  <span className="block text-[11px] text-blue-900 mt-0.5">
                    <strong>{dropoff}</strong>
                    {dropoffLoc?.address && <span className="block text-[10px] text-slate-400 truncate max-w-[200px]">{dropoffLoc.address}</span>}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {!pricing ? (
            <p className="mt-4 text-xs text-slate-400">Specify valid dates to compute pricing.</p>
          ) : (
            <>
              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <div className="flex justify-between py-1">
                  <span>Duration</span>
                  <span className="font-bold text-[#0A142F]">{pricing.days} {pricing.days === 1 ? 'day' : 'days'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Daily Rate</span>
                  <span className="font-bold text-[#0A142F]">{formatINR(car.pricePerDay)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Base Tariff</span>
                  <span className="font-bold text-[#0A142F]">{formatINR(pricing.base ?? pricing.basePrice)}</span>
                </div>

                {/* Extras itemized breakdown */}
                {Object.entries(extras).filter(([, v]) => v).map(([k]) => {
                  const meta = EXTRAS.find((e) => e.id === k);
                  if (!meta) return null;
                  const cost = meta.type === 'per_day' ? meta.price * pricing.days : meta.price;
                  return (
                    <div key={k} className="flex justify-between py-0.5 text-slate-500">
                      <span>+ {meta.name}</span>
                      <span>{formatINR(cost)}</span>
                    </div>
                  );
                })}

                {pricing.discount > 0 && (
                  <div className="flex justify-between py-1 font-bold text-emerald-600">
                    <span>Discount ({pricing.couponCode})</span>
                    <span>-{formatINR(pricing.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between py-1">
                  <span>GST (18% Statutory)</span>
                  <span className="font-bold text-[#0A142F]">{formatINR(pricing.tax)}</span>
                </div>

                <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-[#0A142F]">
                  <span>Total Estimated</span>
                  <span className="text-base text-[#0A142F]">{formatINR(pricing.total)}</span>
                </div>

                <div className="mt-2 flex justify-between border-t border-dashed border-slate-200 pt-2 text-[11px] text-slate-400">
                  <span>Refundable Deposit</span>
                  <span>{formatINR(pricing.deposit ?? car.deposit)}</span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
