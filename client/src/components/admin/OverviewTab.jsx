import React, { useState } from 'react';
import {
  Car,
  CalendarCheck,
  Users,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Activity,
  TrendingUp,
  Star,
  Mail,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  MapPin,
  FileText,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { formatINR } from '../../utils/pricing.js';
import CarImage from '../CarImage.jsx';
import StatusBadge from '../StatusBadge.jsx';

export default function OverviewTab({
  stats,
  analytics,
  cars = [],
  bookings = [],
  customers = [],
  timeRange,
  setTimeRange,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  onApplyCustomRange,
  loadingAnalytics,
  analyticsError,
  onRetryAnalytics,
  setActiveTab,
  setSelectedDetailBooking,
  setReceiptRef,
}) {
  const [chartMode, setChartMode] = useState('revenue'); // 'revenue' | 'volume'

  // Calculated telemetry metrics
  const totalCarsCount = stats?.totalCars ?? analytics?.kpis?.totalCars ?? cars.length;
  const availableCarsCount = stats?.availableCars ?? analytics?.kpis?.availableCars ?? cars.filter((c) => c.available).length;
  const unavailableCarsCount = stats?.unavailableCars ?? (cars.length - (stats?.availableCars ?? 0));
  
  const totalBookingsCount = stats?.totalBookings ?? analytics?.kpis?.totalBookings ?? bookings.length;
  const confirmedBookingsCount = stats?.confirmedBookings ?? analytics?.kpis?.confirmedBookings ?? bookings.filter((b) => b.status === 'Confirmed').length;
  const pendingBookingsCount = stats?.pendingBookings ?? analytics?.kpis?.pendingBookings ?? bookings.filter((b) => b.status === 'Pending').length;
  const completedBookingsCount = stats?.completedBookings ?? analytics?.kpis?.completedBookings ?? bookings.filter((b) => b.status === 'Completed').length;
  const cancelledBookingsCount = stats?.cancelledBookings ?? analytics?.kpis?.cancelledBookings ?? bookings.filter((b) => b.status === 'Cancelled').length;

  const totalCustomersCount = stats?.totalCustomers ?? stats?.totalUsers ?? customers.length;
  const totalRevenueAmount = stats?.verifiedPaymentsTotal ?? analytics?.kpis?.collectedRevenue ?? 0;

  const utilizationRate = totalCarsCount > 0
    ? Math.min(100, Math.round(((totalCarsCount - availableCarsCount) / totalCarsCount) * 100))
    : 0;

  const avgBookingRate = totalBookingsCount > 0
    ? Math.round(totalRevenueAmount / totalBookingsCount)
    : 0;

  // Monthly trends data
  const monthlyTrends = analytics?.monthlyTrends || [];
  const maxRevenue = monthlyTrends.reduce((max, m) => Math.max(max, m.revenue || 0), 1);
  const maxBookings = monthlyTrends.reduce((max, m) => Math.max(max, m.bookings || 0), 1);

  // Popular cars
  const popularCars = analytics?.popularCars || [];

  // Recent bookings (first 6)
  const recentBookings = bookings.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 4 PRIMARY HERO KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Total Fleet */}
        <div
          onClick={() => setActiveTab('fleet')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Fleet
            </span>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition">
              <Car size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-mono text-3xl font-black text-[#0A142F] tracking-tight">
              {totalCarsCount}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {availableCarsCount} Available
              </span>
              <span className="text-slate-400 font-mono">
                {unavailableCarsCount} Inactive
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-semibold group-hover:text-blue-700">
            <span>Manage Catalog</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* 2. Active Bookings */}
        <div
          onClick={() => setActiveTab('bookings')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-emerald-400 hover:shadow-md transition duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Bookings
            </span>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition">
              <CalendarCheck size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-mono text-3xl font-black text-[#0A142F] tracking-tight">
              {confirmedBookingsCount}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              {pendingBookingsCount > 0 ? (
                <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  <Clock size={11} /> {pendingBookingsCount} Pending
                </span>
              ) : (
                <span className="text-slate-500 font-medium">All orders settled</span>
              )}
              <span className="text-slate-400 font-mono">{totalBookingsCount} Total</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-semibold group-hover:text-emerald-800">
            <span>View Reservations</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* 3. Total Customers */}
        <div
          onClick={() => setActiveTab('customers')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-violet-400 hover:shadow-md transition duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              Registered Customers
            </span>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 group-hover:scale-105 transition">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-mono text-3xl font-black text-[#0A142F] tracking-tight">
              {totalCustomersCount}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-violet-700 font-semibold">Verified KYC Renters</span>
              <span className="text-slate-400 font-mono">Kanniyakumari</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-violet-700 font-semibold group-hover:text-violet-800">
            <span>Customer Directory</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* 4. Total Verified Revenue */}
        <div
          onClick={() => setActiveTab('payments')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-emerald-300 bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/40 p-5 shadow-xs hover:border-emerald-500 hover:shadow-md transition duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">
              Verified Revenue
            </span>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-emerald-600 to-green-600 text-white shadow-md shadow-emerald-600/30 group-hover:scale-105 transition">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-mono text-3xl font-black text-emerald-800 tracking-tight">
              {formatINR(totalRevenueAmount)}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-medium">Bank & Gateway Settled</span>
              <span className="text-slate-500 font-mono">{completedBookingsCount} Completed</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800 font-semibold group-hover:text-emerald-900">
            <span>Transaction Ledger</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* 6 OPERATIONAL TELEMETRY STAT CHIPS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Pending */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
            <Clock size={13} className="text-amber-500" />
            <span>Pending Review</span>
          </div>
          <p className="font-mono text-lg font-black text-[#0A142F] mt-1">{pendingBookingsCount}</p>
        </div>

        {/* Completed */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
            <Award size={13} className="text-emerald-600" />
            <span>Completed Trips</span>
          </div>
          <p className="font-mono text-lg font-black text-[#0A142F] mt-1">{completedBookingsCount}</p>
        </div>

        {/* Fleet Utilization */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
            <Activity size={13} className="text-blue-600" />
            <span>Fleet Utilization</span>
          </div>
          <p className="font-mono text-lg font-black text-[#0A142F] mt-1">{utilizationRate}%</p>
        </div>

        {/* Avg Trip Value */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
            <TrendingUp size={13} className="text-indigo-600" />
            <span>Avg. Trip Value</span>
          </div>
          <p className="font-mono text-lg font-black text-[#0A142F] mt-1">{formatINR(avgBookingRate)}</p>
        </div>

        {/* Rating */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
            <Star size={13} className="text-amber-500 fill-amber-500" />
            <span>Fleet Rating</span>
          </div>
          <p className="font-mono text-lg font-black text-[#0A142F] mt-1">4.9 / 5.0</p>
        </div>

        {/* Inquiries */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
            <Mail size={13} className="text-cyan-600" />
            <span>Active Messages</span>
          </div>
          <p className="font-mono text-lg font-black text-[#0A142F] mt-1">
            {stats?.totalMessages ?? 0}
          </p>
        </div>
      </div>

      {/* MONTHLY REVENUE & BOOKINGS TREND CHART */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              <h2 className="text-base sm:text-lg font-heading font-black text-[#0A142F]">
                Revenue & Reservation Volume Trends
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Aggregated directly from MySQL database transactions and rental contracts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Chart Mode Toggle */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartMode('revenue')}
                className={`rounded-lg px-3 py-1 font-mono transition ${
                  chartMode === 'revenue'
                    ? 'bg-white text-[#0A142F] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-[#0A142F]'
                }`}
              >
                Revenue (₹)
              </button>
              <button
                type="button"
                onClick={() => setChartMode('volume')}
                className={`rounded-lg px-3 py-1 font-mono transition ${
                  chartMode === 'volume'
                    ? 'bg-white text-[#0A142F] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-[#0A142F]'
                }`}
              >
                Trips Volume (#)
              </button>
            </div>

            {/* Time Range Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                ['all', 'All Time'],
                ['30d', '30 Days'],
                ['90d', '90 Days'],
                ['year', 'This Year'],
                ['custom', 'Custom'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTimeRange(key)}
                  className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition ${
                    timeRange === key
                      ? 'bg-[#0A142F] text-white font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-[#0A142F] border border-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Range Bar */}
        {timeRange === 'custom' && (
          <div className="mt-4 pt-4 border-b border-slate-100 flex flex-wrap items-end gap-3 pb-4">
            <div>
              <label className="block font-mono text-[11px] font-bold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="field text-xs py-1.5 bg-white"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="field text-xs py-1.5 bg-white"
              />
            </div>
            <button
              type="button"
              onClick={onApplyCustomRange}
              className="btn-primary text-xs py-2 px-4"
            >
              Apply Filter
            </button>
          </div>
        )}

        {/* Chart Visualization */}
        {loadingAnalytics && !analytics ? (
          <div className="py-16 text-center">
            <RefreshCw size={24} className="mx-auto text-blue-600 animate-spin" />
            <p className="mt-2 text-xs font-semibold text-slate-500 font-mono">
              Loading analytics from MySQL database...
            </p>
          </div>
        ) : analyticsError ? (
          <div className="py-8 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
            <AlertTriangle size={24} className="mx-auto text-rose-500" />
            <p className="mt-2 text-xs font-bold">{analyticsError}</p>
            <button
              type="button"
              onClick={onRetryAnalytics}
              className="mt-2 btn-outline text-xs px-3 py-1"
            >
              Retry
            </button>
          </div>
        ) : monthlyTrends.length > 0 ? (
          <div className="mt-6">
            <div className="h-64 flex items-end gap-2 sm:gap-4 pt-6 px-2 border-b border-slate-200">
              {monthlyTrends.map((m, idx) => {
                const val = chartMode === 'revenue' ? (m.revenue || 0) : (m.bookings || 0);
                const max = chartMode === 'revenue' ? maxRevenue : maxBookings;
                const pct = Math.max(8, Math.round((val / max) * 100));

                return (
                  <div key={m.month || idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    {/* Hover Tooltip Value */}
                    <div className="opacity-0 group-hover:opacity-100 transition duration-150 mb-2 px-2 py-1 bg-[#0A142F] text-white rounded-md text-[10px] font-mono whitespace-nowrap shadow-md pointer-events-none z-10">
                      {chartMode === 'revenue' ? formatINR(val) : `${val} Trips`}
                    </div>

                    {/* Bar */}
                    <div
                      className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                        chartMode === 'revenue'
                          ? 'bg-gradient-to-t from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-400'
                          : 'bg-gradient-to-t from-emerald-600 to-teal-500 group-hover:from-emerald-500 group-hover:to-teal-400'
                      }`}
                      style={{ height: `${pct}%` }}
                    />
                    
                    {/* Month label */}
                    <span className="mt-2 text-[10px] sm:text-xs font-mono font-bold text-slate-500 truncate w-full text-center">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-2 font-mono">
              <span>Past 12 Months Telemetry</span>
              <span>
                Total Displayed:{' '}
                <strong className="text-[#0A142F]">
                  {chartMode === 'revenue'
                    ? formatINR(monthlyTrends.reduce((s, m) => s + (m.revenue || 0), 0))
                    : `${monthlyTrends.reduce((s, m) => s + (m.bookings || 0), 0)} Reservations`}
                </strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 font-mono text-xs">
            No historical trend data found for selected period.
          </div>
        )}
      </div>

      {/* TWO-COLUMN GRID: POPULAR VEHICLES & CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Cars Leaderboard */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-black text-sm sm:text-base text-[#0A142F] flex items-center gap-2">
              <Award size={17} className="text-amber-500" />
              Most Rented Vehicles
            </h3>
            <span className="font-mono text-xs text-slate-500">By Reservation Volume</span>
          </div>

          <div className="space-y-3">
            {popularCars.length > 0 ? (
              popularCars.slice(0, 5).map((car, idx) => (
                <div
                  key={car.id || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-100/70 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-xs text-slate-400 w-4">
                      #{idx + 1}
                    </span>
                    <div className="h-10 w-14 rounded-lg bg-slate-200 overflow-hidden border border-slate-300 shrink-0">
                      <CarImage src={car.image} alt={car.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#0A142F]">{car.name}</p>
                      <p className="font-mono text-[10px] text-slate-500">
                        {car.category || 'SUV'} · {car.transmission || 'Automatic'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono font-bold text-xs text-[#0A142F]">
                      {car.bookingsCount || car.bookings || 0} Bookings
                    </p>
                    <p className="font-mono text-[10px] font-semibold text-emerald-700">
                      {formatINR(car.revenue || car.totalRevenue || 0)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              cars.slice(0, 5).map((c, idx) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/70"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-xs text-slate-400 w-4">#{idx + 1}</span>
                    <div className="h-10 w-14 rounded-lg bg-slate-200 overflow-hidden border border-slate-300 shrink-0">
                      <CarImage src={c.image} alt={c.brand} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#0A142F]">{c.brand} {c.model}</p>
                      <p className="font-mono text-[10px] text-slate-500">{c.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-xs text-blue-700">{formatINR(c.pricePerDay)}/day</p>
                    <span className="font-mono text-[10px] text-emerald-700 font-semibold">Active Fleet</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Share Distribution */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-black text-sm sm:text-base text-[#0A142F] flex items-center gap-2">
              <Car size={17} className="text-blue-600" />
              Fleet Category Distribution
            </h3>
            <span className="font-mono text-xs text-slate-500">{cars.length} Total Vehicles</span>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { label: 'SUV', color: 'bg-blue-600' },
              { label: 'Sedan', color: 'bg-indigo-600' },
              { label: 'Luxury', color: 'bg-purple-600' },
              { label: 'Hatchback', color: 'bg-emerald-600' },
              { label: 'MUV / MPV', color: 'bg-amber-500' },
              { label: 'Electric Vehicles', color: 'bg-teal-500' },
            ].map((cat) => {
              const count = cars.filter((c) => c.category === cat.label).length;
              const pct = cars.length > 0 ? Math.round((count / cars.length) * 100) : 0;

              return (
                <div key={cat.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{cat.label}</span>
                    <span className="font-mono text-slate-500">
                      <strong>{count}</strong> cars ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${cat.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RECENT BOOKINGS TABLE */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-heading font-black text-sm sm:text-base text-[#0A142F] flex items-center gap-2">
              <CalendarCheck size={17} className="text-blue-600" />
              Recent Reservation Feed
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest bookings submitted by customers across Kanniyakumari District.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Bookings ({bookings.length})</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Station & Schedule</th>
                <th className="py-3 px-4 text-right">Total Price</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBookings.length > 0 ? (
                recentBookings.map((b) => (
                  <tr key={b.id || b.ref} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {b.ref}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          <CarImage src={b.car?.image} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-[#0A142F]">{b.car?.brand} {b.car?.model}</p>
                          <span className="font-mono text-[10px] text-slate-500">{b.car?.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#0A142F]">{b.customer?.fullName || 'Customer'}</p>
                      <p className="font-mono text-[10px] text-slate-500">{b.customer?.phone || b.customer?.email}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      <div className="flex items-center gap-1 font-semibold text-[#0A142F]">
                        <MapPin size={11} className="text-blue-600 shrink-0" />
                        <span>{b.pickup}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(b.start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} &rarr;{' '}
                        {new Date(b.end).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-right text-emerald-800">
                      {formatINR(b.pricing?.total || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailBooking(b)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-[#0A142F] transition"
                          title="View booking details"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setReceiptRef(b.ref)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-[#0A142F] transition"
                          title="View invoice"
                        >
                          <FileText size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-mono text-xs">
                    No bookings recorded in database yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
