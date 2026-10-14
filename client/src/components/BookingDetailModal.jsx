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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#161A22] border border-[rgba(198,205,213,0.15)] text-[#F5F7FA] p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-[#75CFFF]">
              {booking.ref}
            </span>
            <StatusBadge status={booking.status} />
            <StatusBadge status={booking.paymentStatus} />
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white transition"
          >
            <X size={19} />
          </button>
        </div>

        {/* Vehicle Header Card */}
        <div className="mt-5 flex flex-col sm:flex-row gap-4 rounded-2xl bg-[#1B2028] p-4 border border-white/5">
          <CarImage
            src={booking.car?.image}
            alt={`${booking.car?.brand} ${booking.car?.model}`}
            className="h-28 w-full sm:w-44 rounded-xl object-cover bg-neutral-900 border border-white/5"
          />
          <div className="flex-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#75CFFF]">
              {booking.car?.category || 'Fleet Vehicle'}
            </span>
            <h3 className="text-xl font-black text-[#F5F7FA] mt-0.5">
              {booking.car?.brand} {booking.car?.model}
            </h3>
            <p className="text-xs text-[#C6CDD5] mt-0.5">
              {booking.car?.year} · {booking.car?.location} · Daily Rate: {formatINR(booking.car?.pricePerDay || booking.pricing?.pricePerDay)} / day
            </p>
            {booking.pricing?.discount > 0 && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                <Award size={12} /> Saved {formatINR(booking.pricing.discount)} with coupon {booking.pricing.couponCode ? `(${booking.pricing.couponCode})` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="mt-6">
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#75CFFF] mb-3">
            Journey Telemetry & Timeline
          </h4>
          <div className="space-y-4 rounded-2xl border border-white/5 bg-[#1B2028]/60 p-4">
            {timeline.map((step, idx) => (
              <div key={step.title} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold font-mono ${
                      step.isError
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : step.completed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : step.current
                        ? 'bg-[#75CFFF] text-[#111318] ring-4 ring-[#75CFFF]/20'
                        : 'bg-white/5 text-[#C6CDD5] border border-white/10'
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
                        step.completed ? 'bg-emerald-500/50' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className={`text-sm font-bold ${step.isError ? 'text-rose-400' : 'text-[#F5F7FA]'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-[#C6CDD5] mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trip Schedule & Pickup Details */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/5 p-4 text-xs bg-[#1B2028]">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-mono text-[10px] font-bold text-[#75CFFF] uppercase tracking-wider block">
                Pickup Station & Time
              </span>
              {pickupStation?.tag && (
                <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  {pickupStation.tag}
                </span>
              )}
            </div>
            <p className="font-bold text-sm text-[#F5F7FA] flex items-center gap-1.5">
              <MapPin size={14} className="text-[#75CFFF] shrink-0" /> {booking.pickup}
            </p>
            {pickupStation?.address && (
              <p className="text-[#C6CDD5] mt-1 text-[11px] leading-relaxed">
                {pickupStation.address}
              </p>
            )}
            <p className="text-[#C6CDD5] mt-2 flex items-center gap-1.5 font-mono text-[11px] border-t border-white/5 pt-2">
              <Calendar size={13} className="shrink-0 text-[#75CFFF]" />
              {startTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 p-4 text-xs bg-[#1B2028]">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-mono text-[10px] font-bold text-[#75CFFF] uppercase tracking-wider block">
                Dropoff Station & Time
              </span>
              {dropoffStation?.tag && (
                <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                  {dropoffStation.tag}
                </span>
              )}
            </div>
            <p className="font-bold text-sm text-[#F5F7FA] flex items-center gap-1.5">
              <MapPin size={14} className="text-[#75CFFF] shrink-0" /> {booking.dropoff}
            </p>
            {dropoffStation?.address && (
              <p className="text-[#C6CDD5] mt-1 text-[11px] leading-relaxed">
                {dropoffStation.address}
              </p>
            )}
            <p className="text-[#C6CDD5] mt-2 flex items-center gap-1.5 font-mono text-[11px] border-t border-white/5 pt-2">
              <Calendar size={13} className="shrink-0 text-[#75CFFF]" />
              {endTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        {/* Pickup Station Handover Instructions Card */}
        {pickupStation && (
          <div className="mt-4 rounded-2xl bg-[#1B2028] border border-white/10 p-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Info size={15} className="text-[#75CFFF] shrink-0" />
                <span className="font-bold text-[#F5F7FA]">Handover Instructions & Helpdesk</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${pickupStation.phone.replace(/\s+/g, '')}`}
                  className="font-mono font-semibold text-[#75CFFF] bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1 hover:border-[#75CFFF]/40 transition"
                >
                  <Phone size={12} /> {pickupStation.phone}
                </a>
                <button
                  type="button"
                  onClick={() => setShowStationMap(!showStationMap)}
                  className="font-semibold text-[#F5F7FA] bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/10 transition"
                >
                  {showStationMap ? 'Hide Map' : 'View on Map'}
                </button>
              </div>
            </div>
            <p className="text-[#C6CDD5] mt-2 leading-relaxed">
              {pickupStation.instructions} · <strong>Hours:</strong> {pickupStation.hours} · <strong>Landmark:</strong> {pickupStation.landmark}
            </p>

            {showStationMap && (
              <div className="mt-3 pt-3 border-t border-white/10">
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
          <div className="rounded-2xl border border-white/5 bg-[#1B2028] p-4">
            <span className="font-mono text-[10px] font-bold text-[#75CFFF] uppercase tracking-wider block mb-1.5">
              Renter Driver Details
            </span>
            <p className="font-bold text-[#F5F7FA] text-sm flex items-center gap-1.5">
              <User size={13} className="text-neutral-400" /> {booking.customer?.fullName || 'Customer'}
            </p>
            {booking.customer?.email && (
              <p className="text-[#C6CDD5] mt-0.5 flex items-center gap-1.5">
                <Mail size={12} /> {booking.customer.email}
              </p>
            )}
            {booking.customer?.phone && (
              <p className="text-[#C6CDD5] mt-0.5 flex items-center gap-1.5">
                <Phone size={12} /> {booking.customer.phone}
              </p>
            )}
            {booking.customer?.license && (
              <p className="text-[#C6CDD5] mt-1">
                Licence: <span className="font-mono font-bold text-[#F5F7FA]">{booking.customer.license}</span>
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#1B2028] p-4">
            <span className="font-mono text-[10px] font-bold text-[#75CFFF] uppercase tracking-wider block mb-1.5">
              Optional Add-ons
            </span>
            {EXTRAS.filter((e) => booking.extras?.[e.key]).length > 0 ? (
              <ul className="space-y-1">
                {EXTRAS.filter((e) => booking.extras?.[e.key]).map((e) => (
                  <li key={e.key} className="flex justify-between text-[#C6CDD5]">
                    <span>{e.label}</span>
                    <span className="font-mono text-[#F5F7FA]">{formatINR(e.perDay * (booking.pricing?.days || 1))}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500">No optional add-ons selected</p>
            )}
          </div>
        </div>

        {/* Itemized Price Breakdown */}
        {booking.pricing && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-[#1B2028] p-4 text-xs space-y-1.5">
            <div className="flex justify-between font-bold text-[#C6CDD5] pb-1 border-b border-white/5">
              <span>Rental Charges ({booking.pricing.days || 1} day(s))</span>
              <span className="font-mono text-[#F5F7FA]">{formatINR(booking.pricing.base)}</span>
            </div>
            {booking.pricing.extras > 0 && (
              <div className="flex justify-between text-[#C6CDD5]">
                <span>Add-on services</span>
                <span className="font-mono text-[#F5F7FA]">{formatINR(booking.pricing.extras)}</span>
              </div>
            )}
            {booking.pricing.discount > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span>Coupon discount {booking.pricing.couponCode ? `(${booking.pricing.couponCode})` : ''}</span>
                <span className="font-mono">-{formatINR(booking.pricing.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#C6CDD5]">
              <span>GST (18% on rental)</span>
              <span className="font-mono text-[#F5F7FA]">{formatINR(booking.pricing.tax)}</span>
            </div>
            <div className="flex justify-between text-neutral-400 pt-0.5">
              <span>Security Deposit (Refundable upon vehicle return)</span>
              <span className="font-mono text-[#F5F7FA]">{formatINR(booking.pricing.deposit ?? booking.car?.deposit ?? 0)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-base font-black text-[#F5F7FA]">
              <span>Total Payable Amount</span>
              <span className="font-mono text-lg text-[#75CFFF]">{formatINR(booking.pricing.total)}</span>
            </div>
          </div>
        )}

        {/* Actions Bottom Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div>
            {canCancel ? (
              <span className="text-xs font-semibold text-emerald-400">
                Eligible for free cancellation (24+ hrs prior to pickup)
              </span>
            ) : booking.status === 'Confirmed' ? (
              <span className="text-xs text-[#C6CDD5]">
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
              className="btn-outline text-xs px-3.5 py-2 flex items-center gap-1.5 text-[#C6CDD5]"
            >
              <FileText size={14} /> Tax Invoice
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="btn-outline text-xs px-3.5 py-2 flex items-center gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
              title="Download official PDF invoice"
            >
              {downloadingPdf ? (
                <Loader2 size={14} className="animate-spin text-emerald-400" />
              ) : (
                <Download size={14} className="text-emerald-400" />
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
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition"
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
