import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Quote, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchBar from '../components/SearchBar.jsx';
import CarCard from '../components/CarCard.jsx';
import { useCars } from '../context/CarContext.jsx';
import { categories, steps, benefits, offers, testimonials, faqs } from '../data/homeContent.js';

const HERO_IMG = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1800&q=70';

function SectionHead({ title, text }) {
  return (
    <div className="mb-10 max-w-2xl">
      <h2 className="heading">{title}</h2>
      {text && <p className="mt-3 text-neutral-600">{text}</p>}
    </div>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-neutral-200 rounded-3xl border border-neutral-200 bg-white">
      {faqs.map((f, i) => (
        <div key={f.q}>
          <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-semibold">
            {f.q}
            <ChevronDown size={18} className={`shrink-0 transition ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <p className="px-6 pb-5 text-sm leading-relaxed text-neutral-600">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address'); return; }
    setError('');
    toast.success('Subscribed (demo). No email was actually sent.');
    setEmail('');
  };
  return (
    <form onSubmit={submit} noValidate className="mt-6 flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <div className="flex-1">
        <label htmlFor="newsletter" className="sr-only">Email address</label>
        <input id="newsletter" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field border-white/20 bg-white/10 text-white placeholder:text-neutral-400" />
        {error && <p className="mt-1 text-xs font-semibold text-white">{error}</p>}
      </div>
      <button className="btn bg-white text-ink hover:bg-neutral-100">Subscribe</button>
    </form>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { cars } = useCars();
  const featured = [...cars].sort((a, b) => b.rating - a.rating).slice(0, 6);
  const copyCode = async (code) => {
    try { await navigator.clipboard.writeText(code); toast.success(`${code} copied`); }
    catch { toast(`Use code ${code} at payment`); }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative bg-ink text-white" style={{ backgroundImage: `linear-gradient(90deg, rgba(14,14,16,.92), rgba(14,14,16,.55)), url(${HERO_IMG})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="container-x pb-24 pt-20 sm:pt-28">
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">Find Your Perfect Ride</h1>
          <p className="mt-5 max-w-xl text-lg text-neutral-300">Hatchbacks to luxury, petrol to electric. Compare prices in rupees and book in minutes.</p>
          <div className="mt-10"><SearchBar /></div>
        </div>
      </section>

      {/* Featured cars */}
      <section className="section">
        <div className="container-x">
          <SectionHead title="Featured cars" text="Popular picks from our fleet, ready for your next trip." />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => <CarCard key={c.id} car={c} />)}
          </div>
          <div className="mt-10 text-center"><Link to="/cars" className="btn-dark">Browse all cars</Link></div>
        </div>
      </section>

      {/* Categories */}
      <section className="section bg-neutral-50">
        <div className="container-x">
          <SectionHead title="Browse by category" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {categories.map(({ name, icon: Icon, blurb }) => (
              <button key={name} onClick={() => navigate(`/cars?category=${name}`)} className="rounded-3xl border border-neutral-200 bg-white p-5 text-left transition hover:border-ink">
                <Icon size={26} />
                <p className="mt-4 font-bold">{name}</p>
                <p className="mt-1 text-xs text-neutral-500">{blurb}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="container-x">
          <SectionHead title="How it works" text="Three steps from search to the driver's seat." />
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="rounded-3xl border border-neutral-200 p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent"><Icon size={22} /></span>
                  <span className="text-sm font-semibold text-neutral-500">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-1 text-sm text-neutral-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why choose us */}
      <section className="section bg-ink text-white">
        <div className="container-x">
          <SectionHead title="Why choose Drivo" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon size={26} className="text-accent" />
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-1 text-sm text-neutral-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offers */}
      <section className="section">
        <div className="container-x">
          <SectionHead title="Offers and discounts" text="Copy a code now and apply it at payment." />
          <div className="grid gap-6 md:grid-cols-3">
            {offers.map((o) => (
              <div key={o.code} className="flex flex-col rounded-3xl border border-dashed border-neutral-300 p-6">
                <Tag size={20} className="text-accent" />
                <h3 className="mt-3 text-lg font-bold">{o.title}</h3>
                <p className="mt-1 flex-1 text-sm text-neutral-600">{o.text}</p>
                <button onClick={() => copyCode(o.code)} className="btn-outline mt-5 self-start font-mono">{o.code}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section bg-neutral-50">
        <div className="container-x">
          <SectionHead title="What customers say" />
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="rounded-3xl bg-white p-6 shadow-card">
                <Quote size={22} className="text-accent" />
                <blockquote className="mt-3 text-sm leading-relaxed text-neutral-700">{t.text}</blockquote>
                <figcaption className="mt-5 text-sm"><span className="font-bold">{t.name}</span> <span className="text-neutral-500">from {t.city}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container-x grid gap-10 lg:grid-cols-3">
          <div>
            <h2 className="heading">Questions, answered</h2>
            <p className="mt-3 text-neutral-600">More help is on the <Link to="/faq" className="font-semibold text-accent underline">FAQ page</Link>.</p>
          </div>
          <div className="lg:col-span-2"><Faq /></div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-accent text-white">
        <div className="container-x flex flex-col justify-between gap-6 py-14 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Get deals in your inbox</h2>
            <p className="mt-2 text-white/80">New offers and fleet updates, once a month.</p>
          </div>
          <Newsletter />
        </div>
      </section>
    </>
  );
}
