import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, SearchX, AlertTriangle, Calendar, MapPin, CheckCircle, Clock, X, RotateCcw, RefreshCw } from 'lucide-react';
import { useCars } from '../context/CarContext.jsx';
import CarCard from '../components/CarCard.jsx';
import FilterSidebar from '../components/FilterSidebar.jsx';
import Loading from '../components/Loading.jsx';
import { DEFAULT_FILTERS, filterCars, sortCars, activeFilterCount } from '../utils/carFilters.js';
import { toLocalInput } from '../utils/pricing.js';
import { isSupportedLocation, SERVICE_NOTICE } from '../utils/locations.js';

const PAGE_SIZE = 12;
const uniq = (list, key) => [...new Set(list.map((c) => c[key]))].sort();
const fmtDate = (s) => (s && !Number.isNaN(new Date(s).getTime()) ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');

export default function Cars() {
  const { cars, loading, error, refreshCars } = useCars();
  const [params, setParams] = useSearchParams();
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
    locations: uniq(cars.filter((c) => isSupportedLocation(c.location)), 'location'),
    seats: [...new Set(cars.map((c) => c.seats))].sort((a, b) => a - b),
    ceiling: Math.ceil(Math.max(1000, ...cars.map((c) => c.pricePerDay || 5000)) / 500) * 500,
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

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const c of cars) {
      if (c.category) {
        counts[c.category] = (counts[c.category] || 0) + 1;
      }
    }
    return counts;
  }, [cars]);

  const CATEGORY_TABS = useMemo(() => {
    const core = ['All', 'SUV', 'Sedan', 'Hatchback', 'Luxury'];
    for (const cat of options.categories) {
      if (!core.includes(cat) && cat) core.push(cat);
    }
    return core;
  }, [options.categories]);

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
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block">
                OFFICIAL INVENTORY
              </span>
              <span className="rounded-full bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[10px] font-extrabold text-blue-900 tracking-wide">
                Kanniyakumari District Only
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-black text-[#0A142F] tracking-tight">
              Fleet Catalogue
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              {cars.length} verified vehicles stationed across {options.locations.length} operational hubs in Kanniyakumari district, Tamil Nadu.
            </p>
          </div>
        </div>

        {/* Real-time Rental Period & Availability Bar */}
        <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1 min-w-[180px]">
              <label htmlFor="cars-pickup-city" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <MapPin size={14} className="text-[#0A142F]" /> Kanniyakumari Hub Location
              </label>
              <select
                id="cars-pickup-city"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition cursor-pointer"
                value={dates.pickup}
                onChange={(e) => handleDateChange('pickup', e.target.value)}
              >
                <option value="">All Kanniyakumari Hubs</option>
                {options.locations.map((loc) => (
                  <option key={loc} value={loc}>{loc} Hub</option>
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

        {/* Backend Error / Offline Notice */}
        {error && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-xs text-amber-900 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
              <span>
                <strong>Notice:</strong> Using cached fleet data. Real-time API connection failed ({error}).
              </span>
            </div>
            <button
              type="button"
              onClick={() => refreshCars()}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-amber-200/60 hover:bg-amber-200 px-3.5 py-1.5 font-bold text-amber-950 transition cursor-pointer"
            >
              <RefreshCw size={12} /> Retry Connection
            </button>
          </div>
        )}

        {/* Search & Sort Controls */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label htmlFor="car-search" className="sr-only">Search by car brand or model</label>
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="car-search"
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-3 text-xs sm:text-sm font-semibold text-[#0F172A] placeholder-slate-400 focus:border-[#0A142F] focus:outline-none shadow-2xs transition"
              placeholder="Search by car brand or model (e.g. BMW, Mercedes, Creta, Swift)..."
              value={filters.q}
              onChange={(e) => setFilter('q', e.target.value)}
            />
            {filters.q && (
              <button
                type="button"
                onClick={() => setFilter('q', '')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer rounded-full hover:bg-slate-100"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div>
            <label htmlFor="sort" className="sr-only">Sort by</label>
            <select
              id="sort"
              className="w-full sm:w-56 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:outline-none shadow-2xs cursor-pointer"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="popularity">Sort: Most Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Sort: Highest Rated</option>
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

        {/* Quick Category Filter Pills */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((cat) => {
            const isAll = cat === 'All';
            const isActive = isAll ? !filters.category : filters.category === cat;
            const count = isAll ? cars.length : (categoryCounts[cat] || 0);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter('category', isAll ? '' : (isActive ? '' : cat))}
                className={`whitespace-nowrap flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0A142F] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
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
                <p className="mt-1 text-xs text-slate-500">Please check your server connection and retry.</p>
                <button className="btn-primary mt-4 text-xs" onClick={() => refreshCars()}>Retry</button>
              </div>
            ) : !results.length ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-6 text-center shadow-xs">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-2">
                  <SearchX size={28} />
                </div>
                <h2 className="mt-2 font-display text-lg font-bold text-[#0A142F]">
                  {filters.q ? `No cars match "${filters.q}"` : 'No vehicles match your selected filters'}
                </h2>
                <p className="mt-1 text-xs text-slate-500 max-w-md">
                  {filters.q
                    ? `We couldn't find any vehicle matching "${filters.q}". Try checking the spelling, or search by body type like SUV, Sedan, or Luxury.`
                    : 'Try loosening your price budget, vehicle class, or location filters to view more available cars.'}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  {filters.q && (
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      onClick={() => setFilter('q', '')}
                    >
                      Clear Search
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-xl bg-[#0A142F] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1E293B] transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    onClick={clearAll}
                  >
                    <RotateCcw size={13} /> Clear All Filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                  <p>Showing <span className="font-bold text-[#0A142F]">{shown.length}</span> of <span className="font-bold text-[#0A142F]">{results.length}</span> vehicles</p>
                  {activeCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0A142F]">{activeCount} filter(s) active</span>
                      <button
                        type="button"
                        onClick={clearAll}
                        className="inline-flex items-center gap-1 font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                      >
                        <RotateCcw size={11} /> Clear
                      </button>
                    </div>
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
