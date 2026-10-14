import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Car, Menu, X, Heart, User, LogOut } from 'lucide-react';
import { useCars } from '../context/CarContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/cars', label: 'Cars' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
];

const linkClass = ({ isActive }) =>
  `rounded-full px-3.5 py-2 text-sm font-semibold transition ${isActive ? 'bg-ink text-white' : 'text-neutral-600 hover:text-ink'}`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const profileRef = useRef(null);
  const { favorites } = useCars();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => { setOpen(false); setProfileOpen(false); }, [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
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
    <header className={`sticky top-0 z-50 border-b bg-white/90 backdrop-blur transition ${scrolled ? 'border-neutral-200 shadow-sm' : 'border-transparent'}`}>
      <div className="container-x flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white"><Car size={20} /></span>
          Drivo
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>)}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/favorites" className="relative grid h-10 w-10 place-items-center rounded-full text-neutral-600 hover:bg-neutral-100" aria-label={`Favorites (${favorites.length})`}>
            <Heart size={19} />
            {favorites.length > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{favorites.length}</span>}
          </Link>

          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn-outline">Log in</Link>
              <Link to="/register" className="btn-dark">Sign up</Link>
            </>
          ) : (
            <Link to="/dashboard" className="rounded-full bg-neutral-100 px-3.5 py-2 text-xs font-bold text-ink hover:bg-neutral-200">
              {user.fullName.split(' ')[0]}
            </Link>
          )}

          <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100 hover:bg-neutral-200" aria-label="Profile menu" aria-expanded={profileOpen}>
              <User size={19} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-card">
                {isAuthenticated && (
                  <div className="border-b border-neutral-100 px-3 py-2">
                    <p className="truncate text-xs font-bold text-ink">{user.fullName}</p>
                    <p className="truncate text-[11px] text-neutral-500">{user.email}</p>
                  </div>
                )}
                {[['/dashboard', 'My dashboard'], ['/my-bookings', 'My bookings'], ['/favorites', 'Favorites']].map(([to, label]) => (
                  <Link key={to} to={to} className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-neutral-100">{label}</Link>
                ))}
                {!isAuthenticated ? (
                  <Link to="/register" className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-neutral-100">Create account</Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); logout(); }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-neutral-100 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-neutral-200 bg-white md:hidden">
          <nav className="container-x flex flex-col gap-1 py-3" aria-label="Mobile">
            {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>)}
            <NavLink to="/favorites" className={linkClass}>Favorites ({favorites.length})</NavLink>
            <NavLink to="/my-bookings" className={linkClass}>My bookings</NavLink>
            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
            <div className="mt-2 flex gap-2">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="btn-outline flex-1">Log in</Link>
                  <Link to="/register" className="btn-dark flex-1">Sign up</Link>
                </>
              ) : (
                <button type="button" onClick={logout} className="btn-outline flex-1 text-red-600">
                  <LogOut size={16} /> Log out ({user.fullName.split(' ')[0]})
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
