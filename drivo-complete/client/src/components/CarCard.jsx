import { Link } from 'react-router-dom';
import { Heart, Star, Fuel, Settings2, Users } from 'lucide-react';
import { formatINR } from '../utils/pricing.js';
import { useCars } from '../context/CarContext.jsx';
import { useBookings } from '../context/BookingContext.jsx';
import CarImage from './CarImage.jsx';

// `query` is an optional "?pickup=..&start=.." string carried from search to details/booking.
export default function CarCard({ car, query = '' }) {
  const { isFavorite, toggleFavorite } = useCars();
  const { isBookedNow } = useBookings();
  const fav = isFavorite(car.id);
  const bookedNow = isBookedNow(car.id);
  const bookQuery = query ? `&${query.slice(1)}` : '';

  return (
    <article className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-card transition hover:-translate-y-1">
      <div className="relative aspect-[3/2] overflow-hidden bg-neutral-100">
        <CarImage src={car.image} alt={`${car.brand} ${car.model}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold">{car.category}</span>
        <button onClick={() => toggleFavorite(car.id)} aria-pressed={fav} aria-label={fav ? 'Remove from favorites' : 'Add to favorites'} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 transition hover:scale-110">
          <Heart size={17} className={fav ? 'fill-red-500 text-red-500' : 'text-neutral-700'} />
        </button>
        {(!car.available || bookedNow) && <span className="absolute bottom-3 left-3 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">{car.available ? 'Booked right now' : 'Unavailable'}</span>}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold leading-tight">{car.brand} {car.model}</h3>
            <p className="text-xs text-neutral-500">{car.year} · {car.location}</p>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold"><Star size={14} className="fill-amber-400 text-amber-400" />{car.rating}</span>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
          <li className="flex items-center gap-1"><Fuel size={13} />{car.fuel}</li>
          <li className="flex items-center gap-1"><Settings2 size={13} />{car.transmission}</li>
          <li className="flex items-center gap-1"><Users size={13} />{car.seats} seats</li>
        </ul>
        <p className="mt-4 text-xl font-extrabold">{formatINR(car.pricePerDay)}<span className="text-xs font-medium text-neutral-500"> / day</span></p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link to={`/cars/${car.id}${query}`} className="btn-outline">View details</Link>
          {car.available
            ? <Link to={`/booking?car=${car.id}${bookQuery}`} className="btn-dark">Book now</Link>
            : <span className="btn-dark opacity-50" aria-disabled="true">Book now</span>}
        </div>
      </div>
    </article>
  );
}
