import { Link } from 'react-router-dom';
import { Heart, Zap } from 'lucide-react';
import { useCars } from '../context/CarContext.jsx';
import CarCard from '../components/CarCard.jsx';

export default function Favorites() {
  const { favoriteCars, clearFavorites } = useCars();

  return (
    <div className="container-x py-10 text-[#F5F7FA]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#75CFFF]/30 bg-[#75CFFF]/10 px-3 py-1 text-[11px] font-mono font-bold tracking-wider text-[#75CFFF] uppercase mb-2">
            <Zap size={11} className="fill-[#75CFFF]" /> Saved Shortlist
          </span>
          <h1 className="heading">Your Saved Fleet</h1>
          <p className="mt-2 text-xs sm:text-sm text-[#C6CDD5]/80">
            {favoriteCars.length} vehicles bookmarked in your active browser session.
          </p>
        </div>
        {favoriteCars.length > 0 && (
          <button className="btn-outline text-xs" onClick={clearFavorites}>
            Remove All
          </button>
        )}
      </div>

      {favoriteCars.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-[rgba(198,205,213,0.18)] bg-[#161A22] py-20 text-center shadow-2xl">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#1B2028] border border-[rgba(198,205,213,0.14)] text-[#75CFFF]">
            <Heart size={24} />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-[#F5F7FA]">No Saved Vehicles Yet</h2>
          <p className="mt-1 text-xs text-[#C6CDD5]/70 max-w-sm">
            Tap the heart icon on any vehicle card across the fleet catalogue to save it for quick comparison and booking.
          </p>
          <Link to="/cars" className="btn-primary mt-6 text-xs">
            Explore Fleet
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteCars.map((c) => (
            <CarCard key={c.id} car={c} />
          ))}
        </div>
      )}
    </div>
  );
}
