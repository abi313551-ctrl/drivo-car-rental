import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, CreditCard, XCircle, Eye, Car, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBookings } from '../context/BookingContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import CarImage from '../components/CarImage.jsx';
import BookingReceiptModal from '../components/BookingReceiptModal.jsx';
import { formatINR } from '../utils/pricing.js';
import { isCancellable } from '../services/bookingService.js';

const fmt = (s) => (s && !Number.isNaN(new Date(s).getTime()) ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-');

export default function MyBookings() {
  const { bookings, cancelBooking } = useBookings();
  const { user, isAdmin } = useAuth();
  const [filter, setFilter] = useState('All');
  const [selectedReceiptRef, setSelectedReceiptRef] = useState(null);

  const userBookings = useMemo(() => {
    let list = [...bookings];
    if (user && !isAdmin) {
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
    <div className="bg-[#F8F9FA] min-h-screen text-[#0F172A] py-10 sm:py-14">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1">
              RESERVATIONS
            </span>
            <h1 className="font-display text-2xl sm:text-4xl font-black text-[#0A142F]">
              Reservation History
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Telemetry records, dispatch itineraries, and tax invoices for your Drivo reservations.
            </p>
          </div>
          <Link to="/cars" className="rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition shadow-sm">
            Reserve Another Vehicle
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {['All', 'Confirmed', 'Cancelled'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer ${
                filter === tab
                  ? 'bg-[#0A142F] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center p-8">
            <Car size={36} className="text-slate-400" />
            <h2 className="mt-3 font-display text-lg font-bold text-[#0A142F]">No reservations found</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              {filter === 'All' ? 'You have not reserved any vehicles yet.' : `No ${filter.toLowerCase()} reservations recorded.`}
            </p>
            <Link to="/cars" className="btn-primary mt-5 text-xs">Explore Available Fleet</Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.map((b) => {
              const canCancel = isCancellable(b);
              return (
                <article key={b.ref} className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:shadow-md">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex gap-4 items-start">
                      <CarImage
                        src={b.car?.image}
                        alt={`${b.car?.brand} ${b.car?.model}`}
                        className="h-24 w-36 shrink-0 rounded-2xl object-cover bg-slate-100 border border-slate-200"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-[#0A142F]">
                            {b.ref}
                          </span>
                          <StatusBadge status={b.status} />
                          <StatusBadge status={b.paymentStatus} />
                        </div>
                        <h2 className="mt-1.5 font-display text-lg font-black text-[#0A142F]">
                          {b.car?.brand} {b.car?.model} <span className="text-xs text-slate-400 font-normal">({b.car?.year})</span>
                        </h2>
                        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5"><MapPin size={13} className="text-[#0A142F]" /> {b.pickup} → {b.dropoff}</span>
                          <span className="flex items-center gap-1.5 font-semibold text-slate-700"><Calendar size={13} className="text-[#0A142F]" /> {fmt(b.start)} to {fmt(b.end)}</span>
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          Lead Driver: <strong className="text-[#0A142F]">{b.customer?.fullName}</strong> ({b.customer?.email})
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-3 md:items-end md:border-t-0 md:pt-0">
                      <div className="md:text-right">
                        <p className="text-xs text-slate-400 font-medium">{b.pricing?.days || 1} day duration total</p>
                        <p className="font-display text-2xl font-black text-[#0A142F]">{formatINR(b.pricing?.total)}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link to={`/booking/confirmation/${b.ref}`} className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1">
                          <Eye size={14} /> Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptRef(b.ref)}
                          className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <FileText size={14} /> Tax Invoice
                        </button>
                        {b.status === 'Confirmed' && b.paymentStatus !== 'Paid' && (
                          <Link to={`/payment?ref=${b.ref}`} className="rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-3.5 py-2 text-xs font-bold flex items-center gap-1 shadow-xs">
                            <CreditCard size={14} /> Pay Now
                          </Link>
                        )}
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancel(b.ref)}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
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

        {selectedReceiptRef && (
          <BookingReceiptModal bookingRef={selectedReceiptRef} onClose={() => setSelectedReceiptRef(null)} />
        )}
      </div>
    </div>
  );
}
