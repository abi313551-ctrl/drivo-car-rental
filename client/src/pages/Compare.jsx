import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  X,
  Trash2,
  Calendar,
  Check,
  AlertTriangle,
  Star,
  Users,
  Fuel,
  Settings2,
  Tag,
  Gauge,
  Plus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
  CalendarDays,
  MapPin,
  Coins,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCars } from '../context/CarContext.jsx';
import CarImage from '../components/CarImage.jsx';
import { formatINR, toLocalInput, defaultRange } from '../utils/pricing.js';
import { validateRange } from '../utils/validation.js';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Compare() {
  const {
    cars,
    compareCars,
    compareIds,
    removeFromCompare,
    addToCompare,
    clearCompare,
    setCompareList,
  } = useCars();
  const [params, setParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Highlight differences toggle
  const [highlightDiffs, setHighlightDiffs] = useState(true);

  // Quick Car Add Modal / Drawer state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalCategory, setModalCategory] = useState('');

  // Date range state for availability checking
  const [range, setRange] = useState(() => {
    const s = params.get('start');
    const e = params.get('end');
    const ok = (str) => str && !Number.isNaN(new Date(str).getTime());
    if (ok(s) && ok(e)) {
      return { start: s, end: e };
    }
    return defaultRange();
  });

  const [dateErrors, setDateErrors] = useState({});
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Sync URL query parameters on mount if ?cars=1,2,3 is supplied
  useEffect(() => {
    const carParam = params.get('cars');
    if (carParam) {
      const parsedIds = carParam
        .split(',')
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0);
      if (parsedIds.length > 0) {
        setCompareList(parsedIds);
      }
    }
  }, [params, setCompareList]);

  // Update query params when compareIds change
  useEffect(() => {
    const nextParams = new URLSearchParams(params);
    if (compareIds.length > 0) {
      nextParams.set('cars', compareIds.join(','));
    } else {
      nextParams.delete('cars');
    }
    if (range.start && range.end) {
      nextParams.set('start', range.start);
      nextParams.set('end', range.end);
    }
    setParams(nextParams, { replace: true });
  }, [compareIds, range.start, range.end]);

  // Validate dates
  useEffect(() => {
    const errors = validateRange(range.start, range.end);
    setDateErrors(errors);
  }, [range.start, range.end]);

  // Recheck real-time availability for all compared cars whenever dates or compare list change
  useEffect(() => {
    if (compareCars.length === 0) return;
    if (Object.keys(dateErrors).length > 0) {
      setAvailabilityMap({});
      return;
    }

    let isMounted = true;
    setCheckingAvailability(true);

    const checkPromises = compareCars.map(async (car) => {
      try {
        const res = await apiRequest(
          `/cars/${car.id}/availability?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`
        );
        return {
          carId: car.id,
          available: Boolean(res.available),
          reason: res.reason || null,
          conflict: res.conflict || null,
        };
      } catch (err) {
        return {
          carId: car.id,
          available: Boolean(car.available),
          reason: null,
          conflict: null,
        };
      }
    });

    Promise.all(checkPromises)
      .then((results) => {
        if (!isMounted) return;
        const newMap = {};
        results.forEach((r) => {
          newMap[r.carId] = r;
        });
        setAvailabilityMap(newMap);
      })
      .finally(() => {
        if (isMounted) setCheckingAvailability(false);
      });

    return () => {
      isMounted = false;
    };
  }, [compareCars, range.start, range.end, dateErrors]);

  const now = toLocalInput(new Date());

  // Quick Preset Handlers
  const handlePresetCompare = (categoryName) => {
    const filtered = cars.filter((c) => c.category === categoryName).slice(0, 3);
    if (filtered.length > 0) {
      setCompareList(filtered.map((c) => c.id));
      toast.success(`Loaded top 3 ${categoryName} cars into comparison`);
    }
  };

  // Difference detection helpers
  const isDiff = (extractor) => {
    if (compareCars.length < 2) return false;
    const values = compareCars.map(extractor);
    const first = JSON.stringify(values[0]);
    return values.some((v) => JSON.stringify(v) !== first);
  };

  // Best of highlight finders
  const bestPriceId = useMemo(() => {
    if (compareCars.length < 2) return null;
    let minPrice = Infinity;
    let bestId = null;
    compareCars.forEach((c) => {
      if (c.pricePerDay < minPrice) {
        minPrice = c.pricePerDay;
        bestId = c.id;
      }
    });
    return bestId;
  }, [compareCars]);

  const maxSeatsId = useMemo(() => {
    if (compareCars.length < 2) return null;
    let max = -1;
    let bestId = null;
    compareCars.forEach((c) => {
      if (c.seats > max) {
        max = c.seats;
        bestId = c.id;
      }
    });
    return bestId;
  }, [compareCars]);

  const topRatingId = useMemo(() => {
    if (compareCars.length < 2) return null;
    let max = -1;
    let bestId = null;
    compareCars.forEach((c) => {
      if (c.rating > max) {
        max = c.rating;
        bestId = c.id;
      }
    });
    return bestId;
  }, [compareCars]);

  // Aggregate all unique features from the compared cars
  const allFeatures = useMemo(() => {
    const set = new Set();
    compareCars.forEach((c) => {
      if (Array.isArray(c.features)) {
        c.features.forEach((f) => set.add(f));
      }
    });
    return Array.from(set).sort();
  }, [compareCars]);

  // Cars available for modal selection
  const availableCarsToAdd = useMemo(() => {
    return cars
      .filter((c) => !compareIds.includes(c.id))
      .filter((c) => {
        if (!modalCategory) return true;
        return c.category === modalCategory;
      })
      .filter((c) => {
        if (!modalSearch) return true;
        const q = modalSearch.toLowerCase();
        return (
          c.brand.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      });
  }, [cars, compareIds, modalCategory, modalSearch]);

  const categories = useMemo(() => [...new Set(cars.map((c) => c.category))].sort(), [cars]);

  // ==========================================
  // EMPTY STATE
  // ==========================================
  if (compareCars.length === 0) {
    return (
      <div className="container-x py-16 text-[#0A142F]">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-white text-[#1E3A8A] border border-slate-200 shadow-sm">
            <ArrowLeftRight size={36} />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-900/15 bg-blue-50/80 px-3.5 py-1 text-[11px] font-mono font-bold tracking-wider text-[#1E3A8A] uppercase mb-3">
            <Sparkles size={11} className="fill-[#1E3A8A]" /> Fleet Comparison Engine
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-[#0A142F]">No Vehicles Selected for Comparison</h1>
          <p className="mt-4 text-slate-600 leading-relaxed text-xs sm:text-sm">
            Select up to <strong className="text-[#0A142F]">3 vehicles</strong> from our luxury and performance fleet to compare rental tariffs,
            powertrains, transmission, seating capacity, amenities, and live dispatch availability side-by-side.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/cars" className="btn-primary px-8 py-3 text-xs">
              Explore Fleet Catalogue <ArrowRight size={14} />
            </Link>
          </div>

          {/* Quick preset recommendations */}
          <div className="mt-12 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm text-left">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-[#1E3A8A]" />
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-[#0A142F]">Popular Comparison Presets (1-Click)</h2>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Instantly populate the comparison dashboard with verified models from our primary vehicle classes:
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handlePresetCompare('SUV')}
                className="flex flex-col items-start p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30 transition text-left"
              >
                <span className="font-bold text-xs text-[#0A142F]">Luxury SUVs</span>
                <span className="text-[11px] text-slate-500 mt-1">Ground clearance & executive travel</span>
              </button>
              <button
                type="button"
                onClick={() => handlePresetCompare('Sedan')}
                className="flex flex-col items-start p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30 transition text-left"
              >
                <span className="font-bold text-xs text-[#0A142F]">Premium Sedans</span>
                <span className="text-[11px] text-slate-500 mt-1">High-speed highway comfort</span>
              </button>
              <button
                type="button"
                onClick={() => handlePresetCompare('Electric Vehicles')}
                className="flex flex-col items-start p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30 transition text-left"
              >
                <span className="font-bold text-xs text-[#0A142F]">Electrified Fleet</span>
                <span className="text-[11px] text-slate-500 mt-1">Instant torque & intelligent tech</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE COMPARISON MATRIX
  // ==========================================
  return (
    <div className="container-x py-10 text-[#0A142F]">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#1E3A8A] mb-1.5">
            <ArrowLeftRight size={14} />
            <span>Side-by-Side Analysis</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-[#0A142F]">Vehicle Comparison ({compareCars.length}/3)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analyze specifications, rental tariffs, and real-time database availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Highlight differences toggle */}
          <button
            type="button"
            onClick={() => setHighlightDiffs((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold border transition ${
              highlightDiffs
                ? 'bg-blue-50 text-[#1E3A8A] border-blue-900/20 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:text-[#0A142F]'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${highlightDiffs ? 'bg-[#1E3A8A] animate-ping' : 'bg-slate-300'}`}
            />
            {highlightDiffs ? 'Highlight Differences: ON' : 'Highlight Differences: OFF'}
          </button>

          {/* Add more car button (if < 3) */}
          {compareCars.length < 3 && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn-outline text-xs py-2 px-3.5 flex items-center gap-1.5 text-slate-700"
            >
              <Plus size={14} /> Add Vehicle ({3 - compareCars.length} slot left)
            </button>
          )}

          {/* Clear all */}
          <button
            type="button"
            onClick={clearCompare}
            className="btn-outline text-xs py-2 px-3 text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center gap-1.5"
            title="Clear all compared cars"
          >
            <Trash2 size={14} /> Clear All
          </button>
        </div>
      </div>

      {/* Date & Availability Filter Banner */}
      <section className="mb-8 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#0A142F]">
            <Calendar size={15} className="text-[#1E3A8A]" />
            <span>Rental Schedule & Availability Verification</span>
          </div>
          {checkingAvailability && (
            <span className="text-xs font-mono font-medium text-[#1E3A8A] animate-pulse flex items-center gap-1">
              Checking MySQL database availability...
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="cmp-start" className="mb-1 block text-xs font-bold text-[#0A142F]">
              Pickup Date & Time
            </label>
            <input
              id="cmp-start"
              type="datetime-local"
              className="field text-sm"
              min={now}
              value={range.start}
              onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
            />
            {dateErrors.start && (
              <p className="mt-1 text-xs text-rose-500 font-medium" role="alert">
                {dateErrors.start}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="cmp-end" className="mb-1 block text-xs font-bold text-[#0A142F]">
              Return Date & Time
            </label>
            <input
              id="cmp-end"
              type="datetime-local"
              className="field text-sm"
              min={range.start || now}
              value={range.end}
              onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
            />
            {dateErrors.end && (
              <p className="mt-1 text-xs text-rose-500 font-medium" role="alert">
                {dateErrors.end}
              </p>
            )}
          </div>

          <div className="flex flex-col justify-end">
            <p className="text-xs text-slate-500 leading-relaxed">
              Availability is verified live against existing confirmed and active bookings in the MySQL database.
            </p>
          </div>
        </div>
      </section>

      {/* COMPARISON MATRIX CONTAINER */}
      <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-sm">
        <table className="w-full min-w-[700px] border-collapse text-left">
          {/* Table Header: Car Cards */}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="p-5 w-1/4 align-top text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                <div className="sticky top-20">
                  <span className="block text-[#0A142F] font-heading font-black text-base mb-1">Specifications</span>
                  <span>Vehicle Architecture</span>
                </div>
              </th>

              {compareCars.map((car) => {
                const carImg = car.image || (Array.isArray(car.images) && car.images[0]) || '';
                const availInfo = availabilityMap[car.id];
                const isAvail = availInfo ? availInfo.available : Boolean(car.available);
                const bookParams = new URLSearchParams({
                  car: car.id,
                  pickup: car.location,
                  dropoff: car.location,
                  start: range.start,
                  end: range.end,
                }).toString();

                return (
                  <th key={car.id} className="p-5 w-1/4 align-top border-l border-slate-200">
                    <div className="relative flex flex-col h-full">
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeFromCompare(car.id)}
                        aria-label={`Remove ${car.brand} ${car.model} from comparison`}
                        className="absolute -top-1 -right-1 z-10 grid h-7 w-7 place-items-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 shadow-sm transition"
                      >
                        <X size={14} />
                      </button>

                      {/* Car Image */}
                      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/80 mb-3">
                        <CarImage
                          src={carImg}
                          alt={`${car.brand} ${car.model}`}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 rounded-md bg-white/90 border border-slate-200/80 px-2 py-0.5 text-[10px] font-mono font-bold text-[#1E3A8A] backdrop-blur-sm shadow-xs">
                          {car.category}
                        </span>
                      </div>

                      {/* Title & Location */}
                      <h3 className="font-heading font-black text-base leading-tight text-[#0A142F]">
                        {car.brand} {car.model}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">
                        {car.year} · {car.location}
                      </p>

                      {/* Daily Rate */}
                      <div className="mt-2.5 flex items-baseline gap-1">
                        <span className="text-lg font-mono font-extrabold text-[#0A142F]">{formatINR(car.pricePerDay)}</span>
                        <span className="text-[11px] text-slate-500 font-sans">/ day</span>
                        {bestPriceId === car.id && (
                          <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-900/15 px-2 py-0.5 text-[9px] font-mono font-bold text-[#1E3A8A]">
                            Best Value
                          </span>
                        )}
                      </div>

                      {/* Live Availability Badge */}
                      <div className="mt-3">
                        {!car.available ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200">
                            Fleet Unavailable
                          </span>
                        ) : isAvail ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            <Check size={13} /> Available for Dates
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 border border-rose-200"
                            title={availInfo?.reason || 'Booked for these dates'}
                          >
                            <AlertTriangle size={13} /> Booked for Dates
                          </span>
                        )}
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="mt-4 flex flex-col gap-2">
                        {isAvail ? (
                          <Link
                            to={isAuthenticated ? `/booking?${bookParams}` : `/login?redirect=${encodeURIComponent(`/booking?${bookParams}`)}`}
                            state={{ from: `/booking?${bookParams}` }}
                            onClick={() => {
                              if (!isAuthenticated) {
                                toast('Please log in or register to complete your reservation.', { icon: '🔐' });
                              }
                            }}
                            className="btn-primary py-2 text-center text-xs font-mono font-bold"
                          >
                            Reserve Car
                          </Link>
                        ) : (
                          <span
                            className="btn-outline py-2 text-center text-xs font-bold opacity-50 cursor-not-allowed text-slate-400 border-slate-200"
                            title="Unavailable for selected dates"
                          >
                            Unavailable
                          </span>
                        )}
                        <Link
                          to={`/cars/${car.id}?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`}
                          className="btn-outline py-2 text-center text-xs text-slate-700"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  </th>
                );
              })}

              {/* Empty placeholder slot up to 3 */}
              {Array.from({ length: 3 - compareCars.length }).map((_, idx) => (
                <th key={`empty-col-${idx}`} className="p-5 w-1/4 align-top border-l border-slate-200">
                  <div
                    onClick={() => setShowAddModal(true)}
                    className="flex flex-col items-center justify-center min-h-[300px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center hover:border-blue-300 hover:bg-blue-50/20 cursor-pointer transition"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-white border border-slate-200 text-[#1E3A8A] mb-3 shadow-xs">
                      <Plus size={20} />
                    </div>
                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#0A142F]">Add Vehicle</span>
                    <span className="text-[11px] font-mono text-slate-400 mt-1 max-w-[140px]">
                      Compare with another fleet model
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body: Categorized Specifications */}
          <tbody className="divide-y divide-neutral-200 text-sm">
            {/* --- SECTION 1: PRICING & ESSENTIALS --- */}
            <tr className="bg-neutral-100/70 font-bold text-xs uppercase tracking-wider text-neutral-600">
              <td colSpan={4} className="py-2.5 px-5">
                Pricing & Booking Terms
              </td>
            </tr>

            {/* Price Per Day */}
            <tr className={highlightDiffs && isDiff((c) => c.pricePerDay) ? 'bg-amber-50/40' : ''}>
              <td className="p-4 px-5 font-semibold text-neutral-600 flex items-center justify-between">
                <span>Daily Rental Price</span>
                {highlightDiffs && isDiff((c) => c.pricePerDay) && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Differs
                  </span>
                )}
              </td>
              {compareCars.map((car) => (
                <td key={car.id} className="p-4 border-l border-neutral-200 font-bold text-ink">
                  {formatINR(car.pricePerDay)} / day
                  {bestPriceId === car.id && (
                    <span className="block text-[11px] font-medium text-emerald-600">Best Daily Rate</span>
                  )}
                </td>
              ))}
              {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                <td key={i} className="p-4 border-l border-neutral-200 text-neutral-300">—</td>
              ))}
            </tr>

            {/* Refundable Deposit */}
            <tr className={highlightDiffs && isDiff((c) => c.deposit) ? 'bg-amber-50/40' : ''}>
              <td className="p-4 px-5 font-semibold text-neutral-600 flex items-center justify-between">
                <span>Security Deposit</span>
                {highlightDiffs && isDiff((c) => c.deposit) && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Differs
                  </span>
                )}
              </td>
              {compareCars.map((car) => (
                <td key={car.id} className="p-4 border-l border-neutral-200 text-neutral-800">
                  {car.deposit ? formatINR(car.deposit) : 'Not available'}
                  <span className="block text-[11px] text-neutral-400">100% Refundable</span>
                </td>
              ))}
              {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                <td key={i} className="p-4 border-l border-neutral-200 text-neutral-300">—</td>
              ))}
            </tr>

            {/* --- SECTION 2: VEHICLE ARCHITECTURE & PERFORMANCE --- */}
            <tr className="bg-neutral-100/70 font-bold text-xs uppercase tracking-wider text-neutral-600">
              <td colSpan={4} className="py-2.5 px-5">
                Technical Specifications & Specs
              </td>
            </tr>

            {/* Category */}
            <tr className={highlightDiffs && isDiff((c) => c.category) ? 'bg-amber-50/40' : ''}>
              <td className="p-4 px-5 font-semibold text-neutral-600 flex items-center justify-between">
                <span>Category / Body Type</span>
                {highlightDiffs && isDiff((c) => c.category) && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Differs
                  </span>
                )}
              </td>
              {compareCars.map((car) => (
                <td key={car.id} className="p-4 border-l border-neutral-200 font-semibold text-ink">
                  {car.category || 'Not available'}
                </td>
              ))}
              {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                <td key={i} className="p-4 border-l border-neutral-200 text-neutral-300">—</td>
              ))}
            </tr>

            {/* Seating Capacity */}
            <tr className={highlightDiffs && isDiff((c) => c.seats) ? 'bg-amber-50/40' : ''}>
              <td className="p-4 px-5 font-semibold text-neutral-600 flex items-center justify-between">
                <span>Seating Capacity</span>
                {highlightDiffs && isDiff((c) => c.seats) && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Differs
                  </span>
                )}
              </td>
              {compareCars.map((car) => (
                <td key={car.id} className="p-4 border-l border-neutral-200 font-semibold text-ink">
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={14} className="text-neutral-500" />
                    {car.seats ? `${car.seats} Passengers` : 'Not available'}
                  </span>
                  {maxSeatsId === car.id && (
                    <span className="block text-[11px] font-medium text-emerald-600">Most Spacious</span>
                  )}
                </td>
              ))}
              {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                <td key={i} className="p-4 border-l border-neutral-200 text-neutral-300">—</td>
              ))}
            </tr>

            {/* Transmission */}
            <tr className={highlightDiffs && isDiff((c) => c.transmission) ? 'bg-amber-50/40' : ''}>
              <td className="p-4 px-5 font-semibold text-neutral-600 flex items-center justify-between">
                <span>Transmission</span>
                {highlightDiffs && isDiff((c) => c.transmission) && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Differs
                  </span>
                )}
              </td>
              {compareCars.map((car) => (
                <td key={car.id} className="p-4 border-l border-neutral-200 font-semibold text-ink">
                  <span className="inline-flex items-center gap-1.5">
                    <Settings2 size={14} className="text-neutral-500" />
                    {car.transmission || 'Not available'}
                  </span>
                </td>
              ))}
              {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                <td key={i} className="p-4 border-l border-neutral-200 text-neutral-300">—</td>
              ))}
            </tr>

            {/* Fuel Type */}
            <tr className={highlightDiffs && isDiff((c) => c.fuel) ? 'bg-amber-50/40' : ''}>
              <td className="p-4 px-5 font-semibold text-neutral-600 flex items-center justify-between">
                <span>Fuel Type</span>
                {highlightDiffs && isDiff((c) => c.fuel) && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Differs
                  </span>
                )}
              </td>
              {compareCars.map((car) => (
                <td key={car.id} className="p-4 border-l border-neutral-200 font-semibold text-ink">
                  <span className="inline-flex items-center gap-1.5">
                    <Fuel size={14} className="text-neutral-500" />
                    {car.fuel || 'Not available'}
                  </span>
                </td>
              ))}
              {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                <td key={i} className="p-4 border-l border-neutral-200 text-neutral-300">—</td>
              ))}
            </tr>

            {/* Mileage / Range (Rule 9: Do not invent missing specifications. Display Not available when a value is missing) */}
            <tr>
              <td className="p-4 px-5 font-semibold text-neutral-600">
                <span>Mileage / Range</span>
                <span className="block text-[11px] text-neutral-400 font-normal">ARAI / Standard Range</span>
              </td>
              {compareCars.map((car) => (
                <td key={car.id} className="p-4 border-l border-neutral-200 text-neutral-500 italic">
                  Not available
                </td>
              ))}
              {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                <td key={i} className="p-4 border-l border-neutral-200 text-neutral-300">—</td>
              ))}
            </tr>

            {/* Model Year */}
            <tr className={highlightDiffs && isDiff((c) => c.year) ? 'bg-amber-50/40' : ''}>
              <td className="p-4 px-5 font-semibold text-neutral-600 flex items-center justify-between">
                <span>Model Year</span>
                {highlightDiffs && isDiff((c) => c.year) && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Differs
                  </span>
                )}
              </td>
              {compareCars.map((car) => (
                <td key={car.id} className="p-4 border-l border-neutral-200 text-neutral-800">
                  {car.year || 'Not available'}
                </td>
              ))}
              {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                <td key={i} className="p-4 border-l border-neutral-200 text-neutral-300">—</td>
              ))}
            </tr>

            {/* Hub Location */}
            <tr className={highlightDiffs && isDiff((c) => c.location) ? 'bg-amber-50/40' : ''}>
              <td className="p-4 px-5 font-semibold text-neutral-600 flex items-center justify-between">
                <span>Pickup Hub City</span>
                {highlightDiffs && isDiff((c) => c.location) && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Differs
                  </span>
                )}
              </td>
              {compareCars.map((car) => (
                <td key={car.id} className="p-4 border-l border-neutral-200 text-neutral-800">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-neutral-500" />
                    {car.location || 'Not available'}
                  </span>
                </td>
              ))}
              {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                <td key={i} className="p-4 border-l border-neutral-200 text-neutral-300">—</td>
              ))}
            </tr>

            {/* Customer Rating */}
            <tr className={highlightDiffs && isDiff((c) => c.rating) ? 'bg-amber-50/40' : ''}>
              <td className="p-4 px-5 font-semibold text-neutral-600 flex items-center justify-between">
                <span>Customer Rating</span>
                {highlightDiffs && isDiff((c) => c.rating) && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Differs
                  </span>
                )}
              </td>
              {compareCars.map((car) => (
                <td key={car.id} className="p-4 border-l border-neutral-200 font-bold text-ink">
                  <span className="inline-flex items-center gap-1">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    {car.rating || 'Not available'} / 5.0
                  </span>
                  {topRatingId === car.id && (
                    <span className="block text-[11px] font-medium text-emerald-600">Top Rated</span>
                  )}
                </td>
              ))}
              {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                <td key={i} className="p-4 border-l border-neutral-200 text-neutral-300">—</td>
              ))}
            </tr>

            {/* Popularity Index */}
            <tr className={highlightDiffs && isDiff((c) => c.popularity) ? 'bg-amber-50/40' : ''}>
              <td className="p-4 px-5 font-semibold text-neutral-600 flex items-center justify-between">
                <span>Fleet Popularity Score</span>
                {highlightDiffs && isDiff((c) => c.popularity) && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Differs
                  </span>
                )}
              </td>
              {compareCars.map((car) => (
                <td key={car.id} className="p-4 border-l border-neutral-200 text-neutral-800">
                  {car.popularity ? `${car.popularity}%` : 'Not available'}
                </td>
              ))}
              {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                <td key={i} className="p-4 border-l border-neutral-200 text-neutral-300">—</td>
              ))}
            </tr>

            {/* --- SECTION 3: FEATURES & AMENITIES MATRIX --- */}
            <tr className="bg-neutral-100/70 font-bold text-xs uppercase tracking-wider text-neutral-600">
              <td colSpan={4} className="py-2.5 px-5">
                Features & Equipment Matrix
              </td>
            </tr>

            {allFeatures.map((feat) => {
              const diff = isDiff((c) => Boolean(c.features && c.features.includes(feat)));
              return (
                <tr key={feat} className={highlightDiffs && diff ? 'bg-amber-50/40' : ''}>
                  <td className="p-3 px-5 text-xs font-medium text-neutral-700 flex items-center justify-between">
                    <span>{feat}</span>
                    {highlightDiffs && diff && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded">
                        Differs
                      </span>
                    )}
                  </td>
                  {compareCars.map((car) => {
                    const hasFeat = Array.isArray(car.features) && car.features.includes(feat);
                    return (
                      <td key={car.id} className="p-3 border-l border-neutral-200">
                        {hasFeat ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                            <Check size={14} className="text-emerald-600" /> Included
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                    );
                  })}
                  {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                    <td key={i} className="p-3 border-l border-neutral-200 text-neutral-300">—</td>
                  ))}
                </tr>
              );
            })}

            {/* --- SECTION 4: VEHICLE OVERVIEW --- */}
            <tr className="bg-neutral-100/70 font-bold text-xs uppercase tracking-wider text-neutral-600">
              <td colSpan={4} className="py-2.5 px-5">
                Overview & Description
              </td>
            </tr>
            <tr>
              <td className="p-4 px-5 font-semibold text-neutral-600">
                <span>Vehicle Summary</span>
              </td>
              {compareCars.map((car) => (
                <td key={car.id} className="p-4 border-l border-neutral-200 text-xs text-neutral-600 leading-relaxed">
                  {car.description || 'Not available'}
                </td>
              ))}
              {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                <td key={i} className="p-4 border-l border-neutral-200 text-neutral-300">—</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* QUICK ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden text-[#0A142F]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-heading text-base font-black text-[#0A142F]">Add Vehicle to Comparison</h2>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Select a car from certified inventory ({3 - compareCars.length} slot available)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="border-b border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Search by brand or model..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="field text-xs flex-1 bg-white"
              />
              <select
                value={modalCategory}
                onChange={(e) => setModalCategory(e.target.value)}
                className="field text-xs sm:w-44 bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Car List */}
            <div className="overflow-y-auto p-4 space-y-2.5 flex-1">
              {availableCarsToAdd.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="font-mono text-xs">No matching vehicles found in inventory.</p>
                </div>
              ) : (
                availableCarsToAdd.map((car) => {
                  const carImg = car.image || (Array.isArray(car.images) && car.images[0]) || '';
                  return (
                    <div
                      key={car.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 overflow-hidden rounded-xl bg-slate-100 shrink-0 border border-slate-200/80">
                          <CarImage src={carImg} alt={car.model} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-heading font-black text-xs text-[#0A142F]">
                            {car.brand} {car.model}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                            {car.category} · {car.transmission} · {car.fuel} · {car.seats} seats
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="font-mono font-bold text-xs text-[#0A142F]">{formatINR(car.pricePerDay)}</span>
                          <span className="text-[10px] text-slate-400 block">/ day</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            addToCompare(car.id);
                            if (compareCars.length + 1 >= 3) {
                              setShowAddModal(false);
                            }
                          }}
                          className="btn-primary py-1.5 px-3 text-[11px] font-mono font-bold"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 p-4 bg-white text-right">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-outline text-xs py-2 px-4 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
