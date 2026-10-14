import { formatINR } from '../utils/pricing.js';

function Select({ id, label, value, onChange, options, format = (o) => o }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-mono font-medium tracking-wider text-[#C6CDD5]">
        {label}
      </label>
      <select
        id={id}
        className="field text-xs font-semibold text-[#F5F7FA] bg-[#111318]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" className="bg-[#111318] text-[#C6CDD5]">All {label}s</option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#111318] text-[#F5F7FA]">
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
      className="space-y-4 rounded-2xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-5 shadow-2xl text-[#F5F7FA]"
      aria-label="Fleet Filters"
    >
      <div className="flex items-center justify-between border-b border-[rgba(198,205,213,0.08)] pb-3">
        <h2 className="font-display text-sm font-bold tracking-wider uppercase text-[#F5F7FA]">
          Fleet Filters
        </h2>
        <button
          onClick={onClear}
          disabled={!activeCount}
          className="text-xs font-mono font-bold text-[#75CFFF] hover:underline disabled:text-[#C6CDD5]/30 transition"
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

      <div className="pt-2 border-t border-[rgba(198,205,213,0.08)]">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="f-price" className="text-xs font-mono font-medium text-[#C6CDD5]">
            Max Daily Rate
          </label>
          <span className="font-mono text-xs font-bold text-[#75CFFF]">{formatINR(max)}</span>
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
          className="w-full accent-[#75CFFF] cursor-pointer"
        />
      </div>

      <div className="pt-3 border-t border-[rgba(198,205,213,0.08)]">
        <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-medium text-[#C6CDD5]">
          <input
            type="checkbox"
            checked={!!filters.availableOnly}
            onChange={(e) => onChange('availableOnly', e.target.checked)}
            className="h-4 w-4 rounded border-[rgba(198,205,213,0.3)] bg-[#111318] text-[#75CFFF] focus:ring-[#75CFFF]/30"
          />
          <span>Show available cars only</span>
        </label>
      </div>
    </aside>
  );
}
