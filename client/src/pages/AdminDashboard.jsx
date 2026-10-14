import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Car,
  CalendarCheck,
  Users,
  IndianRupee,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Mail,
  FileText,
  AlertTriangle,
  ArrowRight,
  Filter,
  UploadCloud,
  Image as ImageIcon,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Clock,
  ArrowUpRight,
  CheckCircle,
  DollarSign,
  Calendar,
  MapPin,
  Copy,
  Phone,
  Building,
  Navigation,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useCars } from '../context/CarContext.jsx';
import { apiRequest, uploadCarImage } from '../services/api.js';
import { resolveImageUrl } from '../utils/imageUrl.js';
import { formatINR } from '../utils/pricing.js';
import CarImage from '../components/CarImage.jsx';
import BookingReceiptModal from '../components/BookingReceiptModal.jsx';
import { locations } from '../data/homeContent.js';
import { SUPPORTED_LOCATIONS, getLocationsForCity } from '../utils/locations.js';
import PickupLocationMap from '../components/PickupLocationMap.jsx';

export default function AdminDashboard() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { cars, refreshCars, toggleCarAvailability } = useCars();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [chartMode, setChartMode] = useState('revenue'); // 'revenue' | 'volume'

  // Admin bookings
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');

  // Contact messages
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Selected receipt
  const [receiptRef, setReceiptRef] = useState(null);

  // Locations management
  const [selectedLocationCity, setSelectedLocationCity] = useState('Coimbatore');

  // Fleet management states
  const [carSearch, setCarSearch] = useState('');
  const [carCatFilter, setCarCatFilter] = useState('all');
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);

  // Car image upload states
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMode, setImageMode] = useState('upload'); // 'upload' | 'url'

  // Form state for car create/edit
  const initialCarForm = {
    brand: '',
    model: '',
    year: 2024,
    category: 'SUV',
    fuel: 'Petrol',
    transmission: 'Automatic',
    seats: 5,
    pricePerDay: 3200,
    deposit: 6000,
    location: 'Coimbatore',
    image: '',
    available: true,
  };
  const [carForm, setCarForm] = useState(initialCarForm);
  const [savingCar, setSavingCar] = useState(false);
  // Fetch admin stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await apiRequest('/admin/stats');
      setStats(res);
    } catch (err) {
      toast.error('Failed to load admin metrics');
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch admin bookings
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await apiRequest('/admin/bookings');
      setBookings(res.bookings || []);
    } catch {
      toast.error('Failed to load all bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch contact messages
  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await apiRequest('/contact');
      setMessages(res.messages || []);
    } catch {
      toast.error('Failed to load contact messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Fetch detailed analytics
  const fetchAnalytics = async (range = timeRange, start = customStart, end = customEnd) => {
    setLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      let url = `/admin/analytics?range=${range}`;
      if (range === 'custom' && start) {
        url += `&startDate=${encodeURIComponent(start)}`;
        if (end) url += `&endDate=${encodeURIComponent(end)}`;
      }
      const res = await apiRequest(url);
      setAnalytics(res);
    } catch (err) {
      setAnalyticsError(err.message || 'Failed to load analytics metrics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchStats();
      fetchBookings();
      fetchMessages();
      fetchAnalytics(timeRange, customStart, customEnd);
    }
  }, [isAuthenticated, isAdmin, timeRange]);

  // Handle Unauthorized / Non-admin
  if (!isAuthenticated) {
    return (
      <div className="container-x py-20 min-h-[70vh] flex items-center justify-center">
        <div className="mx-auto max-w-md rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-8 text-center shadow-2xl">
          <Shield size={40} className="mx-auto text-[#75CFFF]" />
          <h1 className="mt-4 text-2xl font-black text-[#F5F7FA]">Admin Authentication Required</h1>
          <p className="mt-2 text-sm text-[#C6CDD5]">Please log in with an administrator account to access this portal.</p>
          <Link to="/login" className="btn-primary mt-6 inline-block">Sign In as Admin</Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-x py-20 min-h-[70vh] flex items-center justify-center text-center">
        <div className="mx-auto max-w-md rounded-3xl border border-rose-500/30 bg-[#161A22] p-8 shadow-2xl">
          <AlertTriangle size={40} className="mx-auto text-rose-400" />
          <h1 className="mt-4 text-2xl font-black text-[#F5F7FA]">Access Denied (403 Forbidden)</h1>
          <p className="mt-2 text-sm text-[#C6CDD5]">You do not have administrative privileges. Only authorized staff may view the admin dashboard.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/dashboard" className="btn-primary text-xs">Customer Dashboard</Link>
            <Link to="/" className="btn-outline text-xs text-[#C6CDD5]">Return Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered cars
  const filteredCars = cars.filter((c) => {
    const matchQ = `${c.brand} ${c.model}`.toLowerCase().includes(carSearch.toLowerCase());
    const matchCat = carCatFilter === 'all' || c.category === carCatFilter;
    return matchQ && matchCat;
  });

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    const q = bookingSearch.toLowerCase();
    const matchQ =
      b.ref.toLowerCase().includes(q) ||
      (b.customer?.fullName || '').toLowerCase().includes(q) ||
      (b.customer?.email || '').toLowerCase().includes(q) ||
      (b.car?.brand || '').toLowerCase().includes(q) ||
      (b.car?.model || '').toLowerCase().includes(q);
    const matchStatus = bookingFilter === 'all' || b.status === bookingFilter;
    return matchQ && matchStatus;
  });

  // File upload handlers
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid image type. Please select a JPG, PNG, or WEBP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5 MB. Please select a smaller image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    toast.success(`Selected "${file.name}" (${(file.size / 1024).toFixed(0)} KB)`);
  };

  const handleRemoveFile = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAddModal = () => {
    setEditingCar(null);
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setImageMode('upload');
    setCarForm({
      ...initialCarForm,
      image: '',
    });
    setShowAddCarModal(true);
  };

  const openEditModal = (c) => {
    setEditingCar(c);
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setImageMode('upload');
    setCarForm({
      brand: c.brand,
      model: c.model,
      year: c.year,
      category: c.category,
      fuel: c.fuel,
      transmission: c.transmission,
      seats: c.seats,
      pricePerDay: c.pricePerDay,
      deposit: c.deposit,
      location: c.location,
      image: c.image || '',
      available: c.available,
    });
    setShowAddCarModal(true);
  };

  const closeCarModal = () => {
    setShowAddCarModal(false);
    setEditingCar(null);
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCarForm(initialCarForm);
  };

  // Handle Car Form Submit (Create or Update with Image Upload)
  const handleSaveCar = async (e) => {
    e.preventDefault();
    if (!carForm.brand.trim() || !carForm.model.trim()) {
      toast.error('Brand and model are required');
      return;
    }

    let resolvedImage = (carForm.image || '').trim();

    // If an image file was selected by the admin, upload it first to FastAPI backend
    if (selectedFile) {
      setUploadingImage(true);
      try {
        const uploadRes = await uploadCarImage(selectedFile);
        resolvedImage = uploadRes.url;
      } catch (err) {
        toast.error(err.message || 'Image upload failed. Please try again.');
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    } else if (!editingCar && !resolvedImage) {
      toast.error('Please upload a car image or provide an image URL');
      return;
    }

    setSavingCar(true);
    try {
      const finalImage = resolvedImage || editingCar?.image || '';
      const payload = {
        ...carForm,
        image: finalImage,
        images: [finalImage],
        year: Number(carForm.year),
        seats: Number(carForm.seats),
        pricePerDay: Number(carForm.pricePerDay),
        deposit: Number(carForm.deposit),
      };

      if (editingCar) {
        await apiRequest(`/cars/${editingCar.id}`, { method: 'PUT', body: payload });
        toast.success(`Updated ${carForm.brand} ${carForm.model}`);
      } else {
        await apiRequest('/cars', { method: 'POST', body: payload });
        toast.success(`Added ${carForm.brand} ${carForm.model} to catalog!`);
      }
      refreshCars();
      fetchStats();
      closeCarModal();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSavingCar(false);
    }
  };

  // Delete Car
  const handleDeleteCar = async (carId, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" from the fleet?`)) return;
    try {
      await apiRequest(`/cars/${carId}`, { method: 'DELETE' });
      toast.success(`${name} deleted`);
      refreshCars();
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Could not delete vehicle');
    }
  };

  // Update Booking Status
  const handleUpdateBookingStatus = async (bookingId, newStatus, newPaymentStatus) => {
    try {
      const body = { status: newStatus };
      if (newPaymentStatus) body.paymentStatus = newPaymentStatus;
      await apiRequest(`/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body,
      });
      toast.success(`Booking status updated to ${newStatus}`);
      fetchBookings();
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Could not update booking');
    }
  };

  return (
    <div className="container-x py-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#75CFFF]/10 border border-[#75CFFF]/30 text-[#75CFFF]">
              <Shield size={18} />
            </span>
            <h1 className="font-heading text-2xl font-black text-[#F5F7FA]">Drivo Admin Portal</h1>
            <span className="rounded-full bg-[#75CFFF]/10 border border-[#75CFFF]/25 px-3 py-0.5 font-mono text-[11px] font-bold text-[#75CFFF]">
              Authorized Staff
            </span>
          </div>
          <p className="mt-1 text-xs text-[#C6CDD5]">
            Real-time MySQL fleet management, live revenue analytics, and booking controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchStats();
              fetchBookings();
              fetchMessages();
              refreshCars();
              fetchAnalytics(timeRange, customStart, customEnd);
              toast.success('Admin data synchronized');
            }}
            className="btn-outline text-xs px-3 py-2 flex items-center gap-1.5 text-[#C6CDD5]"
            title="Refresh database records"
          >
            <RefreshCw size={14} className={loadingStats || loadingAnalytics ? 'animate-spin text-[#75CFFF]' : ''} /> Refresh
          </button>
          <Link to="/dashboard" className="btn-primary text-xs px-3 py-2">
            Customer View
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {[
          ['overview', 'Overview & Analytics'],
          ['fleet', `Fleet Management (${cars.length})`],
          ['bookings', `All Bookings (${bookings.length})`],
          ['inquiries', `Customer Messages (${messages.length})`],
          ['locations', `Pickup Hubs (${SUPPORTED_LOCATIONS.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-full px-4 py-2 font-mono text-xs font-semibold transition ${
              activeTab === key
                ? 'bg-[#75CFFF] text-[#111318] shadow-md shadow-[#75CFFF]/15'
                : 'bg-[#1B2028] text-[#C6CDD5] hover:bg-white/10 border border-white/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="mt-8 space-y-8">
          {/* Analytics Header & Date Range Filter */}
          <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#75CFFF]" />
                  <h2 className="text-lg font-bold text-[#F5F7FA]">Analytics & Performance Metrics</h2>
                </div>
                <p className="mt-1 text-xs text-[#C6CDD5]">
                  Aggregated from MySQL database bookings, verified payments, and fleet utilization records.
                </p>
              </div>

              {/* Time Range Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  ['all', 'All Time'],
                  ['30d', 'Last 30 Days'],
                  ['90d', 'Last 90 Days'],
                  ['year', 'This Year'],
                  ['custom', 'Custom Range'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setTimeRange(key);
                      if (key !== 'custom') {
                        fetchAnalytics(key);
                      }
                    }}
                    className={`rounded-full px-3.5 py-1.5 font-mono text-xs font-semibold transition ${
                      timeRange === key
                        ? 'bg-[#75CFFF] text-[#111318] shadow-sm'
                        : 'bg-[#1B2028] text-[#C6CDD5] hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Range Inputs */}
            {timeRange === 'custom' && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-end gap-3 animate-in fade-in">
                <div>
                  <label htmlFor="adm-start" className="block font-mono text-[11px] font-semibold text-[#75CFFF] mb-1">
                    Start Date & Time
                  </label>
                  <input
                    id="adm-start"
                    type="datetime-local"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="field text-xs py-1.5"
                  />
                </div>
                <div>
                  <label htmlFor="adm-end" className="block font-mono text-[11px] font-semibold text-[#75CFFF] mb-1">
                    End Date & Time
                  </label>
                  <input
                    id="adm-end"
                    type="datetime-local"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="field text-xs py-1.5"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchAnalytics('custom', customStart, customEnd)}
                  className="btn-primary text-xs py-2 px-4"
                >
                  Apply Filter
                </button>
              </div>
            )}
          </div>

          {/* Loading & Error States */}
          {loadingAnalytics && !analytics && (
            <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-12 text-center shadow-xl">
              <RefreshCw size={28} className="mx-auto text-[#75CFFF] animate-spin" />
              <p className="mt-3 text-sm font-semibold text-[#C6CDD5]">Calculating real-time analytics from database...</p>
            </div>
          )}

          {analyticsError && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
              <AlertTriangle size={28} className="mx-auto text-red-600" />
              <p className="mt-2 text-sm font-bold text-red-900">{analyticsError}</p>
              <button
                type="button"
                onClick={() => fetchAnalytics(timeRange, customStart, customEnd)}
                className="mt-3 btn-outline text-xs py-1.5 px-3 border-red-300 text-red-700 hover:bg-red-100"
              >
                Retry Loading
              </button>
            </div>
          )}

          {analytics && analytics.kpis && (
            <>
              {/* PRIMARY FINANCIAL & BOOKINGS KPI GRID */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Gross Booking Value (GBV) */}
                <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-5 shadow-xl transition hover:border-[#75CFFF]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#75CFFF]">Gross Booking Value</span>
                    <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#C6CDD5]">Contracted</span>
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-[#F5F7FA]">{formatINR(analytics.kpis.grossBookingValue)}</p>
                  <p className="mt-1 text-xs text-[#C6CDD5]">Confirmed & completed rental value</p>
                </div>

                {/* 2. Actual Collected Revenue */}
                <div className="rounded-3xl border border-emerald-500/20 bg-[#161A22] p-5 shadow-xl transition hover:border-emerald-500/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">Collected Revenue</span>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">Settled Cash</span>
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-emerald-400">{formatINR(analytics.kpis.collectedRevenue)}</p>
                  <p className="mt-1 text-xs text-[#C6CDD5]">Verified payments marked 'Paid'</p>
                </div>

                {/* 3. Pending / Uncollected Balance */}
                <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-5 shadow-xl transition hover:border-[#75CFFF]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">Pending Collection</span>
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">Awaiting</span>
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-[#F5F7FA]">{formatINR(analytics.kpis.pendingRevenue)}</p>
                  <p className="mt-1 text-xs text-[#C6CDD5]">Active rentals awaiting payment settlement</p>
                </div>

                {/* 4. Average Order Value (AOV) */}
                <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-5 shadow-xl transition hover:border-[#75CFFF]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#75CFFF]">Average Ticket Value</span>
                    <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#C6CDD5]">AOV</span>
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-[#F5F7FA]">{formatINR(analytics.kpis.avgOrderValue)}</p>
                  <p className="mt-1 text-xs text-[#C6CDD5]">Avg size per verified reservation</p>
                </div>

                {/* 5. Total Bookings */}
                <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-5 shadow-xl transition hover:border-[#75CFFF]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#C6CDD5]">Total Reservations</span>
                    <CalendarCheck size={16} className="text-[#75CFFF]" />
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-[#F5F7FA]">{analytics.kpis.totalBookings}</p>
                  <p className="mt-1 text-xs text-[#C6CDD5]">{analytics.kpis.confirmedBookings} confirmed · {analytics.kpis.completedBookings} completed</p>
                </div>

                {/* 6. Fleet Inventory */}
                <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-5 shadow-xl transition hover:border-[#75CFFF]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#C6CDD5]">Fleet Units</span>
                    <Car size={16} className="text-emerald-400" />
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-[#F5F7FA]">{analytics.kpis.totalCars}</p>
                  <p className="mt-1 text-xs text-emerald-400 font-medium">{analytics.kpis.availableCars} active & ready ({analytics.kpis.maintenanceCars} service)</p>
                </div>

                {/* 7. Live Fleet Utilization */}
                <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-5 shadow-xl transition hover:border-[#75CFFF]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#C6CDD5]">Fleet Utilization</span>
                    <Activity size={16} className="text-[#75CFFF]" />
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-[#75CFFF]">{analytics.kpis.fleetUtilizationRate}%</p>
                  <p className="mt-1 text-xs text-[#C6CDD5]">{analytics.kpis.currentlyBookedCars} cars currently on road</p>
                </div>

                {/* 8. Registered Accounts */}
                <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-5 shadow-xl transition hover:border-[#75CFFF]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#C6CDD5]">Registered Drivers</span>
                    <Users size={16} className="text-[#75CFFF]" />
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-[#F5F7FA]">{analytics.kpis.totalUsers}</p>
                  <p className="mt-1 text-xs text-[#C6CDD5]">{analytics.kpis.customerUsers} customers · {analytics.kpis.adminUsers} staff</p>
                </div>
              </div>

              {/* BOOKING STATUS DISTRIBUTION BAR */}
              <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-5 shadow-xl">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#75CFFF] block mb-3">
                  Telemetry Status Distribution ({analytics.kpis.totalBookings} Total)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-xs font-bold text-emerald-400">Confirmed Bookings</span>
                    <p className="text-xl font-black font-mono text-[#F5F7FA] mt-1">{analytics.kpis.confirmedBookings}</p>
                    <span className="text-[11px] text-emerald-400/80 font-medium">Active reservations</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <span className="text-xs font-bold text-blue-400">Completed Trips</span>
                    <p className="text-xl font-black font-mono text-[#F5F7FA] mt-1">{analytics.kpis.completedBookings}</p>
                    <span className="text-[11px] text-blue-400/80 font-medium">Successfully finished</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-xs font-bold text-amber-300">Pending Bookings</span>
                    <p className="text-xl font-black font-mono text-[#F5F7FA] mt-1">{analytics.kpis.pendingBookings}</p>
                    <span className="text-[11px] text-amber-300/80 font-medium">Awaiting payment</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-xs font-bold text-rose-400">Cancelled Bookings</span>
                    <p className="text-xl font-black font-mono text-[#F5F7FA] mt-1">{analytics.kpis.cancelledBookings}</p>
                    <span className="text-[11px] text-rose-400/80 font-medium">Refunded or cancelled</span>
                  </div>
                </div>
              </div>

              {/* MONTHLY REVENUE & BOOKING TRENDS CHART */}
              {analytics.monthlyTrends && analytics.monthlyTrends.length > 0 && (
                <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                      <h3 className="font-heading font-black text-lg text-[#F5F7FA] flex items-center gap-2">
                        <TrendingUp size={18} className="text-[#75CFFF]" />
                        Monthly Booking & Revenue Trends
                      </h3>
                      <p className="text-xs text-[#C6CDD5] mt-0.5">
                        Direct chronological aggregation from persistent MySQL database timestamps.
                      </p>
                    </div>

                    {/* Chart Mode Toggle */}
                    <div className="flex items-center gap-1.5 rounded-full bg-[#1B2028] border border-white/5 p-1">
                      <button
                        type="button"
                        onClick={() => setChartMode('revenue')}
                        className={`rounded-full px-3 py-1 font-mono text-xs font-semibold transition ${
                          chartMode === 'revenue'
                            ? 'bg-[#75CFFF] text-[#111318] shadow'
                            : 'text-[#C6CDD5] hover:text-white'
                        }`}
                      >
                        Revenue (₹)
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartMode('volume')}
                        className={`rounded-full px-3 py-1 font-mono text-xs font-semibold transition ${
                          chartMode === 'volume'
                            ? 'bg-[#75CFFF] text-[#111318] shadow'
                            : 'text-[#C6CDD5] hover:text-white'
                        }`}
                      >
                        Booking Volume
                      </button>
                    </div>
                  </div>

                  {/* Chart Legend */}
                  <div className="flex items-center justify-end gap-4 text-xs font-mono mb-4 text-[#C6CDD5]">
                    {chartMode === 'revenue' ? (
                      <>
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded bg-[#75CFFF]" /> Gross Booking Value
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded bg-emerald-400" /> Collected Revenue
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded bg-[#75CFFF]" /> Total Bookings
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded bg-rose-400" /> Cancellations
                        </span>
                      </>
                    )}
                  </div>

                  {/* Responsive Visual Bar Chart */}
                  {(() => {
                    const trends = analytics.monthlyTrends;
                    const maxVal =
                      chartMode === 'revenue'
                        ? Math.max(1, ...trends.map((t) => Math.max(t.grossValue || 0, t.collectedRevenue || 0)))
                        : Math.max(1, ...trends.map((t) => Math.max(t.bookings || 0, t.cancelled || 0)));

                    return (
                      <div className="pt-6 pb-2">
                        <div className="flex items-end justify-between gap-2 sm:gap-4 h-56 border-b border-white/10 px-2 sm:px-4">
                          {trends.map((t) => {
                            const bar1Val = chartMode === 'revenue' ? t.grossValue : t.bookings;
                            const bar2Val = chartMode === 'revenue' ? t.collectedRevenue : t.cancelled;
                            const h1 = Math.max(4, Math.round((bar1Val / maxVal) * 100));
                            const h2 = Math.max(4, Math.round((bar2Val / maxVal) * 100));

                            return (
                              <div
                                key={t.month}
                                className="group relative flex-1 flex flex-col items-center justify-end h-full"
                              >
                                {/* Tooltip on hover */}
                                <div className="pointer-events-none absolute -top-12 z-20 hidden rounded-xl bg-[#1B2028] border border-white/10 px-2.5 py-1.5 text-[11px] text-[#F5F7FA] shadow-xl group-hover:block whitespace-nowrap font-mono">
                                  <p className="font-bold">{t.label}</p>
                                  {chartMode === 'revenue' ? (
                                    <>
                                      <p className="text-[#75CFFF]">GBV: {formatINR(t.grossValue)}</p>
                                      <p className="text-emerald-400">Paid: {formatINR(t.collectedRevenue)}</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-[#75CFFF]">Bookings: {t.bookings}</p>
                                      <p className="text-rose-400">Cancelled: {t.cancelled}</p>
                                    </>
                                  )}
                                </div>

                                {/* Bars container */}
                                <div className="flex items-end justify-center gap-1 sm:gap-2 w-full max-w-[50px] h-full">
                                  {/* Bar 1 */}
                                  <div
                                    style={{ height: `${h1}%` }}
                                    className={`w-full rounded-t transition-all duration-500 ${
                                      chartMode === 'revenue'
                                        ? 'bg-[#75CFFF]/40 group-hover:bg-[#75CFFF]'
                                        : 'bg-[#75CFFF]/50 group-hover:bg-[#75CFFF]'
                                    }`}
                                  />
                                  {/* Bar 2 */}
                                  <div
                                    style={{ height: `${h2}%` }}
                                    className={`w-full rounded-t transition-all duration-500 ${
                                      chartMode === 'revenue'
                                        ? 'bg-emerald-500/60 group-hover:bg-emerald-400'
                                        : 'bg-rose-500/60 group-hover:bg-rose-400'
                                    }`}
                                  />
                                </div>

                                {/* Month Label */}
                                <span className="mt-2 font-mono text-[11px] font-semibold text-[#C6CDD5] truncate w-full text-center">
                                  {t.label.split(' ')[0]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TWO COLUMN INSIGHTS: POPULAR CARS & FLEET CATEGORIES */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* 1. Popular Cars by Real Bookings */}
                <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-black text-lg text-[#F5F7FA] flex items-center gap-2">
                      <Award size={18} className="text-[#75CFFF]" />
                      Popular Fleet Cars (Real Booking Counts)
                    </h3>
                  </div>
                  <p className="text-xs text-[#C6CDD5] mb-4">
                    Ranked by total completed and confirmed reservations recorded in the database.
                  </p>

                  {analytics.popularCars && analytics.popularCars.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.popularCars.map((car, idx) => (
                        <div
                          key={car.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-white/5 bg-[#1B2028] hover:border-[#75CFFF]/30 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#75CFFF]/10 border border-[#75CFFF]/30 text-[#75CFFF] font-mono text-xs font-bold shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="h-10 w-14 overflow-hidden rounded-xl bg-neutral-900 border border-white/5 shrink-0">
                              <CarImage src={car.image} alt={car.model} className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-[#F5F7FA] leading-tight">
                                {car.brand} {car.model}
                              </h4>
                              <p className="font-mono text-[11px] text-[#C6CDD5]">
                                {car.category} · {formatINR(car.pricePerDay)}/day
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-400">
                              {car.bookingsCount} booking{car.bookingsCount === 1 ? '' : 's'}
                            </span>
                            <span className="block font-mono text-[11px] font-semibold text-[#75CFFF] mt-1">
                              {formatINR(car.revenue)} earned
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-neutral-500 font-mono text-xs">
                      No car bookings recorded yet.
                    </div>
                  )}
                </div>

                {/* 2. Fleet Inventory & Availability Summary by Category */}
                <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-black text-lg text-[#F5F7FA] flex items-center gap-2">
                      <PieChart size={18} className="text-[#75CFFF]" />
                      Fleet Inventory & Category Availability
                    </h3>
                  </div>
                  <p className="text-xs text-[#C6CDD5] mb-4">
                    Active availability and operational breakdown across car categories.
                  </p>

                  {analytics.categorySummary && analytics.categorySummary.length > 0 ? (
                    <div className="space-y-3.5">
                      {analytics.categorySummary.map((cat) => (
                        <div key={cat.category} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#F5F7FA]">{cat.category}</span>
                            <span className="font-mono text-[#C6CDD5]">
                              <strong className="text-emerald-400">{cat.available}</strong> ready / {cat.total} total ({cat.sharePercent}% of fleet)
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="h-2 w-full rounded-full bg-[#1B2028] border border-white/5 overflow-hidden flex">
                            <div
                              style={{ width: `${cat.sharePercent}%` }}
                              className="h-full bg-gradient-to-r from-[#75CFFF] to-emerald-400 rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-neutral-500 font-mono text-xs">
                      No fleet category records available.
                    </div>
                  )}
                </div>
              </div>

              {/* RECENT BOOKINGS SUMMARY TABLE */}
              <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-heading font-black text-lg text-[#F5F7FA] flex items-center gap-2">
                      <Clock size={18} className="text-[#75CFFF]" />
                      Recent Bookings Overview
                    </h3>
                    <p className="text-xs text-[#C6CDD5] mt-0.5">
                      Direct view of the latest customer bookings with verified database pricing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1 text-[#C6CDD5]"
                  >
                    View All ({bookings.length}) <ArrowRight size={13} />
                  </button>
                </div>

                {analytics.recentBookings && analytics.recentBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 bg-[#1B2028] text-[#75CFFF] font-mono text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Booking Ref</th>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3">Vehicle</th>
                          <th className="py-2.5 px-3">Dates</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Payment</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {analytics.recentBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-white/5 transition">
                            <td className="py-3 px-3 font-mono font-bold text-[#75CFFF]">{b.ref}</td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-[#F5F7FA]">{b.customer?.fullName || 'Customer'}</p>
                              <p className="text-[10px] text-[#C6CDD5]">{b.customer?.email || '—'}</p>
                            </td>
                            <td className="py-3 px-3 font-semibold text-[#F5F7FA]">
                              {b.car?.brand} {b.car?.model}
                            </td>
                            <td className="py-3 px-3 font-mono text-[#C6CDD5]">
                              {b.start ? b.start.split('T')[0] : '—'} &rarr; {b.end ? b.end.split('T')[0] : '—'}
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={b.status} />
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={b.paymentStatus} />
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-[#75CFFF]">
                              {formatINR(b.pricing?.total || 0)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setReceiptRef(b.ref)}
                                className="font-mono text-[11px] font-bold text-[#75CFFF] hover:underline"
                              >
                                Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-6 text-xs text-neutral-500 font-mono">No recent bookings recorded.</p>
                )}
              </div>
            </>
          )}

          {/* Quick Actions Shortcuts */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-6 shadow-xl">
              <h3 className="font-heading font-black text-lg text-[#F5F7FA]">Fleet Controls</h3>
              <p className="mt-1 text-xs text-[#C6CDD5]">Quickly add new vehicles or configure daily rental rates.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={openAddModal}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Plus size={15} /> Add New Car
                </button>
                <button onClick={() => setActiveTab('fleet')} className="btn-outline text-xs text-[#C6CDD5]">
                  Manage Fleet ({cars.length})
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-6 shadow-xl">
              <h3 className="font-heading font-black text-lg text-[#F5F7FA]">Booking Dispatch</h3>
              <p className="mt-1 text-xs text-[#C6CDD5]">Process confirmed bookings, print tax receipts, or handle refunds.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => setActiveTab('bookings')} className="btn-primary text-xs flex items-center gap-1.5">
                  <CalendarCheck size={15} /> Review Bookings ({bookings.length})
                </button>
                <button onClick={() => setActiveTab('inquiries')} className="btn-outline text-xs flex items-center gap-1.5 text-[#C6CDD5]">
                  <Mail size={15} /> Inquiries ({messages.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FLEET MANAGEMENT */}
      {activeTab === 'fleet' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  placeholder="Filter by brand or model..."
                  value={carSearch}
                  onChange={(e) => setCarSearch(e.target.value)}
                  className="field pl-9 text-xs"
                />
              </div>

              <select
                value={carCatFilter}
                onChange={(e) => setCarCatFilter(e.target.value)}
                className="field text-xs sm:w-44"
              >
                <option value="all">All Categories</option>
                {['Hatchback', 'Sedan', 'SUV', 'MUV / MPV', 'Luxury', 'Electric Vehicles'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              onClick={openAddModal}
              className="btn-primary text-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus size={15} /> Add Vehicle to Fleet
            </button>
          </div>

          <p className="font-mono text-xs text-[#C6CDD5]">Showing {filteredCars.length} of {cars.length} cars in catalog</p>

          <div className="overflow-x-auto rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-[#1B2028] font-mono text-[11px] font-bold uppercase tracking-wider text-[#75CFFF]">
                <tr>
                  <th className="p-4">Car ID & Vehicle</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Specs</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Daily Rate</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCars.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-900 border border-white/5">
                          <CarImage src={c.image} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-black text-[#F5F7FA]">{c.brand} {c.model}</p>
                          <span className="font-mono text-[10px] text-[#C6CDD5]">ID: #{c.id} · {c.year}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 font-mono font-semibold text-[11px] text-[#C6CDD5]">
                        {c.category}
                      </span>
                    </td>
                    <td className="p-4 text-[#C6CDD5]">
                      {c.fuel} · {c.transmission} · {c.seats} seats
                    </td>
                    <td className="p-4 text-[#C6CDD5] font-medium">
                      {c.location}
                    </td>
                    <td className="p-4 font-mono font-bold text-[#75CFFF]">
                      {formatINR(c.pricePerDay)}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleCarAvailability(c.id, !c.available)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold border transition ${
                          c.available
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 border-rose-500/25 text-rose-400 hover:bg-rose-500/20'
                        }`}
                        title="Click to toggle availability"
                      >
                        {c.available ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {c.available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-[#C6CDD5] hover:bg-white/10 hover:text-white transition"
                          title="Edit vehicle"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCar(c.id, `${c.brand} ${c.model}`)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete vehicle"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ALL BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  placeholder="Search ref, customer, email, car..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="field pl-9 text-xs"
                />
              </div>

              <select
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value)}
                className="field text-xs sm:w-40"
              >
                <option value="all">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-[#1B2028] font-mono text-[11px] font-bold uppercase tracking-wider text-[#75CFFF]">
                <tr>
                  <th className="p-4">Booking Ref</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Car Reserved</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status & Payment</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBookings.map((b) => (
                  <tr key={b.id || b.ref} className="hover:bg-white/5 transition">
                    <td className="p-4">
                      <span className="font-mono font-bold text-[#75CFFF]">{b.ref}</span>
                      <p className="text-[11px] font-medium text-[#C6CDD5] mt-0.5 flex items-center gap-1">
                        <MapPin size={11} className="text-[#75CFFF] shrink-0" /> {b.pickup}
                      </p>
                      {b.dropoff && b.dropoff !== b.pickup && (
                        <p className="text-[10px] text-neutral-400">Return: {b.dropoff}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[#F5F7FA]">{b.customer?.fullName}</p>
                      <p className="text-[#C6CDD5]">{b.customer?.email}</p>
                      <p className="font-mono text-neutral-400 text-[10px]">{b.customer?.phone}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[#F5F7FA]">{b.car?.brand} {b.car?.model}</p>
                      <span className="font-mono text-[10px] text-[#C6CDD5]">{b.car?.category}</span>
                    </td>
                    <td className="p-4 font-mono text-[#C6CDD5]">
                      <div>Start: {new Date(b.start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                      <div className="text-[10px] text-neutral-400">End: {new Date(b.end).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                    </td>
                    <td className="p-4 font-mono font-extrabold text-[#75CFFF]">
                      {formatINR(b.pricing?.total || 0)}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <StatusBadge status={b.status} />
                        <span
                          className={`block font-mono text-[10px] font-semibold ${
                            b.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-300'
                          }`}
                        >
                          Payment: {b.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setReceiptRef(b.ref)}
                          className="btn-outline px-2 py-1 text-[11px] flex items-center gap-1 text-[#C6CDD5]"
                          title="Print or view tax invoice"
                        >
                          <FileText size={13} /> Invoice
                        </button>
                        {b.status === 'Confirmed' && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, 'Completed', 'Paid')}
                            className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 font-mono text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                            title="Mark trip as completed"
                          >
                            Complete
                          </button>
                        )}
                        {b.status === 'Confirmed' && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, 'Cancelled')}
                            className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2 py-1 font-mono text-[11px] font-bold text-rose-400 hover:bg-rose-500/20 transition"
                            title="Cancel booking"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMER INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div className="mt-8 space-y-4">
          <p className="font-mono text-xs text-[#C6CDD5]">Contact form transmissions stored in database</p>
          <div className="grid gap-4 md:grid-cols-2">
            {messages.map((m) => (
              <div key={m.id} className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-6 shadow-xl">
                <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F7FA]">{m.name}</h3>
                    <p className="text-xs text-[#C6CDD5]">{m.email} · {m.phone || 'No phone'}</p>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {new Date(m.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="font-bold text-xs text-[#75CFFF]">Subject: {m.subject}</p>
                  <p className="mt-1.5 text-xs text-[#C6CDD5] leading-relaxed bg-[#1B2028] p-3 rounded-2xl border border-white/5">{m.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PICKUP HUBS & STATIONS */}
      {activeTab === 'locations' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-heading text-lg font-black text-[#F5F7FA] flex items-center gap-2">
                <MapPin size={20} className="text-[#75CFFF]" /> Drivo Network Hubs & Handover Stations
              </h2>
              <p className="mt-0.5 text-xs text-[#C6CDD5]">
                Authoritative physical dispatch hubs, airport terminal kiosks, and railway concierge points with verified coordinates.
              </p>
            </div>

            {/* City Selector */}
            <div className="flex flex-wrap gap-1.5 rounded-2xl bg-[#1B2028] border border-white/5 p-1 text-xs">
              {['Coimbatore', 'Chennai', 'Bengaluru', 'Kochi', 'Hyderabad', 'Mumbai', 'Delhi', 'Nagercoil'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedLocationCity(c)}
                  className={`rounded-xl px-3 py-1 font-mono text-xs font-semibold transition ${
                    selectedLocationCity === c
                      ? 'bg-[#75CFFF] text-[#111318] shadow-sm'
                      : 'text-[#C6CDD5] hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Map */}
          <PickupLocationMap
            city={selectedLocationCity}
            title={`Interactive Station Map — ${selectedLocationCity}`}
            subtitle={`Visual coordinates and radius for Drivo ${selectedLocationCity} operational stations.`}
          />

          {/* Station Directory Cards */}
          <div className="space-y-3">
            <h3 className="font-heading font-black text-sm text-[#F5F7FA] flex items-center gap-2">
              <Building size={16} className="text-[#75CFFF]" /> Registered Stations in {selectedLocationCity}
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              {getLocationsForCity(selectedLocationCity).map((loc) => {
                const cityFleetCount = cars.filter((c) => c.location === loc.city).length;
                return (
                  <div
                    key={loc.id}
                    className="flex flex-col justify-between rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-5 shadow-xl hover:border-[#75CFFF]/40 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                          {loc.tag}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-[#C6CDD5]">
                          {cityFleetCount} Fleet Vehicles
                        </span>
                      </div>

                      <h4 className="font-black text-base text-[#F5F7FA]">{loc.name}</h4>
                      <p className="mt-1 text-xs text-[#C6CDD5] leading-relaxed">{loc.address}</p>

                      <div className="mt-3 rounded-xl bg-[#1B2028] border border-white/5 p-2.5 text-[11px] space-y-1 text-[#C6CDD5]">
                        <p className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-400">Hours:</span>
                          <span className="font-medium text-[#F5F7FA]">{loc.hours}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-400">Desk Phone:</span>
                          <a href={`tel:${loc.phone.replace(/\s+/g, '')}`} className="font-mono font-bold text-[#75CFFF] hover:underline">
                            {loc.phone}
                          </a>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-400">Coordinates:</span>
                          <span className="font-mono text-[10px] text-[#75CFFF]">
                            {loc.lat}, {loc.lng}
                          </span>
                        </p>
                      </div>

                      <div className="mt-3 text-xs text-[#C6CDD5]">
                        <strong className="text-[#F5F7FA] block text-[11px]">Handover Instructions:</strong>
                        <p className="mt-0.5 leading-relaxed text-[#C6CDD5]/90">{loc.instructions}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-neutral-400 uppercase">
                        Landmark: {loc.landmark}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${loc.lat}, ${loc.lng}`);
                          toast.success(`Copied coordinates: ${loc.lat}, ${loc.lng}`);
                        }}
                        className="btn-outline text-[11px] px-2.5 py-1 flex items-center gap-1 text-[#C6CDD5]"
                        title="Copy GPS coordinates"
                      >
                        <Copy size={11} /> Copy GPS
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CAR MODAL */}
      {showAddCarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-[#161A22] border border-[rgba(198,205,213,0.15)] text-[#F5F7FA] p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-heading text-lg font-black text-[#F5F7FA]">
                {editingCar ? `Edit ${editingCar.brand} ${editingCar.model}` : 'Add Vehicle to Fleet'}
              </h2>
              <button
                onClick={closeCarModal}
                className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCar} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-xs font-bold text-[#75CFFF]">Brand</label>
                  <input
                    type="text"
                    required
                    value={carForm.brand}
                    onChange={(e) => setCarForm({ ...carForm, brand: e.target.value })}
                    className="field mt-1 text-xs"
                    placeholder="e.g. Porsche / BMW"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold text-[#75CFFF]">Model</label>
                  <input
                    type="text"
                    required
                    value={carForm.model}
                    onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
                    className="field mt-1 text-xs"
                    placeholder="e.g. Taycan / i8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-mono text-xs font-bold text-[#75CFFF]">Category</label>
                  <select
                    value={carForm.category}
                    onChange={(e) => setCarForm({ ...carForm, category: e.target.value })}
                    className="field mt-1 text-xs"
                  >
                    {['SUV', 'Sedan', 'Hatchback', 'MUV / MPV', 'Luxury', 'Electric Vehicles'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-xs font-bold text-[#75CFFF]">Powertrain</label>
                  <select
                    value={carForm.fuel}
                    onChange={(e) => setCarForm({ ...carForm, fuel: e.target.value })}
                    className="field mt-1 text-xs"
                  >
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-xs font-bold text-[#75CFFF]">Transmission</label>
                  <select
                    value={carForm.transmission}
                    onChange={(e) => setCarForm({ ...carForm, transmission: e.target.value })}
                    className="field mt-1 text-xs"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-mono text-xs font-bold text-[#75CFFF]">Year</label>
                  <input
                    type="number"
                    value={carForm.year}
                    onChange={(e) => setCarForm({ ...carForm, year: e.target.value })}
                    className="field mt-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold text-[#75CFFF]">Seats</label>
                  <input
                    type="number"
                    value={carForm.seats}
                    onChange={(e) => setCarForm({ ...carForm, seats: e.target.value })}
                    className="field mt-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold text-[#75CFFF]">Daily Rate (₹)</label>
                  <input
                    type="number"
                    value={carForm.pricePerDay}
                    onChange={(e) => setCarForm({ ...carForm, pricePerDay: e.target.value })}
                    className="field mt-1 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-xs font-bold text-[#75CFFF]">City Hub</label>
                  <select
                    value={carForm.location}
                    onChange={(e) => setCarForm({ ...carForm, location: e.target.value })}
                    className="field mt-1 text-xs"
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-xs font-bold text-[#75CFFF]">Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={carForm.deposit}
                    onChange={(e) => setCarForm({ ...carForm, deposit: e.target.value })}
                    className="field mt-1 text-xs font-mono"
                  />
                </div>
              </div>

              {/* UPLOAD CAR IMAGE & LIVE PREVIEW */}
              <div className="space-y-2 rounded-2xl border border-white/5 bg-[#1B2028] p-4">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs font-bold text-[#75CFFF] flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-[#75CFFF]" />
                    Vehicle Media Asset <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex rounded-lg bg-[#111318] p-0.5 text-[11px] font-semibold border border-white/5">
                    <button
                      type="button"
                      onClick={() => setImageMode('upload')}
                      className={`rounded-md px-2.5 py-0.5 transition font-mono ${
                        imageMode === 'upload' ? 'bg-[#75CFFF] text-[#111318] shadow font-bold' : 'text-[#C6CDD5] hover:text-white'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`rounded-md px-2.5 py-0.5 transition font-mono ${
                        imageMode === 'url' ? 'bg-[#75CFFF] text-[#111318] shadow font-bold' : 'text-[#C6CDD5] hover:text-white'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {imageMode === 'upload' ? (
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                    />

                    {/* Preview box if a file was selected or if editing an existing car */}
                    {(previewUrl || (editingCar && editingCar.image)) ? (
                      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111318] p-3 shadow-md">
                        <div className="flex items-center gap-4">
                          <div className="h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-neutral-900 border border-white/5">
                            <img
                              src={previewUrl || resolveImageUrl(editingCar?.image)}
                              alt="Car Preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                                  selectedFile ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' : 'bg-white/5 border border-white/10 text-[#C6CDD5]'
                                }`}
                              >
                                {selectedFile ? 'New Image Selected' : 'Current Saved Asset'}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-xs font-bold text-[#F5F7FA]">
                              {selectedFile ? selectedFile.name : (editingCar ? `${editingCar.brand} ${editingCar.model}` : 'Vehicle Image')}
                            </p>
                            {selectedFile && (
                              <p className="font-mono text-[11px] text-[#C6CDD5]">
                                Size: {(selectedFile.size / 1024).toFixed(0)} KB · Type: {selectedFile.type.split('/')[1]?.toUpperCase()}
                              </p>
                            )}
                            <div className="mt-2.5 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="btn-outline px-2.5 py-1 text-[11px] flex items-center gap-1 text-[#C6CDD5]"
                              >
                                <UploadCloud size={13} /> {selectedFile ? 'Change Image' : 'Upload Replacement'}
                              </button>
                              {selectedFile && (
                                <button
                                  type="button"
                                  onClick={handleRemoveFile}
                                  className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Drag & drop / upload button */
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-[#111318] p-6 text-center transition hover:border-[#75CFFF] hover:bg-white/5"
                      >
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-[#75CFFF] group-hover:scale-110 transition">
                          <UploadCloud size={24} />
                        </div>
                        <p className="mt-2 text-xs font-bold text-[#F5F7FA]">
                          Choose Image to Upload
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#C6CDD5]">
                          JPG, JPEG, PNG, or WEBP (Max size: 5 MB)
                        </p>
                        <button
                          type="button"
                          className="btn-outline mt-3 px-3 py-1 text-xs pointer-events-none text-[#C6CDD5]"
                        >
                          Choose File
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={carForm.image}
                      onChange={(e) => setCarForm({ ...carForm, image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="field text-xs"
                    />
                    {carForm.image && (
                      <div className="mt-2 h-20 w-32 overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
                        <img
                          src={resolveImageUrl(carForm.image)}
                          alt="URL preview"
                          className="h-full w-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="car-available"
                  checked={carForm.available}
                  onChange={(e) => setCarForm({ ...carForm, available: e.target.checked })}
                  className="rounded border-white/20 bg-[#111318] text-[#75CFFF] focus:ring-[#75CFFF]"
                />
                <label htmlFor="car-available" className="text-xs font-bold text-[#F5F7FA]">
                  Mark as Available for Rent
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={closeCarModal}
                  className="btn-outline text-xs text-[#C6CDD5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCar || uploadingImage}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  {uploadingImage ? 'Uploading Image...' : savingCar ? 'Saving...' : editingCar ? 'Save Changes' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      {receiptRef && (
        <BookingReceiptModal bookingRef={receiptRef} onClose={() => setReceiptRef(null)} />
      )}
    </div>
  );
}
