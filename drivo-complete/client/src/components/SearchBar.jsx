import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { locations } from '../data/homeContent.js';
import { validateSearch } from '../utils/validation.js';
import { toLocalInput } from '../utils/pricing.js';

export default function SearchBar() {
  const navigate = useNavigate();
  const now = toLocalInput(new Date());
  const [form, setForm] = useState({ pickup: '', dropoff: '', start: '', end: '' });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    // Clear the stale error for the field being edited (and return date when pickup changes)
    setErrors((er) => ({ ...er, [k]: undefined, ...(k === 'start' ? { end: undefined } : {}) }));
  };

  const onSubmit = (ev) => {
    ev.preventDefault();
    const e = validateSearch(form);
    setErrors(e);
    if (Object.keys(e).length) { toast.error('Please fix the highlighted fields'); return; }
    navigate(`/cars?${new URLSearchParams(form).toString()}`);
  };

  // Plain render helpers (not components) so inputs keep focus while typing.
  const locField = (name, label) => (
    <div>
      <label htmlFor={name} className="mb-1 block text-xs font-semibold text-neutral-600">{label}</label>
      <select id={name} className="field" value={form[name]} onChange={set(name)} aria-invalid={!!errors[name]}>
        <option value="">Select city</option>
        {locations.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      {errors[name] && <p className="field-error" role="alert">{errors[name]}</p>}
    </div>
  );

  const dateField = (name, label, min) => (
    <div>
      <label htmlFor={name} className="mb-1 block text-xs font-semibold text-neutral-600">{label}</label>
      <input id={name} type="datetime-local" className="field" min={min} value={form[name]} onChange={set(name)} aria-invalid={!!errors[name]} />
      {errors[name] && <p className="field-error" role="alert">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 rounded-3xl bg-white p-5 text-ink shadow-2xl sm:grid-cols-2 lg:grid-cols-5 lg:items-start">
      {locField('pickup', 'Pickup location')}
      {locField('dropoff', 'Return location')}
      {dateField('start', 'Pickup date and time', now)}
      {dateField('end', 'Return date and time', form.start || now)}
      <button type="submit" className="btn-primary h-[42px] sm:col-span-2 lg:col-span-1 lg:mt-5"><Search size={17} /> Search cars</button>
    </form>
  );
}
