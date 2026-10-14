import { formatINR } from '../utils/pricing.js';

function Select({ id, label, value, onChange, options, format = (o) => o }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-slate-700">
        {label}
      </label>
      <select
        id={id}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition cursor-pointer"
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

export default function FilterSidebar({ filters, options, onChange, onClear, activeCount }) {
  const max = filters.maxPrice ?? options.ceiling;
  return (
    <aside
      className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs text-[#0F172A]"
      aria-label="Fleet Filters"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="font-display text-xs font-bold tracking-wider uppercase text-[#0A142F]">
          Fleet Filters
        </h2>
        <button
          onClick={onClear}
          disabled={!activeCount}
          className="text-xs font-bold text-blue-900 hover:underline disabled:text-slate-300 transition cursor-pointer"
        >
          Reset ({activeCount})
        </button>
      </div>

      <Select
        id="f-location"
        label="Pickup City"
        value={filters.location}
        onChange={(v) => onChange('location', v)}
        options={options.locations}
      />
      <Select
        id="f-category"
        label="Vehicle Class"
        value={filters.category}
        onChange={(v) => onChange('category', v)}
        options={options.categories}
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
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="f-price" className="text-xs font-bold text-slate-700">
            Max Daily Rate
          </label>
          <span className="font-display text-xs font-bold text-[#0A142F]">{formatINR(max)}</span>
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
    </aside>
  );
}
