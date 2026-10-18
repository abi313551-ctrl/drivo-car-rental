import { RotateCcw } from 'lucide-react';
import { formatINR } from '../utils/pricing.js';

function Select({ id, label, value, onChange, options, format = (o) => o }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-slate-700">
        {label}
      </label>
      <select
        id={id}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All {label}s</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {format(o)}
          </option>
        ))}
      </select>
    </div>
  );
}

const PRIMARY_CATEGORIES = ['SUV', 'Sedan', 'Hatchback', 'Luxury'];

export default function FilterSidebar({ filters, options, onChange, onClear, activeCount }) {
  const max = filters.maxPrice ?? options.ceiling;
  const min = filters.minPrice ?? 1000;

  return (
    <aside
      className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs text-[#0F172A]"
      aria-label="Fleet Filters"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="font-display text-xs font-bold tracking-wider uppercase text-[#0A142F]">
          Filters {activeCount > 0 && <span className="ml-1 text-[11px] font-bold text-blue-700">({activeCount})</span>}
        </h2>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 hover:underline transition cursor-pointer"
          >
            <RotateCcw size={12} /> Clear Filters
          </button>
        )}
      </div>

      {/* Primary Category Quick Filters */}
      <div>
        <label className="mb-2 block text-xs font-bold text-slate-700">
          Body Type / Category
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onChange('category', '')}
            className={`rounded-xl px-3 py-2 text-xs font-bold text-center transition cursor-pointer ${
              !filters.category
                ? 'bg-[#0A142F] text-white shadow-2xs'
                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            All Categories
          </button>
          {PRIMARY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onChange('category', filters.category === cat ? '' : cat)}
              className={`rounded-xl px-3 py-2 text-xs font-bold text-center transition cursor-pointer ${
                filters.category === cat
                  ? 'bg-[#0A142F] text-white shadow-2xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {/* Additional category dropdown if more categories exist */}
        {options.categories.some((c) => !PRIMARY_CATEGORIES.includes(c)) && (
          <div className="mt-2">
            <select
              value={PRIMARY_CATEGORIES.includes(filters.category) || !filters.category ? '' : filters.category}
              onChange={(e) => onChange('category', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-600 focus:border-[#0A142F] focus:outline-none cursor-pointer"
            >
              <option value="">More categories...</option>
              {options.categories
                .filter((c) => !PRIMARY_CATEGORIES.includes(c))
                .map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="f-price" className="text-xs font-bold text-slate-700">
            Daily Budget
          </label>
          <span className="font-display text-xs font-bold text-[#0A142F]">
            Up to {formatINR(max)}
          </span>
        </div>
        <input
          id="f-price"
          type="range"
          min="1000"
          max={options.ceiling}
          step="500"
          value={max}
          onChange={(e) =>
            onChange('maxPrice', Number(e.target.value) >= options.ceiling ? null : Number(e.target.value))
          }
          className="w-full accent-[#0A142F] cursor-pointer"
        />
        <div className="mt-1 flex justify-between text-[10px] text-slate-400 font-medium">
          <span>₹1,000</span>
          <span>{formatINR(options.ceiling)}</span>
        </div>
      </div>

      <Select
        id="f-location"
        label="Pickup City"
        value={filters.location}
        onChange={(v) => onChange('location', v)}
        options={options.locations}
      />
      <Select
        id="f-fuel"
        label="Powertrain"
        value={filters.fuel}
        onChange={(v) => onChange('fuel', v)}
        options={options.fuels}
      />
      <Select
        id="f-trans"
        label="Transmission"
        value={filters.transmission}
        onChange={(v) => onChange('transmission', v)}
        options={options.transmissions}
      />
      <Select
        id="f-seats"
        label="Capacity"
        value={filters.seats}
        onChange={(v) => onChange('seats', v)}
        options={options.seats.map(String)}
        format={(o) => `${o} Seats`}
      />

      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.availableOnly}
            onChange={(e) => onChange('availableOnly', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#0A142F] focus:ring-1 focus:ring-[#0A142F] cursor-pointer"
          />
          <span>Show only available vehicles</span>
        </label>
      </div>

      {activeCount > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClear}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-red-600 transition cursor-pointer"
          >
            <RotateCcw size={13} /> Clear All Filters
          </button>
        </div>
      )}
    </aside>
  );
}
