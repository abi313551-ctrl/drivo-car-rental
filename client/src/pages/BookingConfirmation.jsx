import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, FileText, Download, Loader2, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBookings } from '../context/BookingContext.jsx';
import BookingSummary from '../components/BookingSummary.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import BookingReceiptModal from '../components/BookingReceiptModal.jsx';
import { apiRequest, downloadInvoicePdf } from '../services/api.js';
import { getLocationByName } from '../utils/locations.js';

export default function BookingConfirmation() {
  const { ref } = useParams();
  const { getBooking } = useBookings();
  const [b, setB] = useState(() => getBooking(ref));
  const [loading, setLoading] = useState(!b);
  const [showReceipt, setShowReceipt] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!b?.ref) return;
    setDownloadingPdf(true);
    try {
      await downloadInvoicePdf(b.ref);
      toast.success('Official PDF Invoice downloaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF invoice');
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    if (!b && ref) {
      setLoading(true);
      apiRequest(`/bookings/${ref}`)
        .then((data) => setB(data.booking))
        .catch(() => setB(null))
        .finally(() => setLoading(false));
    }
  }, [ref, b]);

  if (loading) {
    return (
      <div className="container-x py-24 text-center text-[#0F172A]">
        <Loader2 size={32} className="mx-auto animate-spin text-[#0A142F]" />
        <p className="mt-3 text-xs font-semibold text-slate-500">Verifying reservation record...</p>
      </div>
    );
  }

  if (!b) {
    return (
      <section className="container-x grid min-h-[60vh] place-items-center py-20 text-center text-[#0F172A]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-[#0A142F]">Reservation Not Found</h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">No booking record matching reference {ref} exists in MySQL.</p>
          <Link to="/cars" className="mt-6 inline-flex rounded-xl bg-[#0A142F] text-white px-6 py-3 text-xs font-bold uppercase">
            Return to Fleet
          </Link>
        </div>
      </section>
    );
  }

  const pStation = getLocationByName(b.pickup);

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-[#0F172A] py-10 sm:py-14">
      <div className="container-x max-w-3xl">
        {/* Confirmed Banner */}
        <div className="rounded-3xl bg-white p-8 sm:p-10 text-center border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto shadow-2xs">
            <CheckCircle2 size={36} />
          </div>
          <h1 className="mt-4 font-display text-2xl sm:text-4xl font-black text-[#0A142F]">
            Reservation Confirmed
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium">
            Official Reference Token: <strong className="text-[#0A142F] font-bold text-base">{b.ref}</strong>
          </p>

          <div className="mt-4 flex flex-wrap justify-center items-center gap-3 text-xs font-medium">
            <span>Booking: <StatusBadge status={b.status} /></span>
            <span className="text-slate-300">•</span>
            <span>Payment: <StatusBadge status={b.paymentStatus} /></span>
          </div>
        </div>

        {/* Booking Summary Snapshot */}
        <div className="mt-6">
          <BookingSummary
            car={b.car}
            start={b.start}
            end={b.end}
            pickup={b.pickup}
            dropoff={b.dropoff}
            extras={b.extras}
            pricing={b.pricing}
            title="Reservation Snapshot"
          />
        </div>

        {/* Handover Station Card */}
        {pStation && (
          <div className="mt-6 rounded-2xl bg-white p-5 border border-slate-200/90 text-xs text-slate-600 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <span className="font-display font-bold text-[#0A142F] text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin size={14} className="text-[#0A142F]" /> Handover Station: {pStation.name}
              </span>
              <a
                href={`tel:${pStation.phone.replace(/\s+/g, '')}`}
                className="text-blue-900 font-bold flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-md"
              >
                <Phone size={11} /> {pStation.phone}
              </a>
            </div>
            <p className="text-[#0A142F] mt-2.5 font-medium"><strong>Hub Address:</strong> {pStation.address}</p>
            <p className="text-slate-500 mt-1"><strong>Instructions:</strong> {pStation.instructions}</p>
            <p className="text-slate-400 mt-1 text-[11px]"><strong>Hours:</strong> {pStation.hours} · <strong>Landmark:</strong> {pStation.landmark}</p>
          </div>
        )}

        {/* Official PDF Tax Invoice Row */}
        <div className="mt-6 rounded-2xl bg-white p-5 border border-slate-200/90 text-xs text-slate-600 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-display font-bold text-xs uppercase tracking-wider text-[#0A142F]">
              Official Tax Invoice &amp; Dispatch Receipt
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Itemized GST breakdown and official verification registered in MySQL.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowReceipt(true)}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileText size={14} /> View Receipt
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
              title="Download official PDF invoice"
            >
              {downloadingPdf ? (
                <Loader2 size={14} className="animate-spin text-white" />
              ) : (
                <Download size={14} className="text-white" />
              )}
              <span>{downloadingPdf ? 'Generating...' : 'PDF Invoice'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          {b.paymentStatus !== 'Paid' && (
            <Link
              to={`/payment?ref=${b.ref}`}
              className="rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-6 py-2.5 text-xs font-bold tracking-wider uppercase transition shadow-sm"
            >
              Proceed to Payment Gateway
            </Link>
          )}
          <Link
            to="/dashboard"
            className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 text-xs font-bold tracking-wider uppercase transition shadow-2xs"
          >
            My Account Dashboard
          </Link>
          <Link
            to="/cars"
            className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 text-xs font-bold tracking-wider uppercase transition shadow-2xs"
          >
            Explore Other Cars
          </Link>
        </div>

        {showReceipt && (
          <BookingReceiptModal bookingRef={b.ref} onClose={() => setShowReceipt(false)} />
        )}
      </div>
    </div>
  );
}
