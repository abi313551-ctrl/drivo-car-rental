import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Car,
  FileText,
  XCircle,
  Eye,
  Download,
  Loader2,
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useBookings } from '../context/BookingContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import CarImage from '../components/CarImage.jsx';
import BookingDetailModal from '../components/BookingDetailModal.jsx';
import BookingReceiptModal from '../components/BookingReceiptModal.jsx';
import { formatINR, rentalDays } from '../utils/pricing.js';
import { isCancellable } from '../services/bookingService.js';
import { apiRequest, downloadInvoicePdf } from '../services/api.js';

const fmt = (s) =>
  s && !Number.isNaN(new Date(s).getTime())
    ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

export default function MyBookings() {
  const navigate = useNavigate();
  const { cancelBooking } = useBookings();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [bookingsList, setBookingsList] = useState([]);
  const [weddingBookings, setWeddingBookings] = useState([]);
  const [serviceType, setServiceType] = useState('cars'); // 'cars' | 'wedding'
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'upcoming' | 'past' | 'cancelled'
  const [selectedDetailBooking, setSelectedDetailBooking] = useState(null);
  const [selectedReceiptRef, setSelectedReceiptRef] = useState(null);
  const [downloadingPdfRef, setDownloadingPdfRef] = useState(null);
  const [cancellingRef, setCancellingRef] = useState(null);

  const fetchUserBookings = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [carRes, wedRes] = await Promise.all([
        apiRequest('/bookings/my').catch(() => ({ bookings: [] })),
        apiRequest('/decorations/bookings/my').catch(() => ({ bookings: [] })),
      ]);
      if (Array.isArray(carRes.bookings)) {
        setBookingsList(carRes.bookings);
      }
      if (Array.isArray(wedRes.bookings)) {
        setWeddingBookings(wedRes.bookings);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch your bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBookings();
  }, [isAuthenticated]);

  const handleDownloadPdf = async (ref) => {
    setDownloadingPdfRef(ref);
    try {
      await downloadInvoicePdf(ref);
      toast.success('Invoice PDF downloaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF invoice');
    } finally {
      setDownloadingPdfRef(null);
    }
  };

  const handleCancel = async (ref) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${ref}?`)) {
      return;
    }
    setCancellingRef(ref);
    try {
      const res = await cancelBooking(ref);
      if (!res.ok) {
        toast.error(res.error || 'Could not cancel booking');
        return;
      }
      toast.success(`Booking ${ref} cancelled successfully`);
      fetchUserBookings();
      setSelectedDetailBooking(null);
    } finally {
      setCancellingRef(null);
    }
  };

  // Filter categorization
  const now = new Date();

  const categorized = useMemo(() => {
    const sorted = [...bookingsList].sort(
      (a, b) => new Date(b.createdAt || b.start) - new Date(a.createdAt || a.start)
    );

    const all = sorted;
    const upcoming = sorted.filter(
      (b) => b.status !== 'Cancelled' && new Date(b.end || b.start) >= now
    );
    const past = sorted.filter(
      (b) => b.status === 'Completed' || (b.status !== 'Cancelled' && new Date(b.end || b.start) < now)
    );
    const cancelled = sorted.filter((b) => b.status === 'Cancelled');

    return { all, upcoming, past, cancelled };
  }, [bookingsList, now]);

  const currentList = categorized[filter] || categorized.all;

  if (authLoading) {
    return (
      <div className="bg-[#F8F9FA] min-h-[70vh] grid place-items-center text-[#0F172A]">
        <Loader2 size={32} className="mx-auto animate-spin text-[#0A142F]" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="bg-[#F8F9FA] min-h-[75vh] flex items-center justify-center py-16 text-[#0F172A]">
        <div className="container-x w-full max-w-md text-center rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-sm">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-[#0A142F] mx-auto">
            <Lock size={26} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-black text-[#0A142F]">Sign In Required</h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Please sign in to access your bookings, dispatch itineraries, and tax invoices.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login?from=/my-bookings"
              className="rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition shadow-sm"
            >
              Sign In
            </Link>
            <Link
              to="/register?from=/my-bookings"
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 text-xs font-bold uppercase tracking-wider transition"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const FILTER_TABS = [
    { id: 'all', label: 'All Bookings', count: categorized.all.length },
    { id: 'upcoming', label: 'Upcoming', count: categorized.upcoming.length },
    { id: 'past', label: 'Past', count: categorized.past.length },
    { id: 'cancelled', label: 'Cancelled', count: categorized.cancelled.length },
  ];

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-[#0F172A] py-10 sm:py-14">
      <div className="container-x">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1">
              RESERVATION DASHBOARD
            </span>
            <h1 className="font-display text-2xl sm:text-4xl font-black text-[#0A142F]">
              My Bookings
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Verified reservations and itineraries for {user.fullName}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchUserBookings}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Link
              to={serviceType === 'wedding' ? '/wedding-cars' : '/cars'}
              className="rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition shadow-sm"
            >
              {serviceType === 'wedding' ? 'Reserve Wedding Decor' : 'Book Another Car'}
            </Link>
          </div>
        </div>

        {/* Service Type Switcher */}
        <div className="mt-6 flex items-center gap-3 border-b border-slate-200/80 pb-4">
          <button
            type="button"
            onClick={() => { setServiceType('cars'); setFilter('all'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              serviceType === 'cars'
                ? 'bg-[#0A142F] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Car size={14} />
            <span>Self-Drive Fleet ({bookingsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setServiceType('wedding'); setFilter('all'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              serviceType === 'wedding'
                ? 'bg-[#0A142F] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sparkles size={14} className="text-rose-500" />
            <span>Wedding Car Decor ({weddingBookings.length})</span>
          </button>
        </div>

        {/* Filter Tabs for Car Rentals */}
        {serviceType === 'cars' && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {FILTER_TABS.map((t) => {
              const active = filter === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilter(t.id)}
                  className={`whitespace-nowrap flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#0A142F] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 size={32} className="mx-auto animate-spin text-[#0A142F]" />
            <p className="mt-3 text-xs font-semibold text-slate-500">Loading your verified bookings...</p>
          </div>
        ) : serviceType === 'wedding' ? (
          weddingBookings.length === 0 ? (
            <div className="mt-8 grid place-items-center rounded-3xl border border-dashed border-slate-300 bg-white py-16 px-6 text-center shadow-xs">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-500 mb-2">
                <Sparkles size={32} />
              </div>
              <h2 className="mt-2 font-display text-lg font-bold text-[#0A142F]">
                No Wedding Car Reservations Yet
              </h2>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Explore our 24 luxury car flower decoration designs across Kanniyakumari district and book for your wedding or reception.
              </p>
              <Link
                to="/wedding-cars"
                className="mt-6 rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition shadow-sm"
              >
                Explore Wedding Designs
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {weddingBookings.map((wb) => {
                const pkg = wb.package || {};
                const carItem = wb.car;
                const totalAmt = wb.pricing?.total || 0;

                return (
                  <article
                    key={wb.ref}
                    className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center min-w-0 flex-1">
                        <div className="relative aspect-[16/10] w-full sm:w-48 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/80 shrink-0">
                          <img
                            src={pkg.image || '/decorations/decor-1.jpg'}
                            alt={pkg.name || 'Wedding Car Decor'}
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80';
                            }}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute top-2 left-2 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            Wedding Floral
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              Token: {wb.ref}
                            </span>
                            <StatusBadge status={wb.status} />
                            <StatusBadge status={wb.payment_status || wb.paymentStatus || 'Pending'} />
                            <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                              {wb.drive_mode === 'with_driver' ? 'Chauffeur Fleet + Decor' : 'Decorate Own Car'}
                            </span>
                          </div>

                          <h3 className="font-display text-lg sm:text-xl font-bold text-[#0A142F] truncate">
                            {pkg.name || 'Custom Wedding Floral Decoration'}
                          </h3>
                          {carItem && (
                            <p className="text-xs font-semibold text-blue-900 mt-0.5">
                              Vehicle: {carItem.brand} {carItem.model} ({carItem.category})
                            </p>
                          )}

                          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-[#0A142F] shrink-0" />
                              <span><strong>Event Date:</strong> {wb.event_date || wb.eventDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-[#0A142F] shrink-0" />
                              <span><strong>Ready by:</strong> {wb.completion_time || wb.completionTime}</span>
                            </div>
                            <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
                              <MapPin size={13} className="text-[#0A142F] shrink-0" />
                              <span className="truncate"><strong>Venue:</strong> {wb.venue_location || wb.venueLocation} ({wb.service_city || wb.serviceCity})</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between sm:justify-start gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Tariff</p>
                          <p className="font-display text-xl sm:text-2xl font-black text-[#0A142F]">
                            {formatINR(totalAmt)}
                          </p>
                          <p className="text-[11px] text-slate-500">GST and venue setup included</p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : currentList.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-3xl border border-dashed border-slate-300 bg-white py-16 px-6 text-center shadow-xs">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400 mb-2">
              <Car size={32} />
            </div>
            <h2 className="mt-2 font-display text-lg font-bold text-[#0A142F]">
              {filter === 'all'
                ? 'No reservations yet'
                : `No ${filter} reservations found`}
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              {filter === 'all'
                ? 'You have not made any car reservations yet. Discover our verified luxury fleet and book your first drive.'
                : `There are currently no bookings classified under ${filter}.`}
            </p>
            <Link
              to="/cars"
              className="mt-6 rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition shadow-sm"
            >
              Explore Available Fleet
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {currentList.map((b) => {
              const carSnapshot = b.car || {};
              const daysCount = b.pricing?.days || rentalDays(b.start, b.end);
              const totalAmount = b.pricing?.total || 0;
              const canCancel = isCancellable(b);

              return (
                <article
                  key={b.ref}
                  className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Car Photography and Key Specs */}
                    <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center min-w-0 flex-1">
                      <div className="relative aspect-[16/10] w-full sm:w-48 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/80 shrink-0">
                        <CarImage
                          src={carSnapshot.image}
                          alt={`${carSnapshot.brand} ${carSnapshot.model}`}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute top-2 left-2 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur-md">
                          {carSnapshot.category || 'Luxury'}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            ID: #{b.id} · Ref: {b.ref}
                          </span>
                          <StatusBadge status={b.status} />
                          <StatusBadge status={b.paymentStatus} />
                          {b.paymentId && (
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                              Tx: {b.paymentId}
                            </span>
                          )}
                        </div>

                        <h3 className="font-display text-lg sm:text-xl font-bold text-[#0A142F] truncate">
                          {carSnapshot.brand} {carSnapshot.model}
                        </h3>

                        <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-[#0A142F] shrink-0" />
                            <span className="truncate"><strong>Pickup:</strong> {b.pickup}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-[#0A142F] shrink-0" />
                            <span><strong>Start:</strong> {fmt(b.start)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-[#0A142F] shrink-0" />
                            <span><strong>Duration:</strong> {daysCount} {daysCount === 1 ? 'day' : 'days'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-[#0A142F] shrink-0" />
                            <span><strong>Return:</strong> {fmt(b.end)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Pricing & Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between sm:justify-start gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Rental Cost</p>
                        <p className="font-display text-xl sm:text-2xl font-black text-[#0A142F]">
                          {formatINR(totalAmount)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatINR(carSnapshot.pricePerDay || 0)}/day · GST incl.
                        </p>
                        {b.paymentStatus === 'Paid' ? (
                          <p className="text-[11px] text-emerald-600 font-bold mt-1">
                            Paid in Full ({formatINR(b.amountPaid || totalAmount)})
                          </p>
                        ) : b.status !== 'Cancelled' ? (
                          <p className="text-[11px] text-amber-600 font-bold mt-1">
                            Amount Due: {formatINR(totalAmount)}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {b.paymentStatus !== 'Paid' && b.status !== 'Cancelled' && (
                          <Link
                            to={`/payment?ref=${b.ref}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            <CreditCard size={13} />
                            <span>Pay Now</span>
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedDetailBooking(b)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-[#0A142F] text-slate-700 px-3.5 py-2 text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                          <Eye size={13} /> View Details
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(b.ref)}
                          disabled={downloadingPdfRef === b.ref}
                          title="Download Official Tax Invoice PDF"
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-2 text-xs font-semibold transition cursor-pointer"
                        >
                          <Download size={13} className={downloadingPdfRef === b.ref ? 'animate-bounce' : ''} />
                          <span className="hidden sm:inline">PDF</span>
                        </button>

                        {canCancel && b.status !== 'Cancelled' && (
                          <button
                            type="button"
                            disabled={cancellingRef === b.ref}
                            onClick={() => handleCancel(b.ref)}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 text-xs font-bold transition cursor-pointer"
                          >
                            <XCircle size={13} />
                            <span>{cancellingRef === b.ref ? 'Cancelling...' : 'Cancel'}</span>
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

      {/* Booking Detail Modal */}
      {selectedDetailBooking && (
        <BookingDetailModal
          booking={selectedDetailBooking}
          onClose={() => setSelectedDetailBooking(null)}
          onCancel={(ref) => handleCancel(ref)}
          onPay={(ref) => navigate(`/payment?ref=${ref}`)}
          onViewReceipt={(ref) => {
            setSelectedDetailBooking(null);
            setSelectedReceiptRef(ref);
          }}
        />
      )}

      {/* Booking Receipt Modal */}
      {selectedReceiptRef && (
        <BookingReceiptModal
          bookingRef={selectedReceiptRef}
          onClose={() => setSelectedReceiptRef(null)}
        />
      )}
    </div>
  );
}
