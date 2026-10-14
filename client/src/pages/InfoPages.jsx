import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Award, Users, ChevronDown } from 'lucide-react';
import { faqs as seedFaqs, locations } from '../data/homeContent.js';

export function About() {
  return (
    <div className="container-x py-12 space-y-16">
      <section className="max-w-3xl">
        <span className="font-mono text-xs uppercase tracking-widest text-[#75CFFF]">About Drivo</span>
        <h1 className="font-heading text-3xl sm:text-4xl font-black text-[#F5F7FA] mt-2">
          Next-Generation Autonomous & Self-Drive Luxury Mobility
        </h1>
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#C6CDD5]">
          Drivo bridges the gap between precision digital engineering and premium automotive luxury across eight key hubs in India. Every vehicle in our catalogue is instrumented for safety, transparent pricing, and instant contactless dispatch.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: ShieldCheck, title: 'Precision Telemetry', text: 'Rigorous 40-point hardware and hygiene audit before every single customer dispatch.' },
          { icon: MapPin, title: '8 Strategic Hubs', text: `Integrated stations across ${locations.join(', ')} with terminal concierges.` },
          { icon: Award, title: 'Cryptographic Transparency', text: '100% upfront pricing: verified daily rate, 18% GST, and refundable security hold.' },
          { icon: Users, title: '24/7 Digital Concierge', text: 'Immediate roadside support and flight-synchronized vehicle handovers.' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-6 shadow-xl transition hover:border-[#75CFFF]/40">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#75CFFF]/10 border border-[#75CFFF]/25 text-[#75CFFF]">
              <Icon size={22} />
            </span>
            <h2 className="mt-4 font-heading font-bold text-lg text-[#F5F7FA]">{title}</h2>
            <p className="mt-1 text-xs text-[#C6CDD5] leading-relaxed">{text}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#161A22] p-8 sm:p-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="font-heading text-2xl font-black text-[#F5F7FA] sm:text-3xl">Ready for next-gen travel?</h2>
          <p className="mt-2 text-sm text-[#C6CDD5]">Explore the fleet matrix and secure your vehicle in under 60 seconds.</p>
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
    <div className="container-x max-w-4xl py-12">
      <span className="font-mono text-xs uppercase tracking-widest text-[#75CFFF]">Knowledge Base</span>
      <h1 className="font-heading text-3xl sm:text-4xl font-black text-[#F5F7FA] mt-2">Frequently Answered Questions</h1>
      <p className="mt-2 text-sm text-[#C6CDD5]">Everything regarding fleet bookings, security deposits, and cancellation terms.</p>

      <div className="mt-8 divide-y divide-white/10 rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] shadow-2xl">
        {EXTENDED_FAQS.map((f, i) => (
          <div key={f.q}>
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              aria-expanded={open === i}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-bold text-[#F5F7FA] hover:text-[#75CFFF] transition"
            >
              <span className="text-sm font-semibold">{f.q}</span>
              <ChevronDown size={18} className={`shrink-0 text-[#75CFFF] transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && (
              <p className="px-6 pb-5 text-xs leading-relaxed text-[#C6CDD5] font-sans border-t border-white/5 pt-3">
                {f.a}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-white/5 bg-[#1B2028] p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-sm text-[#F5F7FA]">Still have specific inquiries?</h2>
          <p className="text-xs text-[#C6CDD5] mt-0.5">Our concierge team will resolve custom travel and vehicle requests.</p>
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
        ['2. Data Security', 'Account passwords are encrypted using bcrypt hashing on our backend database. Payment flows in this project use a clearly labelled mock gateway and never store real card details.'],
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
    <div className="container-x max-w-3xl py-12">
      <h1 className="font-heading text-3xl font-black text-[#F5F7FA]">{content.title}</h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-wider text-[#75CFFF]">Last updated: {content.updated}</p>
      <div className="mt-8 space-y-6 rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-8 shadow-2xl">
        {content.sections.map(([heading, body]) => (
          <section key={heading} className="border-b border-white/5 pb-4 last:border-none last:pb-0">
            <h2 className="font-bold text-base text-[#F5F7FA]">{heading}</h2>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#C6CDD5]">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
