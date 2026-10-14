import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Award, Users, ChevronDown } from 'lucide-react';
import { faqs as seedFaqs, locations } from '../data/homeContent.js';

export function About() {
  return (
    <div className="container-x py-12 space-y-16">
      <section className="max-w-3xl">
        <span className="rounded-full bg-accent-soft px-3.5 py-1 text-xs font-bold text-accent">About Drivo</span>
        <h1 className="heading mt-3">Self-drive car rentals built for transparency</h1>
        <p className="mt-4 text-lg leading-relaxed text-neutral-600">
          Drivo connects travellers across seven major Indian cities with a curated fleet of hatchbacks, sedans, SUVs, electric vehicles, and luxury cars. Every rental shows the exact base rate, GST, and refundable deposit upfront.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: ShieldCheck, title: '100% Inspected Fleet', text: 'Every car undergoes a 40-point safety and hygiene check before handover.' },
          { icon: MapPin, title: '7 Major Cities', text: `Available across ${locations.join(', ')} with airport & station hubs.` },
          { icon: Award, title: 'Zero Hidden Fees', text: 'Clear daily tariffs, optional add-ons, and instant coupon discounts.' },
          { icon: Users, title: '24/7 Support', text: 'Dedicated customer support and roadside assistance throughout your trip.' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-card">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent">
              <Icon size={22} />
            </span>
            <h2 className="mt-4 font-bold text-lg">{title}</h2>
            <p className="mt-1 text-sm text-neutral-600">{text}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-ink p-8 text-white sm:p-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">Ready for your next road trip?</h2>
          <p className="mt-2 text-neutral-300">Compare vehicles and lock in your dates in under two minutes.</p>
        </div>
        <Link to="/cars" className="btn-primary shrink-0">Browse our fleet</Link>
      </section>
    </div>
  );
}

const EXTENDED_FAQS = [
  ...seedFaqs,
  {
    q: 'How is the rental duration calculated?',
    a: 'Rentals are billed per started 24-hour block from your scheduled pickup time. Maximum single booking duration is 30 days.',
  },
  {
    q: 'Can I add a child seat, GPS, or additional driver?',
    a: 'Yes! During Step 3 of the booking flow, you can toggle Additional Driver, Child Seat, GPS Navigation, or Premium Insurance.',
  },
  {
    q: 'How do coupon codes work?',
    a: 'Enter a promo code like WELCOME10, WEEKEND15, or EVGO500 during Step 4 of booking to apply instant discounts before GST is calculated.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <div className="container-x max-w-4xl py-12">
      <h1 className="heading">Frequently Asked Questions</h1>
      <p className="mt-2 text-neutral-600">Everything you need to know about renting, pricing, and cancellations.</p>

      <div className="mt-8 divide-y divide-neutral-200 rounded-3xl border border-neutral-200 bg-white shadow-card">
        {EXTENDED_FAQS.map((f, i) => (
          <div key={f.q}>
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              aria-expanded={open === i}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-bold"
            >
              {f.q}
              <ChevronDown size={18} className={`shrink-0 transition ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="px-6 pb-5 text-sm leading-relaxed text-neutral-600">{f.a}</p>}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl bg-neutral-50 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold">Still have questions?</h2>
          <p className="text-sm text-neutral-600">Our support team is happy to help with custom requests.</p>
        </div>
        <Link to="/contact" className="btn-dark">Contact support</Link>
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
        ['1. Driver Eligibility', 'Drivers must be at least 21 years old and hold a valid Indian Driving Licence (format e.g. TN37 20190012345) along with an original government photo ID at the time of vehicle pickup.'],
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
      <h1 className="heading">{content.title}</h1>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Last updated: {content.updated}</p>
      <div className="mt-8 space-y-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-card">
        {content.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2 className="text-lg font-bold text-ink">{heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
