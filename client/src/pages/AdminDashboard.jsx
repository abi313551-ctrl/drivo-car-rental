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
  Eye,
  CreditCard,
  Star,
  Download,
  Sliders,
  Settings as SettingsIcon,
  Check,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useCars } from '../context/CarContext.jsx';
import { apiRequest, uploadCarImage } from '../services/api.js';
import { resolveImageUrl } from '../utils/imageUrl.js';
import { formatINR } from '../utils/pricing.js';
import CarImage from '../components/CarImage.jsx';
import BookingDetailModal from '../components/BookingDetailModal.jsx';
import BookingReceiptModal from '../components/BookingReceiptModal.jsx';
import { locations } from '../data/homeContent.js';
import { SUPPORTED_LOCATIONS, getLocationsForCity } from '../utils/locations.js';
import PickupLocationMap from '../components/PickupLocationMap.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import AdminLogin from './AdminLogin.jsx';

export default function AdminDashboard() {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();
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
  const [bookingDateFilter, setBookingDateFilter] = useState('');

  // Customer Management states
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);

  // Payment Management states
  const [paymentsData, setPaymentsData] = useState(null);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);

  // Reviews Management states
  const [reviewsData, setReviewsData] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');

  // Platform Settings states
  const [settingsData, setSettingsData] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingLoyalty, setSavingLoyalty] = useState(false);
  const [loyaltyForm, setLoyaltyForm] = useState({
    pointsPerBooking: 100,
    rupeePerPointRedemption: 1.0,
    minRedemptionPoints: 500,
  });

  // Contact messages
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Selected receipt & detail modal
  const [receiptRef, setReceiptRef] = useState(null);
  const [selectedDetailBooking, setSelectedDetailBooking] = useState(null);

  // Locations management
  const [selectedLocationCity, setSelectedLocationCity] = useState('Nagercoil');

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
  const [isDragging, setIsDragging] = useState(false);
  const [imageMode, setImageMode] = useState('upload'); // 'upload' | 'url'

  // Form state for car create/edit
  const initialCarForm = {
    name: '',
    brand: '',
    model: '',
    registrationNumber: '',
    year: 2025,
    category: 'SUV',
    fuel: 'Petrol',
    transmission: 'Automatic',
    seats: 5,
    pricePerDay: 3200,
    deposit: 5000,
    location: 'Nagercoil',
    image: '',
    description: '',
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

  // Fetch customers directory
  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const res = await apiRequest('/admin/customers');
      setCustomers(res.customers || []);
    } catch {
      toast.error('Failed to load customer list');
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Fetch payments
  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await apiRequest('/admin/payments');
      setPaymentsData(res);
    } catch {
      toast.error('Failed to load payment transactions');
    } finally {
      setLoadingPayments(false);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await apiRequest('/admin/reviews');
      setReviewsData(res);
    } catch {
      toast.error('Failed to load customer reviews');
    } finally {
      setLoadingReviews(false);
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this customer review?')) return;
    try {
      await apiRequest(`/admin/reviews/${reviewId}`, { method: 'DELETE' });
      toast.success('Review removed successfully');
      fetchReviews();
    } catch (err) {
      toast.error(err.message || 'Could not delete review');
    }
  };

  // Seed demo reviews
  const handleSeedDemoReviews = async () => {
    try {
      const res = await apiRequest('/admin/reviews/seed-demo', { method: 'POST' });
      toast.success(res.message || 'Demo reviews created');
      fetchReviews();
    } catch (err) {
      toast.error(err.message || 'Could not seed reviews');
    }
  };

  // Fetch settings
  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await apiRequest('/admin/settings');
      setSettingsData(res);
      if (res?.loyaltyProgram) {
        setLoyaltyForm({
          pointsPerBooking: res.loyaltyProgram.pointsPerBooking || 100,
          rupeePerPointRedemption: res.loyaltyProgram.rupeePerPointRedemption || 1.0,
          minRedemptionPoints: res.loyaltyProgram.minRedemptionPoints || 500,
        });
      }
    } catch {
      toast.error('Failed to load system settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  // Save loyalty settings
  const handleSaveLoyaltySettings = async (e) => {
    e.preventDefault();
    setSavingLoyalty(true);
    try {
      await apiRequest('/admin/settings/loyalty', {
        method: 'PUT',
        body: loyaltyForm,
      });
      toast.success('Loyalty program settings updated');
      fetchSettings();
    } catch (err) {
      toast.error(err.message || 'Could not update settings');
    } finally {
      setSavingLoyalty(false);
    }
  };

  // Download CSV report
  const handleDownloadCsv = async (reportType) => {
    try {
      const token = localStorage.getItem('drivo_auth_token');
      const response = await fetch(`/api/admin/reports/export/${reportType}.csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drivo_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Exported ${reportType} CSV successfully`);
    } catch (err) {
      toast.error(err.message || 'Failed to download report');
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
      fetchCustomers();
      fetchPayments();
      fetchReviews();
      fetchSettings();
      fetchMessages();
      fetchAnalytics(timeRange, customStart, customEnd);
    }
  }, [isAuthenticated, isAdmin, timeRange]);

  // Filtered cars
  const filteredCars = cars.filter((c) => {
    const q = carSearch.toLowerCase();
    const matchQ = `${c.brand} ${c.model} ${c.registrationNumber || ''}`.toLowerCase().includes(q);
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
      (b.customer?.phone || '').toLowerCase().includes(q) ||
      (b.car?.brand || '').toLowerCase().includes(q) ||
      (b.car?.model || '').toLowerCase().includes(q) ||
      (b.car?.registrationNumber || '').toLowerCase().includes(q);
    const matchStatus = bookingFilter === 'all' || b.status === bookingFilter;
    const matchDate = !bookingDateFilter || (b.start && b.start.startsWith(bookingDateFilter));
    return matchQ && matchStatus && matchDate;
  });

  // Filtered customers
  const filteredCustomers = customers.filter((cust) => {
    const q = customerSearch.toLowerCase();
    return (
      (cust.fullName || '').toLowerCase().includes(q) ||
      (cust.email || '').toLowerCase().includes(q) ||
      (cust.phone || '').toLowerCase().includes(q) ||
      String(cust.id).includes(q)
    );
  });

  // Filtered payments
  const filteredPayments = useMemo(() => {
    if (!paymentsData?.payments) return [];
    return paymentsData.payments.filter((p) => {
      const matchesStatus =
        paymentFilter === 'all' ||
        p.status?.toLowerCase() === paymentFilter.toLowerCase();
      const q = paymentSearch.toLowerCase();
      const matchesSearch =
        !q ||
        (p.transactionId || '').toLowerCase().includes(q) ||
        (p.razorpayPaymentId || '').toLowerCase().includes(q) ||
        (p.bookingRef || '').toLowerCase().includes(q) ||
        (p.customer?.fullName || '').toLowerCase().includes(q) ||
        (p.customer?.email || '').toLowerCase().includes(q) ||
        (p.car?.brand || '').toLowerCase().includes(q) ||
        (p.car?.model || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [paymentsData, paymentFilter, paymentSearch]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (!reviewsData?.reviews) return [];
    return reviewsData.reviews.filter((r) => {
      if (reviewRatingFilter === 'all') return true;
      return String(r.rating) === String(reviewRatingFilter);
    });
  }, [reviewsData, reviewRatingFilter]);

  // File upload handlers with drag-and-drop support
  const processSelectedFile = (file) => {
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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    processSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
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
    setIsDragging(false);
    setImageMode('upload');
    setCarForm({
      ...initialCarForm,
      image: '',
      description: '',
    });
    setShowAddCarModal(true);
  };

  const openEditModal = (c) => {
    setEditingCar(c);
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setIsDragging(false);
    setImageMode('upload');
    setCarForm({
      name: `${c.brand} ${c.model}`.trim(),
      brand: c.brand,
      model: c.model,
      registrationNumber: c.registrationNumber || '',
      year: c.year,
      category: c.category,
      fuel: c.fuel,
      transmission: c.transmission,
      seats: c.seats,
      pricePerDay: c.pricePerDay,
      deposit: c.deposit,
      location: c.location || 'Nagercoil',
      image: c.image || '',
      description: c.description || '',
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
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCarForm(initialCarForm);
  };

  // Handle Car Form Submit (Create or Update with Image Upload)
  const handleSaveCar = async (e) => {
    e.preventDefault();
    let brand = (carForm.brand || '').trim();
    let model = (carForm.model || '').trim();
    const name = (carForm.name || '').trim();

    if ((!brand || !model) && name) {
      const parts = name.split(' ');
      if (!brand) brand = parts[0];
      if (!model) model = parts.slice(1).join(' ') || parts[0];
    }

    if (!brand || !model) {
      toast.error('Car name or brand & model are required');
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
        name: `${brand} ${model}`.trim(),
        brand,
        model,
        registrationNumber: (carForm.registrationNumber || '').trim().toUpperCase(),
        image: finalImage,
        images: [finalImage],
        year: Number(carForm.year),
        seats: Number(carForm.seats),
        pricePerDay: Number(carForm.pricePerDay),
        deposit: Number(carForm.deposit),
      };

      if (editingCar) {
        await apiRequest(`/admin/cars/${editingCar.id}`, { method: 'PUT', body: payload });
        toast.success(`Updated ${brand} ${model}`);
      } else {
        await apiRequest('/admin/cars', { method: 'POST', body: payload });
        toast.success(`Added ${brand} ${model} to catalog!`);
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
    if (!window.confirm(`Are you sure you want to delete "${name}" from the fleet?`)) return;
    try {
      const res = await apiRequest(`/admin/cars/${carId}`, { method: 'DELETE' });
      if (res?.deactivated) {
        toast(res.message || `${name} was marked unavailable due to historical reservations.`, { icon: 'ℹ️' });
      } else {
        toast.success(res?.message || `${name} removed from fleet`);
      }
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

  if (loading) {
    return (
      <div className="container-x py-20 min-h-[70vh] flex items-center justify-center">
        <RefreshCw size={28} className="animate-spin text-[#1E3A8A]" />
      </div>
    );
  }

  // Handle Unauthorized / Non-admin
  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  if (!isAdmin) {
    return (
      <div className="container-x py-20 min-h-[70vh] flex items-center justify-center text-center text-[#0A142F]">
        <div className="mx-auto max-w-md rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
          <AlertTriangle size={40} className="mx-auto text-rose-500" />
          <h1 className="mt-4 font-heading text-2xl font-black text-[#0A142F]">Access Denied (403 Forbidden)</h1>
          <p className="mt-2 text-sm text-slate-600">You do not have administrative privileges. Only authorized staff may view the admin dashboard.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/admin/login" className="btn-primary text-xs">Switch to Admin Login</Link>
            <Link to="/dashboard" className="btn-outline text-xs text-slate-700">Customer Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-10 text-[#0A142F]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 border border-blue-900/15 text-[#1E3A8A]">
              <Shield size={18} />
            </span>
            <h1 className="font-heading text-2xl font-black text-[#0A142F]">Drivo Admin Portal</h1>
            <span className="rounded-full bg-blue-50 border border-blue-900/15 px-3 py-0.5 font-mono text-[11px] font-bold text-[#1E3A8A]">
              Authorized Staff
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Real-time MySQL fleet management, live revenue analytics, and booking controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchStats();
              fetchBookings();
              fetchCustomers();
              fetchPayments();
              fetchReviews();
              fetchSettings();
              fetchMessages();
              refreshCars();
              fetchAnalytics(timeRange, customStart, customEnd);
              toast.success('Admin data synchronized');
            }}
            className="btn-outline text-xs px-3 py-2 flex items-center gap-1.5 text-slate-700"
            title="Refresh database records"
          >
            <RefreshCw size={14} className={loadingStats || loadingAnalytics || loadingCustomers || loadingPayments || loadingReviews ? 'animate-spin text-[#1E3A8A]' : ''} /> Refresh
          </button>
          <Link to="/dashboard" className="btn-primary text-xs px-3 py-2">
            Customer View
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          ['overview', 'Dashboard Overview'],
          ['fleet', `Car Management (${cars.length})`],
          ['bookings', `Booking Management (${bookings.length})`],
          ['customers', `Customer Management (${customers.length})`],
          ['payments', `Payment Management (${paymentsData?.totalCount ?? '...'})`],
          ['reviews', `Reviews & Ratings (${reviewsData?.totalReviews ?? '...'})`],
          ['reports', 'Reports & Analytics'],
          ['settings', 'Platform Settings'],
          ['inquiries', `Customer Messages (${messages.length})`],
          ['locations', `Pickup Hubs (${SUPPORTED_LOCATIONS.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-full px-4 py-2 font-mono text-xs font-semibold transition ${
              activeTab === key
                ? 'bg-[#0A142F] text-white shadow-sm font-bold'
                : 'bg-white text-slate-600 hover:text-[#0A142F] border border-slate-200/80 hover:bg-slate-50'
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
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#1E3A8A]" />
                  <h2 className="text-lg font-heading font-black text-[#0A142F]">Analytics & Performance Metrics</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
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
                        ? 'bg-[#0A142F] text-white shadow-sm font-bold'
                        : 'bg-slate-50 text-slate-600 hover:text-[#0A142F] border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Range Inputs */}
            {timeRange === 'custom' && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-end gap-3 animate-in fade-in">
                <div>
                  <label htmlFor="adm-start" className="block font-mono text-[11px] font-bold text-[#0A142F] mb-1">
                    Start Date & Time
                  </label>
                  <input
                    id="adm-start"
                    type="datetime-local"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="field text-xs py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="adm-end" className="block font-mono text-[11px] font-bold text-[#0A142F] mb-1">
                    End Date & Time
                  </label>
                  <input
                    id="adm-end"
                    type="datetime-local"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="field text-xs py-1.5 bg-white"
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
            <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-sm">
              <RefreshCw size={28} className="mx-auto text-[#1E3A8A] animate-spin" />
              <p className="mt-3 text-sm font-semibold text-slate-500">Calculating real-time analytics from database...</p>
            </div>
          )}

          {analyticsError && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center">
              <AlertTriangle size={28} className="mx-auto text-rose-600" />
              <p className="mt-2 text-sm font-bold text-rose-900">{analyticsError}</p>
              <button
                type="button"
                onClick={() => fetchAnalytics(timeRange, customStart, customEnd)}
                className="mt-3 btn-outline text-xs py-1.5 px-3 border-rose-300 text-rose-700 hover:bg-rose-100"
              >
                Retry Loading
              </button>
            </div>
          )}

          <>
            {/* PRIMARY ADMIN DASHBOARD SUMMARY METRICS (Actual MySQL Telemetry) */}
              <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {/* 1. Total Cars */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm transition hover:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">Total Cars</span>
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-[#0A142F]">
                      <Car size={16} />
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-[#0A142F]">
                    {stats?.totalCars ?? analytics?.kpis?.totalCars ?? cars.length}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Total fleet catalog inventory</p>
                </div>

                {/* 2. Available Cars */}
                <div className="rounded-3xl border border-emerald-200 bg-white p-4 sm:p-5 shadow-sm transition hover:border-emerald-300">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-700">Available Cars</span>
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                      <CheckCircle2 size={16} />
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-emerald-700">
                    {stats?.availableCars ?? analytics?.kpis?.availableCars ?? cars.filter(c => c.available).length}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-700 font-medium">Ready for immediate booking</p>
                </div>

                {/* 3. Unavailable Cars */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm transition hover:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">Unavailable Cars</span>
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-500">
                      <XCircle size={16} />
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-slate-600">
                    {stats?.unavailableCars ?? (cars.length - (stats?.availableCars ?? 0))}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Maintenance / deactivated</p>
                </div>

                {/* 4. Total Bookings */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm transition hover:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">Total Bookings</span>
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-[#1E3A8A]">
                      <CalendarCheck size={16} />
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-[#0A142F]">
                    {stats?.totalBookings ?? analytics?.kpis?.totalBookings ?? bookings.length}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">All registered reservations</p>
                </div>

                {/* 5. Pending Bookings */}
                <div className="rounded-3xl border border-amber-200 bg-white p-4 sm:p-5 shadow-sm transition hover:border-amber-300">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-700">Pending Bookings</span>
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600">
                      <Clock size={16} />
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-amber-700">
                    {stats?.pendingBookings ?? analytics?.kpis?.pendingBookings ?? 0}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Unsettled / awaiting dispatch</p>
                </div>

                {/* 6. Confirmed Bookings */}
                <div className="rounded-3xl border border-blue-200 bg-white p-4 sm:p-5 shadow-sm transition hover:border-blue-300">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Confirmed Bookings</span>
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-[#1E3A8A]">
                      <CheckCircle size={16} />
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-[#1E3A8A]">
                    {stats?.confirmedBookings ?? analytics?.kpis?.confirmedBookings ?? 0}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Active confirmed reservations</p>
                </div>

                {/* 7. Cancelled Bookings */}
                <div className="rounded-3xl border border-rose-200 bg-white p-4 sm:p-5 shadow-sm transition hover:border-rose-300">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-700">Cancelled Bookings</span>
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-50 text-rose-600">
                      <XCircle size={16} />
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-rose-700">
                    {stats?.cancelledBookings ?? analytics?.kpis?.cancelledBookings ?? 0}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Cancelled or refunded</p>
                </div>

                {/* 8. Total Registered Customers */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm transition hover:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">Registered Customers</span>
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-[#1E3A8A]">
                      <Users size={16} />
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-[#0A142F]">
                    {stats?.totalCustomers ?? stats?.totalUsers ?? customers.length}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Registered renter accounts</p>
                </div>

                {/* 9. Revenue from Verified Successful Payments */}
                <div className="rounded-3xl border border-emerald-300 bg-emerald-50/50 p-4 sm:p-5 shadow-sm transition hover:border-emerald-400">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">Verified Revenue</span>
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-white shadow-2xs">
                      <IndianRupee size={16} />
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-emerald-800">
                    {formatINR(stats?.verifiedPaymentsTotal ?? analytics?.kpis?.collectedRevenue ?? 0)}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-700 font-medium">Gateway verified &amp; settled</p>
                </div>

                {/* 10. Completed Trips */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm transition hover:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">Completed Trips</span>
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-700">
                      <Award size={16} />
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-[#0A142F]">
                    {stats?.completedBookings ?? analytics?.kpis?.completedBookings ?? 0}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Vehicle successfully returned</p>
                </div>
              </div>

              {/* BOOKING STATUS DISTRIBUTION BAR */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1E3A8A] block mb-3">
                  Telemetry Status Distribution ({stats?.totalBookings ?? analytics?.kpis?.totalBookings ?? bookings.length} Total)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-800">Confirmed Bookings</span>
                    <p className="text-xl font-black font-mono text-[#0A142F] mt-1">
                      {stats?.confirmedBookings ?? analytics?.kpis?.confirmedBookings ?? 0}
                    </p>
                    <span className="text-[11px] text-emerald-700 font-medium">Active reservations</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                    <span className="text-xs font-bold text-blue-800">Completed Trips</span>
                    <p className="text-xl font-black font-mono text-[#0A142F] mt-1">
                      {stats?.completedBookings ?? analytics?.kpis?.completedBookings ?? 0}
                    </p>
                    <span className="text-[11px] text-blue-700 font-medium">Successfully finished</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-xs font-bold text-amber-800">Pending Bookings</span>
                    <p className="text-xl font-black font-mono text-[#0A142F] mt-1">
                      {stats?.pendingBookings ?? analytics?.kpis?.pendingBookings ?? 0}
                    </p>
                    <span className="text-[11px] text-amber-700 font-medium">Awaiting payment</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                    <span className="text-xs font-bold text-rose-800">Cancelled Bookings</span>
                    <p className="text-xl font-black font-mono text-[#0A142F] mt-1">
                      {stats?.cancelledBookings ?? analytics?.kpis?.cancelledBookings ?? 0}
                    </p>
                    <span className="text-[11px] text-rose-700 font-medium">Refunded or cancelled</span>
                  </div>
                </div>
              </div>

              {/* MONTHLY REVENUE & BOOKING TRENDS CHART */}
              {analytics?.monthlyTrends && analytics.monthlyTrends.length > 0 && (
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                      <h3 className="font-heading font-black text-lg text-[#0A142F] flex items-center gap-2">
                        <TrendingUp size={18} className="text-[#1E3A8A]" />
                        Monthly Booking & Revenue Trends
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Direct chronological aggregation from persistent MySQL database timestamps.
                      </p>
                    </div>

                    {/* Chart Mode Toggle */}
                    <div className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 p-1">
                      <button
                        type="button"
                        onClick={() => setChartMode('revenue')}
                        className={`rounded-full px-3 py-1 font-mono text-xs font-semibold transition ${
                          chartMode === 'revenue'
                            ? 'bg-[#0A142F] text-white shadow-sm font-bold'
                            : 'text-slate-600 hover:text-[#0A142F]'
                        }`}
                      >
                        Revenue (₹)
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartMode('volume')}
                        className={`rounded-full px-3 py-1 font-mono text-xs font-semibold transition ${
                          chartMode === 'volume'
                            ? 'bg-[#0A142F] text-white shadow-sm font-bold'
                            : 'text-slate-600 hover:text-[#0A142F]'
                        }`}
                      >
                        Booking Volume
                      </button>
                    </div>
                  </div>

                  {/* Chart Legend */}
                  <div className="flex items-center justify-end gap-4 text-xs font-mono mb-4 text-slate-500">
                    {chartMode === 'revenue' ? (
                      <>
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded bg-[#1E3A8A]" /> Gross Booking Value
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded bg-emerald-600" /> Collected Revenue
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded bg-[#1E3A8A]" /> Total Bookings
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded bg-rose-500" /> Cancellations
                        </span>
                      </>
                    )}
                  </div>

                  {/* Responsive Visual Bar Chart */}
                  {(() => {
                    const trends = analytics?.monthlyTrends || [];
                    const maxVal =
                      chartMode === 'revenue'
                        ? Math.max(1, ...trends.map((t) => Math.max(t.grossValue || 0, t.collectedRevenue || 0)))
                        : Math.max(1, ...trends.map((t) => Math.max(t.bookings || 0, t.cancelled || 0)));

                    return (
                      <div className="pt-6 pb-2">
                        <div className="flex items-end justify-between gap-2 sm:gap-4 h-56 border-b border-slate-200 px-2 sm:px-4">
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
                                <div className="pointer-events-none absolute -top-12 z-20 hidden rounded-2xl bg-white border border-slate-200 px-3 py-1.5 text-[11px] text-[#0A142F] shadow-xl group-hover:block whitespace-nowrap font-mono">
                                  <p className="font-bold">{t.label}</p>
                                  {chartMode === 'revenue' ? (
                                    <>
                                      <p className="text-[#1E3A8A] font-bold">GBV: {formatINR(t.grossValue)}</p>
                                      <p className="text-emerald-700 font-bold">Paid: {formatINR(t.collectedRevenue)}</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-[#1E3A8A] font-bold">Bookings: {t.bookings}</p>
                                      <p className="text-rose-600 font-bold">Cancelled: {t.cancelled}</p>
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
                                        ? 'bg-blue-300 group-hover:bg-[#1E3A8A]'
                                        : 'bg-blue-300 group-hover:bg-[#1E3A8A]'
                                    }`}
                                  />
                                  {/* Bar 2 */}
                                  <div
                                    style={{ height: `${h2}%` }}
                                    className={`w-full rounded-t transition-all duration-500 ${
                                      chartMode === 'revenue'
                                        ? 'bg-emerald-300 group-hover:bg-emerald-600'
                                        : 'bg-rose-300 group-hover:bg-rose-600'
                                    }`}
                                  />
                                </div>

                                {/* Month Label */}
                                <span className="mt-2 font-mono text-[11px] font-semibold text-slate-500 truncate w-full text-center">
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
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-black text-lg text-[#0A142F] flex items-center gap-2">
                      <Award size={18} className="text-[#1E3A8A]" />
                      Popular Fleet Cars (Real Booking Counts)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Ranked by total completed and confirmed reservations recorded in the database.
                  </p>

                  {analytics?.popularCars && analytics.popularCars.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.popularCars.map((car, idx) => (
                        <div
                          key={car.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:border-slate-300 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 border border-blue-900/15 text-[#1E3A8A] font-mono text-xs font-bold shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="h-10 w-14 overflow-hidden rounded-xl bg-white border border-slate-200/80 shrink-0">
                              <CarImage src={car.image} alt={car.model} className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-[#0A142F] leading-tight">
                                {car.brand} {car.model}
                              </h4>
                              <p className="font-mono text-[11px] text-slate-500">
                                {car.category} · {formatINR(car.pricePerDay)}/day
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-700">
                              {car.bookingsCount} booking{car.bookingsCount === 1 ? '' : 's'}
                            </span>
                            <span className="block font-mono text-[11px] font-bold text-[#0A142F] mt-1">
                              {formatINR(car.revenue)} earned
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 font-mono text-xs">
                      No car bookings recorded yet.
                    </div>
                  )}
                </div>

                {/* 2. Fleet Inventory & Availability Summary by Category */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-black text-lg text-[#0A142F] flex items-center gap-2">
                      <PieChart size={18} className="text-[#1E3A8A]" />
                      Fleet Inventory & Category Availability
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Active availability and operational breakdown across car categories.
                  </p>

                  {analytics?.categorySummary && analytics.categorySummary.length > 0 ? (
                    <div className="space-y-3.5">
                      {analytics.categorySummary.map((cat) => (
                        <div key={cat.category} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#0A142F]">{cat.category}</span>
                            <span className="font-mono text-slate-600">
                              <strong className="text-emerald-700">{cat.available}</strong> ready / {cat.total} total ({cat.sharePercent}% of fleet)
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="h-2 w-full rounded-full bg-slate-100 border border-slate-200/80 overflow-hidden flex">
                            <div
                              style={{ width: `${cat.sharePercent}%` }}
                              className="h-full bg-gradient-to-r from-[#1E3A8A] to-blue-500 rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 font-mono text-xs">
                      No fleet category records available.
                    </div>
                  )}
                </div>
              </div>

              {/* RECENT BOOKINGS SUMMARY TABLE */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-heading font-black text-lg text-[#0A142F] flex items-center gap-2">
                      <Clock size={18} className="text-[#1E3A8A]" />
                      Recent Bookings Overview
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Direct view of the latest customer bookings with verified database pricing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1 text-slate-700"
                  >
                    View All ({bookings.length}) <ArrowRight size={13} />
                  </button>
                </div>

                {(stats?.recentBookings || analytics?.recentBookings || bookings.slice(0, 10))?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[#1E3A8A] font-mono text-[11px] font-bold uppercase tracking-wider">
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
                      <tbody className="divide-y divide-slate-100">
                        {(stats?.recentBookings || analytics?.recentBookings || bookings.slice(0, 10)).map((b) => (
                          <tr key={b.id || b.ref} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-3 font-mono font-bold text-[#1E3A8A]">{b.ref}</td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-[#0A142F]">{b.customer?.fullName || 'Customer'}</p>
                              <p className="text-[10px] text-slate-500">{b.customer?.email || '—'}</p>
                            </td>
                            <td className="py-3 px-3 font-semibold text-[#0A142F]">
                              {b.car?.brand} {b.car?.model}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-500">
                              {b.start ? b.start.split('T')[0] : '—'} &rarr; {b.end ? b.end.split('T')[0] : '—'}
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={b.status} />
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={b.paymentStatus} />
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-[#0A142F]">
                              {formatINR(b.pricing?.total || 0)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setReceiptRef(b.ref)}
                                className="font-mono text-[11px] font-bold text-[#1E3A8A] hover:underline"
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
                  <p className="text-center py-6 text-xs text-slate-400 font-mono">No recent bookings recorded.</p>
                )}
              </div>
            </>

          {/* Quick Actions Shortcuts */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <h3 className="font-heading font-black text-lg text-[#0A142F]">Fleet Controls</h3>
              <p className="mt-1 text-xs text-slate-500">Quickly add new vehicles or configure daily rental rates.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={openAddModal}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Plus size={15} /> Add New Car
                </button>
                <button onClick={() => setActiveTab('fleet')} className="btn-outline text-xs text-slate-700">
                  Manage Fleet ({cars.length})
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <h3 className="font-heading font-black text-lg text-[#0A142F]">Booking Dispatch</h3>
              <p className="mt-1 text-xs text-slate-500">Process confirmed bookings, print tax receipts, or handle refunds.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => setActiveTab('bookings')} className="btn-primary text-xs flex items-center gap-1.5">
                  <CalendarCheck size={15} /> Review Bookings ({bookings.length})
                </button>
                <button onClick={() => setActiveTab('inquiries')} className="btn-outline text-xs flex items-center gap-1.5 text-slate-700">
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

          <p className="font-mono text-xs text-slate-500">Showing {filteredCars.length} of {cars.length} cars in catalog</p>

          <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 font-mono text-[11px] font-bold uppercase tracking-wider text-[#0A142F]">
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
              <tbody className="divide-y divide-slate-100">
                {filteredCars.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                          <CarImage src={c.image} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-[#0A142F]">{c.brand} {c.model}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-500">ID: #{c.id} · {c.year}</span>
                            {c.registrationNumber && (
                              <span className="rounded bg-amber-50 border border-amber-300 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-900 tracking-wider">
                                {c.registrationNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 font-mono font-semibold text-[11px] text-slate-700">
                        {c.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {c.fuel} · {c.transmission} · {c.seats} seats
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {c.location}
                    </td>
                    <td className="p-4 font-mono font-bold text-[#1E3A8A]">
                      {formatINR(c.pricePerDay)}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleCarAvailability(c.id, !c.available)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold border transition ${
                          c.available
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        }`}
                        title="Click to toggle availability"
                      >
                        {c.available ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {c.available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/cars/${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-[#0A142F] transition"
                          title="View vehicle on customer website"
                        >
                          <Eye size={14} />
                        </a>
                        <button
                          onClick={() => openEditModal(c)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-[#0A142F] transition"
                          title="Edit vehicle"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCar(c.id, `${c.brand} ${c.model}`)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
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
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={bookingDateFilter}
                  onChange={(e) => setBookingDateFilter(e.target.value)}
                  className="field text-xs py-1.5 bg-white"
                  title="Filter by rental pickup date"
                />
                {bookingDateFilter && (
                  <button
                    type="button"
                    onClick={() => setBookingDateFilter('')}
                    className="font-mono text-[11px] text-slate-500 hover:text-slate-800 underline"
                  >
                    Clear Date
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 font-mono text-[11px] font-bold uppercase tracking-wider text-[#0A142F]">
                <tr>
                  <th className="p-4">Booking Ref</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Car Reserved</th>
                  <th className="p-4">Dates & Duration</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status & Payment</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id || b.ref} className="hover:bg-slate-50/60 transition">
                    <td className="p-4">
                      <span className="font-mono font-bold text-[#1E3A8A]">{b.ref}</span>
                      <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                        Booked: {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '—'}
                      </p>
                      <p className="text-[11px] font-medium text-slate-600 mt-1 flex items-center gap-1">
                        <MapPin size={11} className="text-[#1E3A8A] shrink-0" /> {b.pickup}
                      </p>
                      {b.dropoff && b.dropoff !== b.pickup && (
                        <p className="text-[10px] text-slate-400">Return: {b.dropoff}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[#0A142F]">{b.customer?.fullName}</p>
                      <p className="text-slate-600">{b.customer?.email}</p>
                      <p className="font-mono text-slate-400 text-[10px]">{b.customer?.phone}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[#0A142F]">{b.car?.brand} {b.car?.model}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-500">{b.car?.category} · #{b.car?.id || b.carId}</span>
                        {b.car?.registrationNumber && (
                          <span className="rounded bg-amber-50 border border-amber-300 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-900 tracking-wider">
                            {b.car.registrationNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      <div>Start: {new Date(b.start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[10px] text-slate-400">End: {new Date(b.end).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      {b.pricing?.days && (
                        <div className="text-[10px] text-[#1E3A8A] font-bold mt-0.5">{b.pricing.days} {b.pricing.days === 1 ? 'day' : 'days'} duration</div>
                      )}
                    </td>
                    <td className="p-4 font-mono font-extrabold text-[#1E3A8A]">
                      {formatINR(b.pricing?.total || 0)}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <StatusBadge status={b.status} />
                        <span
                          className={`block font-mono text-[10px] font-semibold ${
                            b.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          Payment: {b.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailBooking(b)}
                          className="btn-outline px-2 py-1 text-[11px] flex items-center gap-1 text-slate-700 hover:text-[#0A142F]"
                          title="Inspect booking details & timeline"
                        >
                          <Eye size={13} /> Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setReceiptRef(b.ref)}
                          className="btn-outline px-2 py-1 text-[11px] flex items-center gap-1 text-slate-700 hover:text-[#0A142F]"
                          title="Print or view tax invoice"
                        >
                          <FileText size={13} /> Invoice
                        </button>
                        {b.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(b.id, 'Confirmed')}
                            className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 font-mono text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition"
                            title="Confirm pending booking"
                          >
                            Confirm
                          </button>
                        )}
                        {b.status === 'Confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(b.id, 'Completed')}
                            className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 font-mono text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                            title="Mark rental as completed"
                          >
                            Complete
                          </button>
                        )}
                        {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(b.id, 'Cancelled')}
                            className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 font-mono text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
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

      {/* TAB: CUSTOMER MANAGEMENT */}
      {activeTab === 'customers' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                placeholder="Search customer by name, email, phone, ID..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="field pl-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-500">
                Showing {filteredCustomers.length} of {customers.length} registered customers
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 font-mono text-[11px] font-bold uppercase tracking-wider text-[#0A142F]">
                <tr>
                  <th className="p-4">Customer ID</th>
                  <th className="p-4">Customer Name & Contact</th>
                  <th className="p-4">Driving License</th>
                  <th className="p-4">Total Bookings</th>
                  <th className="p-4">Total Spent</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-4 font-mono font-bold text-[#1E3A8A]">
                        #{c.id}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 border border-blue-200 font-bold text-xs text-[#1E3A8A]">
                            {c.fullName ? c.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-[#0A142F]">{c.fullName}</p>
                            <p className="text-slate-500 text-[11px]">{c.email}</p>
                            <p className="font-mono text-slate-400 text-[10px]">{c.phone || 'No phone registered'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-600">
                        {c.license ? (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                            {c.license}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not on file</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-mono text-xs font-bold text-[#1E3A8A]">
                          {c.totalBookings} {c.totalBookings === 1 ? 'Booking' : 'Bookings'}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-700">
                        {formatINR(c.totalSpent || 0)}
                      </td>
                      <td className="p-4 font-mono text-slate-500 text-[11px]">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerHistory(c)}
                          className="btn-outline px-3 py-1.5 text-xs inline-flex items-center gap-1.5 text-slate-700 hover:text-[#0A142F]"
                        >
                          <CalendarCheck size={13} className="text-[#1E3A8A]" />
                          <span>View History ({c.totalBookings})</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 font-mono">
                      No customer accounts found matching search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PAYMENT MANAGEMENT */}
      {activeTab === 'payments' && (
        <div className="mt-8 space-y-6">
          {/* Header & Metrics */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard size={20} className="text-[#1E3A8A]" />
                  <h2 className="text-lg font-heading font-black text-[#0A142F]">Payment Transactions Ledger</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Actual transaction records and gateway settlements stored in MySQL database.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchPayments}
                  className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 text-slate-700"
                >
                  <RefreshCw size={13} className={loadingPayments ? 'animate-spin text-[#1E3A8A]' : ''} /> Sync Payments
                </button>
              </div>
            </div>

            {/* Payment Metrics Cards */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-500 block">Total Records</span>
                <span className="font-mono text-xl font-black text-[#0A142F] mt-1 block">
                  {paymentsData?.totalCount ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">All gateway attempts</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-800 block">Verified Revenue</span>
                <span className="font-mono text-xl font-black text-emerald-800 mt-1 block">
                  {formatINR(paymentsData?.totalVerifiedAmount ?? 0)}
                </span>
                <span className="text-[10px] text-emerald-700">Settled & captured</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-700 block">Successful / Paid</span>
                <span className="font-mono text-xl font-black text-emerald-700 mt-1 block">
                  {paymentsData?.paidCount ?? 0}
                </span>
                <span className="text-[10px] text-emerald-600">Paid transactions</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80">
                <span className="font-mono text-[10px] uppercase font-bold text-rose-700 block">Failed / Void</span>
                <span className="font-mono text-xl font-black text-rose-700 mt-1 block">
                  {paymentsData?.failedCount ?? 0}
                </span>
                <span className="text-[10px] text-rose-600">Declined / cancelled</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80">
                <span className="font-mono text-[10px] uppercase font-bold text-amber-700 block">Pending Settle</span>
                <span className="font-mono text-xl font-black text-amber-700 mt-1 block">
                  {paymentsData?.pendingCount ?? 0}
                </span>
                <span className="text-[10px] text-amber-600">Awaiting webhook</span>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                placeholder="Search transaction ID, booking ref, customer..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="field pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="field text-xs sm:w-40"
              >
                <option value="all">All Payment Statuses</option>
                <option value="Paid">Paid / Successful</option>
                <option value="Failed">Failed / Declined</option>
                <option value="Pending">Pending</option>
              </select>

              <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
                Showing {filteredPayments.length} of {paymentsData?.totalCount ?? 0}
              </span>
            </div>
          </div>

          {/* Payments Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 font-mono text-[11px] font-bold uppercase tracking-wider text-[#0A142F]">
                <tr>
                  <th className="p-4">Transaction Reference</th>
                  <th className="p-4">Booking Ref</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Vehicle Reserved</th>
                  <th className="p-4 text-right">Amount (₹)</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((p) => {
                    const isPaid = p.status === 'Paid' || p.status === 'Captured' || p.status === 'Success';
                    const isFailed = p.status === 'Failed' || p.status === 'Declined';
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-4 font-mono font-bold text-[#1E3A8A]">
                          <div>{p.transactionId || p.razorpayPaymentId || `TXN-${p.id}`}</div>
                          {p.razorpayPaymentId && p.transactionId !== p.razorpayPaymentId && (
                            <span className="font-mono text-[10px] text-slate-400 block">{p.razorpayPaymentId}</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-mono font-bold text-[#0A142F]">{p.bookingRef || '—'}</span>
                          {p.pickup && (
                            <span className="block text-[10px] text-slate-500 mt-0.5">{p.pickup}</span>
                          )}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-[#0A142F]">{p.customer?.fullName || 'Walk-in Renter'}</p>
                          <p className="text-slate-500 text-[11px]">{p.customer?.email || '—'}</p>
                          <p className="font-mono text-slate-400 text-[10px]">{p.customer?.phone || ''}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-[#0A142F]">
                            {p.car?.brand} {p.car?.model}
                          </p>
                          {p.car?.registrationNumber && (
                            <span className="rounded bg-amber-50 border border-amber-300 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-900 tracking-wider">
                              {p.car.registrationNumber}
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono font-black text-right text-base text-[#0A142F]">
                          {formatINR(p.amount || 0)}
                        </td>
                        <td className="p-4">
                          <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                            {p.method || 'Online / Gateway'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold border ${
                              isPaid
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : isFailed
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-amber-50 border-amber-200 text-amber-700'
                            }`}
                          >
                            {isPaid ? <CheckCircle2 size={12} /> : isFailed ? <XCircle size={12} /> : <Clock size={12} />}
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : '—'}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedPaymentDetail(p)}
                            className="btn-outline px-2.5 py-1 text-xs inline-flex items-center gap-1 text-slate-700 hover:text-[#0A142F]"
                            title="Inspect payment audit trace"
                          >
                            <Eye size={12} /> Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-400 font-mono">
                      No payment transactions found matching search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: REVIEWS & RATINGS MANAGEMENT */}
      {activeTab === 'reviews' && (
        <div className="mt-8 space-y-6">
          {/* Header & Rating Breakdown Banner */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-amber-500 fill-amber-500" />
                  <h2 className="text-lg font-heading font-black text-[#0A142F]">Reviews & Ratings Management</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Customer feedback, ratings verification, and fleet quality governance.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSeedDemoReviews}
                  className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 text-slate-700"
                  title="Generate sample verified reviews for testing"
                >
                  <Plus size={13} /> Seed Customer Reviews
                </button>
                <button
                  type="button"
                  onClick={fetchReviews}
                  className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 text-slate-700"
                >
                  <RefreshCw size={13} className={loadingReviews ? 'animate-spin text-[#1E3A8A]' : ''} /> Refresh
                </button>
              </div>
            </div>

            {/* Rating Summary Scorecard */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
              {/* Overall Score */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-center">
                <span className="font-mono text-5xl font-black text-[#0A142F]">
                  {reviewsData?.averageRating ? reviewsData.averageRating.toFixed(1) : '5.0'}
                </span>
                <div className="flex items-center gap-1 mt-2 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={
                        star <= Math.round(reviewsData?.averageRating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }
                    />
                  ))}
                </div>
                <p className="mt-2 font-mono text-xs font-semibold text-slate-600">
                  Fleet Average Rating across {reviewsData?.totalReviews ?? 0} reviews
                </p>
              </div>

              {/* Star Distribution Bars */}
              <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviewsData?.ratingDistribution?.[String(stars)] || 0;
                  const total = reviewsData?.totalReviews || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="font-mono font-bold w-12 text-slate-700 flex items-center gap-1">
                        {stars} <Star size={12} className="fill-amber-400 text-amber-400" />
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 w-16 text-right">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-600">Filter by Rating:</span>
              <div className="flex flex-wrap gap-1.5">
                {['all', '5', '4', '3', '2', '1'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setReviewRatingFilter(val)}
                    className={`rounded-xl px-3 py-1 font-mono text-xs font-semibold transition ${
                      reviewRatingFilter === val
                        ? 'bg-[#0A142F] text-white shadow-sm font-bold'
                        : 'bg-white text-slate-600 hover:text-[#0A142F] border border-slate-200'
                    }`}
                  >
                    {val === 'all' ? 'All Ratings' : `${val} ★`}
                  </button>
                ))}
              </div>
            </div>

            <span className="font-mono text-xs text-slate-500">
              Showing {filteredReviews.length} reviews
            </span>
          </div>

          {/* Reviews Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#0A142F]">{r.userName || r.customerName || 'Drivo Renter'}</h3>
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.2 font-mono text-[9px] font-bold text-emerald-700">
                            Verified Rental
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{r.userEmail || r.customerEmail || 'Verified customer'}</p>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-[11px] font-bold text-[#1E3A8A]">
                          Vehicle: {r.carName || (r.car ? `${r.car.brand} ${r.car.model}` : `Car #${r.carId}`)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100 italic">
                        "{r.comment || 'Smooth pickup and pristine vehicle condition.'}"
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-400">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Verified booking'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(r.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition"
                      title="Delete review and recalculate car rating"
                    >
                      <Trash2 size={13} /> Remove Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-12 text-center text-slate-400 font-mono text-xs bg-white rounded-3xl border border-dashed border-slate-200">
                <Star size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-600">No customer reviews found matching filter.</p>
                <button
                  type="button"
                  onClick={handleSeedDemoReviews}
                  className="btn-primary mt-3 text-xs inline-flex items-center gap-1.5"
                >
                  <Plus size={14} /> Seed Sample Reviews
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: REPORTS & ANALYTICS */}
      {activeTab === 'reports' && (
        <div className="mt-8 space-y-6">
          {/* Header & CSV Downloads */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 size={20} className="text-[#1E3A8A]" />
                  <h2 className="text-lg font-heading font-black text-[#0A142F]">Business Reports & Analytics</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Real-time financial audits, rental volume metrics, and one-click CSV database exports.
                </p>
              </div>

              {/* Direct CSV Export Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadCsv('bookings')}
                  className="btn-outline text-xs px-3.5 py-2 flex items-center gap-2 text-slate-800 hover:text-[#0A142F] font-bold"
                  title="Export complete bookings database table to CSV"
                >
                  <Download size={14} className="text-[#1E3A8A]" />
                  <span>Download Bookings CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadCsv('revenue')}
                  className="btn-primary text-xs px-3.5 py-2 flex items-center gap-2 font-bold"
                  title="Export verified revenue breakdown to CSV"
                >
                  <Download size={14} />
                  <span>Download Revenue CSV</span>
                </button>
              </div>
            </div>

            {/* Performance KPI highlights */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-100">
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80">
                <span className="font-mono text-[10px] uppercase font-bold text-[#1E3A8A] block">Gross Booking Volume</span>
                <span className="font-mono text-xl sm:text-2xl font-black text-[#0A142F] mt-1 block">
                  {formatINR(bookings.reduce((sum, b) => sum + (b.pricing?.total || 0), 0))}
                </span>
                <span className="text-[10px] text-slate-500">Total pipeline booking value</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-800 block">Verified Settled Revenue</span>
                <span className="font-mono text-xl sm:text-2xl font-black text-emerald-800 mt-1 block">
                  {formatINR(paymentsData?.totalVerifiedAmount ?? stats?.totalRevenue ?? 0)}
                </span>
                <span className="text-[10px] text-emerald-700">Bank & gateway confirmed</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-600 block">Completed Trips</span>
                <span className="font-mono text-xl sm:text-2xl font-black text-[#0A142F] mt-1 block">
                  {stats?.completedBookings ?? bookings.filter((b) => b.status === 'Completed').length}
                </span>
                <span className="text-[10px] text-slate-500">Fulfilled customer rentals</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-600 block">Active Fleet Vehicles</span>
                <span className="font-mono text-xl sm:text-2xl font-black text-[#0A142F] mt-1 block">
                  {cars.filter((c) => c.available).length} / {cars.length}
                </span>
                <span className="text-[10px] text-slate-500">Operational in Kanniyakumari</span>
              </div>
            </div>
          </div>

          {/* Revenue by Vehicle Category Table */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <h3 className="font-heading font-bold text-sm text-[#0A142F] mb-3 flex items-center gap-2">
                <Car size={16} className="text-[#1E3A8A]" /> Fleet Performance by Category
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-mono text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Vehicles</th>
                      <th className="py-2.5 px-3 text-right">Avg Rate/Day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {['SUV', 'Sedan', 'Hatchback', 'MUV / MPV', 'Luxury', 'Electric Vehicles'].map((cat) => {
                      const catCars = cars.filter((c) => c.category === cat);
                      const avgPrice = catCars.length
                        ? Math.round(catCars.reduce((s, c) => s + c.pricePerDay, 0) / catCars.length)
                        : 0;
                      return (
                        <tr key={cat} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-[#0A142F]">{cat}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{catCars.length}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1E3A8A]">
                            {avgPrice ? formatINR(avgPrice) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Kanniyakumari Dispatch Station Distribution */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <h3 className="font-heading font-bold text-sm text-[#0A142F] mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-[#1E3A8A]" /> Station Fleet Deployment
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-mono text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Kanniyakumari Hub</th>
                      <th className="py-2.5 px-3 text-center">Allocated Cars</th>
                      <th className="py-2.5 px-3 text-right">Operational Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      'Nagercoil',
                      'Kanyakumari',
                      'Marthandam',
                      'Kuzhithurai',
                      'Colachel',
                      'Thuckalay',
                      'Karungal',
                    ].map((hub) => {
                      const count = cars.filter((c) => c.location === hub).length;
                      return (
                        <tr key={hub} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-[#0A142F]">{hub} Hub</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">{count}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                              Active Station
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="mt-8 space-y-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <SettingsIcon size={20} className="text-[#1E3A8A]" />
              <h2 className="text-lg font-heading font-black text-[#0A142F]">Platform & Operational Settings</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Manage Kanniyakumari service area constraints, payment gateway integrations, loyalty rewards rules, and rental policies.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Section 1: Service Area & Geofencing */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-[#0A142F] flex items-center gap-2">
                  <MapPin size={16} className="text-[#1E3A8A]" /> Service Area & Territory
                </h3>
                <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#1E3A8A]">
                  District Boundary Active
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Drivo is exclusively operational in <strong>Kanniyakumari District, Tamil Nadu</strong>. The backend API validates all booking pick-up requests against authorized district hubs.
              </p>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                <span className="font-mono text-[11px] font-bold text-[#0A142F] block">
                  Verified Local Handover Stations (14 Hubs)
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Nagercoil',
                    'Kanyakumari',
                    'Marthandam',
                    'Kuzhithurai',
                    'Colachel',
                    'Thuckalay',
                    'Padmanabhapuram',
                    'Karungal',
                    'Kulasekharam',
                    'Suchindram',
                    'Eraniel',
                    'Boothapandi',
                    'Thiruvattar',
                    'Killiyoor',
                  ].map((h) => (
                    <span
                      key={h}
                      className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 font-mono text-[11px] text-slate-700 shadow-2xs font-semibold"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Payment Gateway Configuration */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-[#0A142F] flex items-center gap-2">
                  <CreditCard size={16} className="text-[#1E3A8A]" /> Payment Gateway Status
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold border ${
                    settingsData?.paymentGateway?.mode === 'Production Live'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  {settingsData?.paymentGateway?.mode || 'Test / Simulation'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-semibold">Payment Provider:</span>
                  <span className="font-mono font-bold text-[#0A142F]">Razorpay Payments</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-semibold">API Key ID:</span>
                  <span className="font-mono text-slate-700">
                    {settingsData?.paymentGateway?.keyIdMasked || 'rzp_test_simulated'}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-3.5 text-[11px] text-amber-900 leading-relaxed">
                <strong>Live Key Configuration Notice:</strong>
                <p className="mt-1">
                  To switch to live Razorpay transactions, configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">RAZORPAY_KEY_ID</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">RAZORPAY_KEY_SECRET</code> in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">server/.env</code>. The application automatically falls back to safe simulation mode when keys are not configured.
                </p>
              </div>
            </div>

            {/* Section 3: Loyalty Program Rules (Editable Form) */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-[#0A142F] flex items-center gap-2">
                  <Award size={16} className="text-[#1E3A8A]" /> Loyalty Program Configuration
                </h3>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                  Active
                </span>
              </div>

              <form onSubmit={handleSaveLoyaltySettings} className="space-y-3">
                <div>
                  <label className="font-mono text-xs font-bold text-slate-700 block mb-1">
                    Points Awarded Per Completed Booking
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={loyaltyForm.pointsPerBooking}
                    onChange={(e) => setLoyaltyForm({ ...loyaltyForm, pointsPerBooking: Number(e.target.value) })}
                    className="field text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-mono text-xs font-bold text-slate-700 block mb-1">
                    Redemption Rate (₹ Value per Point)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={loyaltyForm.rupeePerPointRedemption}
                    onChange={(e) => setLoyaltyForm({ ...loyaltyForm, rupeePerPointRedemption: Number(e.target.value) })}
                    className="field text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-mono text-xs font-bold text-slate-700 block mb-1">
                    Minimum Points Required to Redeem
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={loyaltyForm.minRedemptionPoints}
                    onChange={(e) => setLoyaltyForm({ ...loyaltyForm, minRedemptionPoints: Number(e.target.value) })}
                    className="field text-xs font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingLoyalty}
                  className="btn-primary text-xs w-full py-2 font-bold"
                >
                  {savingLoyalty ? 'Saving Rules...' : 'Save Loyalty Rules'}
                </button>
              </form>
            </div>

            {/* Section 4: Rental Policies & Safety Guidelines */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-[#0A142F] flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#1E3A8A]" /> Fleet Governance & Policies
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-semibold">Minimum Driver Age:</span>
                  <span className="font-mono font-bold text-[#0A142F]">21 Years (MV Act)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-semibold">Mandatory Documents:</span>
                  <span className="font-medium text-[#0A142F]">Original DL + Aadhaar / Passport</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-semibold">Security Deposit:</span>
                  <span className="font-medium text-[#0A142F]">Refundable Post Vehicle Check</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-semibold">Speed Monitoring:</span>
                  <span className="font-medium text-[#0A142F]">80 km/h District Safety Advisory</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-semibold">Fuel Protocol:</span>
                  <span className="font-medium text-[#0A142F]">Same-to-Same return standard</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 font-mono">
                Admin session authenticated as: <strong>{user?.email || 'admin@drivo.com'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMER INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div className="mt-8 space-y-4">
          <p className="font-mono text-xs text-slate-500">Contact form transmissions stored in database</p>
          <div className="grid gap-4 md:grid-cols-2">
            {messages.map((m) => (
              <div key={m.id} className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#0A142F]">{m.name}</h3>
                    <p className="text-xs text-slate-500">{m.email} · {m.phone || 'No phone'}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(m.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="font-bold text-xs text-[#1E3A8A]">Subject: {m.subject}</p>
                  <p className="mt-1.5 text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200/80">{m.message}</p>
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
              <h2 className="font-heading text-lg font-bold text-[#0A142F] flex items-center gap-2">
                <MapPin size={20} className="text-[#1E3A8A]" /> Drivo Network Hubs & Handover Stations
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Authoritative physical dispatch hubs, airport terminal kiosks, and railway concierge points with verified coordinates.
              </p>
            </div>

            {/* City Selector */}
            <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white border border-slate-200 p-1 text-xs shadow-sm">
              {['Coimbatore', 'Chennai', 'Bengaluru', 'Kochi', 'Hyderabad', 'Mumbai', 'Delhi', 'Nagercoil'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedLocationCity(c)}
                  className={`rounded-xl px-3 py-1 font-mono text-xs font-semibold transition ${
                    selectedLocationCity === c
                      ? 'bg-[#0A142F] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#0A142F] hover:bg-slate-100'
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
            <h3 className="font-heading font-bold text-sm text-[#0A142F] flex items-center gap-2">
              <Building size={16} className="text-[#1E3A8A]" /> Registered Stations in {selectedLocationCity}
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              {getLocationsForCity(selectedLocationCity).map((loc) => {
                const cityFleetCount = cars.filter((c) => c.location === loc.city).length;
                return (
                  <div
                    key={loc.id}
                    className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm hover:border-[#1E3A8A]/40 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
                          {loc.tag}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-slate-500">
                          {cityFleetCount} Fleet Vehicles
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-[#0A142F]">{loc.name}</h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">{loc.address}</p>

                      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-[11px] space-y-1 text-slate-600">
                        <p className="flex items-center justify-between">
                          <span className="font-semibold text-slate-400">Hours:</span>
                          <span className="font-medium text-[#0A142F]">{loc.hours}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="font-semibold text-slate-400">Desk Phone:</span>
                          <a href={`tel:${loc.phone.replace(/\s+/g, '')}`} className="font-mono font-bold text-[#1E3A8A] hover:underline">
                            {loc.phone}
                          </a>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="font-semibold text-slate-400">Coordinates:</span>
                          <span className="font-mono text-[10px] text-[#1E3A8A]">
                            {loc.lat}, {loc.lng}
                          </span>
                        </p>
                      </div>

                      <div className="mt-3 text-xs text-slate-600">
                        <strong className="text-[#0A142F] block text-[11px]">Handover Instructions:</strong>
                        <p className="mt-0.5 leading-relaxed text-slate-600">{loc.instructions}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400 uppercase">
                        Landmark: {loc.landmark}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${loc.lat}, ${loc.lng}`);
                          toast.success(`Copied coordinates: ${loc.lat}, ${loc.lng}`);
                        }}
                        className="btn-outline text-[11px] px-2.5 py-1 flex items-center gap-1 text-slate-700 hover:text-[#0A142F]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white border border-slate-200 text-[#0A142F] p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-heading text-lg font-bold text-[#0A142F]">
                {editingCar ? `Edit ${editingCar.brand} ${editingCar.model}` : 'Add Vehicle to Fleet'}
              </h2>
              <button
                onClick={closeCarModal}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCar} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-mono text-xs font-bold text-slate-700">Car Name</label>
                  <input
                    type="text"
                    value={carForm.name || (carForm.brand && carForm.model ? `${carForm.brand} ${carForm.model}` : '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parts = val.trim().split(' ');
                      setCarForm({
                        ...carForm,
                        name: val,
                        brand: parts[0] || carForm.brand,
                        model: parts.slice(1).join(' ') || carForm.model,
                      });
                    }}
                    className="field mt-1 text-xs"
                    placeholder="e.g. Hyundai Creta"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold text-slate-700">Brand</label>
                  <input
                    type="text"
                    required
                    value={carForm.brand}
                    onChange={(e) => setCarForm({ ...carForm, brand: e.target.value, name: `${e.target.value} ${carForm.model}`.trim() })}
                    className="field mt-1 text-xs"
                    placeholder="e.g. Hyundai"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold text-slate-700">Model</label>
                  <input
                    type="text"
                    required
                    value={carForm.model}
                    onChange={(e) => setCarForm({ ...carForm, model: e.target.value, name: `${carForm.brand} ${e.target.value}`.trim() })}
                    className="field mt-1 text-xs"
                    placeholder="e.g. Creta"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold text-slate-700">Reg. Number (TN)</label>
                  <input
                    type="text"
                    value={carForm.registrationNumber}
                    onChange={(e) => setCarForm({ ...carForm, registrationNumber: e.target.value.toUpperCase() })}
                    className="field mt-1 text-xs font-mono font-bold uppercase tracking-wider"
                    placeholder="TN-74-E-1001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-mono text-xs font-bold text-slate-700">Category</label>
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
                  <label className="font-mono text-xs font-bold text-slate-700">Powertrain</label>
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
                  <label className="font-mono text-xs font-bold text-slate-700">Transmission</label>
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
                  <label className="font-mono text-xs font-bold text-slate-700">Year</label>
                  <input
                    type="number"
                    value={carForm.year}
                    onChange={(e) => setCarForm({ ...carForm, year: e.target.value })}
                    className="field mt-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold text-slate-700">Seats</label>
                  <input
                    type="number"
                    value={carForm.seats}
                    onChange={(e) => setCarForm({ ...carForm, seats: e.target.value })}
                    className="field mt-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold text-slate-700">Daily Rate (₹)</label>
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
                  <label className="font-mono text-xs font-bold text-slate-700">Kanniyakumari Hub</label>
                  <select
                    value={carForm.location}
                    onChange={(e) => setCarForm({ ...carForm, location: e.target.value })}
                    className="field mt-1 text-xs"
                  >
                    {[
                      'Nagercoil',
                      'Kanyakumari',
                      'Marthandam',
                      'Kuzhithurai',
                      'Colachel',
                      'Thuckalay',
                      'Padmanabhapuram',
                      'Karungal',
                      'Kulasekharam',
                      'Suchindram',
                      'Eraniel',
                      'Boothapandi',
                      'Thiruvattar',
                      'Killiyoor',
                    ].map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-xs font-bold text-slate-700">Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={carForm.deposit}
                    onChange={(e) => setCarForm({ ...carForm, deposit: e.target.value })}
                    className="field mt-1 text-xs font-mono"
                  />
                </div>
              </div>

              {/* UPLOAD CAR IMAGE & LIVE PREVIEW */}
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs font-bold text-[#0A142F] flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-[#1E3A8A]" />
                    Vehicle Media Asset <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex rounded-lg bg-slate-200/80 p-0.5 text-[11px] font-semibold border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setImageMode('upload')}
                      className={`rounded-md px-2.5 py-0.5 transition font-mono ${
                        imageMode === 'upload' ? 'bg-white text-[#0A142F] shadow font-bold' : 'text-slate-600 hover:text-[#0A142F]'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`rounded-md px-2.5 py-0.5 transition font-mono ${
                        imageMode === 'url' ? 'bg-white text-[#0A142F] shadow font-bold' : 'text-slate-600 hover:text-[#0A142F]'
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
                      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
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
                                  selectedFile ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-slate-100 border border-slate-200 text-slate-600'
                                }`}
                              >
                                {selectedFile ? 'New Image Selected' : 'Current Saved Asset'}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-xs font-bold text-[#0A142F]">
                              {selectedFile ? selectedFile.name : (editingCar ? `${editingCar.brand} ${editingCar.model}` : 'Vehicle Image')}
                            </p>
                            {selectedFile && (
                              <p className="font-mono text-[11px] text-slate-500">
                                Size: {(selectedFile.size / 1024).toFixed(0)} KB · Type: {selectedFile.type.split('/')[1]?.toUpperCase()}
                              </p>
                            )}
                            <div className="mt-2.5 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="btn-outline px-2.5 py-1 text-[11px] flex items-center gap-1 text-slate-700 hover:text-[#0A142F]"
                              >
                                <UploadCloud size={13} /> {selectedFile ? 'Change Image' : 'Upload Replacement'}
                              </button>
                              {selectedFile && (
                                <button
                                  type="button"
                                  onClick={handleRemoveFile}
                                  className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition"
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
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                          isDragging
                            ? 'border-blue-600 bg-blue-50/80 scale-[1.01]'
                            : 'border-slate-300 bg-white hover:border-[#1E3A8A] hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#1E3A8A] group-hover:scale-110 transition">
                          <UploadCloud size={24} />
                        </div>
                        <p className="mt-2 text-xs font-bold text-[#0A142F]">
                          {isDragging ? 'Drop car image to upload...' : 'Choose or Drag & Drop Image to Upload'}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          JPG, JPEG, PNG, or WEBP (Max size: 5 MB)
                        </p>
                        <button
                          type="button"
                          className="btn-outline mt-3 px-3 py-1 text-xs pointer-events-none text-slate-700"
                        >
                          Browse Image Files
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
                      <div className="mt-2 h-20 w-32 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
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

              {/* DESCRIPTION TEXTAREA */}
              <div>
                <label className="font-mono text-xs font-bold text-slate-700">Vehicle Description</label>
                <textarea
                  rows={3}
                  value={carForm.description}
                  onChange={(e) => setCarForm({ ...carForm, description: e.target.value })}
                  className="field mt-1 text-xs"
                  placeholder="Enter vehicle details, driving experience highlights, features, or rental guidelines..."
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="car-available"
                  checked={carForm.available}
                  onChange={(e) => setCarForm({ ...carForm, available: e.target.checked })}
                  className="rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                />
                <label htmlFor="car-available" className="text-xs font-bold text-[#0A142F]">
                  Mark as Available for Rent
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeCarModal}
                  className="btn-outline text-xs text-slate-700 hover:text-[#0A142F]"
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

      {/* BOOKING DETAILS INSPECTION MODAL */}
      {selectedDetailBooking && (
        <BookingDetailModal
          booking={selectedDetailBooking}
          onClose={() => setSelectedDetailBooking(null)}
          onCancel={() => {
            handleUpdateBookingStatus(selectedDetailBooking.id, 'Cancelled');
            setSelectedDetailBooking(null);
          }}
          onViewReceipt={(ref) => {
            setSelectedDetailBooking(null);
            setReceiptRef(ref);
          }}
        />
      )}

      {/* CUSTOMER BOOKING HISTORY MODAL */}
      {selectedCustomerHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white border border-slate-200/90 text-[#0A142F] p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-[#1E3A8A] font-bold">
                  {selectedCustomerHistory.fullName?.charAt(0) || 'C'}
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-[#0A142F]">
                    {selectedCustomerHistory.fullName}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    ID #{selectedCustomerHistory.id} · {selectedCustomerHistory.email} · {selectedCustomerHistory.phone || 'No phone'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerHistory(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Quick metrics */}
            <div className="mt-4 grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 block font-mono text-[10px] uppercase">Total Bookings</span>
                <span className="font-mono text-base font-bold text-[#0A142F]">{selectedCustomerHistory.totalBookings}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-mono text-[10px] uppercase">Total Expenditure</span>
                <span className="font-mono text-base font-bold text-emerald-700">{formatINR(selectedCustomerHistory.totalSpent || 0)}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-mono text-[10px] uppercase">Registered Since</span>
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {selectedCustomerHistory.createdAt ? new Date(selectedCustomerHistory.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-heading font-bold text-sm text-[#0A142F] mb-3">Itemized Rental History</h3>
              {selectedCustomerHistory.bookings && selectedCustomerHistory.bookings.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] font-bold text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Ref</th>
                        <th className="py-2.5 px-3">Vehicle</th>
                        <th className="py-2.5 px-3">Pickup & Return</th>
                        <th className="py-2.5 px-3">Dates</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedCustomerHistory.bookings.map((b) => (
                        <tr key={b.id || b.ref} className="hover:bg-slate-50/60 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#1E3A8A]">{b.ref}</td>
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-[#0A142F]">{b.car?.brand} {b.car?.model}</p>
                            {b.car?.registrationNumber && (
                              <span className="font-mono text-[10px] text-slate-500">{b.car.registrationNumber}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            <div>{b.pickup}</div>
                            {b.dropoff && b.dropoff !== b.pickup && (
                              <div className="text-[10px] text-slate-400">&rarr; {b.dropoff}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                            {b.start ? b.start.split('T')[0] : '—'} &rarr; {b.end ? b.end.split('T')[0] : '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-right text-[#0A142F]">
                            {formatINR(b.pricing?.total || 0)}
                          </td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={b.status} />
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomerHistory(null);
                                setSelectedDetailBooking(b);
                              }}
                              className="font-mono text-[11px] font-bold text-[#1E3A8A] hover:underline"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 font-mono text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No previous bookings recorded for this customer.
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomerHistory(null)}
                className="btn-outline text-xs px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT TRANSACTION DETAIL INSPECTION MODAL */}
      {selectedPaymentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white border border-slate-200/90 text-[#0A142F] p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-[#1E3A8A]">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-[#0A142F]">
                    Payment Transaction
                  </h2>
                  <p className="font-mono text-xs text-slate-500">
                    {selectedPaymentDetail.transactionId || selectedPaymentDetail.razorpayPaymentId || `TXN-${selectedPaymentDetail.id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPaymentDetail(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Amount & Status Card */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-slate-500">Settled Amount</span>
                <span className="font-mono text-2xl font-black text-[#0A142F] block mt-0.5">
                  {formatINR(selectedPaymentDetail.amount || 0)}
                </span>
              </div>
              <span
                className={`rounded-full px-3 py-1 font-mono text-xs font-bold border ${
                  selectedPaymentDetail.status === 'Paid' || selectedPaymentDetail.status === 'Captured'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : selectedPaymentDetail.status === 'Failed'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
              >
                {selectedPaymentDetail.status}
              </span>
            </div>

            {/* Gateway Audit Details */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 font-semibold">Payment Gateway:</span>
                <span className="font-bold text-[#0A142F]">Razorpay Payments</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 font-semibold">Payment Method:</span>
                <span className="font-mono font-bold text-[#1E3A8A]">{selectedPaymentDetail.method || 'Online'}</span>
              </div>
              {selectedPaymentDetail.razorpayPaymentId && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-500 font-semibold">Razorpay Payment ID:</span>
                  <span className="font-mono text-[#0A142F]">{selectedPaymentDetail.razorpayPaymentId}</span>
                </div>
              )}
              {selectedPaymentDetail.razorpayOrderId && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-500 font-semibold">Razorpay Order ID:</span>
                  <span className="font-mono text-[#0A142F]">{selectedPaymentDetail.razorpayOrderId}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 font-semibold">Timestamp:</span>
                <span className="font-mono text-slate-700">
                  {selectedPaymentDetail.createdAt ? new Date(selectedPaymentDetail.createdAt).toLocaleString('en-IN') : '—'}
                </span>
              </div>
            </div>

            {/* Customer & Booking Association */}
            <div className="mt-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 p-4 space-y-2 text-xs">
              <span className="font-mono text-[10px] uppercase font-bold text-[#1E3A8A] block">
                Associated Booking & Renter
              </span>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Booking Reference:</span>
                <span className="font-mono font-bold text-[#0A142F]">{selectedPaymentDetail.bookingRef || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Customer Name:</span>
                <span className="font-bold text-[#0A142F]">{selectedPaymentDetail.customer?.fullName || 'Walk-in'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Customer Email:</span>
                <span className="text-slate-700">{selectedPaymentDetail.customer?.email || '—'}</span>
              </div>
              {selectedPaymentDetail.car && (
                <div className="flex items-center justify-between pt-1 border-t border-blue-200/50">
                  <span className="text-slate-600">Vehicle:</span>
                  <span className="font-bold text-[#0A142F]">
                    {selectedPaymentDetail.car.brand} {selectedPaymentDetail.car.model}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {selectedPaymentDetail.bookingRef && (
                <button
                  type="button"
                  onClick={() => {
                    const ref = selectedPaymentDetail.bookingRef;
                    setSelectedPaymentDetail(null);
                    setReceiptRef(ref);
                  }}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <FileText size={13} /> View Invoice
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedPaymentDetail(null)}
                className="btn-outline text-xs px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
