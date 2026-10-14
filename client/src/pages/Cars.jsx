import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, SearchX, AlertTriangle, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
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
  }, [params, options.categories, options.locations]);

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

  useEffect(() => { const t = setTimeout(() => setLoading(false), 250); return () => clearTimeout(t); }, []);
  useEffect(() => { setVisible(PAGE_SIZE); }, [filters, sort]);

  const setFilter = (key, value) => {
    setFilters((f) => {
      const next = { ...f, [key]: value };
      const newParams = new URLSearchParams(params);
      if (value) {
        newParams.set(key === 'location' ? 'pickup' : key, value);
      } else {
        newParams.delete(key === 'location' ? 'pickup' : key);
      }
      setParams(newParams, { replace: true });
      return next;
    });
  };

  const clearAll = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setDates({ pickup: '', start: '', end: '' });
    setParams(new URLSearchParams(), { replace: true });
  };

  const results = useMemo(() => {
    const f = filterCars(cars, filters);
    return sortCars(f, sort);
  }, [cars, filters, sort]);

  const shown = results.slice(0, visible);
  const activeCount = activeFilterCount(filters);
  const hasActivePeriod = Boolean(dates.start && dates.end);
  const availableCount = results.filter((c) => c.available && !c.isPeriodConflict && c.isAvailableForPeriod !== false).length;

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-[#0F172A] py-10">
      <div className="container-x">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1.5">
              OFFICIAL INVENTORY
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-black text-[#0A142F] tracking-tight">
              Fleet Catalogue
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              {cars.length} verified vehicles available for immediate dispatch across {options.locations.length} operational hubs.
            </p>
          </div>
        </div>

        {/* Real-time Rental Period & Availability Bar */}
        <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1 min-w-[180px]">
              <label htmlFor="cars-pickup-city" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <MapPin size={14} className="text-[#0A142F]" /> Hub Location
              </label>
              <select
                id="cars-pickup-city"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition cursor-pointer"
                value={dates.pickup}
                onChange={(e) => handleDateChange('pickup', e.target.value)}
              >
                <option value="">All Locations</option>
                {options.locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label htmlFor="cars-start-date" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Calendar size={14} className="text-[#0A142F]" /> Pickup Schedule
              </label>
              <input
                id="cars-start-date"
                type="datetime-local"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition cursor-pointer"
                min={now}
                value={dates.start}
                onChange={(e) => handleDateChange('start', e.target.value)}
              >
              </input>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label htmlFor="cars-end-date" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Clock size={14} className="text-[#0A142F]" /> Return Schedule
              </label>
              <input
                id="cars-end-date"
                type="datetime-local"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition cursor-pointer"
                min={dates.start || now}
                value={dates.end}
                onChange={(e) => handleDateChange('end', e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setFilter('availableOnly', !filters.availableOnly)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                  filters.availableOnly
                    ? 'border-[#0A142F] bg-[#0A142F] text-white shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle size={14} className={filters.availableOnly ? 'text-white' : 'text-slate-400'} />
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
                  className="text-xs font-bold text-slate-500 hover:text-[#0A142F] hover:underline px-2 py-2 cursor-pointer"
                >
                  Reset Schedule
                </button>
              )}
            </div>
          </div>

          {hasActivePeriod && (
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-900 bg-blue-50/80 rounded-xl px-3.5 py-2 border border-blue-100">
              <CheckCircle size={14} className="shrink-0 text-blue-700" />
              <span>Live availability check for {fmtDate(dates.start)} to {fmtDate(dates.end)}: {availableCount} of {results.length} cars ready for dispatch.</span>
            </div>
          )}
        </div>

        {/* Search & Sort Controls */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label htmlFor="car-search" className="sr-only">Search by brand or model</label>
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="car-search"
              type="search"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold text-[#0F172A] placeholder-slate-400 focus:border-[#0A142F] focus:outline-none shadow-2xs"
              placeholder="Search by brand or model (e.g. BMW, Mercedes, Creta, Swift)..."
              value={filters.q}
              onChange={(e) => setFilter('q', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="sort" className="sr-only">Sort by</label>
            <select
              id="sort"
              className="w-full sm:w-52 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:outline-none shadow-2xs cursor-pointer"
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
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 lg:hidden shadow-2xs cursor-pointer"
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
              <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                <AlertTriangle size={32} className="text-slate-400" />
                <h2 className="mt-3 font-display text-lg font-bold text-[#0A142F]">Fleet data unreachable</h2>
                <p className="mt-1 text-xs text-slate-500">Please refresh the connection to retry.</p>
                <button className="btn-primary mt-4 text-xs" onClick={() => window.location.reload()}>Refresh</button>
              </div>
            ) : !results.length ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                <SearchX size={32} className="text-slate-400" />
                <h2 className="mt-3 font-display text-lg font-bold text-[#0A142F]">No vehicles match your criteria</h2>
                <p className="mt-1 text-xs text-slate-500">Try loosening your filters or clearing search criteria.</p>
                <button className="btn-primary mt-4 text-xs" onClick={clearAll}>Reset All Filters</button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <p>Showing {shown.length} of {results.length} vehicles</p>
                  {activeCount > 0 && (
                    <span className="font-bold text-[#0A142F]">{activeCount} filter(s) active</span>
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
                      className="rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-8 py-3.5 text-xs font-bold tracking-wider uppercase transition shadow-sm cursor-pointer"
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
    </div>
  );
}
