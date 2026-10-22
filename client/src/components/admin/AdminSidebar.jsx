import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  Users,
  CreditCard,
  Star,
  BarChart3,
  MapPin,
  Mail,
  Settings as SettingsIcon,
  Shield,
  ShieldCheck,
  ExternalLink,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  counts = {},
  user,
  onSignOut,
}) {
  const navSections = [
    {
      title: 'Main Dashboard',
      items: [
        {
          key: 'overview',
          label: 'Overview',
          icon: LayoutDashboard,
          count: null,
        },
      ],
    },
    {
      title: 'Fleet & Operations',
      items: [
        {
          key: 'fleet',
          label: 'Car Inventory',
          icon: Car,
          count: counts.cars ?? null,
        },
        {
          key: 'bookings',
          label: 'Bookings',
          icon: CalendarCheck,
          count: counts.bookings ?? null,
          highlightBadge: counts.pendingBookings > 0 ? `${counts.pendingBookings} pending` : null,
        },
        {
          key: 'customers',
          label: 'Customers',
          icon: Users,
          count: counts.customers ?? null,
        },
      ],
    },
    {
      title: 'Finance & Quality',
      items: [
        {
          key: 'payments',
          label: 'Transactions',
          icon: CreditCard,
          count: counts.payments ?? null,
        },
        {
          key: 'reviews',
          label: 'Reviews & Ratings',
          icon: Star,
          count: counts.reviews ?? null,
        },
        {
          key: 'reports',
          label: 'Reports & CSV',
          icon: BarChart3,
          count: null,
        },
      ],
    },
    {
      title: 'District & System',
      items: [
        {
          key: 'locations',
          label: 'Pickup Hubs',
          icon: MapPin,
          count: counts.locations ?? null,
        },
        {
          key: 'inquiries',
          label: 'Messages',
          icon: Mail,
          count: counts.messages ?? null,
        },
        {
          key: 'settings',
          label: 'Platform Settings',
          icon: SettingsIcon,
          count: null,
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0A142F] text-slate-300 select-none">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <Car size={20} className="relative z-10" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0A142F]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-lg font-black tracking-tight text-white">DRIVO</span>
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-blue-400 border border-blue-400/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Fleet OS • Kanniyakumari</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          title="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Connection Beacon */}
      <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-slate-300 font-mono text-[10px] font-medium">MySQL DB: Connected</span>
        </div>
        <span className="text-emerald-400 font-mono text-[10px] font-bold">100% Live</span>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>
            <div className="space-y-0.5 mt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.key);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition duration-150 group ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={17}
                        className={`transition ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-white'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.highlightBadge && (
                        <span className="rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 font-mono text-[10px] font-bold animate-pulse">
                          {item.highlightBadge}
                        </span>
                      )}
                      {item.count !== null && !item.highlightBadge && (
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                            isActive
                              ? 'bg-white/20 text-white font-bold'
                              : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer / User Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs shadow">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <ShieldCheck size={16} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">
              {user?.fullName || 'Drivo Administrator'}
            </p>
            <p className="truncate text-[10px] text-slate-400 font-mono">
              {user?.email || 'System Administrator'}
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <Link
            to="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700/60 transition"
            title="Open customer portal in new tab"
          >
            <ExternalLink size={12} />
            <span>Live Site</span>
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[11px] font-medium border border-rose-500/20 transition"
            title="Sign out of admin portal"
          >
            <LogOut size={12} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-72 lg:flex lg:flex-col border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Slide-over */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
