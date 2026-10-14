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
    <div className="rounded-2xl border border-[rgba(198,205,213,0.14)] bg-[#161A22] p-5 shadow-2xl text-[#F5F7FA]">
      <h2 className="font-display text-sm font-bold tracking-wider uppercase text-[#F5F7FA] border-b border-[rgba(198,205,213,0.08)] pb-3">
        {title}
      </h2>
      {!car ? (
        <p className="mt-3 text-xs text-[#C6CDD5]/60 font-mono">Select a vehicle to calculate tariff.</p>
      ) : (
        <>
          <div className="mt-4 flex gap-3.5 items-center">
            <div className="h-14 w-20 overflow-hidden rounded-xl bg-[#1B2028] border border-[rgba(198,205,213,0.1)] shrink-0">
              <CarImage src={car.image} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="text-xs">
              <p className="font-display font-bold text-sm text-[#F5F7FA]">{car.brand} {car.model}</p>
              <p className="text-[#C6CDD5]/60 font-mono">{car.year} · {car.category}</p>
            </div>
          </div>

          <dl className="mt-4 space-y-2.5 text-xs text-[#C6CDD5]/80 border-t border-[rgba(198,205,213,0.08)] pt-3">
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 font-mono text-[#C6CDD5]/60">Pickup Hub</dt>
              <dd className="text-right">
                <span className="font-bold text-[#F5F7FA]">{fmt(start)}</span>
                {pickup && (
                  <span className="block text-[11px] text-[#75CFFF] mt-0.5">
                    <strong>{pickup}</strong>
                    {pickupLoc?.address && <span className="block text-[10px] text-[#C6CDD5]/50 truncate max-w-[200px]">{pickupLoc.address}</span>}
                  </span>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 font-mono text-[#C6CDD5]/60">Return Hub</dt>
              <dd className="text-right">
                <span className="font-bold text-[#F5F7FA]">{fmt(end)}</span>
                {dropoff && (
                  <span className="block text-[11px] text-[#75CFFF] mt-0.5">
                    <strong>{dropoff}</strong>
                    {dropoffLoc?.address && <span className="block text-[10px] text-[#C6CDD5]/50 truncate max-w-[200px]">{dropoffLoc.address}</span>}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {!pricing ? (
            <p className="mt-4 text-xs font-mono text-[#C6CDD5]/50">Specify valid dates to compute pricing.</p>
          ) : (
            <dl className="mt-4 space-y-2 border-t border-[rgba(198,205,213,0.08)] pt-4 text-xs">
              <div className="flex justify-between text-[#C6CDD5]/80">
                <dt>Rental Duration</dt>
                <dd className="font-mono font-bold text-[#F5F7FA]">{pricing.days} {pricing.days === 1 ? 'day' : 'days'}</dd>
              </div>
              <div className="flex justify-between text-[#C6CDD5]/80">
                <dt>Daily Tariff</dt>
                <dd className="font-mono">{formatINR(pricing.pricePerDay || car.pricePerDay)} / day</dd>
              </div>
              <div className="flex justify-between text-[#C6CDD5]/80">
                <dt>Base Charge ({pricing.days}d x {formatINR(pricing.pricePerDay || car.pricePerDay)})</dt>
                <dd className="font-mono text-[#F5F7FA]">{formatINR(pricing.base)}</dd>
              </div>
              {EXTRAS.filter((e) => extras[e.key]).map((e) => (
                <div key={e.key} className="flex justify-between text-[#C6CDD5]/80">
                  <dt>{e.label} ({pricing.days}d x {formatINR(e.perDay)})</dt>
                  <dd className="font-mono text-[#F5F7FA]">{formatINR(e.perDay * pricing.days)}</dd>
                </div>
              ))}
              {pricing.extras > 0 && !EXTRAS.some((e) => extras[e.key]) && (
                <div className="flex justify-between text-[#C6CDD5]/80">
                  <dt>Selected Add-ons</dt>
                  <dd className="font-mono text-[#F5F7FA]">{formatINR(pricing.extras)}</dd>
                </div>
              )}
              {pricing.discount > 0 && (
                <div className="flex justify-between text-[#75CFFF] font-semibold bg-[#75CFFF]/10 px-2 py-1 rounded-md border border-[#75CFFF]/20">
                  <dt>Privilege Discount {pricing.couponCode ? `(${pricing.couponCode})` : ''}</dt>
                  <dd className="font-mono">-{formatINR(pricing.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-[#C6CDD5]/80">
                <dt>Statutory GST (18%)</dt>
                <dd className="font-mono text-[#F5F7FA]">{formatINR(pricing.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-[rgba(198,205,213,0.12)] pt-3 text-sm font-extrabold text-[#F5F7FA]">
                <dt>Total Payable</dt>
                <dd className="text-base text-[#75CFFF] font-mono">{formatINR(pricing.total)}</dd>
              </div>
              <div className="flex justify-between text-[11px] text-[#C6CDD5]/50 pt-1.5 border-t border-dashed border-[rgba(198,205,213,0.08)] font-mono">
                <dt>Refundable Security Deposit</dt>
                <dd className="font-bold text-[#C6CDD5]">{formatINR(pricing.deposit ?? car.deposit ?? 0)}</dd>
              </div>
            </dl>
          )}
        </>
      )}
    </div>
  );
}
