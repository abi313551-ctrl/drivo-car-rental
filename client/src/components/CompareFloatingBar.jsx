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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(198,205,213,0.18)] bg-[#1B2028]/95 px-4 py-2.5 text-[#F5F7FA] shadow-2xl backdrop-blur-2xl">
        {/* Car slots */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#75CFFF] mr-1">
            <ArrowLeftRight size={14} />
            <span>Dock</span>
          </div>

          {compareCars.map((car) => {
            const carImg = car.image || (Array.isArray(car.images) && car.images[0]) || '';
            return (
              <div
                key={car.id}
                className="group relative flex items-center gap-2 rounded-xl bg-[#161A22] px-2 py-1 pr-2.5 border border-[rgba(198,205,213,0.12)] text-xs text-[#F5F7FA]"
              >
                <div className="h-7 w-10 overflow-hidden rounded bg-[#111318] shrink-0">
                  <CarImage src={carImg} alt={car.model} className="h-full w-full object-cover" />
                </div>
                <span className="max-w-[70px] sm:max-w-[100px] truncate font-semibold font-display">
                  {car.brand} {car.model}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCompare(car.id)}
                  aria-label={`Remove ${car.brand} ${car.model} from comparison`}
                  title="Remove from comparison"
                  className="rounded-full p-0.5 text-[#C6CDD5]/60 transition hover:bg-white/10 hover:text-white"
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
              className="hidden md:flex items-center justify-center rounded-xl border border-dashed border-[rgba(198,205,213,0.14)] px-3 py-1 text-[11px] font-mono text-[#C6CDD5]/40"
            >
              + Slot {compareCars.length + idx + 1}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={clearCompare}
            className="rounded-xl p-2 text-[#C6CDD5]/50 transition hover:bg-white/10 hover:text-red-400"
            title="Clear all cars"
            aria-label="Clear all compared cars"
          >
            <Trash2 size={15} />
          </button>

          <Link
            to="/compare"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#75CFFF] px-4 py-2 text-xs font-mono font-bold text-[#111318] transition hover:bg-[#95DBFF] shadow-lg shadow-[#75CFFF]/20"
          >
            <ArrowLeftRight size={13} />
            Compare ({compareCars.length}/3)
          </Link>
        </div>
      </div>
    </aside>
  );
}
