import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, KeyRound, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from || '/dashboard';

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Enter your password';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ form: err.message || 'Login failed. Check your credentials.' });
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickAccount = (demoEmail, demoPw) => {
    setEmail(demoEmail);
    setPassword(demoPw);
    setErrors({});
  };

  return (
    <div className="bg-[#F8F9FA] min-h-[75vh] flex items-center justify-center py-12 text-[#0F172A]">
      <div className="container-x w-full flex justify-center">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3.5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#0A142F] border border-blue-100">
              <LogIn size={22} />
            </span>
            <div>
              <h1 className="font-display text-2xl font-black text-[#0A142F]">Sign In</h1>
              <p className="text-xs text-slate-500">Access your bookings and driver profile</p>
            </div>
          </div>

          {errors.form && (
            <div className="mt-5 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-700" role="alert">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold text-slate-700">Email Address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600 font-semibold" role="alert">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 pr-10 text-xs font-semibold text-[#0F172A] focus:border-[#0A142F] focus:bg-white focus:outline-none transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-600 font-semibold" role="alert">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#0A142F] hover:bg-[#1E293B] text-white py-3.5 text-xs font-bold uppercase tracking-wider transition shadow-sm active:scale-95 disabled:opacity-40 cursor-pointer mt-2"
            >
              {submitting ? 'Verifying Credentials...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Auto-Fill */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <KeyRound size={13} /> Quick Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickAccount('priya@example.com', 'customer123')}
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 p-2.5 text-left text-xs transition cursor-pointer"
              >
                <span className="font-bold text-[#0A142F] block">Customer</span>
                <span className="text-[10px] text-slate-500 block truncate">priya@example.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('admin@drivo.com', 'admin123')}
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 p-2.5 text-left text-xs transition cursor-pointer"
              >
                <span className="font-bold text-[#0A142F] block">Fleet Admin</span>
                <span className="text-[10px] text-slate-500 block truncate">admin@drivo.com</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have a verified account?{' '}
            <Link to="/register" className="font-bold text-[#0A142F] hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
