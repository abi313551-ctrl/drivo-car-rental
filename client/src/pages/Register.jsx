import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

const cleanLicense = (s) => s.replace(/[\s-]/g, '').toUpperCase();

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    license: '',
    password: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined, form: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) e.fullName = 'Full name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Valid email is required';

    if (form.phone.trim()) {
      const p = form.phone.replace(/[\s-]/g, '');
      if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(p)) e.phone = 'Enter a valid 10-digit Indian mobile number';
    }

    if (form.license.trim()) {
      if (!/^[A-Z]{2}\d{2}(19|20)\d{2}\d{7}$/.test(cleanLicense(form.license))) {
        e.license = 'Use the format TN37 20190012345';
      }
    }

    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      const user = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        license: form.license.trim() ? cleanLicense(form.license) : undefined,
        password: form.password,
      });
      toast.success(`Account created! Welcome to DRIVO, ${user.fullName.split(' ')[0]}.`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors({ form: err.message || 'Registration failed' });
      toast.error(err.message || 'Could not register');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-[80vh] flex items-center justify-center py-12 text-[#0F172A]">
      <div className="container-x w-full flex justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3.5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#0A142F] border border-blue-100">
              <UserPlus size={22} />
            </span>
            <div>
              <h1 className="font-display text-2xl font-black text-[#0A142F]">Create Account</h1>
              <p className="text-xs text-slate-500">Verified membership for instant digital car reservations</p>
            </div>
          </div>

          {errors.form && (
            <div className="mt-5 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-700" role="alert">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-name" className="mb-1.5 block text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  id="reg-name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition"
                  placeholder="Priya Raman"
                  value={form.fullName}
                  onChange={setField('fullName')}
                  aria-invalid={!!errors.fullName}
                />
                {errors.fullName && <p className="mt-1 text-xs text-rose-600 font-semibold" role="alert">{errors.fullName}</p>}
              </div>

              <div>
                <label htmlFor="reg-email" className="mb-1.5 block text-xs font-bold text-slate-700">Email Address *</label>
                <input
                  id="reg-email"
                  type="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={setField('email')}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="mt-1 text-xs text-rose-600 font-semibold" role="alert">{errors.email}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-phone" className="mb-1.5 block text-xs font-bold text-slate-700">Mobile Contact</label>
                <input
                  id="reg-phone"
                  type="tel"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={setField('phone')}
                />
                {errors.phone && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="reg-lic" className="mb-1.5 block text-xs font-bold text-slate-700">Licence Number</label>
                <input
                  id="reg-lic"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition"
                  placeholder="TN37 20190012345"
                  value={form.license}
                  onChange={setField('license')}
                />
                {errors.license && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.license}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-pw" className="mb-1.5 block text-xs font-bold text-slate-700">Password *</label>
                <div className="relative">
                  <input
                    id="reg-pw"
                    type={showPw ? 'text' : 'password'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 pr-10 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={setField('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="reg-cpw" className="mb-1.5 block text-xs font-bold text-slate-700">Confirm Password *</label>
                <input
                  id="reg-cpw"
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={setField('confirmPassword')}
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.confirmPassword}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white py-3.5 text-xs font-bold uppercase tracking-wider transition shadow-sm active:scale-95 disabled:opacity-40 cursor-pointer mt-2"
            >
              {submitting ? 'Creating Driver Account...' : 'Complete Registration'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already verified?{' '}
            <Link to="/login" className="font-bold text-[#0A142F] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
