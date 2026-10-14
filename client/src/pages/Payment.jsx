import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Smartphone, Building2, ShieldAlert, CheckCircle2, Lock, Zap } from 'lucide-react';
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
      <section className="container-x grid min-h-[60vh] place-items-center py-20 text-center text-[#F5F7FA]">
        <div>
          <h1 className="heading">Booking Reference Unresolved</h1>
          <p className="mt-3 text-xs sm:text-sm text-[#C6CDD5]/70">
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
    <div className="container-x py-10 text-[#F5F7FA]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 text-[11px] font-mono font-bold text-amber-300">
            <ShieldAlert size={13} /> SECURE SANDBOX GATEWAY — NO ACTUAL CHARGES INCURRED
          </span>
          <h1 className="heading mt-2.5">Finalize Reservation Tariff</h1>
          <p className="mt-1 text-xs font-mono text-[#C6CDD5]/70 flex items-center gap-2">
            <span>Reference: <strong className="text-[#F5F7FA]">{booking.ref}</strong></span>
            <span>·</span>
            <span>Status: <StatusBadge status={booking.paymentStatus} /></span>
          </p>
        </div>
        <Link to={`/booking/confirmation/${booking.ref}`} className="btn-outline text-xs">
          Return to Summary
        </Link>
      </div>

      {booking.paymentStatus === 'Paid' ? (
        <div className="rounded-2xl border border-[#75CFFF]/30 bg-[#161A22] p-8 text-center shadow-2xl">
          <CheckCircle2 size={44} className="mx-auto text-[#75CFFF]" />
          <h2 className="mt-3 font-display text-2xl font-bold text-[#F5F7FA]">Reservation Paid & Confirmed</h2>
          <p className="mt-1 text-xs text-[#C6CDD5]/80 font-mono">
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
            <div className="rounded-2xl border border-[rgba(198,205,213,0.14)] bg-[#1B2028] p-6 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(198,205,213,0.08)] pb-3">
                <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#F5F7FA]">
                  Select Payment Rail
                </h2>
                <button
                  type="button"
                  onClick={fillTestCard}
                  className="text-xs font-mono font-bold text-[#75CFFF] hover:underline"
                >
                  ⚡ Auto-fill Test Card
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {METHODS.map(({ id, label, icon: Icon, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setMethod(id); setErrors({}); }}
                    className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                      method === id
                        ? 'border-[#75CFFF] bg-[#75CFFF]/10 shadow-sm'
                        : 'border-[rgba(198,205,213,0.12)] bg-[#161A22] hover:border-[rgba(198,205,213,0.25)]'
                    }`}
                  >
                    <Icon size={18} className={method === id ? 'text-[#75CFFF]' : 'text-[#C6CDD5]/60'} />
                    <span className="mt-2 font-display font-bold text-xs text-[#F5F7FA]">{label}</span>
                    <span className="text-[10px] text-[#C6CDD5]/50 mt-0.5">{desc}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-[rgba(198,205,213,0.08)] pt-6">
                {method === 'Card' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="card-num" className="mb-1 block text-xs font-mono font-medium text-[#C6CDD5]">
                        Sandbox Card Number (16 Digits)
                      </label>
                      <input
                        id="card-num"
                        className="field font-mono text-xs bg-[#161A22]"
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        value={card.number}
                        onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))}
                      />
                      {errors.number && <p className="field-error">{errors.number}</p>}
                    </div>

                    <div>
                      <label htmlFor="card-name" className="mb-1 block text-xs font-mono font-medium text-[#C6CDD5]">
                        Cardholder Name
                      </label>
                      <input
                        id="card-name"
                        className="field text-xs bg-[#161A22]"
                        placeholder="Priya Raman"
                        value={card.name}
                        onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                      />
                      {errors.name && <p className="field-error">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="card-exp" className="mb-1 block text-xs font-mono font-medium text-[#C6CDD5]">
                          Expiry (MM/YY)
                        </label>
                        <input
                          id="card-exp"
                          className="field font-mono text-xs bg-[#161A22]"
                          placeholder="08/28"
                          maxLength={5}
                          value={card.expiry}
                          onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))}
                        />
                        {errors.expiry && <p className="field-error">{errors.expiry}</p>}
                      </div>
                      <div>
                        <label htmlFor="card-cvv" className="mb-1 block text-xs font-mono font-medium text-[#C6CDD5]">
                          Security CVV
                        </label>
                        <input
                          id="card-cvv"
                          type="password"
                          className="field font-mono text-xs bg-[#161A22]"
                          placeholder="424"
                          maxLength={4}
                          value={card.cvv}
                          onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value }))}
                        />
                        {errors.cvv && <p className="field-error">{errors.cvv}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {method === 'UPI' && (
                  <div>
                    <label htmlFor="upi-id" className="mb-1 block text-xs font-mono font-medium text-[#C6CDD5]">
                      Virtual Payment Address (UPI VPA)
                    </label>
                    <input
                      id="upi-id"
                      className="field text-xs bg-[#161A22]"
                      placeholder="username@okaxis"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    {errors.upiId && <p className="field-error">{errors.upiId}</p>}
                  </div>
                )}

                {method === 'NetBanking' && (
                  <div>
                    <label htmlFor="bank-select" className="mb-1 block text-xs font-mono font-medium text-[#C6CDD5]">
                      Select Banking Gateway
                    </label>
                    <select
                      id="bank-select"
                      className="field text-xs bg-[#161A22]"
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                    >
                      {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank'].map((b) => (
                        <option key={b} value={b} className="bg-[#161A22] text-[#F5F7FA]">{b}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[rgba(198,205,213,0.08)] pt-6">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handlePay(false)}
                  className="btn-primary flex-1 py-3 text-xs font-mono font-bold tracking-wider"
                >
                  <Lock size={14} />
                  {processing ? 'Processing Digital Authorization...' : `Pay ${formatINR(booking.pricing?.total)} (Simulated)`}
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handlePay(true)}
                  className="btn-outline text-xs py-3"
                >
                  Simulate Gateway Reject
                </button>
              </div>

              <p className="mt-4 text-[11px] font-mono text-[#C6CDD5]/50">
                Notice: Sandbox testing environment. Real financial card details should never be entered.
              </p>
            </div>
          </div>

          <aside>
            <BookingSummary
              car={booking.car}
              start={booking.start}
              end={booking.end}
              pickup={booking.pickup}
              dropoff={booking.dropoff}
              extras={booking.extras}
              pricing={booking.pricing}
              title="Reservation Summary"
            />
          </aside>
        </div>
      )}
    </div>
  );
}
