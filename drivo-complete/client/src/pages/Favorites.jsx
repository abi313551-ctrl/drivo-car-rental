import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useCars } from '../context/CarContext.jsx';
import CarCard from '../components/CarCard.jsx';

export default function Favorites() {
  const { favoriteCars, clearFavorites } = useCars();

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="heading">Your favorites</h1>
          <p className="mt-2 text-neutral-600">Saved in this browser only.</p>
        </div>
        {favoriteCars.length > 0 && <button className="btn-outline" onClick={clearFavorites}>Remove all</button>}
      </div>

      {favoriteCars.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-3xl border border-dashed border-neutral-300 py-20 text-center">
          <Heart size={32} className="text-neutral-400" />
          <h2 className="mt-3 text-lg font-bold">No favorites yet</h2>
          <p className="mt-1 text-sm text-neutral-600">Tap the heart on any car to save it here.</p>
          <Link to="/cars" className="btn-dark mt-5">Browse cars</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteCars.map((c) => <CarCard key={c.id} car={c} />)}
        </div>
      )}
    </div>
  );
}
