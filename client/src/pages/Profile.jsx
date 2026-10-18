import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Lock,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user, isAuthenticated, loading, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    license: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        license: user.license || '',
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="bg-[#F8F9FA] min-h-[70vh] grid place-items-center text-[#0F172A]">
        <div className="text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-[#0A142F]" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="bg-[#F8F9FA] min-h-[70vh] flex items-center justify-center py-16 text-[#0F172A]">
        <div className="container-x w-full max-w-md text-center rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-sm">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-[#0A142F] mx-auto">
            <Lock size={26} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-black text-[#0A142F]">Authentication Required</h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Please sign in to view and manage your verified driver profile.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login?from=/profile"
              className="rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition shadow-sm"
            >
              Sign In
            </Link>
            <Link
              to="/register?from=/profile"
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 text-xs font-bold uppercase tracking-wider transition"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 3) {
      errs.fullName = 'Full name must contain letters and be at least 3 characters.';
    }
    if (form.phone && form.phone.trim()) {
      const cleanedPhone = form.phone.replace(/[\s-]/g, '');
      if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(cleanedPhone)) {
        errs.phone = 'Enter a valid 10-digit Indian mobile number.';
      }
    }
    if (form.license && form.license.trim()) {
      const cleanedLic = form.license.replace(/[\s-]/g, '').toUpperCase();
      if (!/^[A-Z]{2}\d{2}(19|20)\d{2}\d{7}$/.test(cleanedLic)) {
        errs.license = 'Format: TN37 20190012345 (2 state letters, 2 code, year, 7 digits).';
      }
    }
    return errs;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validationErrs = validate();
    setErrors(validationErrs);
    if (Object.keys(validationErrs).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || '',
        license: form.license.trim() ? form.license.replace(/[\s-]/g, '').toUpperCase() : '',
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      fullName: user.fullName || '',
      phone: user.phone || '',
      license: user.license || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-[#0F172A] py-10 sm:py-14">
      <div className="container-x max-w-4xl">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1">
              ACCOUNT SETTINGS
            </span>
            <h1 className="font-display text-2xl sm:text-4xl font-black text-[#0A142F]">
              My Profile
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Manage your verified driver profile and personal credentials.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/my-bookings"
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0A142F] px-4 py-2.5 text-xs font-bold transition shadow-2xs"
            >
              My Bookings
            </Link>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-5 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Left Column: Avatar & Overview */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm text-center">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-[#0A142F] text-white text-2xl font-black mx-auto shadow-md">
              {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-[#0A142F]">{user.fullName}</h2>
            <p className="text-xs text-slate-500">{user.email}</p>

            <div className="mt-5 pt-5 border-t border-slate-100 flex justify-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-900 border border-blue-100">
                {user.tier || 'Silver'} Member
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                {user.rewardPoints || 0} Reward Points
              </span>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 text-left space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account Type</span>
                <span className="font-bold text-[#0A142F] capitalize">{user.role || 'Customer'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Member Since</span>
                <span className="font-semibold text-slate-700">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Verified'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: View or Edit Form */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            {!isEditing ? (
              /* View Mode */
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="font-display text-base font-bold text-[#0A142F]">Personal Details</h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:underline cursor-pointer"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                      Full Name
                    </span>
                    <p className="text-sm font-bold text-[#0A142F]">{user.fullName || '—'}</p>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                      Email Address
                    </span>
                    <p className="text-sm font-bold text-[#0A142F]">{user.email || '—'}</p>
                    <span className="text-[10px] text-slate-400">Immutable security identifier</span>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                      Phone Number
                    </span>
                    <p className="text-sm font-bold text-[#0A142F]">
                      {user.phone ? user.phone : <span className="text-slate-400 font-normal">Not provided</span>}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                      Driving Licence
                    </span>
                    <p className="text-sm font-bold text-[#0A142F] uppercase">
                      {user.license ? user.license : <span className="text-slate-400 font-normal">Not provided</span>}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>Your driver profile is authenticated with FastAPI & MySQL.</span>
                  </div>
                  <Link
                    to="/my-bookings"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A142F] hover:underline"
                  >
                    <span>View Reservation History</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <form onSubmit={handleSave} noValidate className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-display text-base font-bold text-[#0A142F]">Edit Profile Information</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your verified contact and driver credentials.
                  </p>
                </div>

                <div>
                  <label htmlFor="p-name" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="p-name"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition ${
                      errors.fullName ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 bg-slate-50/70'
                    }`}
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="p-email" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Email Address
                  </label>
                  <input
                    id="p-email"
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-xs font-semibold text-slate-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Email address cannot be changed for security reasons.</p>
                </div>

                <div>
                  <label htmlFor="p-phone" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Phone Number
                  </label>
                  <input
                    id="p-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition ${
                      errors.phone ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 bg-slate-50/70'
                    }`}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="p-lic" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Driving Licence Number
                  </label>
                  <input
                    id="p-lic"
                    type="text"
                    placeholder="TN37 20190012345"
                    value={form.license}
                    onChange={(e) => setForm({ ...form, license: e.target.value.toUpperCase() })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] uppercase focus:border-[#0A142F] focus:bg-white focus:outline-none transition ${
                      errors.license ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 bg-slate-50/70'
                    }`}
                  />
                  {errors.license && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.license}</p>}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white px-6 py-2.5 text-xs font-bold transition shadow-sm disabled:opacity-40 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <span>Save Profile Changes</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
