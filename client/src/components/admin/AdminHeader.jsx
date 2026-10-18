import React from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Search,
  RefreshCw,
  Bell,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function AdminHeader({
  activeTab,
  setActiveTab,
  setSidebarOpen,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  onRefresh,
  isRefreshing,
  pendingCount = 0,
  user,
}) {
  const getTabInfo = (tab) => {
    switch (tab) {
      case 'overview':
        return { label: 'Overview & Telemetry', parent: 'Dashboard' };
      case 'fleet':
        return { label: 'Fleet Inventory & Pricing', parent: 'Fleet' };
      case 'bookings':
        return { label: 'Reservation Records', parent: 'Operations' };
      case 'customers':
        return { label: 'Customer Directory', parent: 'Renters' };
      case 'payments':
        return { label: 'Payment Ledger & Invoices', parent: 'Finance' };
      case 'reviews':
        return { label: 'Customer Reviews & Ratings', parent: 'Quality' };
      case 'reports':
        return { label: 'Analytics & CSV Reports', parent: 'Intelligence' };
      case 'settings':
        return { label: 'Platform & Loyalty Configuration', parent: 'System' };
      case 'locations':
        return { label: 'Kanniyakumari Pickup Hubs', parent: 'District' };
      case 'inquiries':
        return { label: 'Customer Inquiries & Messages', parent: 'Support' };
      default:
        return { label: 'Admin Portal', parent: 'Drivo' };
    }
  };

  const tabInfo = getTabInfo(activeTab);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden shadow-xs"
          title="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <span>Admin</span>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-500 font-medium">{tabInfo.parent}</span>
          </div>
          <h1 className="font-heading text-sm sm:text-base font-black text-[#0A142F] tracking-tight">
            {tabInfo.label}
          </h1>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder || 'Search fleet, bookings, customers...'}
            className="w-full rounded-xl bg-slate-50 border border-slate-200/80 pl-9 pr-3 py-1.5 text-xs text-[#0A142F] placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
          />
        </div>
      </div>

      {/* Right: Territory Badge, Refresh, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Territory Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono text-[11px] font-bold">Kanniyakumari District</span>
        </div>

        {/* Sync / Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#0A142F] transition shadow-2xs"
          title="Synchronize database records"
        >
          <RefreshCw
            size={15}
            className={isRefreshing ? 'animate-spin text-blue-600' : ''}
          />
        </button>

        {/* Notifications Bell */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('bookings');
          }}
          className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#0A142F] transition shadow-2xs"
          title={pendingCount > 0 ? `${pendingCount} pending booking(s)` : 'No pending bookings'}
        >
          <Bell size={16} />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 font-mono text-[9px] font-bold text-white shadow-xs animate-bounce">
              {pendingCount}
            </span>
          )}
        </button>

        {/* Customer Site Shortcut */}
        <Link
          to="/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0A142F] text-xs font-semibold transition shadow-2xs"
          title="View public customer website"
        >
          <span>View Site</span>
          <ExternalLink size={12} className="text-slate-400" />
        </Link>

        {/* Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <ShieldCheck size={14} />}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-[#0A142F] leading-tight">
              {user?.fullName || 'Admin'}
            </p>
            <p className="font-mono text-[9px] font-bold text-blue-600 uppercase tracking-wider">
              Staff Privileges
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
