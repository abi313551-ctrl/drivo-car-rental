import { Link } from 'react-router-dom';
import { Heart, Star, Fuel, Settings2, Users, ArrowLeftRight, CheckCircle2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatINR } from '../utils/pricing.js';
import { useCars } from '../context/CarContext.jsx';
import { useBookings } from '../context/BookingContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import CarImage from './CarImage.jsx';

// `query` is an optional "?pickup=..&start=.." string carried from search to details/booking.
export default function CarCard({ car, query = '' }) {
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite, isInCompare, toggleCompare } = useCars();
  const { isBookedNow, findConflict } = useBookings();
  const fav = isFavorite(car.id);
  const compared = isInCompare(car.id);
  const bookedNow = isBookedNow(car.id);
  const bookQuery = query ? `&${query.slice(1)}` : '';
  const carImage = car.image || (Array.isArray(car.images) && car.images[0]) || '';

  // Extract start and end from query string to detect date conflicts
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  const start = params.get('start');
  const end = params.get('end');
  const hasDates = Boolean(start && end);
  const conflict = car.periodConflict || (hasDates ? findConflict(car.id, start, end) : null);
  const isPeriodConflict = Boolean(hasDates && conflict);
  const isAvailable = Boolean(car.available && !bookedNow && !isPeriodConflict);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Vehicle Photography Area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <Link to={`/cars/${car.id}${query}`} className="block h-full w-full">
          <CarImage
            src={carImage}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Top-Left Wishlist Heart Button (Reference Image) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(car.id);
          }}
          aria-pressed={fav}
          aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-white hover:scale-110 z-10"
        >
          <Heart size={15} className={fav ? 'fill-red-500 text-red-500' : 'text-slate-600'} />
        </button>

        {/* Top-Right Category Badge (Reference Image) */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleCompare(car.id);
            }}
            aria-pressed={compared}
            title={compared ? 'Remove from comparison' : 'Compare this car'}
            className={`grid h-8 w-8 place-items-center rounded-full transition-all duration-200 shadow-sm backdrop-blur-md ${
              compared
                ? 'bg-[#0B1528] text-white'
                : 'bg-white/90 text-slate-600 hover:bg-white'
            }`}
          >
            <ArrowLeftRight size={13} />
          </button>
          <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-md">
            {car.category}
          </span>
        </div>

        {/* Availability Status Badge if not available */}
        {(!car.available || isPeriodConflict || bookedNow) && (
          <div className="absolute bottom-2.5 left-3 z-10">
            {!car.available ? (
              <span className="rounded-full bg-red-600/90 text-white px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-md">
                Unavailable
              </span>
            ) : isPeriodConflict ? (
              <span className="rounded-full bg-amber-600/90 text-white px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-md">
                Booked for Dates
              </span>
            ) : (
              <span className="rounded-full bg-slate-800/90 text-white px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-md">
                On Rental
              </span>
            )}
          </div>
        )}
      </div>

      {/* Vehicle Details Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to={`/cars/${car.id}${query}`}>
              <h3 className="font-display text-base font-bold text-[#0B1528] group-hover:text-blue-900 transition">
                {car.brand} {car.model}
              </h3>
            </Link>
            <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="font-semibold text-blue-900">{car.location} Hub</span>
              <span>&middot;</span>
              <span>{car.year}</span>
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-[#0B1528] bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md shrink-0">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {car.rating}
          </span>
        </div>

        {/* Exclusive Hub Tag */}
        <div className="mt-2 text-[10px] font-semibold text-slate-500 bg-slate-50/80 px-2 py-1 rounded-md border border-slate-150 flex items-center gap-1.5">
          <MapPin size={10} className="text-blue-700 shrink-0" />
          <span className="truncate">Available exclusively at {car.location} (Kanniyakumari Dist.)</span>
        </div>

        {/* Specifications Matrix Row (Gearbox, Seats, Fuel) */}
        <div className="mt-3.5 flex items-center gap-4 text-xs text-slate-500 py-2 border-y border-slate-100">
          <span className="flex items-center gap-1.5 truncate">
            <Settings2 size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">{car.transmission}</span>
          </span>
          <span className="flex items-center gap-1.5 truncate">
            <Users size={13} className="text-slate-400 shrink-0" />
            <span>{car.seats} Seats</span>
          </span>
          <span className="flex items-center gap-1.5 truncate">
            <Fuel size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">{car.fuel}</span>
          </span>
        </div>

        {/* Pricing & Booking Row */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Daily Rate</p>
            <p className="font-display text-lg font-black text-[#0B1528] leading-tight">
              {formatINR(car.pricePerDay)}
              <span className="text-xs font-normal text-slate-500 font-sans"> /day</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to={`/cars/${car.id}${query}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#0A142F] hover:border-slate-300 transition-all cursor-pointer"
            >
              View Details
            </Link>
            {isAvailable ? (
              <Link
                to={isAuthenticated ? `/booking?car=${car.id}${bookQuery}` : `/login?redirect=${encodeURIComponent(`/booking?car=${car.id}${bookQuery}`)}`}
                state={{ from: `/booking?car=${car.id}${bookQuery}` }}
                onClick={() => {
                  if (!isAuthenticated) {
                    toast('Please log in or register to complete your reservation.', { icon: '🔐' });
                  }
                }}
                className="inline-flex items-center justify-center rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-3.5 py-2 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                Book Now
              </Link>
            ) : isPeriodConflict ? (
              <span
                className="inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 px-3 py-2 text-xs font-semibold cursor-not-allowed"
                title="Car is already booked for these dates"
              >
                Reserved
              </span>
            ) : (
              <span
                className="inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 px-3 py-2 text-xs font-semibold cursor-not-allowed"
              >
                Unavailable
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
