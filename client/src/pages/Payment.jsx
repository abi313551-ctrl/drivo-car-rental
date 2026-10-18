import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Lock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  FileText,
  User,
  ArrowRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useBookings } from '../context/BookingContext.jsx';
import CarImage from '../components/CarImage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatINR } from '../utils/pricing.js';
import {
  apiRequest,
  getPaymentConfig,
  createPaymentOrder,
  verifyPaymentSignature,
  logPaymentFailure,
  downloadInvoicePdf,
} from '../services/api.js';
import { loadRazorpayScript } from '../utils/razorpay.js';

export default function Payment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ref = params.get('ref');

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { refreshBookings } = useBookings();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Fetch booking details directly from backend to ensure authoritative data
  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }

    let isCurrent = true;
    setLoading(true);
    setFetchError('');

    Promise.all([
      apiRequest(`/bookings/${ref}`).catch((err) => ({ error: err })),
      getPaymentConfig().catch(() => ({ isConfigured: false })),
    ]).then(([bookingRes, configRes]) => {
      if (!isCurrent) return;

      if (bookingRes?.error) {
        setFetchError(bookingRes.error.message || 'Failed to load booking details.');
        setBooking(null);
      } else if (bookingRes?.booking) {
        setBooking(bookingRes.booking);
        if (bookingRes.booking.paymentStatus === 'Paid') {
          setPaymentSuccess(true);
        }
      }

      setPaymentConfig(configRes);
      setLoading(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [ref]);

  const handleDownloadPdf = async () => {
    if (!booking?.ref) return;
    setDownloadingPdf(true);
    try {
      await downloadInvoicePdf(booking.ref);
      toast.success('Official Tax Invoice downloaded');
    } catch (err) {
      toast.error(err.message || 'Failed to download tax invoice');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Official Razorpay Checkout Flow
  const handleProceedToPayment = async () => {
    if (!booking || processing) return;

    if (!isAuthenticated) {
      toast.error('Please sign in to proceed with payment.');
      navigate(`/login?from=/payment?ref=${booking.ref}`);
      return;
    }

    if (booking.status === 'Cancelled') {
      toast.error('Cannot pay for a cancelled booking.');
      return;
    }

    if (booking.paymentStatus === 'Paid') {
      toast.success('This reservation has already been paid.');
      return;
    }

    if (!paymentConfig?.isConfigured) {
      toast.error('Razorpay test credentials are not configured on the backend.');
      return;
    }

    setProcessing(true);

    try {
      // 1. Create official Razorpay Order on FastAPI backend
      const orderData = await createPaymentOrder(booking.ref);
      if (!orderData?.orderId) {
        throw new Error('Failed to generate payment order from backend.');
      }

      // 2. Load official Razorpay Checkout SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay Checkout SDK. Please check your internet connection.');
      }

      // 3. Configure Razorpay Checkout options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'DRIVO Car Rental',
        description: `Rental Reservation ${booking.ref}`,
        image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=200&auto=format&fit=crop&q=80',
        order_id: orderData.orderId,
        prefill: {
          name: booking.customer?.fullName || user?.fullName || '',
          email: booking.customer?.email || user?.email || '',
          contact: booking.customer?.phone || user?.phone || '',
        },
        notes: {
          booking_ref: booking.ref,
        },
        theme: {
          color: '#0A142F',
        },
        handler: async (response) => {
          // 4. Send official Razorpay signature payload to backend for HMAC verification
          try {
            const verifyRes = await verifyPaymentSignature({
              bookingRef: booking.ref,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod: 'Razorpay',
            });

            if (verifyRes.ok) {
              setBooking(verifyRes.booking);
              setPaymentSuccess(true);
              toast.success('Payment verified successfully!');
              refreshBookings();
            } else {
              toast.error('Payment verification failed on the server.');
            }
          } catch (verifyErr) {
            toast.error(verifyErr.message || 'Payment signature verification failed.');
            setBooking((prev) => (prev ? { ...prev, paymentStatus: 'Failed' } : null));
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast('Payment window closed. Your booking remains pending.', { icon: 'ℹ️' });
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', async (failResponse) => {
        setProcessing(false);
        const errDetails = failResponse.error || {};
        toast.error(`Payment failed: ${errDetails.description || 'Transaction declined.'}`);
        try {
          await logPaymentFailure({
            bookingRef: booking.ref,
            razorpayOrderId: orderData.orderId,
            errorCode: errDetails.code,
            errorDescription: errDetails.description,
          });
          setBooking((prev) => (prev ? { ...prev, paymentStatus: 'Failed' } : null));
        } catch {
          // Ignore failure logging network error
        }
      });

      rzpInstance.open();
    } catch (err) {
      setProcessing(false);
      toast.error(err.message || 'Failed to initiate payment.');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="bg-[#F8F9FA] min-h-[70vh] grid place-items-center text-[#0F172A]">
        <div className="text-center">
          <Loader2 size={34} className="mx-auto animate-spin text-[#0A142F]" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Loading checkout session...</p>
        </div>
      </div>
    );
  }

  if (!ref || fetchError || !booking) {
    return (
      <section className="bg-[#F8F9FA] min-h-[70vh] flex items-center justify-center py-16 text-[#0F172A]">
        <div className="container-x w-full max-w-lg text-center rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-sm">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 mx-auto">
            <AlertTriangle size={28} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-black text-[#0A142F]">
            {fetchError ? 'Unable to Retrieve Reservation' : 'Booking Reference Missing'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            {fetchError || 'Please select an active reservation from your bookings to proceed with payment.'}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/my-bookings"
              className="rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition shadow-sm"
            >
              My Bookings
            </Link>
            <Link
              to="/cars"
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 text-xs font-bold uppercase tracking-wider transition"
            >
              Explore Fleet
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const pricing = booking.pricing || {};
  const car = booking.car || {};
  const isPaid = booking.paymentStatus === 'Paid' || paymentSuccess;
  const isCancelled = booking.status === 'Cancelled';

  // Format dates
  const fmtDate = (s) =>
    s && !Number.isNaN(new Date(s).getTime())
      ? new Date(s).toLocaleString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : s;

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-[#0F172A] py-10 sm:py-14">
      <div className="container-x">
        {/* Breadcrumb & Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link to="/cars" className="hover:text-[#0A142F] transition">Fleet</Link>
            <span>/</span>
            <Link to="/my-bookings" className="hover:text-[#0A142F] transition">My Bookings</Link>
            <span>/</span>
            <span className="text-[#0A142F] font-bold">Checkout &amp; Payment</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-2xs">
              Ref: {booking.ref}
            </span>
          </div>
        </div>

        {/* Header Title */}
        <div className="mb-8">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1">
            SECURE CHECKOUT &amp; TARIFF SETTLEMENT
          </span>
          <h1 className="font-display text-2xl sm:text-4xl font-black text-[#0A142F] tracking-tight">
            Review Order &amp; Pay
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Authoritative tariff calculated on the Drivo backend. Verified with 256-bit bank encryption.
          </p>
        </div>

        {/* Success Banner if Paid */}
        {isPaid ? (
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto my-6 animate-entrance-1">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-[#0A142F]">
              Payment Verified &amp; Confirmed!
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Your payment of <strong className="text-[#0A142F]">{formatINR(pricing.total)}</strong> has been verified and registered with transaction reference{' '}
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {booking.paymentId || 'Verified Online'}
              </span>.
            </p>

            <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <FileText size={14} />
                <span>{downloadingPdf ? 'Downloading...' : 'Download Official Tax Invoice'}</span>
              </button>
              <Link
                to="/my-bookings"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition shadow-2xs"
              >
                <span>Go to My Bookings</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          /* 2-Column Responsive Checkout Layout */
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_450px] items-start">
            {/* Left Column: Vehicle & Rental Details */}
            <div className="space-y-6">
              {/* Card 1: Selected Car Details */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#0A142F]">
                    1. Reserved Fleet Vehicle
                  </h2>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    ID #{booking.carId}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                  <div className="relative aspect-[16/10] w-full sm:w-56 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/80 shrink-0">
                    <CarImage
                      src={car.image}
                      alt={`${car.brand} ${car.model}`}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur-md">
                      {car.category || 'Luxury'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-xl sm:text-2xl font-black text-[#0A142F]">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Model Year {car.year || 2024} · {car.transmission || 'Automatic'} · {car.fuel || 'Petrol'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1">
                        Daily Rate: {formatINR(pricing.pricePerDay || car.pricePerDay)}/day
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1">
                        Deposit: {formatINR(pricing.deposit || car.deposit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Itinerary & Schedule Details */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm">
                <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#0A142F] border-b border-slate-100 pb-4 mb-5">
                  2. Schedule &amp; Station Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-slate-700">
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      Pickup Hub &amp; Schedule
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-[#0A142F] mt-1">
                      <MapPin size={14} className="text-[#0A142F] shrink-0" />
                      <span>{booking.pickup}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 mt-1.5 text-[11px]">
                      <Clock size={13} className="shrink-0" />
                      <span>{fmtDate(booking.start)}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      Return Hub &amp; Schedule
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-[#0A142F] mt-1">
                      <MapPin size={14} className="text-[#0A142F] shrink-0" />
                      <span>{booking.dropoff || booking.pickup}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 mt-1.5 text-[11px]">
                      <Clock size={13} className="shrink-0" />
                      <span>{fmtDate(booking.end)}</span>
                    </div>
                  </div>
                </div>

                {/* Verified Customer Snapshot */}
                <div className="mt-5 rounded-2xl bg-slate-50/70 p-4 border border-slate-100 text-xs">
                  <div className="flex items-center gap-2 mb-2 font-bold text-[#0A142F]">
                    <User size={14} />
                    <span>Registered Driver Information</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block">Driver Name</span>
                      <strong className="text-slate-800">{booking.customer?.fullName || 'Verified Driver'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Contact Phone</span>
                      <strong className="text-slate-800">{booking.customer?.phone || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Driving License</span>
                      <strong className="text-slate-800 font-mono">{booking.customer?.license || 'On File'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gateway Security Badge */}
              <div className="rounded-2xl bg-slate-100/70 p-4 border border-slate-200/80 flex items-center gap-3.5 text-xs text-slate-600">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#0A142F] shrink-0 shadow-2xs">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="font-bold text-[#0A142F]">
                    Razorpay Official Checkout Integration
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Your card numbers, CVVs, and UPI PINs are processed directly inside Razorpay's PCI-DSS Level 1 compliant secure vault. Drivo never collects or stores raw banking credentials.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Authoritative Price Breakdown & Pay CTA */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#0A142F]">
                  Order Tariff Breakdown
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-900">
                  Backend Verified
                </span>
              </div>

              {/* Itemized Pricing Rows */}
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">
                    Rental Base ({pricing.days || 1} {pricing.days === 1 ? 'day' : 'days'} × {formatINR(pricing.pricePerDay || car.pricePerDay)})
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatINR(pricing.rentalBase || (pricing.days || 1) * (pricing.pricePerDay || 0))}
                  </span>
                </div>

                {pricing.extrasTotal > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Protection &amp; Add-ons</span>
                    <span className="font-bold text-slate-900">{formatINR(pricing.extrasTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">GST Government Tax (18%)</span>
                  <span className="font-bold text-slate-900">{formatINR(pricing.gst)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Refundable Security Deposit</span>
                  <span className="font-bold text-slate-900">{formatINR(pricing.deposit)}</span>
                </div>

                {pricing.discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>Coupon Discount</span>
                    <span className="font-bold">-{formatINR(pricing.discount)}</span>
                  </div>
                )}

                {pricing.pointsDiscount > 0 && (
                  <div className="flex justify-between items-center text-blue-600">
                    <span>Loyalty Points Discount</span>
                    <span className="font-bold">-{formatINR(pricing.pointsDiscount)}</span>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-4 mt-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#0A142F] uppercase tracking-wider block">
                        Final Amount Payable
                      </span>
                      <span className="text-[10px] text-slate-400">All taxes &amp; refundable deposit included</span>
                    </div>
                    <span className="font-display text-2xl font-black text-[#0A142F]">
                      {formatINR(pricing.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status or Action Container */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                {isCancelled ? (
                  <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200 text-rose-700 text-center text-xs">
                    <AlertTriangle size={20} className="mx-auto mb-1 text-rose-600" />
                    <p className="font-bold">Reservation Cancelled</p>
                    <p className="text-[11px] mt-0.5">This booking has been cancelled and cannot accept payment.</p>
                  </div>
                ) : !paymentConfig?.isConfigured ? (
                  <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-200/90 text-amber-900 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <AlertTriangle size={15} className="text-amber-700 shrink-0" />
                      <span>Razorpay Test Gateway Setup Required</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      To initiate live test payments, configure your free Razorpay Test Keys in <code className="bg-amber-100/90 px-1 py-0.5 rounded font-mono font-bold text-amber-950">server/.env</code>:
                    </p>
                    <div className="rounded-lg bg-amber-950/10 p-2 font-mono text-[10px] text-amber-950">
                      RAZORPAY_KEY_ID=rzp_test_...<br />
                      RAZORPAY_KEY_SECRET=...
                    </div>
                    <p className="text-[10px] text-amber-700">
                      Sign up for free test keys at{' '}
                      <a
                        href="https://dashboard.razorpay.com"
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline inline-flex items-center gap-0.5 hover:text-amber-950"
                      >
                        dashboard.razorpay.com <ExternalLink size={10} />
                      </a>
                    </p>
                    <button
                      type="button"
                      disabled
                      className="w-full mt-2 rounded-xl bg-slate-200 text-slate-400 py-3 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
                    >
                      Gateway Keys Required
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={handleProceedToPayment}
                      disabled={processing}
                      className="w-full rounded-2xl bg-[#0A142F] hover:bg-[#1E293B] text-white py-3.5 px-6 text-xs font-bold uppercase tracking-wider transition shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {processing ? (
                        <>
                          <Loader2 size={15} className="animate-spin text-white" />
                          <span>Contacting Gateway...</span>
                        </>
                      ) : (
                        <>
                          <Lock size={14} className="text-emerald-400" />
                          <span>Proceed to Payment ({formatINR(pricing.total)})</span>
                        </>
                      )}
                    </button>

                    <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-400">
                      <CreditCard size={12} />
                      <span>Accepts UPI, RuPay, Visa, Mastercard, NetBanking</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
