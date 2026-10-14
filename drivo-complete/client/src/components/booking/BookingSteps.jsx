import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { EXTRAS } from '../../data/extras.js';
import { formatINR, toLocalInput } from '../../utils/pricing.js';
import BookingSummary from '../BookingSummary.jsx';

// Defined at module level so inputs keep focus while typing.
function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-neutral-600">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

export function StepCar({ draft, cars, car, errors, conflict, rangeOk, onChange }) {
  const now = toLocalInput(new Date());
  return (
    <div className="space-y-5">
      <Field id="b-car" label="Car" error={errors.carId}>
        <select id="b-car" className="field" value={draft.carId ?? ''} onChange={(e) => onChange({ carId: e.target.value ? Number(e.target.value) : null })}>
          <option value="">Select a car</option>
          {cars.map((c) => <option key={c.id} value={c.id} disabled={!c.available}>{c.brand} {c.model} ({c.location}) - {formatINR(c.pricePerDay)}/day{c.available ? '' : ' - unavailable'}</option>)}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="b-start" label="Pickup date and time" error={errors.start}>
          <input id="b-start" type="datetime-local" className="field" min={now} value={draft.start} onChange={(e) => onChange({ start: e.target.value })} />
        </Field>
        <Field id="b-end" label="Return date and time" error={errors.end}>
          <input id="b-end" type="datetime-local" className="field" min={draft.start || now} value={draft.end} onChange={(e) => onChange({ end: e.target.value })} />
        </Field>
      </div>
      {car && rangeOk && (conflict ? (
        <p className="flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm text-red-800" role="alert"><AlertTriangle size={17} className="mt-0.5 shrink-0" />
          This car is already booked from {new Date(conflict.start).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} to {new Date(conflict.end).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}. Pick other dates or another car.
        </p>
      ) : (
        <p className="flex items-start gap-2 rounded-2xl bg-green-50 p-3 text-sm text-green-800"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />Available for these dates.</p>
      ))}
      <p className="flex items-start gap-2 text-xs text-neutral-500"><Info size={14} className="mt-0.5 shrink-0" />Availability is worked out only from bookings saved in this browser. It is not shared with other users or devices.</p>
    </div>
  );
}

export function StepCustomer({ customer, points, pickup, dropoff, errors, onCustomer, onChange }) {
  const input = (id, key, label, props = {}) => (
    <Field id={id} label={label} error={errors[key]} hint={props.hint}>
      <input id={id} className="field" value={customer[key]} onChange={(e) => onCustomer(key, e.target.value)} aria-invalid={!!errors[key]} {...props.attrs} />
    </Field>
  );
  return (
    <div className="space-y-5">
      <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900"><Info size={17} className="mt-0.5 shrink-0" />Demo only. Use sample details, not real documents. Everything is saved in this browser.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {input('c-name', 'fullName', 'Full name', { attrs: { autoComplete: 'name' } })}
        {input('c-email', 'email', 'Email', { attrs: { type: 'email', autoComplete: 'email' } })}
        {input('c-phone', 'phone', 'Phone number', { hint: '10-digit mobile number', attrs: { type: 'tel', autoComplete: 'tel' } })}
        {input('c-license', 'license', "Driver's license number", { hint: 'Example: TN37 20190012345', attrs: { autoComplete: 'off' } })}
        <Field id="c-pickup" label="Pickup location">
          <select id="c-pickup" className="field" value={pickup} onChange={(e) => onChange({ pickup: e.target.value })}>{points.map((p) => <option key={p}>{p}</option>)}</select>
        </Field>
        <Field id="c-return" label="Return location">
          <select id="c-return" className="field" value={dropoff} onChange={(e) => onChange({ dropoff: e.target.value })}>{points.map((p) => <option key={p}>{p}</option>)}</select>
        </Field>
      </div>
    </div>
  );
}

export function StepExtras({ extras, days, onChange }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm text-neutral-600">Optional extras are billed per day for the whole rental.</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {EXTRAS.map((e) => (
          <label key={e.key} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${extras[e.key] ? 'border-accent bg-accent-soft' : 'border-neutral-200 hover:border-neutral-400'}`}>
            <input type="checkbox" className="mt-1 h-4 w-4 accent-accent" checked={!!extras[e.key]} onChange={(ev) => onChange({ ...extras, [e.key]: ev.target.checked })} />
            <span>
              <span className="block font-semibold">{e.label}</span>
              <span className="block text-xs text-neutral-600">{e.description}</span>
              <span className="mt-1 block text-sm font-bold">{formatINR(e.perDay)}/day{days > 0 && <span className="font-normal text-neutral-500"> ({formatINR(e.perDay * days)} total)</span>}</span>
            </span>
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
    <div className="space-y-5">
      <BookingSummary {...summaryProps} />
      <div className="rounded-3xl border border-neutral-200 p-5">
        <h3 className="font-bold">Coupon</h3>
        {couponCode ? (
          <p className="mt-2 flex items-center justify-between text-sm"><span>Applied: <strong className="font-mono">{couponCode}</strong></span><button className="font-semibold text-accent" onClick={onRemove}>Remove</button></p>
        ) : (
          <div className="mt-2 flex gap-2">
            <label htmlFor="coupon" className="sr-only">Coupon code</label>
            <input id="coupon" className="field font-mono uppercase" placeholder="WELCOME10" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), apply())} />
            <button className="btn-dark" onClick={apply}>Apply</button>
          </div>
        )}
        {(msg || couponError) && <p className="field-error" role="alert">{msg || couponError}</p>}
      </div>
    </div>
  );
}

export function StepReview({ customer, summaryProps, agreed, onAgree, error, onEdit }) {
  const row = (k, v) => <div className="flex justify-between gap-4 text-sm"><dt className="text-neutral-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;
  const section = (title, step, children) => (
    <div className="rounded-2xl border border-neutral-200 p-4">
      <div className="mb-2 flex items-center justify-between"><h3 className="font-bold">{title}</h3><button className="text-sm font-semibold text-accent" onClick={() => onEdit(step)}>Edit</button></div>
      <dl className="space-y-1">{children}</dl>
    </div>
  );
  return (
    <div className="space-y-4">
      {section('Your details', 2, <>
        {row('Name', customer.fullName)}{row('Email', customer.email)}{row('Phone', customer.phone)}{row('Licence', customer.license)}
        {row('Pickup', summaryProps.pickup)}{row('Return', summaryProps.dropoff)}
      </>)}
      {section('Extras', 3, row('Selected', EXTRAS.filter((e) => summaryProps.extras[e.key]).map((e) => e.label).join(', ') || 'None'))}
      <BookingSummary {...summaryProps} title="Price" />
      <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900"><Info size={17} className="mt-0.5 shrink-0" />This is a demonstration. Confirming saves a sample booking in your browser. No real reservation is made with any rental company.</p>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 accent-accent" checked={agreed} onChange={(e) => onAgree(e.target.checked)} />I understand this is a demo booking and agree to the sample terms.</label>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
