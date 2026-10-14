import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, SearchX, AlertTriangle } from 'lucide-react';
import { useCars } from '../context/CarContext.jsx';
import CarCard from '../components/CarCard.jsx';
import FilterSidebar from '../components/FilterSidebar.jsx';
import Loading from '../components/Loading.jsx';
import { DEFAULT_FILTERS, filterCars, sortCars, activeFilterCount } from '../utils/carFilters.js';

const PAGE_SIZE = 6;
const uniq = (list, key) => [...new Set(list.map((c) => c[key]))].sort();
const fmtDate = (s) => (s && !Number.isNaN(new Date(s).getTime()) ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');

export default function Cars() {
  const { cars } = useCars();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState('popularity');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const options = useMemo(() => ({
    categories: uniq(cars, 'category'),
    fuels: uniq(cars, 'fuel'),
    transmissions: uniq(cars, 'transmission'),
    locations: uniq(cars, 'location'),
    seats: [...new Set(cars.map((c) => c.seats))].sort((a, b) => a - b),
    ceiling: Math.ceil(Math.max(1000, ...cars.map((c) => c.pricePerDay)) / 500) * 500,
  }), [cars]);

  // Initial filters come from the home-page search / category links.
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    q: params.get('q') || '',
    category: options.categories.includes(params.get('category')) ? params.get('category') : '',
    location: options.locations.includes(params.get('pickup')) ? params.get('pickup') : '',
  }));

  // Pickup/return details travel on to the details and booking pages.
  const criteria = useMemo(() => {
    const keep = ['pickup', 'dropoff', 'start', 'end'].filter((k) => params.get(k));
    return { pickup: params.get('pickup'), dropoff: params.get('dropoff'), start: params.get('start'), end: params.get('end'), query: keep.length ? `?${new URLSearchParams(keep.map((k) => [k, params.get(k)]))}` : '' };
  }, [params]);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  useEffect(() => { setVisible(PAGE_SIZE); }, [filters, sort]);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const clearAll = () => setFilters(DEFAULT_FILTERS);
  const activeCount = activeFilterCount(filters);

  const results = useMemo(() => sortCars(filterCars(cars, filters), sort), [cars, filters, sort]);
  const shown = results.slice(0, visible);

  return (
    <div className="container-x py-10">
      <h1 className="heading">Choose your car</h1>
      <p className="mt-2 text-neutral-600">{cars.length} cars across {options.locations.length} cities. Prices are per day.</p>

      {(criteria.pickup || criteria.start) && (
        <p className="mt-4 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-ink">
          Your search: {criteria.pickup && <strong>{criteria.pickup}</strong>}
          {criteria.dropoff && <> to <strong>{criteria.dropoff}</strong></>}
          {criteria.start && criteria.end && <>, {fmtDate(criteria.start)} to {fmtDate(criteria.end)}</>}.
          {filters.location ? ' Showing cars at the pickup city.' : ' No cars are listed in that pickup city yet, so all cities are shown.'}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="car-search" className="sr-only">Search by brand or model</label>
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input id="car-search" type="search" className="field pl-10" placeholder="Search by brand or model" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} />
        </div>
        <div>
          <label htmlFor="sort" className="sr-only">Sort by</label>
          <select id="sort" className="field sm:w-52" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="popularity">Most popular</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Highest rated</option>
          </select>
        </div>
        <button className="btn-outline lg:hidden" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
          <SlidersHorizontal size={16} /> Filters{activeCount ? ` (${activeCount})` : ''}
        </button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <FilterSidebar filters={filters} options={options} onChange={setFilter} onClear={clearAll} activeCount={activeCount} />
        </div>

        <section aria-live="polite">
          {loading ? <Loading /> : !cars.length ? (
            <div className="grid place-items-center rounded-3xl border border-dashed border-neutral-300 py-16 text-center">
              <AlertTriangle size={30} className="text-neutral-400" />
              <h2 className="mt-3 text-lg font-bold">Cars could not be loaded</h2>
              <p className="mt-1 text-sm text-neutral-600">Refresh the page to try again.</p>
              <button className="btn-dark mt-4" onClick={() => window.location.reload()}>Refresh</button>
            </div>
          ) : !results.length ? (
            <div className="grid place-items-center rounded-3xl border border-dashed border-neutral-300 py-16 text-center">
              <SearchX size={30} className="text-neutral-400" />
              <h2 className="mt-3 text-lg font-bold">No cars match these filters</h2>
              <p className="mt-1 text-sm text-neutral-600">Try a different search or remove a filter.</p>
              <button className="btn-dark mt-4" onClick={clearAll}>Clear all filters</button>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-neutral-600">Showing {shown.length} of {results.length} cars</p>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((c) => <CarCard key={c.id} car={c} query={criteria.query} />)}
              </div>
              {visible < results.length && (
                <div className="mt-10 text-center"><button className="btn-dark" onClick={() => setVisible((v) => v + PAGE_SIZE)}>Load more cars</button></div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
