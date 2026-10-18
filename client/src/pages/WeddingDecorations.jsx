import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Heart,
  Calendar,
  Clock,
  MapPin,
  Car,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  X,
  Loader2,
  Phone,
  Info,
  DollarSign,
  User,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useCars } from '../context/CarContext.jsx';
import {
  getDecorationPackages,
  calculateDecorationPrice,
  createDecorationBooking,
} from '../services/api.js';
import { formatINR } from '../utils/pricing.js';
import { locations } from '../data/homeContent.js';

const ADDON_OPTIONS = [
  { id: 'ribbons_bows', name: 'Gold/Silver Satin Ribbon Streamers', price: 500 },
  { id: 'handle_mirrors_decor', name: '4x Door Handle & Mirror Floral Ties', price: 500 },
  { id: 'trunk_swag', name: 'Rear Trunk Lid Accent Swag Bouquet', price: 1000 },
  { id: 'custom_nameplate_ribbon', name: 'Customized Couple Nameplate Ribbon', price: 800 },
];

export default function WeddingDecorations() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { cars } = useCars();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal State
  const [activePackage, setActivePackage] = useState(null);
  const [driveMode, setDriveMode] = useState('decor_only'); // 'decor_only' | 'with_driver'
  const [selectedCarId, setSelectedCarId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [completionTime, setCompletionTime] = useState('06:30 AM');
  const [serviceCity, setServiceCity] = useState('Nagercoil');
  const [venueLocation, setVenueLocation] = useState('');
  const [selectedAddons, setSelectedAddons] = useState(['ribbons_bows', 'handle_mirrors_decor']);
  const [specialNotes, setSpecialNotes] = useState('');
  const [flowerColors, setFlowerColors] = useState('');

  // Customer Contact Fields (prefilled from authenticated user)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Real-time Pricing State
  const [livePricing, setLivePricing] = useState(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Tomorrow's date string YYYY-MM-DD
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Fetch all 24 decoration packages from MySQL
  useEffect(() => {
    setLoading(true);
    getDecorationPackages()
      .then((res) => {
        if (Array.isArray(res.packages)) {
          setPackages(res.packages);
        }
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to load decoration designs');
      })
      .finally(() => setLoading(false));
  }, []);

  // Prefill user contact details
  useEffect(() => {
    if (user) {
      setCustomerName(user.fullName || '');
      setCustomerPhone(user.phone || '');
      setCustomerEmail(user.email || '');
    }
  }, [user]);

  // Available categories
  const categories = useMemo(() => {
    const cats = ['All'];
    packages.forEach((p) => {
      if (p.theme && !cats.includes(p.theme)) cats.push(p.theme);
    });
    return cats;
  }, [packages]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.theme === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.subtitle || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [packages, selectedCategory, searchQuery]);

  // Calculate authoritative pricing whenever modal inputs change
  useEffect(() => {
    if (!activePackage) {
      setLivePricing(null);
      return;
    }

    setCalculatingPrice(true);
    const payload = {
      packageId: activePackage.id,
      carId: driveMode === 'with_driver' && selectedCarId ? Number(selectedCarId) : null,
      driveMode,
      serviceCity,
      venueLocation,
      additionalAddons: selectedAddons,
    };

    calculateDecorationPrice(payload)
      .then((res) => {
        if (res.ok && res.pricing) {
          setLivePricing(res.pricing);
        }
      })
      .catch(() => {
        // Fallback calculation for preview
      })
      .finally(() => {
        setCalculatingPrice(false);
      });
  }, [activePackage, driveMode, selectedCarId, serviceCity, venueLocation, selectedAddons]);

  const handleOpenBooking = (pkg) => {
    setActivePackage(pkg);
    // Pick suitable car default if user chooses car rental
    if (cars.length > 0 && !selectedCarId) {
      setSelectedCarId(String(cars[0].id));
    }
  };

  const handleToggleAddon = (addonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Please enter the customer / couple name');
      return;
    }
    if (!customerPhone.trim()) {
      toast.error('Please enter a contact phone number');
      return;
    }
    if (!customerEmail.trim()) {
      toast.error('Please enter an email address for confirmation receipt');
      return;
    }
    if (!eventDate) {
      toast.error('Please choose the wedding / event date');
      return;
    }
    if (!venueLocation.trim()) {
      toast.error('Please enter the marriage hall or venue address');
      return;
    }

    // Login guard
    if (!isAuthenticated) {
      toast('Please sign in or register to complete your wedding booking.', { icon: '🔐' });
      const currentPath = '/wedding-cars';
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, {
        state: { from: currentPath },
      });
      return;
    }

    setSubmittingBooking(true);
    try {
      const payload = {
        packageId: activePackage.id,
        carId: driveMode === 'with_driver' && selectedCarId ? Number(selectedCarId) : null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        eventType: 'Wedding',
        eventDate: eventDate,
        completionTime: completionTime,
        venueLocation: venueLocation.trim(),
        pickupLocation: `${serviceCity} Hub`,
        destination: venueLocation.trim(),
        serviceCity: serviceCity,
        driveMode: driveMode,
        additionalAddons: selectedAddons,
        flowerColors: flowerColors.trim(),
        specialNotes: specialNotes.trim(),
      };

      const res = await createDecorationBooking(payload);
      if (res.booking) {
        toast.success(`Wedding Car Decoration Booked! Token: ${res.booking.ref}`, { duration: 6000 });
        setActivePackage(null);
        navigate('/my-bookings');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit wedding reservation');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-[#0F172A] py-10 sm:py-14">
      {/* 1. Luxury Wedding Header */}
      <div className="container-x">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-rose-50 border border-rose-200/80 px-3 py-0.5 text-[11px] font-bold text-rose-800 tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles size={12} className="text-rose-600" />
              Kanniyakumari District Wedding Services
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-[#0A142F] tracking-tight">
            Wedding Car Flower Decorations
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Exquisite floral bonnet crests, muhurtham swags, and executive chauffeured cars. Crafted with 100% fresh blossoms and paint-safe soft-cushion mounts across Nagercoil, Kanyakumari, Marthandam, and nearby hubs.
          </p>
        </div>

        {/* 4 Feature Highlights */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#0A142F]">100% Fresh Flowers</h4>
              <p className="text-[11px] text-slate-500">Imported Dutch roses &amp; marigolds</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#1E3A8A] shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#0A142F]">Scratch-Safe Mounts</h4>
              <p className="text-[11px] text-slate-500">Zero paint damage guarantee</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#0A142F]">Venue Delivery</h4>
              <p className="text-[11px] text-slate-500">Ready 2 hrs before Muhurtham</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
              <Car size={20} />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#0A142F]">Fleet + Chauffeur</h4>
              <p className="text-[11px] text-slate-500">Rent our car or decorate yours</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition capitalize ${
                  selectedCategory === cat
                    ? 'bg-[#0A142F] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search design or flower..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0A142F]"
            />
          </div>
        </div>

        {/* Package Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 size={36} className="mx-auto animate-spin text-[#1E3A8A]" />
            <p className="mt-3 text-xs font-semibold text-slate-500">Loading wedding designs catalog...</p>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-slate-200 bg-white mt-8">
            <Sparkles size={32} className="mx-auto text-slate-400" />
            <h3 className="mt-3 font-display font-bold text-base text-[#0A142F]">No Designs Found</h3>
            <p className="mt-1 text-xs text-slate-500">Try selecting another theme category or clear search filter.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="group rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badge */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img
                      src={pkg.image || '/decorations/decor-1.jpg'}
                      alt={pkg.name}
                      onError={(e) => {
                        e.currentTarget.src = '/decorations/decor-1.jpg';
                      }}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {pkg.badge && (
                      <span className="absolute top-3 left-3 rounded-full bg-[#0A142F]/90 backdrop-blur-md px-3 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        {pkg.badge}
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-xs font-black text-[#0A142F] shadow-xs">
                      From {formatINR(pkg.startingPrice || pkg.starting_price)}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <h3 className="font-display font-bold text-base text-[#0A142F] group-hover:text-blue-900 transition leading-snug">
                      {pkg.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {pkg.subtitle || pkg.description}
                    </p>

                    {/* Included Items Preview */}
                    {Array.isArray(pkg.includedItems || pkg.included_items) && (
                      <ul className="mt-3.5 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
                        {(pkg.includedItems || pkg.included_items).slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="p-5 pt-0">
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(pkg)}
                    className="w-full rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white py-2.5 px-4 text-xs font-bold uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Reserve Design</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Interactive Booking Modal Drawer */}
      {activePackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                  Wedding Car Floral Reservation
                </span>
                <h3 className="font-display font-black text-lg text-[#0A142F]">
                  {activePackage.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePackage(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white border border-slate-200 text-slate-600 hover:text-black transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitBooking} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Option: Service Mode */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  1. Choose Service Option
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDriveMode('decor_only')}
                    className={`rounded-2xl border p-4 text-left transition ${
                      driveMode === 'decor_only'
                        ? 'border-[#0A142F] bg-blue-50/30 ring-2 ring-[#0A142F]/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-xs sm:text-sm text-[#0A142F]">Decorate My Own Car</h4>
                      <CheckCircle2 size={16} className={driveMode === 'decor_only' ? 'text-[#0A142F]' : 'text-slate-300'} />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Our floral artist decorates your personal car at the marriage venue or our hub.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDriveMode('with_driver')}
                    className={`rounded-2xl border p-4 text-left transition ${
                      driveMode === 'with_driver'
                        ? 'border-[#0A142F] bg-blue-50/30 ring-2 ring-[#0A142F]/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-xs sm:text-sm text-[#0A142F]">Fleet Car + Chauffeur</h4>
                      <CheckCircle2 size={16} className={driveMode === 'with_driver' ? 'text-[#0A142F]' : 'text-slate-300'} />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Rent a luxury Drivo vehicle decorated and driven by a certified wedding chauffeur.
                    </p>
                  </button>
                </div>
              </div>

              {/* If Fleet Car selected: Select vehicle */}
              {driveMode === 'with_driver' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <label htmlFor="wedding-car-select" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Fleet Vehicle
                  </label>
                  <select
                    id="wedding-car-select"
                    value={selectedCarId}
                    onChange={(e) => setSelectedCarId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0A142F]"
                  >
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brand} {c.model} ({c.category}) &bull; {formatINR(c.pricePerDay)}/day
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Event Date, Time & City */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  2. Muhurtham &amp; Venue Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Event Date *</label>
                    <input
                      type="date"
                      min={minDate}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0A142F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Completion Time *</label>
                    <select
                      value={completionTime}
                      onChange={(e) => setCompletionTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0A142F]"
                    >
                      <option value="05:30 AM">05:30 AM (Early Muhurtham)</option>
                      <option value="06:30 AM">06:30 AM (Morning Muhurtham)</option>
                      <option value="08:00 AM">08:00 AM</option>
                      <option value="11:00 AM">11:00 AM (Noon Function)</option>
                      <option value="04:30 PM">04:30 PM (Evening Reception)</option>
                      <option value="06:30 PM">06:30 PM (Night Reception)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Service City *</label>
                    <select
                      value={serviceCity}
                      onChange={(e) => setServiceCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0A142F]"
                    >
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Marriage Hall / Venue Name &amp; Full Address *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sri Krishna Kalyana Mandapam, WCC Road, Nagercoil"
                    value={venueLocation}
                    onChange={(e) => setVenueLocation(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0A142F]"
                  />
                </div>
              </div>

              {/* Optional Addons */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  3. Select Add-on Embellishments
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ADDON_OPTIONS.map((addon) => {
                    const isChecked = selectedAddons.includes(addon.id);
                    return (
                      <button
                        type="button"
                        key={addon.id}
                        onClick={() => handleToggleAddon(addon.id)}
                        className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                          isChecked
                            ? 'border-blue-300 bg-blue-50/40 text-blue-900'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-medium">{addon.name}</span>
                        <span className="text-xs font-bold shrink-0 ml-2">+{formatINR(addon.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  4. Contact &amp; Couple Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Saravanan & Priya"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0A142F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0A142F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Address *</label>
                    <input
                      type="email"
                      placeholder="saravanan@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0A142F]"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Special Floral Notes / Color Requests</label>
                  <input
                    type="text"
                    placeholder="e.g. Please add crimson roses to match the bridal saree"
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0A142F]"
                  />
                </div>
              </div>

              {/* Authoritative Live Price Breakdown */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4">
                <div className="flex items-center justify-between border-b border-blue-100/80 pb-2 mb-2">
                  <span className="text-xs font-bold text-[#0A142F]">Authoritative Tariff Breakdown</span>
                  {calculatingPrice && <Loader2 size={14} className="animate-spin text-blue-600" />}
                </div>

                {livePricing ? (
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Floral Design Package ({activePackage.name}):</span>
                      <span className="font-semibold">{formatINR(livePricing.decorPackagePrice)}</span>
                    </div>
                    {livePricing.carRentalCharge > 0 && (
                      <div className="flex justify-between">
                        <span>Luxury Vehicle Rental:</span>
                        <span className="font-semibold">{formatINR(livePricing.carRentalCharge)}</span>
                      </div>
                    )}
                    {livePricing.driverBaseCharge > 0 && (
                      <div className="flex justify-between">
                        <span>Chauffeur Service ({livePricing.durationHours || 8}h):</span>
                        <span className="font-semibold">{formatINR(livePricing.driverBaseCharge)}</span>
                      </div>
                    )}
                    {livePricing.addonsTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Selected Embellishments:</span>
                        <span className="font-semibold">{formatINR(livePricing.addonsTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Applicable GST (18%):</span>
                      <span className="font-semibold">{formatINR(livePricing.gst)}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-2 text-sm font-black text-[#0A142F]">
                      <span>Estimated Total:</span>
                      <span className="text-base text-blue-900">{formatINR(livePricing.total)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">
                    From {formatINR(activePackage.startingPrice || activePackage.starting_price)} + taxes
                  </div>
                )}
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="w-full rounded-2xl bg-[#0A142F] hover:bg-[#1E293B] text-white py-3.5 px-6 font-display text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingBooking ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Confirming Reservation...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Wedding Reservation &rarr;</span>
                    </>
                  )}
                </button>
                <p className="mt-2 text-center text-[11px] text-slate-500">
                  A verification confirmation reference is created immediately in your account.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
