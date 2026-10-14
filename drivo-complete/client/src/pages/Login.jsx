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
    <div className="container-x grid min-h-[75vh] place-items-center py-12">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-card">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent">
            <LogIn size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold">Log in to Drivo</h1>
            <p className="text-sm text-neutral-500">Manage bookings, saved cars, and profile</p>
          </div>
        </div>

        {errors.form && (
          <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-xs font-semibold text-neutral-600">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((er) => ({ ...er, email: undefined, form: undefined })); }}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="field-error" role="alert">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1 block text-xs font-semibold text-neutral-600">Password</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                className="field pr-10"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((er) => ({ ...er, password: undefined, form: undefined })); }}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-ink"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="field-error" role="alert">{errors.password}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
            {submitting ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        <div className="mt-6 rounded-2xl bg-neutral-50 p-4 text-xs text-neutral-600">
          <p className="flex items-center gap-1.5 font-bold text-ink">
            <KeyRound size={14} className="text-accent" /> Seeded test accounts (Backend DB):
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fillQuickAccount('priya@drivo.example', 'customer123')}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-1.5 font-semibold text-ink hover:border-ink"
            >
              Customer (priya@drivo.example)
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('admin@drivo.example', 'admin123')}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-1.5 font-semibold text-ink hover:border-ink"
            >
              Admin (admin@drivo.example)
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-bold text-accent hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
