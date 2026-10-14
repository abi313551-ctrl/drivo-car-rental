import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Headphones,
  Award,
  Zap,
  Car,
  ChevronDown,
  Star,
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  FileCheck,
} from 'lucide-react';
import SearchBar from '../components/SearchBar.jsx';
import CarCard from '../components/CarCard.jsx';
import CarImage from '../components/CarImage.jsx';
import { useCars } from '../context/CarContext.jsx';
import { categories, testimonials, faqs } from '../data/homeContent.js';

// High-resolution static editorial photograph of a luxury car on a scenic open coastal road
const HERO_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=85';
const STORY_IMAGE = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85';

export default function Home() {
  const navigate = useNavigate();
  const { cars } = useCars();
  const [activeFaq, setActiveFaq] = useState(0);

  // Featured vehicles: prioritize highest rated and popular models from actual database
  const featuredCars = useMemo(() => {
    return [...cars]
      .sort((a, b) => b.rating - a.rating || b.popularity - a.popularity)
      .slice(0, 8);
  }, [cars]);

  // Inventory count per category
  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const car of cars) {
      counts[car.category] = (counts[car.category] || 0) + 1;
    }
    return counts;
  }, [cars]);

  return (
    <div className="bg-[#F8F9FA] text-[#0F172A] min-h-screen">
      {/* 1. Spacious Static Editorial Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 border-b border-slate-200/60 bg-gradient-to-b from-[#FAF9F6] via-[#F8F9FA] to-white">
        <div className="container-x">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6">
              {/* Brand Label */}
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 py-1.5 text-xs font-bold tracking-widest text-slate-600 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-[#0A142F]" />
                <span className="uppercase text-[#0A142F]">DRIVO</span>
                <span className="text-slate-300">·</span>
                <span className="uppercase text-slate-500 font-semibold">PREMIUM AUTOMOTIVE MOBILITY</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-[#0A142F]">
                DRIVE BEYOND <br />
                <span className="text-[#1E3A8A]">ORDINARY.</span>
              </h1>

              {/* Subtitle */}
              <p className="max-w-xl text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
                Experience refined self-drive mobility. Curated performance vehicles, certified luxury sedans, and effortless digital booking across South India.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/cars"
                  className="rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-8 py-4 text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-md active:scale-95 flex items-center gap-2.5"
                >
                  <span>Explore Cars</span>
                  <ArrowRight size={16} />
                </Link>

                <a
                  href="#search-panel"
                  className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#0A142F] px-7 py-4 text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-2xs"
                >
                  Find Your Drive
                </a>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-6 border-t border-slate-200/70 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="font-display font-black text-lg text-[#0A142F] block">100+</span>
                  <span className="text-slate-500 font-medium">Verified Vehicles</span>
                </div>
                <div>
                  <span className="font-display font-black text-lg text-[#0A142F] block">150+</span>
                  <span className="text-slate-500 font-medium">Quality Checkpoints</span>
                </div>
                <div>
                  <span className="font-display font-black text-lg text-[#0A142F] block">Zero</span>
                  <span className="text-slate-500 font-medium">Hidden Charges</span>
                </div>
              </div>
            </div>

            {/* Right Static Imagery Column (Asymmetric Editorial Composition) */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl">
                <img
                  src={HERO_IMAGE}
                  alt="Luxury vehicle cruising along an open scenic coastal highway"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-103"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

                {/* Floating Image Badge */}
                <div className="absolute bottom-4 left-4 right-4 sm:right-auto rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-lg border border-slate-100 flex items-center gap-3.5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0A142F] shrink-0 font-bold">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="font-display font-bold text-xs sm:text-sm text-[#0A142F]">
                      Certified Handover Assurance
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Delivered sanitized and inspected to your doorstep
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Functional Booking Search Panel */}
      <section id="search-panel" className="container-x relative z-20 -mt-8 sm:-mt-10">
        <SearchBar />
      </section>

      {/* 3. Refined Benefits Section (Simple, Elegant Icons) */}
      <section className="section bg-white border-b border-slate-200/70">
        <div className="container-x">
          <div className="max-w-2xl mb-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-2">
              THE DRIVO STANDARD
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0A142F] tracking-tight">
              Designed for Total Peace of Mind
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
              Every rental is backed by transparent pricing, round-the-clock support, and uncompromising safety inspections.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Benefit 1 */}
            <div className="rounded-2xl border border-slate-200/80 bg-[#FAF9F6] p-7 transition hover:bg-white hover:shadow-md hover:border-slate-300">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-[#0A142F] border border-slate-200 shadow-2xs">
                <ShieldCheck size={22} />
              </div>
              <h3 className="mt-5 font-display text-base font-bold text-[#0A142F]">Safe &amp; Certified</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                150-point technical inspection and interior deep sanitization before every key handover.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="rounded-2xl border border-slate-200/80 bg-[#FAF9F6] p-7 transition hover:bg-white hover:shadow-md hover:border-slate-300">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-[#0A142F] border border-slate-200 shadow-2xs">
                <Headphones size={22} />
              </div>
              <h3 className="mt-5 font-display text-base font-bold text-[#0A142F]">24/7 Concierge Cover</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                Direct phone and digital roadside assistance whenever and wherever your journey takes you.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="rounded-2xl border border-slate-200/80 bg-[#FAF9F6] p-7 transition hover:bg-white hover:shadow-md hover:border-slate-300">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-[#0A142F] border border-slate-200 shadow-2xs">
                <Award size={22} />
              </div>
              <h3 className="mt-5 font-display text-base font-bold text-[#0A142F]">Transparent Rates</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                All daily tariffs, statutory taxes, and security deposits are explicitly detailed upfront.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="rounded-2xl border border-slate-200/80 bg-[#FAF9F6] p-7 transition hover:bg-white hover:shadow-md hover:border-slate-300">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-[#0A142F] border border-slate-200 shadow-2xs">
                <FileCheck size={22} />
              </div>
              <h3 className="mt-5 font-display text-base font-bold text-[#0A142F]">Instant Digital Handover</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                Quick paperless verification and immediate reservation confirmation in under three minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Vehicles Section (Large Images, Prices in ₹) */}
      <section className="section bg-[#F8F9FA] border-b border-slate-200/70">
        <div className="container-x">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1.5">
                CURATED FLEET
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0A142F] tracking-tight">
                Featured Fleet Models
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600">
                Handpicked selection of executive sedans, spacious SUVs, and electric cruisers.
              </p>
            </div>
            <Link
              to="/cars"
              className="text-xs sm:text-sm font-bold text-[#0A142F] hover:text-[#1E3A8A] flex items-center gap-1.5 hover:gap-2.5 transition-all shrink-0"
            >
              <span>View All {cars.length} Fleet Models</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Showroom Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/cars"
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-[#0A142F] px-8 py-3.5 text-xs font-bold tracking-wider uppercase transition shadow-2xs"
            >
              <span>Explore Complete Catalogue ({cars.length} Vehicles)</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Browse by Category Section (Supported by Actual Inventory) */}
      <section className="section bg-white border-b border-slate-200/70">
        <div className="container-x">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1.5">
                ARCHITECTURE OF CHOICE
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0A142F] tracking-tight">
                Browse by Category
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600">
                Configurations engineered for urban agility, executive travel, and cross-country road trips.
              </p>
            </div>
            <Link
              to="/cars"
              className="text-xs sm:text-sm font-bold text-[#0A142F] hover:text-[#1E3A8A] flex items-center gap-1.5 transition"
            >
              <span>See All Categories</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map(({ name, icon: Icon, blurb, image }) => {
              const count = categoryCounts[name] || 0;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => navigate(`/cars?category=${encodeURIComponent(name)}`)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-[#FAF9F6] p-4 text-left transition-all duration-300 hover:bg-white hover:border-slate-300 hover:shadow-md cursor-pointer"
                >
                  {image && (
                    <div className="mb-3.5 aspect-[16/11] overflow-hidden rounded-xl bg-slate-100">
                      <CarImage
                        src={image}
                        alt={`${name} Category`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-108"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-[#0A142F] border border-slate-200 shadow-2xs">
                      <Icon size={14} />
                    </span>
                    <p className="font-display font-bold text-xs sm:text-sm text-[#0A142F]">{name}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="line-clamp-1">{blurb}</span>
                    {count > 0 && (
                      <span className="ml-1 shrink-0 rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-[#0A142F]">
                        {count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Premium Brand Story Section */}
      <section className="section bg-[#FAF9F6] border-b border-slate-200/70">
        <div className="container-x">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Story Imagery */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-lg">
                <img
                  src={STORY_IMAGE}
                  alt="DRIVO luxury road experience"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A142F]/80 via-transparent to-transparent" />

                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-300 block mb-1">
                    ESTABLISHED 2024
                  </span>
                  <p className="font-display font-black text-xl sm:text-2xl">
                    More Than Just a Rental. A New Way to Travel.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Story Content */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block">
                OUR PHILOSOPHY
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-black text-[#0A142F] tracking-tight leading-tight">
                Engineered for Uncompromising Mobility.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                At DRIVO, we believe true luxury lies in absolute reliability and personal freedom. Whether you are traveling for executive meetings, coastal leisure, or extended road expeditions, our certified fleet delivers effortless performance.
              </p>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Every vehicle is inspected across 150 mechanical and digital checkpoints, delivered pristine with transparent daily pricing and round-the-clock concierge support.
              </p>

              {/* Statistics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <span className="font-display font-black text-2xl text-[#0A142F] block">500+</span>
                  <span className="text-xs text-slate-500 font-medium">Completed Trips</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <span className="font-display font-black text-2xl text-[#0A142F] block">100+</span>
                  <span className="text-xs text-slate-500 font-medium">Fleet Models</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <span className="font-display font-black text-2xl text-[#0A142F] block">8+</span>
                  <span className="text-xs text-slate-500 font-medium">Major Cities</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <span className="font-display font-black text-2xl text-[#0A142F] block">4.8 / 5</span>
                  <span className="text-xs text-slate-500 font-medium">Average Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Client Testimonials */}
      <section className="section bg-white border-b border-slate-200/70">
        <div className="container-x">
          <div className="max-w-xl mb-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-2">
              CLIENT TESTIMONIALS
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0A142F] tracking-tight">
              Verified Driver Reviews
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map(({ name, city, text }) => (
              <div
                key={name}
                className="rounded-2xl border border-slate-200/80 bg-[#FAF9F6] p-6 shadow-2xs transition hover:bg-white hover:shadow-md"
              >
                <div className="flex items-center gap-1 mb-4 text-amber-400">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 mb-6 italic">
                  &ldquo;{text}&rdquo;
                </p>
                <div className="border-t border-slate-200/60 pt-3">
                  <h4 className="font-display font-bold text-xs sm:text-sm text-[#0A142F]">{name}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Frequently Asked Questions */}
      <section className="section bg-[#F8F9FA]">
        <div className="container-x max-w-3xl">
          <div className="text-center mb-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-2">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0A142F]">
              Everything You Need to Know
            </h2>
          </div>

          <div className="divide-y divide-slate-200/80 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            {faqs.map((f, i) => (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === i ? -1 : i)}
                  aria-expanded={activeFaq === i}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-display font-semibold text-[#0A142F] transition hover:text-[#1E3A8A] cursor-pointer"
                >
                  <span className="text-sm sm:text-base">{f.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform duration-300 ${
                      activeFaq === i ? 'rotate-180 text-[#0A142F]' : 'text-slate-400'
                    }`}
                  />
                </button>
                {activeFaq === i && (
                  <p className="px-6 pb-5 text-xs sm:text-sm leading-relaxed text-slate-600">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
