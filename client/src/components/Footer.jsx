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
    <footer className="bg-white text-[#0F172A] border-t border-slate-200/80">
      <div className="container-x grid gap-12 py-16 md:grid-cols-5">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="text-[#0A142F] transition-transform duration-300 group-hover:scale-105">
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
              <span className="font-display text-2xl font-black tracking-wider text-[#0A142F]">
                DRIVO
              </span>
              <span className="text-[8px] tracking-[0.25em] text-slate-400 font-bold uppercase -mt-1">
                DRIVE YOUR WORLD
              </span>
            </div>
          </Link>

          <p className="max-w-sm text-xs leading-relaxed text-slate-600">
            Pioneering seamless luxury car rentals, certified self-drive experiences, and intelligent mobility across South India.
          </p>

          <ul className="space-y-2.5 text-xs text-slate-700 font-medium pt-2">
            <li className="flex items-center gap-2.5">
              <a
                href="https://wa.me/919080105551?text=Hi%20DRIVO%20Team!%20I'm%20interested%20in%20renting%20a%20car.%20Please%20share%20the%20available%20cars%2C%20rental%20prices%2C%20and%20booking%20details.%20Thank%20you!"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className="inline-flex items-center gap-2 text-emerald-700 font-bold hover:text-emerald-800 transition"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#25D366] text-white shrink-0">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </span>
                <span>+91 9080105551 (WhatsApp Concierge)</span>
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={14} className="text-[#0A142F]" />
              <span>+91 9080105551 (24/7 Digital Concierge)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={14} className="text-[#0A142F]" />
              <span>concierge@drivo.example</span>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin size={14} className="text-[#0A142F]" />
              <span>WCC Road, Nagercoil &amp; Beach Road, Kanyakumari</span>
            </li>
          </ul>
        </div>

        {/* Navigation Link Columns */}
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#0A142F]">
              {c.title}
            </h3>
            <ul className="space-y-2.5 text-xs">
              {c.items.map(([to, label]) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0A142F] transition duration-200"
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

      {/* Subfooter */}
      <div className="border-t border-slate-200/80 bg-[#FAF9F6]">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} DRIVO Mobility Solutions Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/919080105551?text=Hi%20DRIVO%20Team!%20I'm%20interested%20in%20renting%20a%20car.%20Please%20share%20the%20available%20cars%2C%20rental%20prices%2C%20and%20booking%20details.%20Thank%20you!"
              target="_blank"
              rel="noreferrer"
              aria-label="DRIVO WhatsApp Contact"
              className="text-slate-500 hover:text-[#25D366] transition"
              title="Chat with us on WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-[#0A142F] transition">
              <Instagram size={16} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-[#0A142F] transition">
              <Twitter size={16} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-[#0A142F] transition">
              <Facebook size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
