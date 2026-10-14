import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, MapPin, Zap, ShieldCheck } from 'lucide-react';
import { EXTRAS } from '../../data/extras.js';
import { formatINR, toLocalInput } from '../../utils/pricing.js';
import BookingSummary from '../BookingSummary.jsx';
import PickupLocationMap from '../PickupLocationMap.jsx';

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-mono font-medium tracking-wider text-[#C6CDD5]">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] font-mono text-[#C6CDD5]/50">{hint}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

export function StepCar({ draft, cars, car, errors, conflict, rangeOk, onChange }) {
  const now = toLocalInput(new Date());
  return (
    <div className="space-y-5 text-[#F5F7FA]">
      <Field id="b-car" label="Select Vehicle Specification" error={errors.carId}>
        <select
          id="b-car"
          className="field text-xs font-semibold bg-[#161A22] text-[#F5F7FA]"
          value={draft.carId ?? ''}
          onChange={(e) => onChange({ carId: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="" className="bg-[#161A22] text-[#C6CDD5]">Select a vehicle from certified fleet</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id} disabled={!c.available} className="bg-[#161A22] text-[#F5F7FA]">
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
            className="field text-xs bg-[#161A22] text-[#F5F7FA]"
            min={now}
            value={draft.start}
            onChange={(e) => onChange({ start: e.target.value })}
          />
        </Field>
        <Field id="b-end" label="Return Schedule" error={errors.end}>
          <input
            id="b-end"
            type="datetime-local"
            className="field text-xs bg-[#161A22] text-[#F5F7FA]"
            min={draft.start || now}
            value={draft.end}
            onChange={(e) => onChange({ end: e.target.value })}
          />
        </Field>
      </div>

      {car && rangeOk && (conflict ? (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-950/60 p-4 text-xs text-red-200 border border-red-500/30" role="alert">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="font-bold text-red-300">Unavailable for Selected Dates</p>
            <p className="mt-0.5 text-red-300/80">
              Already booked from {new Date(conflict.start).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} to {new Date(conflict.end).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-[#75CFFF]/10 p-3.5 text-xs text-[#75CFFF] border border-[#75CFFF]/25">
          <CheckCircle2 size={16} className="shrink-0 text-[#75CFFF]" />
          <span>Vehicle is verified available in live inventory for your dates.</span>
        </div>
      ))}

      <p className="flex items-center gap-2 text-[11px] font-mono text-[#C6CDD5]/60">
        <Info size={13} className="shrink-0 text-[#75CFFF]" />
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
        className="field text-xs bg-[#161A22] text-[#F5F7FA]"
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
    <div className="space-y-6 text-[#F5F7FA]">
      <div className="flex items-start gap-2.5 rounded-xl bg-[#1B2028] p-4 text-xs text-[#C6CDD5] border border-[rgba(198,205,213,0.12)]">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#75CFFF]" />
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
      <div className="pt-2 border-t border-[rgba(198,205,213,0.08)]">
        <PickupLocationMap
          city={city}
          selectedLocationName={pickup}
          onSelectLocation={handleSelectPickup}
          title={`Verified Handover Stations in ${city}`}
          subtitle="Explore official Drivo stations on the map or select from list below."
        />
      </div>

      {/* Return Location Configuration */}
      <div className="rounded-xl border border-[rgba(198,205,213,0.12)] bg-[#1B2028] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-display font-bold text-xs uppercase tracking-wider text-[#F5F7FA] block">
              Return Hub Station
            </span>
            <p className="text-[11px] text-[#C6CDD5]/60 mt-0.5">Where will you hand over the vehicle at conclusion?</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#C6CDD5] bg-[#161A22] px-3 py-1.5 rounded-lg border border-[rgba(198,205,213,0.14)]">
            <input
              type="checkbox"
              className="rounded text-[#75CFFF] focus:ring-[#75CFFF]/30 h-4 w-4 bg-[#111318]"
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
          <div className="mt-3 pt-3 border-t border-[rgba(198,205,213,0.08)]">
            <Field id="c-return" label="Select return hub station">
              <select
                id="c-return"
                className="field text-xs bg-[#161A22]"
                value={dropoff}
                onChange={(e) => onChange({ dropoff: e.target.value })}
              >
                {points.map((p) => (
                  <option key={p} value={p} className="bg-[#161A22] text-[#F5F7FA]">
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
    <fieldset className="text-[#F5F7FA]">
      <legend className="mb-4 text-xs font-mono uppercase tracking-wider text-[#C6CDD5]/70">
        Optional enhancements billed per 24-hour cycle.
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {EXTRAS.map((e) => (
          <label
            key={e.key}
            className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all ${
              extras[e.key]
                ? 'border-[#75CFFF] bg-[#75CFFF]/10 shadow-sm'
                : 'border-[rgba(198,205,213,0.12)] bg-[#161A22] hover:border-[rgba(198,205,213,0.25)]'
            }`}
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#75CFFF]"
              checked={!!extras[e.key]}
              onChange={(ev) => onChange({ ...extras, [e.key]: ev.target.checked })}
            />
            <div>
              <span className="block font-display font-bold text-xs text-[#F5F7FA]">{e.label}</span>
              <span className="block text-[11px] text-[#C6CDD5]/60 mt-0.5">{e.description}</span>
              <span className="mt-2 block font-mono text-xs font-bold text-[#75CFFF]">
                {formatINR(e.perDay)}/day
                {days > 0 && <span className="font-normal text-[#C6CDD5]/50"> ({formatINR(e.perDay * days)} total)</span>}
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
    <div className="space-y-5 text-[#F5F7FA]">
      <BookingSummary {...summaryProps} />
      <div className="rounded-xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-5">
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#F5F7FA]">
          Privilege Coupon Code
        </h3>
        {couponCode ? (
          <div className="mt-3 flex items-center justify-between text-xs rounded-lg bg-[#75CFFF]/10 p-2.5 border border-[#75CFFF]/25">
            <span>Applied: <strong className="font-mono text-[#75CFFF]">{couponCode}</strong></span>
            <button className="font-mono font-bold text-xs text-red-400 hover:underline" onClick={onRemove}>
              Remove
            </button>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <label htmlFor="coupon" className="sr-only">Coupon code</label>
            <input
              id="coupon"
              className="field font-mono uppercase text-xs bg-[#111318]"
              placeholder="e.g. WELCOME10"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), apply())}
            />
            <button className="btn-primary text-xs px-5 py-2.5" onClick={apply}>
              Apply
            </button>
          </div>
        )}
        {(msg || couponError) && <p className="field-error" role="alert">{msg || couponError}</p>}
      </div>
    </div>
  );
}

export function StepReview({ customer, summaryProps, agreed, onAgree, error, onEdit }) {
  const row = (k, v) => (
    <div className="flex justify-between gap-4 text-xs">
      <dt className="font-mono text-[#C6CDD5]/60">{k}</dt>
      <dd className="text-right font-medium text-[#F5F7FA]">{v}</dd>
    </div>
  );
  const section = (title, step, children) => (
    <div className="rounded-xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-4">
      <div className="mb-2 flex items-center justify-between border-b border-[rgba(198,205,213,0.06)] pb-2">
        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#F5F7FA]">{title}</h3>
        <button className="text-xs font-mono font-semibold text-[#75CFFF] hover:underline" onClick={() => onEdit(step)}>
          Edit
        </button>
      </div>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  );
  return (
    <div className="space-y-4 text-[#F5F7FA]">
      {section('Driver Credentials', 2, (
        <>
          {row('Name', customer.fullName)}
          {row('Email', customer.email)}
          {row('Phone', customer.phone)}
          {row('Licence', customer.license)}
          {row('Departure Hub', summaryProps.pickup)}
          {row('Return Hub', summaryProps.dropoff)}
        </>
      ))}
      {section(
        'Selected Add-ons',
        3,
        row('Active Extras', EXTRAS.filter((e) => summaryProps.extras[e.key]).map((e) => e.label).join(', ') || 'None')
      )}
      <BookingSummary {...summaryProps} title="Final Tariff Breakdown" />
      <div className="rounded-xl bg-[#1B2028] p-3.5 border border-[rgba(198,205,213,0.1)] text-xs text-[#C6CDD5]/80 flex items-start gap-2">
        <Info size={16} className="text-[#75CFFF] shrink-0 mt-0.5" />
        <span>Reservation will be confirmed into Drivo's secure reservation database and an instant reference token generated.</span>
      </div>
      <label className="flex items-start gap-2.5 text-xs text-[#C6CDD5] cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded accent-[#75CFFF]"
          checked={agreed}
          onChange={(e) => onAgree(e.target.checked)}
        />
        <span>I have reviewed the driver details, rental dates, and agree to the 2027 rental and verification terms.</span>
      </label>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
