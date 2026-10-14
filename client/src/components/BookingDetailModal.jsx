import { useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Clock,
  Car,
  FileText,
  CreditCard,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Award,
  Download,
  Loader2,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from './StatusBadge.jsx';
import CarImage from './CarImage.jsx';
import { formatINR } from '../utils/pricing.js';
import { EXTRAS } from '../data/extras.js';
import { downloadInvoicePdf } from '../services/api.js';
import { getLocationByName } from '../utils/locations.js';
import PickupLocationMap from './PickupLocationMap.jsx';

export default function BookingDetailModal({
  booking,
  onClose,
  onCancel,
  onViewReceipt,
  onPay,
}) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showStationMap, setShowStationMap] = useState(false);

  const pickupStation = getLocationByName(booking?.pickup);
  const dropoffStation = getLocationByName(booking?.dropoff);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadInvoicePdf(booking.ref);
      toast.success('Invoice PDF downloaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF invoice');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!booking) return null;

  const now = new Date();
  const startTime = new Date(booking.start);
  const endTime = new Date(booking.end);
  const isPast = endTime < now;
  const isOngoing = startTime <= now && now <= endTime;
  const isFuture = startTime > now;

  const canCancel =
    booking.status === 'Confirmed' &&
    (startTime.getTime() - now.getTime()) / (1000 * 60 * 60) >= 24;

  // Timeline steps
  const getTimelineSteps = () => {
    const isCancelled = booking.status === 'Cancelled';
    const isCompleted = booking.status === 'Completed' || (booking.status === 'Confirmed' && isPast);

    return [
      {
        title: 'Booking Confirmed',
        description: `Reserved on ${new Date(booking.createdAt || booking.start).toLocaleDateString('en-IN', { dateStyle: 'medium' })}`,
        completed: true,
        current: false,
      },
      {
        title: 'Vehicle Handover & Pickup',
        description: `${booking.pickup} · ${startTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`,
        completed: !isCancelled && (isOngoing || isCompleted),
        current: !isCancelled && isOngoing,
      },
      {
        title: isCancelled ? 'Booking Cancelled' : 'Return & Inspection',
        description: isCancelled
          ? `Cancelled on ${booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Prior to trip'}`
          : `${booking.dropoff} · ${endTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`,
        completed: isCancelled || isCompleted,
        current: !isCancelled && isCompleted,
        isError: isCancelled,
      },
    ];
  };

  const timeline = getTimelineSteps();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white border border-slate-200/90 text-[#0A142F] p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-blue-50/80 border border-blue-900/15 px-3 py-1 rounded-xl text-[#1E3A8A]">
              {booking.ref}
            </span>
            <StatusBadge status={booking.status} />
            <StatusBadge status={booking.paymentStatus} />
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={19} />
          </button>
        </div>

        {/* Vehicle Header Card */}
        <div className="mt-5 flex flex-col sm:flex-row gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
          <CarImage
            src={booking.car?.image}
            alt={`${booking.car?.brand} ${booking.car?.model}`}
            className="h-28 w-full sm:w-44 rounded-xl object-cover bg-white border border-slate-200/80"
          />
          <div className="flex-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#1E3A8A]">
              {booking.car?.category || 'Fleet Vehicle'}
            </span>
            <h3 className="text-xl font-heading font-black text-[#0A142F] mt-0.5">
              {booking.car?.brand} {booking.car?.model}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {booking.car?.year} · {booking.car?.location} · Daily Rate: {formatINR(booking.car?.pricePerDay || booking.pricing?.pricePerDay)} / day
            </p>
            {booking.pricing?.discount > 0 && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                <Award size={12} /> Saved {formatINR(booking.pricing.discount)} with coupon {booking.pricing.couponCode ? `(${booking.pricing.couponCode})` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="mt-6">
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#1E3A8A] mb-3">
            Journey Telemetry & Timeline
          </h4>
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            {timeline.map((step, idx) => (
              <div key={step.title} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold font-mono ${
                      step.isError
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : step.completed
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : step.current
                        ? 'bg-[#0A142F] text-white ring-4 ring-blue-100'
                        : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                  >
                    {step.isError ? (
                      <X size={14} />
                    ) : step.completed ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  {idx < timeline.length - 1 && (
                    <div
                      className={`h-6 w-0.5 ${
                        step.completed ? 'bg-emerald-300' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className={`text-sm font-bold ${step.isError ? 'text-rose-600' : 'text-[#0A142F]'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trip Schedule & Pickup Details */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200/80 p-4 text-xs bg-slate-50">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-mono text-[10px] font-bold text-[#1E3A8A] uppercase tracking-wider block">
                Pickup Station & Time
              </span>
              {pickupStation?.tag && (
                <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  {pickupStation.tag}
                </span>
              )}
            </div>
            <p className="font-bold text-sm text-[#0A142F] flex items-center gap-1.5">
              <MapPin size={14} className="text-[#1E3A8A] shrink-0" /> {booking.pickup}
            </p>
            {pickupStation?.address && (
              <p className="text-slate-500 mt-1 text-[11px] leading-relaxed">
                {pickupStation.address}
              </p>
            )}
            <p className="text-slate-600 mt-2 flex items-center gap-1.5 font-mono text-[11px] border-t border-slate-200/80 pt-2">
              <Calendar size={13} className="shrink-0 text-[#1E3A8A]" />
              {startTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 p-4 text-xs bg-slate-50">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-mono text-[10px] font-bold text-[#1E3A8A] uppercase tracking-wider block">
                Dropoff Station & Time
              </span>
              {dropoffStation?.tag && (
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  {dropoffStation.tag}
                </span>
              )}
            </div>
            <p className="font-bold text-sm text-[#0A142F] flex items-center gap-1.5">
              <MapPin size={14} className="text-[#1E3A8A] shrink-0" /> {booking.dropoff}
            </p>
            {dropoffStation?.address && (
              <p className="text-slate-500 mt-1 text-[11px] leading-relaxed">
                {dropoffStation.address}
              </p>
            )}
            <p className="text-slate-600 mt-2 flex items-center gap-1.5 font-mono text-[11px] border-t border-slate-200/80 pt-2">
              <Calendar size={13} className="shrink-0 text-[#1E3A8A]" />
              {endTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        {/* Pickup Station Handover Instructions Card */}
        {pickupStation && (
          <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Info size={15} className="text-[#1E3A8A] shrink-0" />
                <span className="font-bold text-[#0A142F]">Handover Instructions & Helpdesk</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${pickupStation.phone.replace(/\s+/g, '')}`}
                  className="font-mono font-semibold text-[#1E3A8A] bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 hover:border-blue-300 transition"
                >
                  <Phone size={12} /> {pickupStation.phone}
                </a>
                <button
                  type="button"
                  onClick={() => setShowStationMap(!showStationMap)}
                  className="font-semibold text-[#0A142F] bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
                >
                  {showStationMap ? 'Hide Map' : 'View on Map'}
                </button>
              </div>
            </div>
            <p className="text-slate-600 mt-2 leading-relaxed">
              {pickupStation.instructions} · <strong>Hours:</strong> {pickupStation.hours} · <strong>Landmark:</strong> {pickupStation.landmark}
            </p>

            {showStationMap && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <PickupLocationMap
                  city={pickupStation.city}
                  selectedLocationName={booking.pickup}
                  compact={true}
                  title={`Station Location: ${pickupStation.name}`}
                  subtitle={pickupStation.address}
                />
              </div>
            )}
          </div>
        )}

        {/* Customer & Extras */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
            <span className="font-mono text-[10px] font-bold text-[#1E3A8A] uppercase tracking-wider block mb-1.5">
              Renter Driver Details
            </span>
            <p className="font-bold text-[#0A142F] text-sm flex items-center gap-1.5">
              <User size={13} className="text-slate-400" /> {booking.customer?.fullName || 'Customer'}
            </p>
            {booking.customer?.email && (
              <p className="text-slate-600 mt-0.5 flex items-center gap-1.5">
                <Mail size={12} /> {booking.customer.email}
              </p>
            )}
            {booking.customer?.phone && (
              <p className="text-slate-600 mt-0.5 flex items-center gap-1.5">
                <Phone size={12} /> {booking.customer.phone}
              </p>
            )}
            {booking.customer?.license && (
              <p className="text-slate-600 mt-1">
                Licence: <span className="font-mono font-bold text-[#0A142F]">{booking.customer.license}</span>
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
            <span className="font-mono text-[10px] font-bold text-[#1E3A8A] uppercase tracking-wider block mb-1.5">
              Optional Add-ons
            </span>
            {EXTRAS.filter((e) => booking.extras?.[e.key]).length > 0 ? (
              <ul className="space-y-1">
                {EXTRAS.filter((e) => booking.extras?.[e.key]).map((e) => (
                  <li key={e.key} className="flex justify-between text-slate-600">
                    <span>{e.label}</span>
                    <span className="font-mono text-[#0A142F] font-bold">{formatINR(e.perDay * (booking.pricing?.days || 1))}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400">No optional add-ons selected</p>
            )}
          </div>
        </div>

        {/* Itemized Price Breakdown */}
        {booking.pricing && (
          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-xs space-y-1.5">
            <div className="flex justify-between font-bold text-slate-600 pb-1 border-b border-slate-200">
              <span>Rental Charges ({booking.pricing.days || 1} day(s))</span>
              <span className="font-mono text-[#0A142F]">{formatINR(booking.pricing.base)}</span>
            </div>
            {booking.pricing.extras > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Add-on services</span>
                <span className="font-mono text-[#0A142F]">{formatINR(booking.pricing.extras)}</span>
              </div>
            )}
            {booking.pricing.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span>Coupon discount {booking.pricing.couponCode ? `(${booking.pricing.couponCode})` : ''}</span>
                <span className="font-mono">-{formatINR(booking.pricing.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>GST (18% on rental)</span>
              <span className="font-mono text-[#0A142F]">{formatINR(booking.pricing.tax)}</span>
            </div>
            <div className="flex justify-between text-slate-500 pt-0.5">
              <span>Security Deposit (Refundable upon vehicle return)</span>
              <span className="font-mono text-[#0A142F]">{formatINR(booking.pricing.deposit ?? booking.car?.deposit ?? 0)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black text-[#0A142F]">
              <span>Total Payable Amount</span>
              <span className="font-mono text-lg text-[#0A142F]">{formatINR(booking.pricing.total)}</span>
            </div>
          </div>
        )}

        {/* Actions Bottom Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            {canCancel ? (
              <span className="text-xs font-semibold text-emerald-700">
                Eligible for free cancellation (24+ hrs prior to pickup)
              </span>
            ) : booking.status === 'Confirmed' ? (
              <span className="text-xs text-slate-400">
                Cancellation closed (&lt; 24 hrs prior to pickup)
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onViewReceipt(booking.ref);
              }}
              className="btn-outline text-xs px-3.5 py-2 flex items-center gap-1.5 text-slate-700"
            >
              <FileText size={14} /> Tax Invoice
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="btn-outline text-xs px-3.5 py-2 flex items-center gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              title="Download official PDF invoice"
            >
              {downloadingPdf ? (
                <Loader2 size={14} className="animate-spin text-emerald-600" />
              ) : (
                <Download size={14} className="text-emerald-600" />
              )}
              <span>{downloadingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>

            {booking.status === 'Confirmed' && booking.paymentStatus !== 'Paid' && (
              <button
                onClick={() => {
                  onClose();
                  onPay(booking.ref);
                }}
                className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
              >
                <CreditCard size={14} /> Pay Now
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => {
                  onClose();
                  onCancel(booking.ref, booking.start);
                }}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
