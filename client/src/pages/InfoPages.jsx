import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Award, Users, ChevronDown } from 'lucide-react';
import { faqs as seedFaqs, locations } from '../data/homeContent.js';

export function About() {
  return (
    <div className="container-x py-12 space-y-16 text-[#0A142F]">
      <section className="max-w-3xl">
        <span className="font-mono text-xs uppercase tracking-widest text-[#1E3A8A] font-bold">About Drivo</span>
        <h1 className="font-heading text-3xl sm:text-4xl font-black text-[#0A142F] mt-2">
          Next-Generation Autonomous & Self-Drive Luxury Mobility
        </h1>
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
          Drivo delivers premium self-drive car rentals and executive mobility exclusively across Kanniyakumari district, Tamil Nadu. Every vehicle in our fleet is verified for safety, hygiene, transparent pricing, and instant dispatch from our verified regional hubs.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: ShieldCheck, title: 'Precision Telemetry', text: 'Rigorous 40-point mechanical, safety, and hygiene audit before every single customer dispatch.' },
          { icon: MapPin, title: '10 Regional Hubs', text: `Convenient pickup and return points across ${locations.slice(0, 5).join(', ')}, and surrounding areas.` },
          { icon: Award, title: 'Transparent Tariffs', text: '100% upfront pricing: verified daily rate, clear taxes, and fully refundable security deposit.' },
          { icon: Users, title: '24/7 Local Concierge', text: 'Immediate roadside support and dedicated concierge assistance across Kanniyakumari district.' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-slate-300">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 border border-blue-900/10 text-[#1E3A8A]">
              <Icon size={22} />
            </span>
            <h2 className="mt-4 font-heading font-bold text-lg text-[#0A142F]">{title}</h2>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">{text}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-12 shadow-sm flex flex-col items-start justify-between gap-6 md:flex-row md:items-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="font-heading text-2xl font-black text-[#0A142F] sm:text-3xl">Ready for next-gen travel?</h2>
          <p className="mt-2 text-sm text-slate-600">Explore the fleet matrix and secure your vehicle in under 60 seconds.</p>
        </div>
        <Link to="/cars" className="btn-primary shrink-0 relative z-10">Browse Fleet</Link>
      </section>
    </div>
  );
}

const EXTENDED_FAQS = [
  ...seedFaqs,
  {
    q: 'How is the rental duration calculated?',
    a: 'Rentals are billed per 24-hour block from your scheduled pickup timestamp. Maximum single booking duration is 30 consecutive days.',
  },
  {
    q: 'Can I add a child seat, GPS, or additional driver?',
    a: 'Yes. During Step 3 of the reservation flow, you can add an Additional Driver, Child Seat, GPS Telemetry, or Premium Collision Cover.',
  },
  {
    q: 'How do coupon codes work?',
    a: 'Apply valid promo vouchers like WELCOME10, WEEKEND15, or EVGO500 during Step 4 to apply instant discounts before tax calculations.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <div className="container-x max-w-4xl py-12 text-[#0A142F]">
      <span className="font-mono text-xs uppercase tracking-widest text-[#1E3A8A] font-bold">Knowledge Base</span>
      <h1 className="font-heading text-3xl sm:text-4xl font-black text-[#0A142F] mt-2">Frequently Answered Questions</h1>
      <p className="mt-2 text-sm text-slate-600">Everything regarding fleet bookings, security deposits, and cancellation terms.</p>

      <div className="mt-8 divide-y divide-slate-100 rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        {EXTENDED_FAQS.map((f, i) => (
          <div key={f.q}>
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              aria-expanded={open === i}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-bold text-[#0A142F] hover:text-[#1E3A8A] transition"
            >
              <span className="text-sm font-semibold">{f.q}</span>
              <ChevronDown size={18} className={`shrink-0 text-[#1E3A8A] transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && (
              <p className="px-6 pb-5 text-xs leading-relaxed text-slate-600 font-sans border-t border-slate-100 pt-3">
                {f.a}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-sm text-[#0A142F]">Still have specific inquiries?</h2>
          <p className="text-xs text-slate-600 mt-0.5">Our concierge team will resolve custom travel and vehicle requests.</p>
        </div>
        <Link to="/contact" className="btn-primary text-xs">Contact Concierge</Link>
      </div>
    </div>
  );
}

export function PolicyPage({ type }) {
  const content = {
    terms: {
      title: 'Terms and Conditions',
      updated: 'October 2026',
      sections: [
        ['1. Driver Eligibility', 'Drivers must be at least 21 years old and hold a valid Indian Driving Licence (e.g. TN37 20190012345) along with an original government photo ID at the time of vehicle pickup.'],
        ['2. Rental Billing & Taxes', 'All rentals are calculated in 24-hour blocks. 18% GST applies to the base rental and selected extras after promotional discounts.'],
        ['3. Vehicle Care & Fuel Policy', 'Vehicles are handed over with a full tank or 80%+ EV charge and must be returned at the same level. Smoking inside vehicles is strictly prohibited.'],
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      updated: 'October 2026',
      sections: [
        ['1. Information We Collect', 'We collect your name, email address, phone number, and driving licence number solely to process your vehicle bookings and verify driver eligibility.'],
        ['2. Data Security', 'Account passwords are protected using bcrypt cryptographic hashing. Online payments are secured end-to-end via PCI-DSS compliant industry standard payment gateways.'],
        ['3. Your Choices', 'You can update your profile details or clear saved favorites at any time from your account dashboard.'],
      ],
    },
    cancellation: {
      title: 'Cancellation & Refund Policy',
      updated: 'October 2026',
      sections: [
        ['1. Free Cancellation Window', 'Active bookings can be cancelled free of charge up to 24 hours before the scheduled pickup date and time directly from the My Bookings page.'],
        ['2. Late Cancellations', 'Bookings starting in less than 24 hours cannot be cancelled online as the vehicle is already prepped and dispatched to your pickup hub.'],
        ['3. Refunds & Security Deposit', 'When a paid booking is cancelled within the eligible window, its payment status automatically updates to Refunded. Security deposits are refunded in full upon damage-free vehicle return.'],
      ],
    },
  }[type] || { title: 'Policy', updated: 'October 2026', sections: [] };

  return (
    <div className="container-x max-w-3xl py-12 text-[#0A142F]">
      <h1 className="font-heading text-3xl font-black text-[#0A142F]">{content.title}</h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-wider text-[#1E3A8A] font-bold">Last updated: {content.updated}</p>
      <div className="mt-8 space-y-6 rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm">
        {content.sections.map(([heading, body]) => (
          <section key={heading} className="border-b border-slate-100 pb-4 last:border-none last:pb-0">
            <h2 className="font-bold text-base text-[#0A142F]">{heading}</h2>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
