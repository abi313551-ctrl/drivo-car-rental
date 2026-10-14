import { useEffect, useState, useRef } from 'react';
import { X, Printer, Download, CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest, downloadInvoicePdf } from '../services/api.js';
import { formatINR } from '../utils/pricing.js';
import { getLocationByName } from '../utils/locations.js';

export default function BookingReceiptModal({ bookingRef, onClose }) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    if (!bookingRef) return;
    setLoading(true);
    apiRequest(`/bookings/${bookingRef}/receipt`)
      .then((res) => setReceipt(res.receipt))
      .catch(() => setReceipt(null))
      .finally(() => setLoading(false));
  }, [bookingRef]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadInvoicePdf(bookingRef);
      toast.success('Official PDF Invoice downloaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF invoice');
    } finally {
      setDownloading(false);
    }
  };

  if (!bookingRef) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md print:p-0 print:bg-white">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#161A22] border border-[rgba(198,205,213,0.15)] text-[#F5F7FA] p-6 shadow-2xl sm:p-8 print:max-h-none print:shadow-none print:p-6 print:rounded-none print:bg-white print:text-black print:border-none">
        {/* Header Actions - hidden in print */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#75CFFF]/10 border border-[#75CFFF]/30 text-[#75CFFF]">
              <FileText size={18} />
            </span>
            <h2 className="text-lg font-black tracking-tight text-[#F5F7FA]">Tax Invoice & Receipt</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
              title="Download official PDF invoice"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              onClick={handlePrint}
              className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#C6CDD5]"
              title="Print or Save as PDF"
            >
              <Printer size={15} /> Print
            </button>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#75CFFF] border-t-transparent" />
            <p className="mt-3 text-sm text-[#C6CDD5]">Preparing official dispatch document...</p>
          </div>
        ) : !receipt ? (
          <div className="py-12 text-center">
            <AlertCircle size={36} className="mx-auto text-amber-400" />
            <p className="mt-2 text-sm text-[#C6CDD5]">Could not retrieve invoice for this booking.</p>
          </div>
        ) : (
          <div ref={printRef} className="pt-4 print:pt-0">
            {/* Invoice Top Section */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-white/10 print:border-neutral-200 pb-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#F5F7FA] print:text-black">DRIVO LUXURY MOBILITY</h1>
                <p className="text-xs text-[#C6CDD5] print:text-neutral-600 mt-0.5">{receipt.company.address}</p>
                <p className="text-xs text-[#C6CDD5] print:text-neutral-600 font-mono">GSTIN: {receipt.company.taxId} · {receipt.company.supportEmail}</p>
              </div>
              <div className="sm:text-right">
                <span className="inline-block rounded-lg bg-white/5 border border-white/10 print:bg-neutral-100 print:border-neutral-200 px-3 py-1 font-mono text-xs font-bold text-[#75CFFF] print:text-black">
                  {receipt.invoiceNumber}
                </span>
                <p className="mt-1 text-xs text-[#C6CDD5] print:text-neutral-600">Booking Ref: <strong className="font-mono text-[#F5F7FA] print:text-black">{receipt.bookingRef}</strong></p>
                <p className="text-xs text-[#C6CDD5] print:text-neutral-600">Date: {receipt.invoiceDate}</p>
              </div>
            </div>

            {/* Status Strip */}
            <div className="my-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#1B2028] border border-white/5 print:bg-neutral-50 print:border-neutral-200 p-3 text-xs">
              <div>
                <span className="text-[#C6CDD5] print:text-neutral-500">Booking Status: </span>
                <strong className={`font-bold font-mono ${receipt.status === 'Cancelled' ? 'text-rose-400 print:text-red-600' : 'text-emerald-400 print:text-green-700'}`}>
                  {receipt.status}
                </strong>
              </div>
              <div>
                <span className="text-[#C6CDD5] print:text-neutral-500">Payment Status: </span>
                <strong className={`font-bold font-mono ${receipt.paymentStatus === 'Paid' ? 'text-emerald-400 print:text-green-700' : receipt.paymentStatus === 'Refunded' ? 'text-[#C6CDD5] print:text-neutral-600' : 'text-amber-400 print:text-amber-700'}`}>
                  {receipt.paymentStatus.toUpperCase()}
                </strong>
              </div>
              <div>
                <span className="text-[#C6CDD5] print:text-neutral-500">Method: </span>
                <span className="font-semibold text-[#F5F7FA] print:text-black">{receipt.paymentMethod}</span>
              </div>
            </div>

            {/* Customer & Vehicle Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-white/10 print:border-neutral-200 pb-6 text-xs">
              <div>
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#75CFFF] print:text-neutral-500 mb-2">Billed To</h3>
                <p className="font-black text-sm text-[#F5F7FA] print:text-black">{receipt.customer.name}</p>
                <p className="text-[#C6CDD5] print:text-neutral-600 mt-0.5">{receipt.customer.email}</p>
                <p className="text-[#C6CDD5] print:text-neutral-600">{receipt.customer.phone}</p>
                {receipt.customer.license && (
                  <p className="text-[#C6CDD5] print:text-neutral-500 mt-1">Driving Licence: <span className="font-mono text-[#F5F7FA] print:text-black">{receipt.customer.license}</span></p>
                )}
              </div>
              <div>
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#75CFFF] print:text-neutral-500 mb-2">Vehicle Reserved</h3>
                <p className="font-black text-sm text-[#F5F7FA] print:text-black">{receipt.vehicle.name}</p>
                <p className="text-[#C6CDD5] print:text-neutral-600 mt-0.5">{receipt.vehicle.category} · {receipt.vehicle.transmission} · {receipt.vehicle.fuel}</p>
                <p className="text-[#C6CDD5] print:text-neutral-600 font-mono">Daily Rate: {formatINR(receipt.vehicle.ratePerDay)} / day</p>
              </div>
            </div>

            {/* Trip Schedule */}
            <div className="py-4 border-b border-white/10 print:border-neutral-200 text-xs">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#75CFFF] print:text-neutral-500 mb-2">Rental Schedule & Stations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-[#1B2028] border border-white/5 p-3 print:bg-transparent print:border-none print:p-0">
                  <span className="text-[#C6CDD5] print:text-neutral-500 block text-[11px]">Pickup Station:</span>
                  <span className="font-bold text-[#F5F7FA] print:text-black">{receipt.schedule.pickupLocation}</span>
                  {(() => {
                    const loc = getLocationByName(receipt.schedule.pickupLocation);
                    return loc ? <span className="block text-[11px] text-[#C6CDD5] print:text-neutral-500 mt-0.5">{loc.address}</span> : null;
                  })()}
                  <span className="font-mono text-[11px] text-[#75CFFF] print:text-neutral-700 block mt-1.5">{new Date(receipt.schedule.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className="rounded-xl bg-[#1B2028] border border-white/5 p-3 print:bg-transparent print:border-none print:p-0">
                  <span className="text-[#C6CDD5] print:text-neutral-500 block text-[11px]">Return Station:</span>
                  <span className="font-bold text-[#F5F7FA] print:text-black">{receipt.schedule.dropoffLocation}</span>
                  {(() => {
                    const loc = getLocationByName(receipt.schedule.dropoffLocation);
                    return loc ? <span className="block text-[11px] text-[#C6CDD5] print:text-neutral-500 mt-0.5">{loc.address}</span> : null;
                  })()}
                  <span className="font-mono text-[11px] text-[#75CFFF] print:text-neutral-700 block mt-1.5">{new Date(receipt.schedule.endTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className="rounded-xl bg-[#1B2028] border border-white/5 p-3 print:bg-transparent print:border-none print:p-0">
                  <span className="text-[#C6CDD5] print:text-neutral-500 block text-[11px]">Duration:</span>
                  <span className="font-bold font-mono text-[#F5F7FA] print:text-black">{receipt.schedule.days} day(s)</span>
                  {(() => {
                    const loc = getLocationByName(receipt.schedule.pickupLocation);
                    return loc ? <span className="block text-[11px] text-emerald-400 print:text-emerald-700 font-medium mt-1">Desk: {loc.hours}</span> : null;
                  })()}
                </div>
              </div>
            </div>

            {/* Itemized Charges */}
            <div className="pt-4 text-xs">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#75CFFF] print:text-neutral-500 mb-3">Itemized Charges</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-[#C6CDD5] print:text-neutral-700">
                  <span>Base Vehicle Rental ({receipt.schedule.days} days)</span>
                  <span className="font-mono text-[#F5F7FA] print:text-black">{formatINR(receipt.charges.baseRental)}</span>
                </div>
                {receipt.charges.extras > 0 && (
                  <div className="flex justify-between text-[#C6CDD5] print:text-neutral-700">
                    <span>Optional Extras & Cover</span>
                    <span className="font-mono text-[#F5F7FA] print:text-black">{formatINR(receipt.charges.extras)}</span>
                  </div>
                )}
                {receipt.charges.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 print:text-green-700 font-semibold">
                    <span>Coupon Discount Applied</span>
                    <span className="font-mono">-{formatINR(receipt.charges.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#C6CDD5] print:text-neutral-700">
                  <span>Goods & Services Tax (GST 18%)</span>
                  <span className="font-mono text-[#F5F7FA] print:text-black">{formatINR(receipt.charges.gst)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Refundable Security Deposit (Held on card)</span>
                  <span className="font-mono text-[#F5F7FA] print:text-black">{formatINR(receipt.charges.securityDeposit)}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 print:border-neutral-300 pt-3 text-base font-black text-[#F5F7FA] print:text-black">
                  <span>Total Amount</span>
                  <span className="font-mono text-lg text-[#75CFFF] print:text-black">{formatINR(receipt.charges.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="mt-8 border-t border-white/10 print:border-neutral-100 pt-4 text-[11px] text-[#C6CDD5] print:text-neutral-500 text-center">
              <p>Thank you for choosing Drivo. Valid driving licence and original ID verification mandatory at car handover.</p>
              <p className="mt-1 font-mono text-[10px]">Computer-generated dispatch document · Verified 2027 cryptographic token.</p>
            </div>

            {/* Download CTA Bar */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-[#1B2028] p-4 border border-white/10 print:hidden">
              <div>
                <p className="text-xs font-bold text-[#F5F7FA]">Official PDF Document</p>
                <p className="text-[11px] text-[#C6CDD5]">Includes verified GST tax breakdown, payment timestamp, and booking itinerary.</p>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="btn-primary text-xs py-2 px-4 shrink-0 flex items-center justify-center gap-1.5"
              >
                {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {downloading ? 'Downloading...' : 'Download PDF Invoice'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
