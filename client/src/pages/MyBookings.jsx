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
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-[#F5F7FA]">Reservation History</h1>
          <p className="mt-1 text-sm text-[#C6CDD5]">
            Telemetry records, dispatch itineraries, and tax invoices for your Drivo reservations.
          </p>
        </div>
        <Link to="/cars" className="btn-primary text-xs">Reserve Another Vehicle</Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {['All', 'Confirmed', 'Cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-full px-4 py-2 font-mono text-xs font-semibold transition ${
              filter === tab
                ? 'bg-[#75CFFF] text-[#111318] shadow-md shadow-[#75CFFF]/15'
                : 'bg-[#1B2028] text-[#C6CDD5] hover:bg-white/10 border border-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-3xl border border-dashed border-white/15 bg-[#161A22] py-20 text-center p-8">
          <Car size={36} className="text-neutral-500" />
          <h2 className="mt-3 text-lg font-bold text-[#F5F7FA]">No reservations found</h2>
          <p className="mt-1 text-sm text-[#C6CDD5]">
            {filter === 'All' ? 'You have not reserved any vehicles yet.' : `No ${filter.toLowerCase()} reservations recorded.`}
          </p>
          <Link to="/cars" className="btn-primary mt-5">Explore Available Fleet</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((b) => {
            const canCancel = isCancellable(b);
            return (
              <article key={b.ref} className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-6 shadow-xl transition hover:border-[#75CFFF]/40">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-4">
                    <CarImage
                      src={b.car?.image}
                      alt={`${b.car?.brand} ${b.car?.model}`}
                      className="h-24 w-36 shrink-0 rounded-2xl object-cover bg-neutral-900 border border-white/5"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-[#75CFFF]">{b.ref}</span>
                        <StatusBadge status={b.status} />
                        <StatusBadge status={b.paymentStatus} />
                      </div>
                      <h2 className="mt-1.5 text-lg font-black text-[#F5F7FA]">
                        {b.car?.brand} {b.car?.model} <span className="font-mono text-xs text-[#C6CDD5] font-normal">({b.car?.year})</span>
                      </h2>
                      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#C6CDD5]">
                        <span className="flex items-center gap-1.5"><MapPin size={13} className="text-[#75CFFF]" /> {b.pickup} → {b.dropoff}</span>
                        <span className="flex items-center gap-1.5 font-mono"><Calendar size={13} className="text-[#75CFFF]" /> {fmt(b.start)} to {fmt(b.end)}</span>
                      </p>
                      <p className="mt-2 text-xs text-[#C6CDD5]/80">
                        Lead Driver: <strong className="text-[#F5F7FA]">{b.customer?.fullName}</strong> ({b.customer?.email})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start justify-between gap-3 border-t border-white/5 pt-3 md:items-end md:border-t-0 md:pt-0">
                    <div className="md:text-right">
                      <p className="font-mono text-xs text-[#C6CDD5]">{b.pricing?.days || 1} day duration total</p>
                      <p className="font-mono text-2xl font-black text-[#75CFFF]">{formatINR(b.pricing?.total)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link to={`/booking/confirmation/${b.ref}`} className="btn-outline px-3.5 py-2 text-xs text-[#C6CDD5]">
                        <Eye size={14} /> Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptRef(b.ref)}
                        className="btn-outline px-3.5 py-2 text-xs flex items-center gap-1 text-[#C6CDD5]"
                      >
                        <FileText size={14} /> Tax Invoice
                      </button>
                      {b.status === 'Confirmed' && b.paymentStatus !== 'Paid' && (
                        <Link to={`/payment?ref=${b.ref}`} className="btn-primary px-3.5 py-2 text-xs">
                          <CreditCard size={14} /> Pay Now
                        </Link>
                      )}
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => handleCancel(b.ref)}
                          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition flex items-center gap-1"
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
  );
}
