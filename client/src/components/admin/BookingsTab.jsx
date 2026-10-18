import React from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  MapPin,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import { formatINR } from '../../utils/pricing.js';
import StatusBadge from '../StatusBadge.jsx';
import CarImage from '../CarImage.jsx';

export default function BookingsTab({
  bookings = [],
  filteredBookings = [],
  bookingSearch,
  setBookingSearch,
  bookingFilter,
  setBookingFilter,
  bookingDateFilter,
  setBookingDateFilter,
  setSelectedDetailBooking,
  setReceiptRef,
  handleUpdateBookingStatus,
}) {
  const pendingCount = bookings.filter((b) => b.status === 'Pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'Confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'Completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'Cancelled').length;

  return (
    <div className="space-y-6">
      {/* TOOLBAR & CONTROLS */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Search reference, customer name, email, vehicle..."
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs text-[#0A142F] focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
            />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-500 font-semibold flex items-center gap-1">
              <Calendar size={13} className="text-blue-600" /> Date:
            </span>
            <input
              type="date"
              value={bookingDateFilter}
              onChange={(e) => setBookingDateFilter(e.target.value)}
              className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 font-mono focus:bg-white focus:border-blue-500 transition outline-none"
              title="Filter by rental pickup date"
            />
            {bookingDateFilter && (
              <button
                type="button"
                onClick={() => setBookingDateFilter('')}
                className="text-[11px] font-mono text-rose-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'all', label: 'All Bookings', count: bookings.length },
              { key: 'Pending', label: 'Pending Review', count: pendingCount, isAlert: pendingCount > 0 },
              { key: 'Confirmed', label: 'Confirmed', count: confirmedCount },
              { key: 'Completed', label: 'Completed', count: completedCount },
              { key: 'Cancelled', label: 'Cancelled', count: cancelledCount },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setBookingFilter(tab.key)}
                className={`rounded-xl px-3 py-1.5 font-mono text-xs font-semibold transition flex items-center gap-2 ${
                  bookingFilter === tab.key
                    ? 'bg-[#0A142F] text-white shadow-xs font-bold'
                    : tab.isAlert
                    ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-50 text-slate-600 hover:text-[#0A142F] border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    bookingFilter === tab.key
                      ? 'bg-white/20 text-white'
                      : tab.isAlert
                      ? 'bg-amber-200 text-amber-900 font-bold'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <span className="font-mono text-xs text-slate-500">
            Showing <strong>{filteredBookings.length}</strong> reservations
          </span>
        </div>
      </div>

      {/* BOOKINGS TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/90 border-b border-slate-200 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="py-3.5 px-4">Booking Ref</th>
              <th className="py-3.5 px-4">Customer Details</th>
              <th className="py-3.5 px-4">Vehicle Reserved</th>
              <th className="py-3.5 px-4">Kanniyakumari Hub & Dates</th>
              <th className="py-3.5 px-4 text-right">Total Amount</th>
              <th className="py-3.5 px-4 text-center">Status & Payment</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((b) => (
                <tr key={b.id || b.ref} className="hover:bg-slate-50/70 transition">
                  {/* Reference */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-blue-700 text-xs">
                      {b.ref}
                    </span>
                    <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                      Booked:{' '}
                      {b.createdAt
                        ? new Date(b.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </p>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-sm text-[#0A142F]">
                      {b.customer?.fullName || 'Guest Customer'}
                    </p>
                    <p className="text-slate-500 text-[11px]">{b.customer?.email}</p>
                    <p className="font-mono text-slate-400 text-[10px]">
                      {b.customer?.phone || 'No phone'}
                    </p>
                  </td>

                  {/* Car */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-14 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                        <CarImage src={b.car?.image} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-[#0A142F]">
                          {b.car?.brand} {b.car?.model}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500">
                            #{b.car?.id || b.carId} · {b.car?.category}
                          </span>
                          {b.car?.registrationNumber && (
                            <span className="rounded bg-amber-50 border border-amber-300 px-1 py-0.2 font-mono text-[9px] font-bold text-amber-900">
                              {b.car.registrationNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Hub & Dates */}
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    <div className="flex items-center gap-1 font-semibold text-[#0A142F]">
                      <MapPin size={12} className="text-blue-600 shrink-0" />
                      <span>{b.pickup}</span>
                      {b.dropoff && b.dropoff !== b.pickup && (
                        <span className="text-[10px] text-slate-400">&rarr; {b.dropoff}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {new Date(b.start).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      <br />
                      &rarr;{' '}
                      {new Date(b.end).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {b.pricing?.days && (
                      <span className="inline-block mt-0.5 text-[10px] text-blue-700 font-bold">
                        {b.pricing.days} {b.pricing.days === 1 ? 'day' : 'days'}
                      </span>
                    )}
                  </td>

                  {/* Total */}
                  <td className="py-3.5 px-4 font-mono font-black text-right text-sm text-blue-700">
                    {formatINR(b.pricing?.total || 0)}
                  </td>

                  {/* Status & Payment */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <StatusBadge status={b.status} />
                      <span
                        className={`font-mono text-[10px] font-semibold ${
                          b.paymentStatus === 'Paid'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        Payment: {b.paymentStatus || 'Pending'}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailBooking(b)}
                        className="btn-outline px-2.5 py-1 text-[11px] flex items-center gap-1 text-slate-700 hover:text-[#0A142F]"
                        title="Inspect full booking specifications"
                      >
                        <Eye size={12} /> Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceiptRef(b.ref)}
                        className="btn-outline px-2.5 py-1 text-[11px] flex items-center gap-1 text-slate-700 hover:text-[#0A142F]"
                        title="View printable tax invoice"
                      >
                        <FileText size={12} /> Invoice
                      </button>

                      {/* State update quick buttons */}
                      {b.status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(b.id, 'Confirmed')}
                          className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 font-mono text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition"
                          title="Confirm reservation"
                        >
                          Confirm
                        </button>
                      )}
                      {b.status === 'Confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(b.id, 'Completed')}
                          className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 font-mono text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                          title="Mark rental completed"
                        >
                          Complete
                        </button>
                      )}
                      {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(b.id, 'Cancelled')}
                          className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 font-mono text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition"
                          title="Cancel reservation"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400 font-mono text-xs">
                  No reservations found matching active filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
