import { formatINR } from '../utils/pricing.js';

function Select({ id, label, value, onChange, options, format = (o) => o }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-neutral-600">{label}</label>
      <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{format(o)}</option>)}
      </select>
    </div>
  );
}

export default function FilterSidebar({ filters, options, onChange, onClear, activeCount }) {
  const max = filters.maxPrice ?? options.ceiling;
  return (
    <aside className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-5" aria-label="Filters">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Filters</h2>
        <button onClick={onClear} disabled={!activeCount} className="text-sm font-semibold text-accent disabled:text-neutral-400">Clear all</button>
      </div>
      <Select id="f-location" label="Location" value={filters.location} onChange={(v) => onChange('location', v)} options={options.locations} />
      <Select id="f-category" label="Category" value={filters.category} onChange={(v) => onChange('category', v)} options={options.categories} />
      <Select id="f-fuel" label="Fuel type" value={filters.fuel} onChange={(v) => onChange('fuel', v)} options={options.fuels} />
      <Select id="f-trans" label="Transmission" value={filters.transmission} onChange={(v) => onChange('transmission', v)} options={options.transmissions} />
      <Select id="f-seats" label="Seating capacity" value={filters.seats} onChange={(v) => onChange('seats', v)} options={options.seats.map(String)} format={(o) => `${o} seats`} />
      <div>
        <label htmlFor="f-price" className="mb-1 block text-xs font-semibold text-neutral-600">Max price per day: {formatINR(max)}</label>
        <input id="f-price" type="range" min="1000" max={options.ceiling} step="500" value={max} onChange={(e) => onChange('maxPrice', Number(e.target.value) >= options.ceiling ? null : Number(e.target.value))} className="w-full accent-accent" />
      </div>
    </aside>
  );
}
