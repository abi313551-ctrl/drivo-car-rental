import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Smartphone, Building2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBookings } from '../context/BookingContext.jsx';
import BookingSummary from '../components/BookingSummary.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatINR } from '../utils/pricing.js';

const METHODS = [
  { id: 'Card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
  { id: 'UPI', label: 'UPI Instant Pay', icon: Smartphone, desc: 'GPay, PhonePe, Paytm, BHIM' },
  { id: 'NetBanking', label: 'Net Banking', icon: Building2, desc: 'All Major Indian Banks' },
];

export default function Payment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ref = params.get('ref');
  const { getBooking, updatePayment } = useBookings();
  const booking = getBooking(ref);

  const [method, setMethod] = useState('Card');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [upiId, setUpiId] = useState('');
  const [bank, setBank] = useState('HDFC Bank');
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  if (!booking) {
    return (
      <section className="container-x grid min-h-[60vh] place-items-center py-20 text-center text-[#0F172A]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-[#0A142F]">Booking Reference Unresolved</h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Please select an active reservation from your dashboard to complete dispatch payment.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/my-bookings" className="btn-primary text-xs">My Bookings</Link>
            <Link to="/cars" className="btn-outline text-xs">Explore Fleet</Link>
          </div>
        </div>
      </section>
    );
  }

  const validate = () => {
    const e = {};
    if (method === 'Card') {
      const digits = card.number.replace(/\s+/g, '');
      if (!/^\d{16}$/.test(digits)) e.number = 'Enter a valid 16-digit test card number';
      if (!card.name.trim() || card.name.trim().length < 3) e.name = 'Enter cardholder name';
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry.trim())) e.expiry = 'MM/YY format required';
      if (!/^\d{3,4}$/.test(card.cvv.trim())) e.cvv = 'Enter 3 or 4 digit CVV';
    } else if (method === 'UPI') {
      if (!/^[\w.-]+@[\w.-]+$/.test(upiId.trim())) e.upiId = 'Enter a valid UPI ID (e.g. driver@upi)';
    }
    return e;
  };

  const handlePay = async (simulateFailure = false) => {
    if (!simulateFailure) {
      const e = validate();
      setErrors(e);
      if (Object.keys(e).length) {
        toast.error('Please resolve the highlighted payment fields');
        return;
      }
    }

    setProcessing(true);
    try {
      const status = simulateFailure ? 'Failed' : 'Paid';
      await updatePayment(booking.ref, { paymentMethod: method, paymentStatus: status });
      if (simulateFailure) {
        toast.error('Mock payment failure recorded');
      } else {
        toast.success('Mock payment verified successfully!');
        navigate(`/booking/confirmation/${booking.ref}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const fillTestCard = () => {
    setMethod('Card');
    setCard({
      number: '4242 4242 4242 4242',
      name: booking.customer?.fullName || 'Priya Raman',
      expiry: '08/28',
      cvv: '424',
    });
    setErrors({});
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-[#0F172A] py-10 sm:py-14">
      <div className="container-x">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-[11px] font-bold text-amber-900">
              <ShieldAlert size={13} className="text-amber-700" /> SECURE SANDBOX GATEWAY — NO ACTUAL CHARGES INCURRED
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-[#0A142F] tracking-tight mt-3">
              Finalize Reservation Tariff
            </h1>
            <p className="mt-1 text-xs text-slate-500 flex items-center gap-2 font-medium">
              <span>Reference: <strong className="text-[#0A142F]">{booking.ref}</strong></span>
              <span>·</span>
              <span>Status: <StatusBadge status={booking.paymentStatus} /></span>
            </p>
          </div>
          <Link to={`/booking/confirmation/${booking.ref}`} className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs">
            Return to Summary
          </Link>
        </div>

        {booking.paymentStatus === 'Paid' ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-sm max-w-xl mx-auto">
            <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
            <h2 className="mt-4 font-display text-2xl font-bold text-[#0A142F]">Reservation Paid &amp; Confirmed</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Settled {formatINR(booking.pricing?.total)} via {booking.paymentMethod || 'Mock Gateway'}.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/my-bookings" className="btn-primary text-xs">View My Bookings</Link>
              <Link to={`/booking/confirmation/${booking.ref}`} className="btn-outline text-xs">Confirmation Details</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#0A142F]">
                    Select Payment Rail
                  </h2>
                  <button
                    type="button"
                    onClick={fillTestCard}
                    className="text-xs font-bold text-blue-900 hover:underline cursor-pointer"
                  >
                    ⚡ Auto-fill Test Card
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {METHODS.map(({ id, label, icon: Icon, desc }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { setMethod(id); setErrors({}); }}
                      className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                        method === id
                          ? 'border-[#0A142F] bg-blue-50/25 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <Icon size={18} className={method === id ? 'text-[#0A142F]' : 'text-slate-400'} />
                      <span className="mt-2.5 font-display font-bold text-xs text-[#0A142F]">{label}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{desc}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-6">
                  {method === 'Card' && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="card-num" className="mb-1 block text-xs font-bold text-slate-700">
                          Sandbox Card Number (16 Digits)
                        </label>
                        <input
                          id="card-num"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-mono font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none"
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          value={card.number}
                          onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))}
                        />
                        {errors.number && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.number}</p>}
                      </div>

                      <div>
                        <label htmlFor="card-name" className="mb-1 block text-xs font-bold text-slate-700">
                          Cardholder Name
                        </label>
                        <input
                          id="card-name"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none"
                          placeholder="Priya Raman"
                          value={card.name}
                          onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                        />
                        {errors.name && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.name}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="card-exp" className="mb-1 block text-xs font-bold text-slate-700">
                            Expiry (MM/YY)
                          </label>
                          <input
                            id="card-exp"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-mono font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none"
                            placeholder="08/28"
                            maxLength={5}
                            value={card.expiry}
                            onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))}
                          />
                          {errors.expiry && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.expiry}</p>}
                        </div>

                        <div>
                          <label htmlFor="card-cvv" className="mb-1 block text-xs font-bold text-slate-700">
                            CVV
                          </label>
                          <input
                            id="card-cvv"
                            type="password"
                            maxLength={4}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-mono font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none"
                            placeholder="424"
                            value={card.cvv}
                            onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value }))}
                          />
                          {errors.cvv && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.cvv}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {method === 'UPI' && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="upi-id" className="mb-1 block text-xs font-bold text-slate-700">
                          Virtual Payment Address (UPI ID)
                        </label>
                        <input
                          id="upi-id"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-mono font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none"
                          placeholder="driver@okhdfcbank"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                        {errors.upiId && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.upiId}</p>}
                      </div>
                      <p className="text-xs text-slate-500">
                        A test mandate request will be simulated and approved instantly.
                      </p>
                    </div>
                  )}

                  {method === 'NetBanking' && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="nb-bank" className="mb-1 block text-xs font-bold text-slate-700">
                          Select Banking Partner
                        </label>
                        <select
                          id="nb-bank"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none cursor-pointer"
                          value={bank}
                          onChange={(e) => setBank(e.target.value)}
                        >
                          <option value="HDFC Bank">HDFC Bank</option>
                          <option value="ICICI Bank">ICICI Bank</option>
                          <option value="State Bank of India">State Bank of India</option>
                          <option value="Axis Bank">Axis Bank</option>
                          <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => handlePay(false)}
                      className="flex-1 rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white py-3.5 text-xs font-bold tracking-wider uppercase transition shadow-sm cursor-pointer disabled:opacity-40"
                    >
                      {processing ? 'Processing Settlement...' : `Authorize ${formatINR(booking.pricing?.total)}`}
                    </button>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => handlePay(true)}
                      className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-5 py-3 text-xs font-bold transition cursor-pointer"
                    >
                      Simulate Failure
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <BookingSummary
                car={booking.car}
                start={booking.start}
                end={booking.end}
                pickup={booking.pickup}
                dropoff={booking.dropoff}
                extras={booking.extras}
                pricing={booking.pricing}
                title="Tariff Breakdown"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
