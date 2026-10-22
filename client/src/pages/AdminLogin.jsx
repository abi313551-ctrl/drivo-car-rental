import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLogin() {
  const { adminLogin, isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already logged in as admin, redirect to /admin
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both administrator email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const adminUser = await adminLogin(email.trim(), password);
      toast.success(`Welcome back, ${adminUser.fullName || 'Administrator'}!`);
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please verify your administrator credentials.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Subtle Accent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-blue-100 blur-3xl"></div>
        <div className="absolute top-1/2 left-10 h-80 w-80 rounded-full bg-slate-200 blur-2xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Back to Website link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0A142F] transition"
          >
            <ArrowLeft size={14} /> Back to Customer Site
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#1E3A8A]">
            <Shield size={12} /> Restricted Access
          </span>
        </div>

        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A142F] text-white shadow-lg shadow-slate-900/10">
            <Shield size={28} className="text-blue-400" />
          </div>
          <h1 className="mt-4 font-heading text-2xl sm:text-3xl font-black tracking-tight text-[#0A142F]">
            DRIVO Admin Portal
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
            Fleet Operations & Booking Command Center
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/40">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 animate-fadeIn">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Authentication Error</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Admin Email Address
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 transition focus:border-[#0A142F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A142F]/10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Security Passphrase
                </label>
              </div>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 transition focus:border-[#0A142F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A142F]/10"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A142F] px-4 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-[#152347] focus:outline-none focus:ring-2 focus:ring-[#0A142F] focus:ring-offset-2 disabled:opacity-60 shadow-md shadow-slate-900/10 active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    <span>Authorize & Enter Admin Panel</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Looking for customer account?{' '}
              <Link to="/login" className="font-bold text-[#1E3A8A] hover:underline">
                Customer Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 text-center text-[11px] text-slate-400">
          Protected by role-based token authentication &bull; Kanniyakumari Fleet Hub &bull; Drivo 2026
        </div>
      </div>
    </div>
  );
}
