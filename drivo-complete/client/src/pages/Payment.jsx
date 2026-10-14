import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Smartphone, Building2, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBookings } from '../context/BookingContext.jsx';
import BookingSummary from '../components/BookingSummary.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatINR } from '../utils/pricing.js';

const METHODS = [
  { id: 'Card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
  { id: 'UPI', label: 'UPI Instant Pay', icon: Smartphone, desc: 'GPay, PhonePe, Paytm' },
  { id: 'NetBanking', label: 'Net Banking', icon: Building2, desc: 'All major Indian banks' },
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
      <section className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
        <div>
          <h1 className="heading">Booking reference not found</h1>
          <p className="mt-3 text-neutral-600">Select an active booking from your bookings list to complete payment.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/my-bookings" className="btn-primary">Go to My Bookings</Link>
            <Link to="/cars" className="btn-outline">Browse cars</Link>
          </div>
        </div>
      </section>
    );
  }

  const validate = () => {
    const e = {};
    if (method === 'Card') {
      const digits = card.number.replace(/\s+/g, '');
      if (!/^\d{16}$/.test(digits)) e.number = 'Enter a 16-digit mock card number';
      if (!card.name.trim() || card.name.trim().length < 3) e.name = 'Enter the cardholder name';
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry.trim())) e.expiry = 'Use MM/YY format';
      if (!/^\d{3,4}$/.test(card.cvv.trim())) e.cvv = 'Enter 3 or 4 digit CVV';
    } else if (method === 'UPI') {
      if (!/^[\w.-]+@[\w.-]+$/.test(upiId.trim())) e.upiId = 'Enter a valid UPI ID (e.g. demo@upi)';
    }
    return e;
  };

  const handlePay = async (simulateFailure = false) => {
    if (!simulateFailure) {
      const e = validate();
      setErrors(e);
      if (Object.keys(e).length) {
        toast.error('Please check the payment fields');
        return;
      }
    }

    setProcessing(true);
    try {
      const status = simulateFailure ? 'Failed' : 'Paid';
      await updatePayment(booking.ref, { paymentMethod: method, paymentStatus: status });
      if (simulateFailure) {
        toast.error('Mock payment failure simulated');
      } else {
        toast.success('Mock payment completed!');
        navigate(`/booking/confirmation/${booking.ref}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const fillTestCard = () => {
    setMethod('Card');
    setCard({ number: '4242 4242 4242 4242', name: booking.customer?.fullName || 'Priya Raman', expiry: '08/28', cvv: '424' });
    setErrors({});
  };

  return (
    <div className="container-x py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            <ShieldAlert size={14} /> MOCK PAYMENT GATEWAY — NO REAL MONEY CHARGED
          </span>
          <h1 className="heading mt-2">Complete payment</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Booking reference <strong className="font-mono">{booking.ref}</strong> · Current status: <StatusBadge status={booking.paymentStatus} />
          </p>
        </div>
        <Link to={`/booking/confirmation/${booking.ref}`} className="btn-outline">Back to booking</Link>
      </div>

      {booking.paymentStatus === 'Paid' ? (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center">
          <CheckCircle2 size={44} className="mx-auto text-green-600" />
          <h2 className="mt-3 text-2xl font-extrabold text-green-950">This booking is already paid</h2>
          <p className="mt-1 text-sm text-green-800">
            Paid {formatINR(booking.pricing?.total)} via {booking.paymentMethod || 'Mock Gateway'}.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/my-bookings" className="btn-primary">View My Bookings</Link>
            <Link to={`/booking/confirmation/${booking.ref}`} className="btn-outline">View Confirmation</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">Select mock payment method</h2>
                <button type="button" onClick={fillTestCard} className="text-xs font-bold text-accent hover:underline">
                  Auto-fill test card
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {METHODS.map(({ id, label, icon: Icon, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setMethod(id); setErrors({}); }}
                    className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                      method === id ? 'border-accent bg-accent-soft/60' : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <Icon size={20} className={method === id ? 'text-accent' : 'text-neutral-600'} />
                    <span className="mt-2 font-bold text-sm">{label}</span>
                    <span className="text-xs text-neutral-500">{desc}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-neutral-200 pt-6">
                {method === 'Card' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="card-num" className="mb-1 block text-xs font-semibold text-neutral-600">Mock Card Number (16 digits)</label>
                      <input
                        id="card-num"
                        className="field font-mono"
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        value={card.number}
                        onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))}
                      />
                      {errors.number && <p className="field-error">{errors.number}</p>}
                    </div>
                    <div>
                      <label htmlFor="card-name" className="mb-1 block text-xs font-semibold text-neutral-600">Name on card</label>
                      <input
                        id="card-name"
                        className="field"
                        placeholder="Priya Raman"
                        value={card.name}
                        onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                      />
                      {errors.name && <p className="field-error">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="card-exp" className="mb-1 block text-xs font-semibold text-neutral-600">Expiry (MM/YY)</label>
                        <input
                          id="card-exp"
                          className="field font-mono"
                          placeholder="08/28"
                          maxLength={5}
                          value={card.expiry}
                          onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))}
                        />
                        {errors.expiry && <p className="field-error">{errors.expiry}</p>}
                      </div>
                      <div>
                        <label htmlFor="card-cvv" className="mb-1 block text-xs font-semibold text-neutral-600">CVV</label>
                        <input
                          id="card-cvv"
                          type="password"
                          className="field font-mono"
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
                    <label htmlFor="upi-id" className="mb-1 block text-xs font-semibold text-neutral-600">Virtual Payment Address (UPI ID)</label>
                    <input
                      id="upi-id"
                      className="field"
                      placeholder="username@okaxis"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    {errors.upiId && <p className="field-error">{errors.upiId}</p>}
                  </div>
                )}

                {method === 'NetBanking' && (
                  <div>
                    <label htmlFor="bank-select" className="mb-1 block text-xs font-semibold text-neutral-600">Select Bank</label>
                    <select id="bank-select" className="field" value={bank} onChange={(e) => setBank(e.target.value)}>
                      {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank'].map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handlePay(false)}
                  className="btn-primary flex-1 py-3"
                >
                  <Lock size={16} />
                  {processing ? 'Processing...' : `Pay ${formatINR(booking.pricing?.total)} (Simulated)`}
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handlePay(true)}
                  className="btn-outline text-xs"
                >
                  Simulate Failed Payment
                </button>
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                Note: This is a clearly labelled mock payment flow for testing and demonstration. Do not enter real financial credentials.
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
              title="Order summary"
            />
          </aside>
        </div>
      )}
    </div>
  );
}
