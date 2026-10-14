import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Info } from 'lucide-react';
import { useBookings } from '../context/BookingContext.jsx';
import BookingSummary from '../components/BookingSummary.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function BookingConfirmation() {
  const { ref } = useParams();
  const { getBooking } = useBookings();
  const b = getBooking(ref);

  if (!b) {
    return (
      <section className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
        <div>
          <h1 className="heading">Booking not found</h1>
          <p className="mt-3 text-neutral-600">No booking with reference {ref} exists in this browser.</p>
          <Link to="/cars" className="btn-dark mt-6">Browse cars</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="container-x max-w-3xl py-10">
      <div className="rounded-3xl bg-green-50 p-6 text-center">
        <CheckCircle2 size={40} className="mx-auto text-green-600" />
        <h1 className="mt-3 text-2xl font-extrabold">Demo booking confirmed</h1>
        <p className="mt-1 text-sm text-neutral-700">Reference <strong className="font-mono">{b.ref}</strong></p>
        <p className="mt-3 flex justify-center gap-2 text-sm">Booking <StatusBadge status={b.status} /> Payment <StatusBadge status={b.paymentStatus} /></p>
      </div>

      <div className="mt-6">
        <BookingSummary car={b.car} start={b.start} end={b.end} pickup={b.pickup} dropoff={b.dropoff} extras={b.extras} pricing={b.pricing} title="Your booking" />
      </div>
      <p className="mt-4 text-sm text-neutral-600">Confirmation sent to <strong>{b.customer.email}</strong> (demo: no email is actually sent).</p>
      <p className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900"><Info size={17} className="mt-0.5 shrink-0" />This is a demo booking saved only in this browser. Availability is calculated from this browser's data and is not shared between users or devices.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={`/payment?ref=${b.ref}`} className="btn-primary">Continue to payment</Link>
        <Link to="/my-bookings" className="btn-outline">My bookings</Link>
        <Link to="/cars" className="btn-outline">Browse more cars</Link>
      </div>
    </div>
  );
}
