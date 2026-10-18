import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Search, Heart, User, LogOut, ArrowLeftRight, Shield, Menu, X, MapPin } from 'lucide-react';
import { useCars } from '../context/CarContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/cars', label: 'Cars' },
  { to: '/wedding-cars', label: 'Wedding Cars' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/faq', label: 'FAQ' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const profileRef = useRef(null);
  const { favorites, compareIds = [] } = useCars();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => { setOpen(false); setProfileOpen(false); }, [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!profileOpen) return undefined;
    const onDown = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setProfileOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [profileOpen]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 bg-white ${
        scrolled
          ? 'shadow-sm border-b border-slate-150 backdrop-blur-md bg-white/95'
          : 'border-b border-slate-100'
      }`}
    >
      <div className="container-x flex h-20 items-center justify-between">
        {/* DRIVO Brand Logo with Car Outline (Matching Reference Image) */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative text-[#0B1528] transition-transform duration-300 group-hover:scale-105">
            <svg width="42" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4 18C4 18 10 17 16 12C20 8.5 28 6 36 7C41 7.6 44 11 44 15"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M1 18H47"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M10 13C15 9.5 24 8 32 8.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="opacity-70"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl font-black tracking-wider text-[#0B1528]">
              DRIVO
            </span>
            <span className="text-[8px] tracking-[0.25em] text-slate-400 font-bold uppercase -mt-1">
              DRIVE YOUR WORLD
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/70 px-2.5 py-0.5 text-[10px] font-bold text-blue-900 tracking-wide ml-1">
            <MapPin size={10} className="text-blue-700" />
            <span>Kanniyakumari Dist.</span>
          </span>
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors duration-200 ${
                  isActive
                    ? 'text-[#0B1528] font-bold border-b-2 border-[#0B1528] pb-1'
                    : 'text-slate-600 hover:text-[#0B1528]'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions & Auth Controls (Matching Reference Image) */}
        <div className="hidden items-center gap-4 md:flex">
          {/* Search Icon */}
          <Link
            to="/cars"
            className="grid h-9 w-9 place-items-center text-slate-700 hover:text-[#0B1528] transition"
            aria-label="Search vehicles"
            title="Search fleet"
          >
            <Search size={19} />
          </Link>

          {/* Favorites Heart Icon */}
          <Link
            to="/favorites"
            className="relative grid h-9 w-9 place-items-center text-slate-700 hover:text-[#0B1528] transition"
            aria-label={`Favorites (${favorites.length})`}
            title="Saved Favorites"
          >
            <Heart size={19} className={favorites.length > 0 ? 'fill-red-500 text-red-500' : ''} />
            {favorites.length > 0 && (
              <span className="absolute 0 top-0 right-0 grid h-4 min-w-4 place-items-center rounded-full bg-[#0B1528] px-1 text-[9px] font-bold text-white">
                {favorites.length}
              </span>
            )}
          </Link>

          {/* Compare Button */}
          {compareIds.length > 0 && (
            <Link
              to="/compare"
              className="relative grid h-9 w-9 place-items-center text-slate-700 hover:text-[#0B1528] transition"
              title="Compare Cars"
            >
              <ArrowLeftRight size={17} />
              <span className="absolute 0 top-0 right-0 grid h-4 min-w-4 place-items-center rounded-full bg-[#0B1528] px-1 text-[9px] font-bold text-white">
                {compareIds.length}
              </span>
            </Link>
          )}

          {!isAuthenticated ? (
            <div className="flex items-center gap-2.5 ml-2">
              <Link
                to="/admin/login"
                className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0B1528] transition px-2 py-1.5 rounded-lg hover:bg-slate-50"
                title="Admin Command Center"
              >
                <Shield size={14} className="text-blue-600" />
                <span>Admin</span>
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-[#0B1528] transition px-2 py-1.5"
              >
                <User size={18} />
                <span>Login</span>
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-[#0B1528] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 transition shadow-sm active:scale-95"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="rounded-full bg-slate-100 hover:bg-slate-200 text-[#0B1528] px-4 py-2 text-xs font-bold transition"
              >
                {user?.fullName?.split(' ')[0] || 'Dashboard'}
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-50 text-[#0B1528] hover:border-slate-400 transition"
                  aria-label="Profile menu"
                  aria-expanded={profileOpen}
                >
                  <User size={18} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl text-slate-800 z-50 animate-entrance-1">
                    <div className="border-b border-slate-100 px-3 py-2.5">
                      <p className="truncate text-xs font-bold text-[#0B1528]">{user.fullName}</p>
                      <p className="truncate text-[11px] text-slate-400">{user.email}</p>
                    </div>
                    <div className="py-1">
                      {[
                        ...(user?.role === 'admin' ? [['/admin', 'Admin Command Center 🛡️', true]] : []),
                        ['/profile', 'My Profile'],
                        ['/my-bookings', 'My Bookings'],
                        ['/cars', 'Explore Fleet'],
                        ['/dashboard', 'Account Overview'],
                        ['/compare', 'Compare Vehicles'],
                        ['/favorites', 'Saved Favorites'],
                      ].map(([to, label, isAdmin]) => (
                        <Link
                          key={to}
                          to={to}
                          className={`block rounded-xl px-3 py-2 text-xs font-medium transition ${
                            isAdmin
                              ? 'text-blue-700 font-bold hover:bg-blue-50'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-[#0B1528]'
                          }`}
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => { setProfileOpen(false); logout(); }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut size={14} /> Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile menu toggle button */}
        <button
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:text-[#0B1528] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-t border-slate-100 bg-white md:hidden px-4 py-4 space-y-2">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? 'bg-slate-100 text-[#0B1528]'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink to="/cars" className="rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
              Explore All Fleet
            </NavLink>
            <NavLink to="/favorites" className="rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-between">
              <span>Saved Favorites</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-800 font-bold">{favorites.length}</span>
            </NavLink>
            <NavLink to="/compare" className="rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-between">
              <span>Compare Vehicles</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-800 font-bold">{compareIds.length}</span>
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className="rounded-xl px-3.5 py-2.5 text-xs font-bold text-blue-700 bg-blue-50 flex items-center gap-2">
                <Shield size={14} /> Admin Command Center
              </NavLink>
            )}
            {isAuthenticated && (
              <>
                <NavLink to="/profile" className="rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  My Profile
                </NavLink>
                <NavLink to="/my-bookings" className="rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  My Bookings
                </NavLink>
              </>
            )}
            <div className="mt-4 flex gap-2 pt-3 border-t border-slate-100">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="rounded-full border border-slate-200 text-xs font-bold flex-1 py-2.5 text-center text-slate-700">
                    Log in
                  </Link>
                  <Link to="/register" className="rounded-full bg-[#0B1528] text-white text-xs font-bold flex-1 py-2.5 text-center">
                    Sign up
                  </Link>
                  <Link to="/admin/login" className="rounded-full border border-blue-200 bg-blue-50/50 text-xs font-bold px-3 py-2.5 text-center text-blue-800 flex items-center justify-center gap-1" title="Admin Portal">
                    <Shield size={12} /> Admin
                  </Link>
                </>
              ) : (
                <button
                  onClick={logout}
                  className="w-full rounded-full border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-600"
                >
                  Log out
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
