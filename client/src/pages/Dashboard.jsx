import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Heart,
  IndianRupee,
  User,
  Car,
  Shield,
  LogOut,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Star,
  Bell,
  AlertCircle,
  ArrowRight,
  Eye,
  RefreshCw,
  Tag,
  CreditCard,
  MapPin,
  Calendar,
  Download,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useCars } from '../context/CarContext.jsx';
import { useBookings } from '../context/BookingContext.jsx';
import CarCard from '../components/CarCard.jsx';
import CarImage from '../components/CarImage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import BookingReceiptModal from '../components/BookingReceiptModal.jsx';
import BookingDetailModal from '../components/BookingDetailModal.jsx';
import { formatINR } from '../utils/pricing.js';
import { apiRequest, downloadInvoicePdf } from '../services/api.js';
import { getLocationByName } from '../utils/locations.js';

export default function Dashboard() {
  const { user, isAuthenticated, isAdmin, updateProfile, logout } = useAuth();
  const { favoriteCars } = useCars();
  const { bookings, cancelBooking, refreshBookings } = useBookings();
  const navigate = useNavigate();

  const [tab, setTab] = useState('upcoming');
  const [selectedReceiptRef, setSelectedReceiptRef] = useState(null);
  const [selectedDetailBooking, setSelectedDetailBooking] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadingPdfRef, setDownloadingPdfRef] = useState(null);

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

  // Review modal state
  const [reviewBooking, setReviewBooking] = useState(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [, setLoadingNotifs] = useState(false);

  // Profile form state (keeps in sync when user loads or updates)
  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    license: user?.license || '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || '',
        phone: user.phone || '',
        license: user.license || '',
      });
    }
  }, [user]);

  // Fetch notifications
  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    setLoadingNotifs(true);
    try {
      const res = await apiRequest('/notifications');
      setNotifications(res.notifications || []);
    } catch {
      // offline fallback
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshBookings(), loadNotifications()]);
      toast.success('Telemetry and reservations synchronized');
    } catch {
      toast.error('Could not refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const markNotifRead = async (id) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // ignore
    }
  };

  // User's own bookings only (by user.id or matching email)
  const myBookings = useMemo(() => {
    if (!user) return [];
    return bookings.filter(
      (b) =>
        b.userId === user.id ||
        (b.customer?.email && b.customer.email.toLowerCase() === user.email.toLowerCase())
    );
  }, [bookings, user]);

  const now = new Date();

  // Active / in-progress rentals right now
  const activeRentals = useMemo(() => {
    return myBookings.filter((b) => {
      if (b.status === 'Cancelled') return false;
      const s = new Date(b.start);
      const e = new Date(b.end);
      return (s <= now && now <= e) || b.status === 'In Progress';
    });
  }, [myBookings, now]);

  // Upcoming bookings starting in future
  const upcomingBookings = useMemo(() => {
    return myBookings.filter((b) => {
      if (b.status !== 'Confirmed') return false;
      const s = new Date(b.start);
      return s > now;
    });
  }, [myBookings, now]);

  // Completed trips
  const completedTrips = useMemo(() => {
    return myBookings.filter((b) => {
      if (b.status === 'Completed') return true;
      if (b.status === 'Confirmed' && new Date(b.end) < now) return true;
      return false;
    });
  }, [myBookings, now]);

  // Cancelled bookings
  const cancelledBookings = useMemo(() => {
    return myBookings.filter((b) => b.status === 'Cancelled');
  }, [myBookings]);

  // Total savings through coupons across bookings
  const totalSavings = useMemo(() => {
    return myBookings
      .filter((b) => b.status !== 'Cancelled')
      .reduce((sum, b) => sum + (b.pricing?.discount || 0), 0);
  }, [myBookings]);

  const stats = useMemo(() => {
    const totalSpent = myBookings
      .filter((b) => b.status !== 'Cancelled')
      .reduce((sum, b) => sum + (b.pricing?.total || 0), 0);
    return {
      totalBookings: myBookings.length,
      activeCount: activeRentals.length,
      upcomingCount: upcomingBookings.length,
      completedCount: completedTrips.length,
      cancelledCount: cancelledBookings.length,
      favoritesCount: favoriteCars.length,
      totalSpent,
      totalSavings,
      unreadNotifs: notifications.filter((n) => !n.read).length,
    };
  }, [myBookings, activeRentals, upcomingBookings, completedTrips, cancelledBookings, favoriteCars, notifications, totalSavings]);

  if (!isAuthenticated) {
    return (
      <div className="container-x py-20 min-h-[70vh] flex items-center justify-center text-[#0A142F]">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200/90 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 border border-blue-900/10 text-[#1E3A8A]">
            <User size={28} />
          </span>
          <h1 className="mt-5 text-2xl font-black text-[#0A142F]">Authenticate to access dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Access your active itineraries, verified telemetry, official tax invoices, and driver identity details.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="btn-primary">Sign In</Link>
            <Link to="/register" className="btn-outline text-slate-700">Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!profile.fullName.trim() || profile.fullName.trim().length < 3) {
      errors.fullName = 'Full name must contain letters and be at least 3 characters.';
    }
    if (profile.phone && !/^(\+91|91|0)?[6-9]\d{9}$/.test(profile.phone.replace(/[\s\-]/g, ''))) {
      errors.phone = 'Enter a valid 10-digit Indian mobile number.';
    }
    if (profile.license && !/^[A-Z]{2}\d{2}(19|20)\d{2}\d{7}$/.test(profile.license.replace(/[\s\-]/g, '').toUpperCase())) {
      errors.license = 'Format: TN37 20190012345 (2 state letters, 2 code, year, 7 digits).';
    }

    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile(profile);
      toast.success('Driver credentials verified and updated');
      setProfileErrors({});
    } catch (err) {
      toast.error(err.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelBooking = async (ref, startTime) => {
    const diffHours = (new Date(startTime) - new Date()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      toast.error('Bookings can only be cancelled up to 24 hours prior to pickup.');
      return;
    }
    if (!window.confirm(`Are you sure you want to cancel booking ${ref}? Any prepaid charges will be refunded.`)) return;

    const res = await cancelBooking(ref);
    if (res.ok) {
      toast.success(`Booking ${ref} cancelled successfully`);
      refreshBookings();
      loadNotifications();
    } else {
      toast.error(res.error || 'Could not cancel booking');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim() || reviewComment.trim().length < 5) {
      toast.error('Please write at least 5 characters for your review');
      return;
    }
    setSubmittingReview(true);
    try {
      await apiRequest('/reviews', {
        method: 'POST',
        body: {
          bookingRef: reviewBooking.ref,
          rating: Number(ratingVal),
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
        },
      });
      toast.success('Thank you for submitting your verified feedback!');
      setReviewBooking(null);
      setReviewComment('');
      setReviewTitle('');
    } catch (err) {
      toast.error(err.message || 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderBookingCard = (b) => {
    const startTime = new Date(b.start);
    const endTime = new Date(b.end);
    const canCancel = b.status === 'Confirmed' && (startTime.getTime() - now.getTime()) / (1000 * 60 * 60) >= 24;

    return (
      <div key={b.ref} className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-slate-300">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex gap-4 items-start">
            <CarImage
              src={b.car?.image}
              alt={`${b.car?.brand} ${b.car?.model}`}
              className="h-20 w-28 sm:h-24 sm:w-36 shrink-0 rounded-2xl object-cover bg-slate-100 border border-slate-200/80"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold bg-blue-50/80 border border-blue-900/15 px-2.5 py-1 rounded-md text-[#1E3A8A]">
                  {b.ref}
                </span>
                <StatusBadge status={b.status} />
                <span className={`font-mono text-[11px] font-semibold ${b.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  Payment: {b.paymentStatus}
                </span>
              </div>
              <h3 className="mt-1.5 text-lg sm:text-xl font-black text-[#0A142F]">{b.car?.brand} {b.car?.model}</h3>
              <p className="text-xs text-slate-500">{b.car?.category} · Hub: {b.pickup}</p>
              {b.pricing?.discount > 0 && (
                <p className="mt-1 text-xs font-bold text-emerald-600 flex items-center gap-1 font-mono">
                  <Tag size={12} /> Saved {formatINR(b.pricing.discount)} with promo
                </p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <p className="font-mono text-xl font-black text-[#0A142F]">{formatINR(b.pricing?.total || 0)}</p>
            <p className="text-xs text-slate-500 font-mono">{b.pricing?.days || 1} day(s) duration</p>
          </div>
        </div>

        {(() => {
          const pLoc = getLocationByName(b.pickup);
          const dLoc = getLocationByName(b.dropoff);
          return (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[#1E3A8A] block font-mono font-bold uppercase tracking-wider text-[10px]">Pickup Station</span>
                  {pLoc?.tag && <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{pLoc.tag}</span>}
                </div>
                <p className="font-mono text-xs font-bold text-[#0A142F] mt-0.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#1E3A8A]" /> {startTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                <p className="text-slate-600 font-semibold mt-1 flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#1E3A8A] shrink-0" /> {b.pickup}
                </p>
                {pLoc?.address && (
                  <p className="text-slate-500 text-[11px] mt-0.5 truncate max-w-xs">{pLoc.address}</p>
                )}
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[#1E3A8A] block font-mono font-bold uppercase tracking-wider text-[10px]">Return Station</span>
                  {dLoc?.tag && <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">{dLoc.tag}</span>}
                </div>
                <p className="font-mono text-xs font-bold text-[#0A142F] mt-0.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#1E3A8A]" /> {endTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                <p className="text-slate-600 font-semibold mt-1 flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#1E3A8A] shrink-0" /> {b.dropoff}
                </p>
                {dLoc?.address && (
                  <p className="text-slate-500 text-[11px] mt-0.5 truncate max-w-xs">{dLoc.address}</p>
                )}
              </div>
            </div>
          );
        })()}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500">
            {canCancel ? (
              <span className="text-emerald-600 font-medium">Free cancellation eligible (&gt; 24h to pickup)</span>
            ) : b.status === 'Confirmed' ? (
              <span className="text-slate-400">Cancellation closed (&lt; 24h to pickup)</span>
            ) : b.status === 'Cancelled' ? (
              <span className="text-rose-600 font-medium">Cancelled on {b.cancelledAt ? new Date(b.cancelledAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Prior to trip'}</span>
            ) : (
              <span className="text-blue-600 font-medium">Rental completed</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedDetailBooking(b)}
              className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1 text-slate-700"
            >
              <Eye size={14} /> Telemetry & Details
            </button>

            <button
              onClick={() => setSelectedReceiptRef(b.ref)}
              className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1 text-slate-700"
            >
              <FileText size={14} /> Tax Invoice
            </button>

            <button
              onClick={() => handleDownloadPdf(b.ref)}
              disabled={downloadingPdfRef === b.ref}
              className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              title="Download official PDF invoice"
            >
              {downloadingPdfRef === b.ref ? (
                <Loader2 size={14} className="animate-spin text-emerald-600" />
              ) : (
                <Download size={14} className="text-emerald-600" />
              )}
              <span>{downloadingPdfRef === b.ref ? 'PDF...' : 'PDF Invoice'}</span>
            </button>

            {b.status === 'Confirmed' && b.paymentStatus !== 'Paid' && (
              <button
                onClick={() => navigate(`/payment?ref=${b.ref}`)}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
              >
                <CreditCard size={14} /> Pay Now
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => handleCancelBooking(b.ref, b.start)}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
              >
                Cancel Booking
              </button>
            )}

            {b.status === 'Completed' && (
              <button
                onClick={() => setReviewBooking(b)}
                className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1 text-slate-700"
              >
                <Star size={13} className="fill-amber-400 text-amber-500" /> Review Trip
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-x py-10 text-[#0A142F]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-black text-[#0A142F]">Pilot Command Center</h1>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-900/15 px-3 py-1 font-mono text-xs font-bold text-[#1E3A8A]">
                <Shield size={12} /> System Admin
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Welcome, <span className="text-[#0A142F] font-bold">{user.fullName}</span> · {user.email}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="btn-outline text-xs flex items-center gap-1.5 px-3 py-2 text-slate-700"
            title="Refresh bookings and notifications"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#1E3A8A]' : ''} />
            Sync
          </button>
          {isAdmin && (
            <Link to="/admin" className="btn-outline text-xs flex items-center gap-1.5 text-slate-700">
              <Shield size={14} className="text-[#1E3A8A]" /> Admin Portal
            </Link>
          )}
          <Link to="/cars" className="btn-primary text-xs">Reserve Fleet</Link>
          <button onClick={logout} className="btn-outline text-xs flex items-center gap-1.5 text-slate-700">
            <LogOut size={14} /> Log out
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Upcoming Trips</span>
            <CalendarCheck size={18} className="text-[#1E3A8A]" />
          </div>
          <p className="mt-3 font-mono text-3xl font-extrabold text-[#0A142F]">{stats.upcomingCount}</p>
          <p className="mt-1 text-xs text-slate-500">{stats.activeCount} currently on road</p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-700">Total Reservations</span>
            <Car size={18} className="text-emerald-700" />
          </div>
          <p className="mt-3 font-mono text-3xl font-extrabold text-[#0A142F]">{stats.totalBookings}</p>
          <p className="mt-1 text-xs text-slate-500">{stats.completedCount} completed · {stats.cancelledCount} cancelled</p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-600">Saved Wishlist</span>
            <Heart size={18} className="text-rose-600" />
          </div>
          <p className="mt-3 font-mono text-3xl font-extrabold text-[#0A142F]">{stats.favoritesCount}</p>
          <p className="mt-1 text-xs text-slate-500">Favorite vehicles</p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Fleet Investment</span>
            <IndianRupee size={18} className="text-[#1E3A8A]" />
          </div>
          <p className="mt-3 font-mono text-3xl font-extrabold text-[#0A142F]">{formatINR(stats.totalSpent)}</p>
          {stats.totalSavings > 0 ? (
            <p className="mt-1 text-xs font-semibold text-emerald-700 font-mono">Saved {formatINR(stats.totalSavings)} with promo</p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">Verified transactions</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {[
          ['upcoming', `Upcoming Trips (${upcomingBookings.length})`],
          ['active', `Active Rentals (${activeRentals.length})`],
          ['completed', `Completed (${completedTrips.length})`],
          ['cancelled', `Cancelled (${cancelledBookings.length})`],
          ['favorites', `Favorites (${favoriteCars.length})`],
          ['notifications', `Alerts (${notifications.length})`],
          ['profile', 'Driver Profile Settings'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 font-mono text-xs font-semibold transition ${
              tab === key
                ? 'bg-[#0A142F] text-white shadow-sm font-bold'
                : 'bg-white text-slate-600 hover:text-[#0A142F] border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: UPCOMING TRIPS */}
      {tab === 'upcoming' && (
        <div className="mt-6 space-y-4">
          {upcomingBookings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 py-16 text-center bg-white p-8 shadow-sm">
              <CalendarCheck size={36} className="mx-auto text-slate-400" />
              <h2 className="mt-3 font-heading font-black text-lg text-[#0A142F]">No upcoming trips scheduled</h2>
              <p className="mt-1 text-sm text-slate-500">Choose from next-generation verified vehicles and plan your highway escape.</p>
              <Link to="/cars" className="btn-primary mt-5 inline-flex items-center gap-1.5">
                Explore Available Fleet <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((b) => renderBookingCard(b))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE RENTALS */}
      {tab === 'active' && (
        <div className="mt-6 space-y-4">
          {activeRentals.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 py-16 text-center bg-white p-8 shadow-sm">
              <Car size={36} className="mx-auto text-slate-400" />
              <h2 className="mt-3 font-heading font-black text-lg text-[#0A142F]">No active rentals on the road right now</h2>
              <p className="mt-1 text-sm text-slate-500">Vehicles currently picked up during their booked time period will show live telemetry here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeRentals.map((b) => renderBookingCard(b))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLETED TRIPS */}
      {tab === 'completed' && (
        <div className="mt-6 space-y-4">
          {completedTrips.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 py-16 text-center bg-white p-8 shadow-sm">
              <Clock size={36} className="mx-auto text-slate-400" />
              <h2 className="mt-3 font-heading font-black text-lg text-[#0A142F]">No completed trips yet</h2>
              <p className="mt-1 text-sm text-slate-500">Your past completed journeys and rental histories will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedTrips.map((b) => renderBookingCard(b))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CANCELLED BOOKINGS */}
      {tab === 'cancelled' && (
        <div className="mt-6 space-y-4">
          {cancelledBookings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 py-16 text-center bg-white p-8 shadow-sm">
              <XCircle size={36} className="mx-auto text-slate-400" />
              <h2 className="mt-3 font-heading font-black text-lg text-[#0A142F]">No cancelled reservations</h2>
              <p className="mt-1 text-sm text-slate-500">All scheduled bookings remain active or completed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cancelledBookings.map((b) => renderBookingCard(b))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: FAVORITES */}
      {tab === 'favorites' && (
        <div className="mt-6">
          {favoriteCars.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 py-16 text-center bg-white p-8 shadow-sm">
              <Heart size={36} className="mx-auto text-slate-400" />
              <h2 className="mt-3 font-heading font-black text-lg text-[#0A142F]">No wishlist vehicles saved</h2>
              <p className="mt-1 text-sm text-slate-500">Click the heart icon on any car card to save it for immediate priority access.</p>
              <Link to="/cars" className="btn-primary mt-5 inline-block">Explore Fleet</Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteCars.map((c) => <CarCard key={c.id} car={c} />)}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: NOTIFICATIONS */}
      {tab === 'notifications' && (
        <div className="mt-6 space-y-4">
          {notifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 py-16 text-center bg-white p-8 shadow-sm">
              <Bell size={36} className="mx-auto text-slate-400" />
              <h2 className="mt-3 font-heading font-black text-lg text-[#0A142F]">No alerts in inbox</h2>
              <p className="mt-1 text-sm text-slate-500">Trip updates, booking dispatch receipts, and policy notices will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markNotifRead(n.id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    n.read
                      ? 'border-slate-200/90 bg-white hover:border-slate-300'
                      : 'border-blue-900/20 bg-blue-50/50 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {!n.read && <span className="h-2 w-2 rounded-full bg-[#1E3A8A] animate-pulse" />}
                        <h4 className="font-bold text-sm text-[#0A142F]">{n.title}</h4>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{n.message}</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: PROFILE SETTINGS */}
      {tab === 'profile' && (
        <div className="mt-6">
          <form onSubmit={handleProfileSave} className="max-w-xl rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-heading font-black text-[#0A142F]">Driver Profile & Legal Identity</h2>
              <p className="text-xs text-slate-500 mt-1">
                Maintain accurate government licence details to enable immediate contactless car release.
              </p>
            </div>

            <div>
              <label htmlFor="prof-name" className="mb-1 block font-mono text-xs font-semibold text-[#0A142F]">Full Legal Name</label>
              <input
                id="prof-name"
                className={`field ${profileErrors.fullName ? 'border-rose-500 bg-rose-50' : ''}`}
                value={profile.fullName}
                onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
              />
              {profileErrors.fullName && <p className="text-xs text-rose-500 mt-1 font-medium">{profileErrors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="prof-email" className="mb-1 block font-mono text-xs font-semibold text-[#0A142F]">Email Address (Immutable Security Key)</label>
              <input id="prof-email" className="field opacity-60 cursor-not-allowed bg-slate-50" value={user.email} disabled />
              <p className="text-[11px] text-slate-400 mt-1">Bound to your cryptographic session tokens.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="prof-phone" className="mb-1 block font-mono text-xs font-semibold text-[#0A142F]">Contact Mobile</label>
                <input
                  id="prof-phone"
                  className={`field ${profileErrors.phone ? 'border-rose-500 bg-rose-50' : ''}`}
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
                {profileErrors.phone && <p className="text-xs text-rose-500 mt-1 font-medium">{profileErrors.phone}</p>}
              </div>
              <div>
                <label htmlFor="prof-lic" className="mb-1 block font-mono text-xs font-semibold text-[#0A142F]">Indian Driving Licence</label>
                <input
                  id="prof-lic"
                  className={`field uppercase font-mono ${profileErrors.license ? 'border-rose-500 bg-rose-50' : ''}`}
                  value={profile.license}
                  onChange={(e) => setProfile((p) => ({ ...p, license: e.target.value }))}
                  placeholder="TN37 20190012345"
                />
                {profileErrors.license && <p className="text-xs text-rose-500 mt-1 font-medium">{profileErrors.license}</p>}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="font-mono text-[11px] text-slate-400">Synced to secure MySQL storage</span>
              <button type="submit" disabled={savingProfile} className="btn-primary text-xs px-5 py-2.5">
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BOOKING DETAIL & TIMELINE MODAL */}
      {selectedDetailBooking && (
        <BookingDetailModal
          booking={selectedDetailBooking}
          onClose={() => setSelectedDetailBooking(null)}
          onCancel={handleCancelBooking}
          onViewReceipt={(ref) => setSelectedReceiptRef(ref)}
          onPay={(ref) => navigate(`/payment?ref=${ref}`)}
        />
      )}

      {/* REVIEW SUBMISSION MODAL */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200/90 text-[#0A142F] p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-heading font-black text-[#0A142F]">Rate & Review Vehicle Performance</h3>
            <p className="text-xs text-slate-500 mt-1">
              Vehicle: {reviewBooking.car?.brand} {reviewBooking.car?.model} (Ref: {reviewBooking.ref})
            </p>

            <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
              <div>
                <label className="block font-mono text-xs font-bold text-[#0A142F] mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatingVal(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition"
                    >
                      <Star size={24} className={star <= ratingVal ? 'fill-amber-400' : 'text-slate-300'} />
                    </button>
                  ))}
                  <span className="ml-2 self-center font-mono text-sm font-bold text-[#0A142F]">{ratingVal} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-[#0A142F] mb-1">Review Headline (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Exceptional highway balance and spotless cabin"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="field text-xs"
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-[#0A142F] mb-1">Detailed Driver Log</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share feedback on handling, pickup punctuality, comfort, and fuel efficiency..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="field text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="btn-outline text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-primary text-xs"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Verified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT / INVOICE MODAL */}
      {selectedReceiptRef && (
        <BookingReceiptModal bookingRef={selectedReceiptRef} onClose={() => setSelectedReceiptRef(null)} />
      )}
    </div>
  );
}
