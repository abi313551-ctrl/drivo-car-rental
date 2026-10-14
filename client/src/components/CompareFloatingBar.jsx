import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftRight, X, Trash2 } from 'lucide-react';
import { useCars } from '../context/CarContext.jsx';
import CarImage from './CarImage.jsx';

export default function CompareFloatingBar() {
  const { pathname } = useLocation();
  const { compareCars, removeFromCompare, clearCompare } = useCars();

  if (compareCars.length === 0 || pathname === '/compare') {
    return null;
  }

  const emptySlots = Math.max(0, 3 - compareCars.length);

  return (
    <aside
      aria-label="Vehicle comparison dock"
      className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 w-[94vw] max-w-2xl animate-entrance-1"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-2.5 text-[#0F172A] shadow-xl backdrop-blur-md">
        {/* Car slots */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0A142F] mr-1">
            <ArrowLeftRight size={14} />
            <span>Compare</span>
          </div>

          {compareCars.map((car) => {
            const carImg = car.image || (Array.isArray(car.images) && car.images[0]) || '';
            return (
              <div
                key={car.id}
                className="group relative flex items-center gap-2 rounded-xl bg-slate-50 px-2 py-1 pr-2.5 border border-slate-200 text-xs text-[#0F172A]"
              >
                <div className="h-7 w-10 overflow-hidden rounded bg-slate-200 shrink-0">
                  <CarImage src={carImg} alt={car.model} className="h-full w-full object-cover" />
                </div>
                <span className="max-w-[70px] sm:max-w-[100px] truncate font-bold text-[#0A142F]">
                  {car.brand} {car.model}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCompare(car.id)}
                  aria-label={`Remove ${car.brand} ${car.model} from comparison`}
                  title="Remove from comparison"
                  className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-black cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}

          {/* Empty slot indicators up to 3 */}
          {Array.from({ length: emptySlots }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="hidden md:flex items-center justify-center rounded-xl border border-dashed border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-400"
            >
              + Slot {compareCars.length + idx + 1}
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearCompare}
            title="Clear comparison dock"
            className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition cursor-pointer"
            aria-label="Clear all vehicles"
          >
            <Trash2 size={13} />
          </button>

          <Link
            to="/compare"
            className="flex items-center gap-1.5 rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase transition shadow-sm active:scale-95"
          >
            <span>Compare Now</span>
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-white/20 text-[9px] font-bold text-white px-1">
              {compareCars.length}
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
