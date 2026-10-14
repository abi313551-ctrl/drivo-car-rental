import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Car } from 'lucide-react';
import toast from 'react-hot-toast';
import { locations as defaultLocations, categories as defaultCategories } from '../data/homeContent.js';
import { validateSearch } from '../utils/validation.js';
import { toLocalInput } from '../utils/pricing.js';
import { useCars } from '../context/CarContext.jsx';

export default function SearchBar() {
  const navigate = useNavigate();
  const { cars } = useCars();
  const now = toLocalInput(new Date());
  const [form, setForm] = useState({ pickup: '', dropoff: '', start: '', end: '', category: '' });
  const [errors, setErrors] = useState({});

  const availableLocations = useMemo(() => {
    const fromCars = cars.map((c) => c.location).filter(Boolean);
    return [...new Set([...fromCars, ...defaultLocations])];
  }, [cars]);

  const set = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: value };
      if (k === 'pickup' && !f.dropoff) {
        next.dropoff = value;
      }
      return next;
    });
    setErrors((er) => ({ ...er, [k]: undefined, ...(k === 'start' ? { end: undefined } : {}) }));
  };

  const onSubmit = (ev) => {
    ev.preventDefault();
    const e = validateSearch(form);
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error('Please specify pickup city and rental dates');
      return;
    }
    const cleanParams = Object.fromEntries(Object.entries(form).filter(([, v]) => v));
    navigate(`/cars?${new URLSearchParams(cleanParams).toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-lg shadow-slate-900/5 text-[#0F172A]"
    >
      <div className="grid gap-4 lg:grid-cols-5 lg:items-center">
        {/* 1. Pick-up Location */}
        <div className="relative flex items-center gap-3 px-3 py-1 lg:border-r lg:border-slate-100">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-[#0A142F] shrink-0 border border-slate-100">
            <MapPin size={17} />
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="sb-pickup" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pick-up Hub
            </label>
            <select
              id="sb-pickup"
              value={form.pickup}
              onChange={set('pickup')}
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0A142F] focus:outline-none cursor-pointer mt-0.5"
            >
              <option value="">Select location</option>
              {availableLocations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            {errors.pickup && <p className="text-[10px] text-rose-600 font-semibold">{errors.pickup}</p>}
          </div>
        </div>

        {/* 2. Pick-up Date */}
        <div className="relative flex items-center gap-3 px-3 py-1 lg:border-r lg:border-slate-100">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-[#0A142F] shrink-0 border border-slate-100">
            <Calendar size={17} />
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="sb-start" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pick-up Schedule
            </label>
            <input
              id="sb-start"
              type="datetime-local"
              min={now}
              value={form.start}
              onChange={set('start')}
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0A142F] focus:outline-none cursor-pointer mt-0.5"
            />
            {errors.start && <p className="text-[10px] text-rose-600 font-semibold">{errors.start}</p>}
          </div>
        </div>

        {/* 3. Drop-off Date */}
        <div className="relative flex items-center gap-3 px-3 py-1 lg:border-r lg:border-slate-100">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-[#0A142F] shrink-0 border border-slate-100">
            <Calendar size={17} />
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="sb-end" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Return Schedule
            </label>
            <input
              id="sb-end"
              type="datetime-local"
              min={form.start || now}
              value={form.end}
              onChange={set('end')}
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0A142F] focus:outline-none cursor-pointer mt-0.5"
            />
            {errors.end && <p className="text-[10px] text-rose-600 font-semibold">{errors.end}</p>}
          </div>
        </div>

        {/* 4. Car Type */}
        <div className="relative flex items-center gap-3 px-3 py-1 lg:border-r lg:border-slate-100">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-[#0A142F] shrink-0 border border-slate-100">
            <Car size={17} />
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="sb-category" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Vehicle Segment
            </label>
            <select
              id="sb-category"
              value={form.category}
              onChange={set('category')}
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0A142F] focus:outline-none cursor-pointer mt-0.5"
            >
              <option value="">All Segments</option>
              {defaultCategories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. Search Button */}
        <div className="px-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white py-3.5 text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search size={16} />
            <span>Search Fleet</span>
          </button>
        </div>
      </div>
    </form>
  );
}
