import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Car, Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const cols = [
  { title: 'Company', items: [['/about', 'About us'], ['/contact', 'Contact'], ['/faq', 'FAQ']] },
  { title: 'Rent', items: [['/cars', 'All cars'], ['/booking', 'Book a car'], ['/my-bookings', 'My bookings']] },
  { title: 'Policies', items: [['/terms', 'Terms and conditions'], ['/privacy', 'Privacy policy'], ['/cancellation', 'Cancellation policy']] },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-neutral-300">
      <div className="container-x grid gap-10 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-ink"><Car size={20} /></span>Drivo
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-400">
            A demo car rental experience. Bookings and payments are simulated and saved only in your browser.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex items-center gap-2"><Phone size={15} /> +91 98765 43210</li>
            <li className="flex items-center gap-2"><Mail size={15} /> hello@drivo.example</li>
            <li className="flex items-center gap-2"><MapPin size={15} /> RS Puram, Coimbatore, Tamil Nadu</li>
          </ul>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="mb-3 text-sm font-bold text-white">{c.title}</h3>
            <ul className="space-y-2 text-sm">
              {c.items.map(([to, label]) => <li key={to}><Link to={to} className="hover:text-white">{label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Drivo. Demo project, not a real rental company.</p>
          <div className="flex gap-3">
            {[[Facebook, 'Facebook'], [Instagram, 'Instagram'], [Twitter, 'Twitter']].map(([Icon, name]) => (
              <button key={name} onClick={() => toast(`${name} link is a demo placeholder`)} aria-label={name} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20"><Icon size={15} /></button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
