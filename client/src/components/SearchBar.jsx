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
      toast.error('Please select location and dates');
      return;
    }
    const cleanParams = Object.fromEntries(Object.entries(form).filter(([, v]) => v));
    navigate(`/cars?${new URLSearchParams(cleanParams).toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-2xl shadow-slate-900/10 text-slate-800"
    >
      <div className="grid gap-4 lg:grid-cols-4 lg:items-center">
        {/* 1. Pick-up Location */}
        <div className="relative flex items-center gap-3 px-3 py-1 lg:border-r lg:border-slate-100">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-[#0B1528] shrink-0">
            <MapPin size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="sb-pickup" className="block text-[11px] font-semibold text-slate-400">
              Pick-up Location
            </label>
            <select
              id="sb-pickup"
              value={form.pickup}
              onChange={set('pickup')}
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0B1528] focus:outline-none cursor-pointer"
            >
              <option value="">Select location</option>
              {availableLocations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            {errors.pickup && <p className="text-[10px] text-red-500 font-semibold">{errors.pickup}</p>}
          </div>
        </div>

        {/* 2. Pick-up Date */}
        <div className="relative flex items-center gap-3 px-3 py-1 lg:border-r lg:border-slate-100">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-[#0B1528] shrink-0">
            <Calendar size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="sb-start" className="block text-[11px] font-semibold text-slate-400">
              Pick-up Date
            </label>
            <input
              id="sb-start"
              type="datetime-local"
              min={now}
              value={form.start}
              onChange={set('start')}
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0B1528] focus:outline-none cursor-pointer"
            />
            {errors.start && <p className="text-[10px] text-red-500 font-semibold">{errors.start}</p>}
          </div>
        </div>

        {/* 3. Drop-off Date */}
        <div className="relative flex items-center gap-3 px-3 py-1 lg:border-r lg:border-slate-100">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-[#0B1528] shrink-0">
            <Calendar size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="sb-end" className="block text-[11px] font-semibold text-slate-400">
              Drop-off Date
            </label>
            <input
              id="sb-end"
              type="datetime-local"
              min={form.start || now}
              value={form.end}
              onChange={set('end')}
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0B1528] focus:outline-none cursor-pointer"
            />
            {errors.end && <p className="text-[10px] text-red-500 font-semibold">{errors.end}</p>}
          </div>
        </div>

        {/* 4. Car Type & Search Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 px-2">
          <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-[#0B1528] shrink-0">
              <Car size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="sb-category" className="block text-[11px] font-semibold text-slate-400">
                Car Type
              </label>
              <select
                id="sb-category"
                value={form.category}
                onChange={set('category')}
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0B1528] focus:outline-none cursor-pointer"
              >
                <option value="">All Cars</option>
                {defaultCategories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto rounded-full bg-[#0B1528] hover:bg-[#1E293B] text-white px-7 py-3 text-xs sm:text-sm font-bold tracking-wide transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            <Search size={15} />
            <span>Search Cars</span>
          </button>
        </div>
      </div>
    </form>
  );
}
