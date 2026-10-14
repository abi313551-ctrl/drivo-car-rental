import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Info, FileText, ArrowRight, Download, Loader2, MapPin, Phone, Zap } from 'lucide-react';
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
      <div className="container-x py-24 text-center text-[#F5F7FA]">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#75CFFF] border-t-transparent" />
        <p className="mt-3 text-xs font-mono text-[#C6CDD5]/60">Verifying reservation record...</p>
      </div>
    );
  }

  if (!b) {
    return (
      <section className="container-x grid min-h-[60vh] place-items-center py-20 text-center text-[#F5F7FA]">
        <div>
          <h1 className="heading">Reservation Not Found</h1>
          <p className="mt-3 text-xs sm:text-sm text-[#C6CDD5]/70">No booking record matching reference {ref} exists in MySQL.</p>
          <Link to="/cars" className="btn-primary mt-6 text-xs inline-block">Return to Fleet</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="container-x max-w-3xl py-10 text-[#F5F7FA]">
      {/* Confirmed Banner */}
      <div className="rounded-2xl bg-[#1B2028] p-7 text-center border border-[#75CFFF]/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#75CFFF]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#111318] border border-[#75CFFF]/40 text-[#75CFFF] mx-auto shadow-md">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="mt-4 font-display text-2xl sm:text-3xl font-extrabold text-[#F5F7FA]">
          Reservation Confirmed
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-[#C6CDD5]/80 font-mono">
          Official Reference Token: <strong className="text-[#75CFFF] text-base">{b.ref}</strong>
        </p>

        <div className="mt-4 flex flex-wrap justify-center items-center gap-2.5 text-xs font-mono">
          <span>Booking: <StatusBadge status={b.status} /></span>
          <span className="text-[#C6CDD5]/30">•</span>
          <span>Payment: <StatusBadge status={b.paymentStatus} /></span>
        </div>
      </div>

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

      {(() => {
        const pStation = getLocationByName(b.pickup);
        if (!pStation) return null;
        return (
          <div className="mt-4 rounded-xl bg-[#161A22] p-5 border border-[rgba(198,205,213,0.12)] text-xs text-[#C6CDD5]/80">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[rgba(198,205,213,0.08)]">
              <span className="font-display font-bold text-[#F5F7FA] text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin size={14} className="text-[#75CFFF]" /> Handover Station: {pStation.name}
              </span>
              <a
                href={`tel:${pStation.phone.replace(/\s+/g, '')}`}
                className="text-[#75CFFF] font-mono font-bold flex items-center gap-1 bg-[#75CFFF]/10 px-2.5 py-1 rounded-md border border-[#75CFFF]/20"
              >
                <Phone size={11} /> {pStation.phone}
              </a>
            </div>
            <p className="text-[#F5F7FA] mt-2.5 font-medium"><strong>Hub Address:</strong> {pStation.address}</p>
            <p className="text-[#C6CDD5]/70 mt-1"><strong>Instructions:</strong> {pStation.instructions}</p>
            <p className="text-[#C6CDD5]/50 mt-1 font-mono text-[11px]"><strong>Hours:</strong> {pStation.hours} · <strong>Landmark:</strong> {pStation.landmark}</p>
          </div>
        );
      })()}

      <div className="mt-4 rounded-xl bg-[#1B2028] p-5 border border-[rgba(198,205,213,0.12)] text-xs text-[#C6CDD5]/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-display font-bold text-xs uppercase tracking-wider text-[#F5F7FA]">
            Official Tax Invoice & Dispatch Receipt
          </p>
          <p className="text-[11px] text-[#C6CDD5]/60 mt-0.5">
            Cryptographically sealed and registered in MySQL with itemized GST breakdown.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowReceipt(true)}
            className="btn-outline text-xs flex items-center gap-1.5 px-3.5 py-2"
          >
            <FileText size={14} /> View Receipt
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="btn-primary text-xs flex items-center gap-1.5 px-3.5 py-2"
            title="Download official PDF invoice"
          >
            {downloadingPdf ? (
              <Loader2 size={14} className="animate-spin text-[#111318]" />
            ) : (
              <Download size={14} className="text-[#111318]" />
            )}
            <span>{downloadingPdf ? 'Generating...' : 'PDF Invoice'}</span>
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {b.paymentStatus !== 'Paid' && (
          <Link to={`/payment?ref=${b.ref}`} className="btn-primary text-xs">
            Proceed to Payment Gateway
          </Link>
        )}
        <Link to="/dashboard" className="btn-outline text-xs">
          My Account Dashboard
        </Link>
        <Link to="/cars" className="btn-outline text-xs">
          Explore Other Cars
        </Link>
      </div>

      {showReceipt && (
        <BookingReceiptModal bookingRef={b.ref} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
}
