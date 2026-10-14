import { Link } from 'react-router-dom';
import { Heart, Zap } from 'lucide-react';
import { useCars } from '../context/CarContext.jsx';
import CarCard from '../components/CarCard.jsx';

export default function Favorites() {
  const { favoriteCars, clearFavorites } = useCars();

  return (
    <div className="container-x py-10 text-[#0A142F]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-900/15 bg-blue-50/80 px-3.5 py-1 text-[11px] font-mono font-bold tracking-wider text-[#1E3A8A] uppercase mb-2">
            <Zap size={11} className="fill-[#1E3A8A]" /> Saved Shortlist
          </span>
          <h1 className="font-heading text-3xl font-black text-[#0A142F]">Your Saved Fleet</h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            {favoriteCars.length} vehicles bookmarked in your active browser session.
          </p>
        </div>
        {favoriteCars.length > 0 && (
          <button className="btn-outline text-xs text-slate-700 hover:text-rose-600 hover:border-rose-200" onClick={clearFavorites}>
            Remove All
          </button>
        )}
      </div>

      {favoriteCars.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center shadow-sm">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 border border-slate-200 text-[#1E3A8A]">
            <Heart size={24} />
          </div>
          <h2 className="mt-4 font-heading text-lg font-black text-[#0A142F]">No Saved Vehicles Yet</h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
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
