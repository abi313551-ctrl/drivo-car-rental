import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Award,
  Zap,
  Car,
  Users,
  MapPin,
  Star,
  Play,
  X,
} from 'lucide-react';
import SearchBar from '../components/SearchBar.jsx';
import CarCard from '../components/CarCard.jsx';
import CarImage from '../components/CarImage.jsx';
import { useCars } from '../context/CarContext.jsx';
import { testimonials, faqs } from '../data/homeContent.js';

const HERO_POSTER = '/hero-drive-bright-poster.jpg';
const HERO_VIDEO = '/hero-drive-bright.mp4';
const STORY_IMAGE = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80';

const categoriesData = [
  {
    name: 'Sedan',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80',
    link: '/cars?category=Sedan',
  },
  {
    name: 'SUV',
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=400&q=80',
    link: '/cars?category=SUV',
  },
  {
    name: 'Sports',
    image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=400&q=80',
    link: '/cars?category=Luxury',
  },
  {
    name: 'Electric',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=400&q=80',
    link: '/cars?category=Electric+Vehicles',
  },
  {
    name: 'Hatchback',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
    link: '/cars?category=Hatchback',
  },
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white shadow-sm">
      {faqs.map((f, i) => (
        <div key={f.q}>
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-display font-semibold text-[#0B1528] transition hover:text-blue-900 cursor-pointer"
          >
            <span className="text-sm sm:text-base">{f.q}</span>
            <ChevronDown
              size={18}
              className={`shrink-0 transition-transform duration-300 ${
                open === i ? 'rotate-180 text-blue-600' : 'text-slate-400'
              }`}
            />
          </button>
          {open === i && (
            <p className="px-6 pb-5 text-xs sm:text-sm leading-relaxed text-slate-600">
              {f.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { cars } = useCars();
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Show top featured vehicles matching the 4-column showroom layout in reference image
  const featured = [...cars].sort((a, b) => b.rating - a.rating || b.popularity - a.popularity).slice(0, 8);

  return (
    <div className="bg-[#FAF9F6] text-[#0A142F] min-h-screen">
      {/* 1. Cinematic Hero Section with Bright Daytime Luxury Driving Video */}
      <section className="relative min-h-[85vh] sm:min-h-[88vh] flex items-center overflow-hidden bg-[#FAF9F6]">
        {/* Genuine High-Resolution Luxury Car Driving Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {/* High-quality static poster fallback */}
          <img
            src={HERO_POSTER}
            alt="Luxury Cars Driving on Architectural Bridge"
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
              videoLoaded && !videoFailed ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          />

          {!videoFailed && (
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              poster={HERO_POSTER}
              onCanPlay={() => setVideoLoaded(true)}
              onError={() => setVideoFailed(true)}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${
                videoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <source src={HERO_VIDEO} type="video/mp4" />
            </video>
          )}

          {/* Gentle Left-Side Ivory Gradient for Flawless Text Readability Without Darkening the Cars */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-3/4 lg:w-1/2 bg-gradient-to-r from-[#FAF9F6]/95 via-[#FAF9F6]/75 to-transparent pointer-events-none z-10" />

          {/* Subtle Bottom Light Fade to integrate smoothly into Floating Search Bar */}
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#FAF9F6] to-transparent pointer-events-none z-10" />
        </div>

        {/* Hero Left Content (Deep Navy Typography & Clear CTAs) */}
        <div className="container-x relative z-20 pt-16 pb-28 sm:pt-24 sm:pb-36 flex flex-col justify-center">
          <div className="max-w-2xl text-left">
            {/* Top Subtitle Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 backdrop-blur-md px-3.5 py-1 text-xs font-bold tracking-widest text-[#0A142F] shadow-sm mb-5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="uppercase text-[11px] font-extrabold tracking-[0.2em] text-[#0A142F]">
                PREMIUM CAR RENTAL
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black leading-[1.02] tracking-tight text-[#0A142F]">
              DRIVE BEYOND <br />
              <span className="text-[#1E3A8A]">ORDINARY.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg lg:text-xl font-normal text-slate-700 leading-relaxed max-w-lg">
              Your journey deserves something extraordinary.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/cars"
                className="rounded-full bg-[#0A142F] hover:bg-[#1E293B] text-white font-bold px-8 py-4 text-xs sm:text-sm tracking-wide uppercase transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                <span>Explore Cars</span>
                <span className="text-base">&rarr;</span>
              </Link>

              <a
                href="#booking-panel"
                className="rounded-full bg-white/90 hover:bg-white text-[#0A142F] border border-slate-200/90 font-bold px-7 py-4 text-xs sm:text-sm tracking-wide uppercase transition-all shadow-sm backdrop-blur-md flex items-center gap-2 cursor-pointer"
              >
                <span>Find Your Drive</span>
                <Play size={14} className="fill-[#0A142F] text-[#0A142F]" />
              </a>
            </div>
          </div>
        </div>

        {/* Live Active Driving Indicator (Bottom Right) */}
        <div className="hidden sm:flex absolute right-6 sm:right-12 bottom-24 sm:bottom-28 z-20 items-center gap-3 bg-white/85 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/80 shadow-sm text-xs font-semibold text-[#0A142F]">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
          <span>Real-time Active Fleet · 1080p Motion</span>
        </div>
      </section>

      {/* 2. Floating Search / Booking Panel (Overlapping Hero Bottom) */}
      <section id="booking-panel" className="container-x relative z-30 -mt-16 sm:-mt-20">
        <SearchBar />
      </section>

      {/* 3. 5 Value Pillars Row (Matching Reference Image) */}
      <section className="container-x py-12 sm:py-16">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5 items-start">
          {/* Safe & Secure */}
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#0B1528] shrink-0">
              <ShieldCheck size={22} className="text-[#0B1528]" />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#0B1528]">Safe &amp; Secure</h4>
              <p className="text-[11px] text-slate-500">Your safety, our priority</p>
            </div>
          </div>

          {/* 24/7 Support */}
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#0B1528] shrink-0">
              <Headphones size={22} className="text-[#0B1528]" />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#0B1528]">24/7 Support</h4>
              <p className="text-[11px] text-slate-500">We&apos;re always here</p>
            </div>
          </div>

          {/* Best Prices */}
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#0B1528] shrink-0">
              <Award size={22} className="text-[#0B1528]" />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#0B1528]">Best Prices</h4>
              <p className="text-[11px] text-slate-500">Premium cars, great value</p>
            </div>
          </div>

          {/* Easy Booking */}
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#0B1528] shrink-0">
              <Zap size={22} className="text-[#0B1528]" />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#0B1528]">Easy Booking</h4>
              <p className="text-[11px] text-slate-500">Quick &amp; hassle free</p>
            </div>
          </div>

          {/* Wide Selection */}
          <div className="flex items-center gap-3.5 col-span-2 sm:col-span-1">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#0B1528] shrink-0">
              <Car size={22} className="text-[#0B1528]" />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#0B1528]">Wide Selection</h4>
              <p className="text-[11px] text-slate-500">Top brands &amp; new models</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Popular Cars for Your Next Journey (Featured Cars Grid) */}
      <section className="container-x pb-16 sm:pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1.5">
              FEATURED CARS
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0B1528] tracking-tight">
              Popular Cars for Your Next Journey
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Choose from our most loved cars, handpicked for your perfect ride.
            </p>
          </div>
          <Link
            to="/cars"
            className="text-xs sm:text-sm font-bold text-[#0B1528] flex items-center gap-1.5 hover:gap-2.5 transition-all shrink-0"
          >
            <span>View All Cars</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* 4-Column Showroom Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </section>

      {/* 5. Split Story & Category Browser Section (Reference Image Exact Match) */}
      <section className="container-x pb-20 sm:pb-28">
        <div className="grid gap-8 lg:grid-cols-12 items-stretch">
          {/* Left Column: Our Story Scenic Card */}
          <div className="lg:col-span-5 relative rounded-3xl overflow-hidden min-h-[380px] bg-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between shadow-lg">
            {/* Background scenic coastal road photo */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${STORY_IMAGE})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-black/40" />

            {/* Top label */}
            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-300 block">
                OUR STORY
              </span>
            </div>

            {/* Middle text */}
            <div className="relative z-10 my-8">
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                More Than Just a Rental
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-200/90 leading-relaxed">
                Freedom to explore. Cars for every journey.
              </p>
            </div>

            {/* Bottom Watch Video CTA */}
            <div className="relative z-10">
              <button
                type="button"
                onClick={() => setVideoModalOpen(true)}
                className="inline-flex items-center gap-2.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#0B1528] backdrop-blur-md px-5 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Play size={13} className="fill-current" />
                <span>Watch Video</span>
              </button>
            </div>
          </div>

          {/* Right Column: Statistics & Category Browser */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            {/* 4 Key Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Stat 1 */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-[#0B1528] shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="font-display font-black text-lg text-[#0B1528]">500+</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Happy Customers</p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-[#0B1528] shrink-0">
                  <Car size={18} />
                </div>
                <div>
                  <h4 className="font-display font-black text-lg text-[#0B1528]">50+</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Premium Cars</p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-[#0B1528] shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="font-display font-black text-lg text-[#0B1528]">12+</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Cities</p>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-[#0B1528] shrink-0">
                  <Star size={18} className="fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-display font-black text-lg text-[#0B1528]">4.8/5</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Customer Rating</p>
                </div>
              </div>
            </div>

            {/* Browse by Category */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h4 className="font-display font-bold text-base sm:text-lg text-[#0B1528]">
                    Browse by Category
                  </h4>
                  <p className="text-xs text-slate-500">
                    Find the perfect car for your next adventure.
                  </p>
                </div>
                <Link
                  to="/cars"
                  className="text-xs font-bold text-[#0B1528] flex items-center gap-1 hover:gap-2 transition-all"
                >
                  <span>View All</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Category Cards Carousel / Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                {categoriesData.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => navigate(cat.link)}
                    className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-left transition-all duration-200 hover:bg-white hover:shadow-md hover:border-slate-200 cursor-pointer"
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white mb-2.5">
                      <CarImage
                        src={cat.image}
                        alt={`${cat.name} Category`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <p className="font-display font-bold text-xs text-[#0B1528]">{cat.name}</p>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 group-hover:text-blue-900 transition mt-0.5">
                      View Cars &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Testimonials & Verified Guest Feedback */}
      <section className="bg-slate-50/60 border-t border-slate-100 py-16 sm:py-24">
        <div className="container-x">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-2">
              CLIENT TESTIMONIALS
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0B1528]">
              Trusted by Discerning Drivers
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Verified experiences from travelers who demand excellence on every road.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map(({ name, city, text }) => (
              <div
                key={name}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center gap-1 mb-4 text-amber-400">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 mb-6 italic">
                  &ldquo;{text}&rdquo;
                </p>
                <div className="border-t border-slate-100 pt-3">
                  <h4 className="font-display font-bold text-xs sm:text-sm text-[#0B1528]">{name}</h4>
                  <p className="text-[11px] text-slate-400 font-medium">{city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Frequently Asked Questions */}
      <section className="container-x py-16 sm:py-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-2">
              COMMON QUESTIONS
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B1528]">
              Everything You Need to Know
            </h2>
          </div>
          <Faq />
        </div>
      </section>

      {/* Driving Video Modal (Only opens if user explicitly clicks Watch Video) */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-entrance-1">
          <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/20">
            {/* Modal Close Button */}
            <button
              onClick={() => setVideoModalOpen(false)}
              className="absolute top-4 right-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition cursor-pointer"
              aria-label="Close video"
            >
              <X size={20} />
            </button>

            {/* Video Player */}
            <div className="aspect-[16/9] w-full">
              <video
                autoPlay
                controls
                playsInline
                className="h-full w-full object-cover"
                poster={HERO_POSTER}
              >
                <source src={HERO_VIDEO} type="video/mp4" />
                <source src={HERO_FALLBACK_VIDEO} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
