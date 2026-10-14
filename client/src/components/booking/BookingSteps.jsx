import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, MapPin, Zap, ShieldCheck } from 'lucide-react';
import { EXTRAS } from '../../data/extras.js';
import { formatINR, toLocalInput } from '../../utils/pricing.js';
import BookingSummary from '../BookingSummary.jsx';
import PickupLocationMap from '../PickupLocationMap.jsx';

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-slate-400 font-medium">{hint}</p>}
      {error && <p className="mt-1 text-xs font-semibold text-rose-600" role="alert">{error}</p>}
    </div>
  );
}

export function StepCar({ draft, cars, car, errors, conflict, rangeOk, onChange }) {
  const now = toLocalInput(new Date());
  return (
    <div className="space-y-5 text-[#0F172A]">
      <Field id="b-car" label="Select Vehicle Specification" error={errors.carId}>
        <select
          id="b-car"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition cursor-pointer"
          value={draft.carId ?? ''}
          onChange={(e) => onChange({ carId: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Select a vehicle from certified fleet</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id} disabled={!c.available}>
              {c.brand} {c.model} ({c.location}) — {formatINR(c.pricePerDay)}/day{c.available ? '' : ' (Currently Unavailable)'}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="b-start" label="Pickup Schedule" error={errors.start}>
          <input
            id="b-start"
            type="datetime-local"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition cursor-pointer"
            min={now}
            value={draft.start}
            onChange={(e) => onChange({ start: e.target.value })}
          />
        </Field>
        <Field id="b-end" label="Return Schedule" error={errors.end}>
          <input
            id="b-end"
            type="datetime-local"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition cursor-pointer"
            min={draft.start || now}
            value={draft.end}
            onChange={(e) => onChange({ end: e.target.value })}
          />
        </Field>
      </div>

      {car && rangeOk && (conflict ? (
        <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 p-4 text-xs text-rose-900 border border-rose-200" role="alert">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-600" />
          <div>
            <p className="font-bold text-rose-900">Unavailable for Selected Dates</p>
            <p className="mt-0.5 text-rose-700">
              Already booked from {new Date(conflict.start).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} to {new Date(conflict.end).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3.5 text-xs text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>Vehicle is verified available in live inventory for your selected window.</span>
        </div>
      ))}

      <p className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
        <Info size={13} className="shrink-0 text-blue-900" />
        Real-time dispatch availability is verified directly against MySQL database.
      </p>
    </div>
  );
}

export function StepCustomer({ customer, points, pickup, dropoff, city = 'Coimbatore', errors, onCustomer, onChange }) {
  const [returnSameLocation, setReturnSameLocation] = useState(pickup === dropoff);

  const input = (id, key, label, props = {}) => (
    <Field id={id} label={label} error={errors[key]} hint={props.hint}>
      <input
        id={id}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition"
        value={customer[key]}
        onChange={(e) => onCustomer(key, e.target.value)}
        aria-invalid={!!errors[key]}
        {...props.attrs}
      />
    </Field>
  );

  const handleSelectPickup = (selectedName) => {
    const update = { pickup: selectedName };
    if (returnSameLocation) {
      update.dropoff = selectedName;
    }
    onChange(update);
  };

  return (
    <div className="space-y-6 text-[#0F172A]">
      <div className="flex items-start gap-2.5 rounded-2xl bg-blue-50/70 p-4 text-xs text-blue-900 border border-blue-100">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-900" />
        <span>Please provide verified driver credentials. Handover is authorized upon matching your physical driving licence.</span>
      </div>

      {/* Driver Identity Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        {input('c-name', 'fullName', 'Primary Driver Full Name', { attrs: { autoComplete: 'name' } })}
        {input('c-email', 'email', 'Digital Invoice Email', { attrs: { type: 'email', autoComplete: 'email' } })}
        {input('c-phone', 'phone', 'Mobile Contact', { hint: '10-digit mobile number', attrs: { type: 'tel', autoComplete: 'tel' } })}
        {input('c-license', 'license', "Driver's Licence Number", { hint: 'Example: TN37 20210045678', attrs: { autoComplete: 'off' } })}
      </div>

      {/* Interactive Pickup Location Map & Selector */}
      <div className="pt-2 border-t border-slate-100">
        <PickupLocationMap
          city={city}
          selectedLocationName={pickup}
          onSelectLocation={handleSelectPickup}
          title={`Verified Handover Stations in ${city}`}
          subtitle="Explore official Drivo stations on the map or select from list below."
        />
      </div>

      {/* Return Location Configuration */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-display font-bold text-xs uppercase tracking-wider text-[#0A142F] block">
              Return Hub Station
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">Where will you hand over the vehicle at conclusion?</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <input
              type="checkbox"
              className="rounded text-[#0A142F] focus:ring-[#0A142F] h-4 w-4 cursor-pointer"
              checked={returnSameLocation}
              onChange={(e) => {
                const checked = e.target.checked;
                setReturnSameLocation(checked);
                if (checked) {
                  onChange({ dropoff: pickup });
                }
              }}
            />
            <span>Return to departure station ({pickup || 'Pickup Hub'})</span>
          </label>
        </div>

        {!returnSameLocation && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <Field id="c-return" label="Select return hub station">
              <select
                id="c-return"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:outline-none transition cursor-pointer"
                value={dropoff}
                onChange={(e) => onChange({ dropoff: e.target.value })}
              >
                {points.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}

export function StepExtras({ extras, days, onChange }) {
  return (
    <fieldset className="text-[#0F172A]">
      <legend className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
        Optional enhancements billed per 24-hour cycle.
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {EXTRAS.map((e) => (
          <label
            key={e.key}
            className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-all ${
              extras[e.key]
                ? 'border-[#0A142F] bg-blue-50/30 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#0A142F] cursor-pointer"
              checked={!!extras[e.key]}
              onChange={(ev) => onChange({ ...extras, [e.key]: ev.target.checked })}
            />
            <div>
              <span className="block font-display font-bold text-xs text-[#0A142F]">{e.label}</span>
              <span className="block text-[11px] text-slate-500 mt-0.5">{e.description}</span>
              <span className="mt-2 block font-display text-xs font-bold text-[#0A142F]">
                {formatINR(e.perDay)}/day
                {days > 0 && <span className="font-normal text-slate-400"> ({formatINR(e.perDay * days)} total)</span>}
              </span>
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function StepSummary({ summaryProps, couponCode, couponError, onApply, onRemove }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const apply = () => { const m = onApply(code); setMsg(m || ''); if (!m) setCode(''); };
  return (
    <div className="space-y-5 text-[#0F172A]">
      <BookingSummary {...summaryProps} />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#0A142F]">
          Privilege Coupon Code
        </h3>
        {couponCode ? (
          <div className="mt-3 flex items-center justify-between text-xs rounded-xl bg-emerald-50 p-3 border border-emerald-200 text-emerald-900">
            <span>Applied: <strong className="font-bold">{couponCode}</strong></span>
            <button className="font-bold text-xs text-rose-600 hover:underline cursor-pointer" onClick={onRemove}>
              Remove
            </button>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <label htmlFor="coupon" className="sr-only">Coupon code</label>
            <input
              id="coupon"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs font-bold uppercase text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none"
              placeholder="e.g. WELCOME10"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button
              type="button"
              className="rounded-xl bg-[#0A142F] text-white px-5 py-2.5 text-xs font-bold uppercase hover:bg-[#1E293B] transition shrink-0 cursor-pointer"
              onClick={apply}
            >
              Apply
            </button>
          </div>
        )}
        {(msg || couponError) && (
          <p className="mt-2 text-xs font-medium text-rose-600">{msg || couponError}</p>
        )}
      </div>
    </div>
  );
}

export function StepReview({ summaryProps, agreed, onAgreed }) {
  return (
    <div className="space-y-5 text-[#0F172A]">
      <BookingSummary {...summaryProps} title="Final Reservation Audit" />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <label className="flex items-start gap-3 cursor-pointer text-xs leading-relaxed text-slate-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded accent-[#0A142F] cursor-pointer"
            checked={agreed}
            onChange={(e) => onAgreed(e.target.checked)}
          />
          <span>
            I acknowledge that I hold a valid driving licence and official government ID, and agree to the DRIVO rental agreement, fuel deposit policy, and cancellation terms.
          </span>
        </label>
      </div>
    </div>
  );
}
