import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, CreditCard, XCircle, Eye, Car } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBookings } from '../context/BookingContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import CarImage from '../components/CarImage.jsx';
import { formatINR } from '../utils/pricing.js';
import { isCancellable } from '../services/bookingService.js';

const fmt = (s) => (s && !Number.isNaN(new Date(s).getTime()) ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-');

export default function MyBookings() {
  const { bookings, cancelBooking } = useBookings();
  const { user, isAdmin } = useAuth();
  const [filter, setFilter] = useState('All');

  const userBookings = useMemo(() => {
    let list = [...bookings];
    if (user && !isAdmin) {
      // Show bookings matching logged-in user's ID or email, plus browser-created bookings without a different userId
      list = list.filter(
        (b) =>
          b.userId === user.id ||
          b.customer?.email?.toLowerCase() === user.email.toLowerCase() ||
          !b.userId
      );
    }
    return list.sort((a, b) => new Date(b.createdAt || b.start) - new Date(a.createdAt || a.start));
  }, [bookings, user, isAdmin]);

  const filtered = useMemo(
    () => (filter === 'All' ? userBookings : userBookings.filter((b) => b.status === filter)),
    [userBookings, filter]
  );

  const handleCancel = async (ref) => {
    const res = await cancelBooking(ref);
    if (!res.ok) {
      toast.error(res.error || 'Could not cancel booking');
      return;
    }
    toast.success(`Booking ${ref} cancelled`);
  };

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="heading">My bookings</h1>
          <p className="mt-2 text-neutral-600">
            View your reservation history, complete pending mock payments, or cancel eligible trips.
          </p>
        </div>
        <Link to="/cars" className="btn-dark">Book another car</Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {['All', 'Confirmed', 'Cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === tab ? 'bg-ink text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-3xl border border-dashed border-neutral-300 py-20 text-center">
          <Car size={34} className="text-neutral-400" />
          <h2 className="mt-3 text-lg font-bold">No bookings found</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {filter === 'All' ? 'You have not booked any cars yet.' : `No ${filter.toLowerCase()} bookings.`}
          </p>
          <Link to="/cars" className="btn-primary mt-5">Browse available cars</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((b) => {
            const canCancel = isCancellable(b);
            return (
              <article key={b.ref} className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-card">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-4">
                    <CarImage
                      src={b.car?.image}
                      alt={`${b.car?.brand} ${b.car?.model}`}
                      className="h-24 w-36 shrink-0 rounded-2xl object-cover bg-neutral-100"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-neutral-500">{b.ref}</span>
                        <StatusBadge status={b.status} />
                        <StatusBadge status={b.paymentStatus} />
                      </div>
                      <h2 className="mt-1 text-lg font-extrabold">
                        {b.car?.brand} {b.car?.model} <span className="text-sm font-normal text-neutral-500">({b.car?.year})</span>
                      </h2>
                      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
                        <span className="flex items-center gap-1"><MapPin size={13} /> {b.pickup} → {b.dropoff}</span>
                        <span className="flex items-center gap-1"><Calendar size={13} /> {fmt(b.start)} to {fmt(b.end)}</span>
                      </p>
                      <p className="mt-2 text-xs text-neutral-500">
                        Booked by: <strong>{b.customer?.fullName}</strong> ({b.customer?.email})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start justify-between gap-3 border-t border-neutral-100 pt-3 md:items-end md:border-t-0 md:pt-0">
                    <div className="md:text-right">
                      <p className="text-xs text-neutral-500">{b.pricing?.days || 1} day rental total</p>
                      <p className="text-xl font-extrabold">{formatINR(b.pricing?.total)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link to={`/booking/confirmation/${b.ref}`} className="btn-outline px-3.5 py-2 text-xs">
                        <Eye size={14} /> Details
                      </Link>
                      {b.status === 'Confirmed' && b.paymentStatus !== 'Paid' && (
                        <Link to={`/payment?ref=${b.ref}`} className="btn-primary px-3.5 py-2 text-xs">
                          <CreditCard size={14} /> Pay now
                        </Link>
                      )}
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => handleCancel(b.ref)}
                          className="btn border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
