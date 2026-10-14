import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';

const cols = [
  {
    title: 'Platform',
    items: [
      ['/cars', 'Explore Fleet'],
      ['/compare', 'Compare Vehicles'],
      ['/booking', 'Direct Booking'],
      ['/my-bookings', 'Manage Bookings'],
    ],
  },
  {
    title: 'Company',
    items: [
      ['/about', 'About Us'],
      ['/contact', 'Contact Us'],
      ['/faq', 'Frequently Asked Questions'],
    ],
  },
  {
    title: 'Legal & Safety',
    items: [
      ['/terms', 'Terms of Service'],
      ['/privacy', 'Privacy Policy'],
      ['/cancellation', 'Cancellation & Refund'],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#0B1528] text-slate-300 border-t border-slate-800">
      <div className="container-x grid gap-12 py-16 md:grid-cols-5">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="text-white transition-transform duration-300 group-hover:scale-105">
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
              <span className="font-display text-2xl font-black tracking-wider text-white">
                DRIVO
              </span>
              <span className="text-[8px] tracking-[0.25em] text-slate-400 font-bold uppercase -mt-1">
                DRIVE YOUR WORLD
              </span>
            </div>
          </Link>

          <p className="mt-4 max-w-sm text-xs leading-relaxed text-slate-400">
            Premium cars. Unforgettable journeys. Experience elevated mobility, certified self-drive vehicles, and seamless digital booking.
          </p>

          <ul className="mt-6 space-y-2.5 text-xs text-slate-300 font-medium">
            <li className="flex items-center gap-2.5">
              <Phone size={14} className="text-[#75CFFF]" />
              <span>+91 98765 43210 (24/7 Concierge)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={14} className="text-[#75CFFF]" />
              <span>concierge@drivo.example</span>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin size={14} className="text-[#75CFFF]" />
              <span>WCC Road, Nagercoil & Beach Road, Kanyakumari</span>
            </li>
          </ul>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              {c.title}
            </h3>
            <ul className="space-y-2.5 text-xs">
              {c.items.map(([to, label]) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition duration-200"
                  >
                    <span>{label}</span>
                    <ArrowUpRight size={11} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800/80 bg-[#070E1B]">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} DRIVO Mobility Solutions Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition">
              <Instagram size={16} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition">
              <Twitter size={16} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition">
              <Facebook size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
