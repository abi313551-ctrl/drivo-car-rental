import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, SearchX, AlertTriangle, Calendar, MapPin, CheckCircle, Clock, Zap } from 'lucide-react';
import { useCars } from '../context/CarContext.jsx';
import CarCard from '../components/CarCard.jsx';
import FilterSidebar from '../components/FilterSidebar.jsx';
import Loading from '../components/Loading.jsx';
import { DEFAULT_FILTERS, filterCars, sortCars, activeFilterCount } from '../utils/carFilters.js';
import { toLocalInput } from '../utils/pricing.js';

const PAGE_SIZE = 12;
const uniq = (list, key) => [...new Set(list.map((c) => c[key]))].sort();
const fmtDate = (s) => (s && !Number.isNaN(new Date(s).getTime()) ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');

export default function Cars() {
  const { cars } = useCars();
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState('popularity');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const now = toLocalInput(new Date());

  // Period state synced with URL search params
  const [dates, setDates] = useState({
    pickup: params.get('pickup') || '',
    start: params.get('start') || '',
    end: params.get('end') || '',
  });

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
    availableOnly: params.get('availableOnly') === 'true',
  }));

  // Sync state if params change from external links
  useEffect(() => {
    setDates({
      pickup: params.get('pickup') || '',
      start: params.get('start') || '',
      end: params.get('end') || '',
    });
    setFilters((prev) => ({
      ...prev,
      q: params.get('q') ?? prev.q,
      category: params.get('category') ?? prev.category,
      location: params.get('pickup') ?? prev.location,
      availableOnly: params.get('availableOnly') === 'true' ? true : prev.availableOnly,
    }));
  }, [params]);

  // Update query string and dates together
  const handleDateChange = (field, value) => {
    const nextDates = { ...dates, [field]: value };
    setDates(nextDates);
    const newParams = new URLSearchParams(params);
    if (value) {
      newParams.set(field, value);
    } else {
      newParams.delete(field);
    }
    if (field === 'pickup') {
      setFilter('location', value);
    }
    setParams(newParams, { replace: true });
  };

  // Pickup/return details travel on to the details and booking pages.
  const criteria = useMemo(() => {
    const keep = ['pickup', 'dropoff', 'start', 'end'].filter((k) => params.get(k));
    return {
      pickup: params.get('pickup'),
      dropoff: params.get('dropoff'),
      start: params.get('start'),
      end: params.get('end'),
      query: keep.length ? `?${new URLSearchParams(keep.map((k) => [k, params.get(k)]))}` : ''
    };
  }, [params]);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 300); return () => clearTimeout(t); }, []);
  useEffect(() => { setVisible(PAGE_SIZE); }, [filters, sort]);

  const setFilter = (key, value) => {
    setFilters((f) => {
      const next = { ...f, [key]: value };
      const newParams = new URLSearchParams(params);
      if (key === 'availableOnly') {
        if (value) newParams.set('availableOnly', 'true');
        else newParams.delete('availableOnly');
        setParams(newParams, { replace: true });
      }
      return next;
    });
  };
  const clearAll = () => setFilters(DEFAULT_FILTERS);
  const activeCount = activeFilterCount(filters);

  const results = useMemo(() => sortCars(filterCars(cars, filters), sort), [cars, filters, sort]);
  const shown = results.slice(0, visible);

  const hasActivePeriod = Boolean(dates.start && dates.end);
  const availableCount = results.filter((c) => c.available && !c.isPeriodConflict && c.isAvailableForPeriod !== false).length;

  return (
    <div className="container-x py-10 text-[#F5F7FA]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#75CFFF]/30 bg-[#75CFFF]/10 px-3 py-1 text-[11px] font-mono font-bold tracking-wider text-[#75CFFF] uppercase mb-2">
            <Zap size={11} className="fill-[#75CFFF]" /> 2027 Certified Inventory
          </span>
          <h1 className="heading">Explore Fleet Catalogue</h1>
          <p className="mt-2 text-xs sm:text-sm text-[#C6CDD5]/80">
            {cars.length} vehicles ready for immediate dispatch across {options.locations.length} operational hubs.
          </p>
        </div>
      </div>

      {/* Real-time Rental Period & Availability Bar */}
      <div className="mt-8 rounded-2xl border border-[rgba(198,205,213,0.12)] bg-[#1B2028] p-5 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1 min-w-[180px]">
            <label htmlFor="cars-pickup-city" className="mb-1.5 flex items-center gap-1.5 text-xs font-mono font-medium tracking-wider text-[#C6CDD5]">
              <MapPin size={14} className="text-[#75CFFF]" /> Hub Location
            </label>
            <select
              id="cars-pickup-city"
              className="field text-xs font-semibold text-[#F5F7FA] bg-[#111318]"
              value={dates.pickup}
              onChange={(e) => handleDateChange('pickup', e.target.value)}
            >
              <option value="" className="bg-[#111318] text-[#C6CDD5]">All Locations</option>
              {options.locations.map((loc) => (
                <option key={loc} value={loc} className="bg-[#111318] text-[#F5F7FA]">{loc}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label htmlFor="cars-start-date" className="mb-1.5 flex items-center gap-1.5 text-xs font-mono font-medium tracking-wider text-[#C6CDD5]">
              <Calendar size={14} className="text-[#75CFFF]" /> Pickup Window
            </label>
            <input
              id="cars-start-date"
              type="datetime-local"
              className="field text-xs font-medium text-[#F5F7FA] bg-[#111318]"
              min={now}
              value={dates.start}
              onChange={(e) => handleDateChange('start', e.target.value)}
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label htmlFor="cars-end-date" className="mb-1.5 flex items-center gap-1.5 text-xs font-mono font-medium tracking-wider text-[#C6CDD5]">
              <Clock size={14} className="text-[#75CFFF]" /> Return Window
            </label>
            <input
              id="cars-end-date"
              type="datetime-local"
              className="field text-xs font-medium text-[#F5F7FA] bg-[#111318]"
              min={dates.start || now}
              value={dates.end}
              onChange={(e) => handleDateChange('end', e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setFilter('availableOnly', !filters.availableOnly)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                filters.availableOnly
                  ? 'border-[#75CFFF] bg-[#75CFFF]/15 text-[#75CFFF] shadow-sm'
                  : 'border-[rgba(198,205,213,0.18)] bg-[#111318] text-[#C6CDD5] hover:text-[#F5F7FA]'
              }`}
            >
              <CheckCircle size={14} className={filters.availableOnly ? 'text-[#75CFFF]' : 'text-[#C6CDD5]/50'} />
              Available ({availableCount})
            </button>

            {(dates.start || dates.end || dates.pickup) && (
              <button
                type="button"
                onClick={() => {
                  setDates({ pickup: '', start: '', end: '' });
                  const newParams = new URLSearchParams(params);
                  newParams.delete('pickup');
                  newParams.delete('start');
                  newParams.delete('end');
                  setParams(newParams, { replace: true });
                  setFilter('location', '');
                }}
                className="text-xs font-mono font-semibold text-[#75CFFF] hover:underline px-2 py-2"
              >
                Reset Dates
              </button>
            )}
          </div>
        </div>

        {hasActivePeriod && (
          <div className="mt-3 flex items-center gap-2 text-xs font-mono text-[#75CFFF] bg-[#75CFFF]/10 rounded-xl px-3.5 py-2 border border-[#75CFFF]/25">
            <CheckCircle size={14} className="shrink-0 text-[#75CFFF]" />
            <span>Live check for {fmtDate(dates.start)} to {fmtDate(dates.end)}: {availableCount} of {results.length} cars ready to book.</span>
          </div>
        )}
      </div>

      {/* Search & Sort Controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="car-search" className="sr-only">Search by brand or model</label>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C6CDD5]/50" />
          <input
            id="car-search"
            type="search"
            className="field pl-10 text-xs bg-[#161A22]"
            placeholder="Search by brand or model (e.g. BMW, Mercedes, Creta, Swift)..."
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="sort" className="sr-only">Sort by</label>
          <select
            id="sort"
            className="field sm:w-52 text-xs font-semibold bg-[#161A22] text-[#F5F7FA]"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="popularity">Most popular</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Highest rated</option>
          </select>
        </div>
        <button
          className="btn-outline lg:hidden text-xs"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={15} /> Filters{activeCount ? ` (${activeCount})` : ''}
        </button>
      </div>

      {/* Main Grid & Filters Sidebar */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <FilterSidebar
            filters={filters}
            options={options}
            onChange={setFilter}
            onClear={clearAll}
            activeCount={activeCount}
          />
        </div>

        <section aria-live="polite">
          {loading ? (
            <Loading />
          ) : !cars.length ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-[rgba(198,205,213,0.18)] bg-[#161A22] py-16 text-center">
              <AlertTriangle size={32} className="text-[#C6CDD5]/40" />
              <h2 className="mt-3 font-display text-lg font-bold text-[#F5F7FA]">Fleet data unreachable</h2>
              <p className="mt-1 text-xs text-[#C6CDD5]/70">Please refresh the connection to retry.</p>
              <button className="btn-primary mt-4 text-xs" onClick={() => window.location.reload()}>Refresh</button>
            </div>
          ) : !results.length ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-[rgba(198,205,213,0.18)] bg-[#161A22] py-16 text-center">
              <SearchX size={32} className="text-[#C6CDD5]/40" />
              <h2 className="mt-3 font-display text-lg font-bold text-[#F5F7FA]">No vehicles match your criteria</h2>
              <p className="mt-1 text-xs text-[#C6CDD5]/70">Try loosening your filters or clearing search criteria.</p>
              <button className="btn-primary mt-4 text-xs" onClick={clearAll}>Reset All Filters</button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between text-xs text-[#C6CDD5]/70 font-mono">
                <p>Showing {shown.length} of {results.length} vehicles</p>
                {activeCount > 0 && (
                  <span className="text-[#75CFFF]">{activeCount} filter(s) active</span>
                )}
              </div>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((c) => (
                  <CarCard key={c.id} car={c} query={criteria.query} />
                ))}
              </div>
              {visible < results.length && (
                <div className="mt-12 text-center">
                  <button
                    className="btn-dark text-xs font-mono font-bold tracking-wider px-8 py-3"
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  >
                    Load More Vehicles ({results.length - visible} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
