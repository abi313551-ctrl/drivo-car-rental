import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, MapPin, ShieldCheck, Sparkles, CheckCircle2, ArrowRight, X, Mail, KeyRound, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, sendForgotPasswordOtp, verifyResetPassword, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp + new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPw, setForgotNewPw] = useState('');
  const [forgotConfirmPw, setForgotConfirmPw] = useState('');
  const [forgotShowPw, setForgotShowPw] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotCooldown, setForgotCooldown] = useState(0);

  const from = location.state?.from || new URLSearchParams(location.search).get('from') || new URLSearchParams(location.search).get('redirect') || '/dashboard';

  // Countdown timer for forgot password OTP resend
  useEffect(() => {
    if (forgotCooldown <= 0) return;
    const timer = setInterval(() => {
      setForgotCooldown((c) => (c > 1 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [forgotCooldown]);

  const validate = () => {
    const e = {};
    if (!email.trim()) {
      e.email = 'Enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = 'Enter a valid email address';
    }
    if (!password) {
      e.password = 'Enter your password';
    }
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
      const msg = err.message || 'Login failed. Please check your credentials.';
      setErrors({ form: msg });
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // If user has email typed or fallback for demonstration
      const promptEmail = email.trim() || 'customer.google@example.com';
      const promptName = email.trim() ? email.split('@')[0] : 'Google Customer';
      
      const user = await loginWithGoogle({
        email: promptEmail,
        name: promptName,
        googleId: 'g_' + Math.random().toString(36).substring(2, 12),
      });
      toast.success(`Signed in with Google! Welcome, ${user.fullName.split(' ')[0]}.`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Google sign-in could not be completed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const openForgotPassword = () => {
    setForgotEmail(email.trim() || '');
    setForgotStep(1);
    setForgotOtp('');
    setForgotNewPw('');
    setForgotConfirmPw('');
    setForgotError('');
    setShowForgotModal(true);
  };

  const handleSendForgotOtp = async (e) => {
    e?.preventDefault();
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setForgotError('Please enter a valid registered email address');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await sendForgotPasswordOtp(forgotEmail.trim());
      setForgotCooldown(res.cooldown || 60);
      setForgotStep(2);
      toast.success('6-digit reset code sent to your email!');
    } catch (err) {
      setForgotError(err.message || 'Failed to dispatch reset code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyForgotReset = async (e) => {
    e?.preventDefault();
    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      setForgotError('Please enter the 6-digit OTP code');
      return;
    }
    if (!forgotNewPw || forgotNewPw.length < 6) {
      setForgotError('New password must be at least 6 characters');
      return;
    }
    if (forgotNewPw !== forgotConfirmPw) {
      setForgotError('Passwords do not match');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    try {
      await verifyResetPassword(forgotEmail.trim(), forgotOtp.trim(), forgotNewPw);
      toast.success('Password reset successfully! Please sign in with your new password.');
      setEmail(forgotEmail.trim());
      setPassword(forgotNewPw);
      setShowForgotModal(false);
    } catch (err) {
      setForgotError(err.message || 'Password reset failed. Check the verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 lg:p-10 text-[#0A142F]">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* ================= LEFT SIDE: BRAND & CAR HERO ================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#EFF6FF] via-[#F0F7FF] to-[#E0EDFD] p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200/70 relative">
          
          {/* Top Brand & Location Badge */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative text-[#0A142F] transition-transform duration-300 group-hover:scale-105">
                <svg width="40" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 18C4 18 10 17 16 12C20 8.5 28 6 36 7C41 7.6 44 11 44 15"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 18H40"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="13" cy="18" r="3" fill="#2563EB" stroke="currentColor" strokeWidth="2" />
                  <circle cx="35" cy="18" r="3" fill="#2563EB" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <span className="font-display text-2xl font-black tracking-tight text-[#0A142F]">
                DRIVO<span className="text-blue-600">.</span>
              </span>
            </Link>

            <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-100/90 text-blue-700 border border-blue-200/80">
              <MapPin size={13} className="shrink-0 text-blue-600" />
              <span>Kanniyakumari District Only</span>
            </div>

            <div className="mt-8">
              <h2 className="font-display text-2xl sm:text-3xl font-black text-[#0A142F] tracking-tight leading-tight">
                Your Journey <br />
                <span className="text-blue-600">Starts Here.</span>
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Discover the beauty of Kanniyakumari with premium self-drive car rentals. Instant pickup from Nagercoil, Kanyakumari, Marthandam, and 14+ local hubs.
              </p>
            </div>
          </div>

          {/* Luxury Car Image Showcase */}
          <div className="my-8 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-lg shadow-blue-900/10 border border-white/80 bg-white">
              <img
                src="/hero-drive-bright-poster.jpg"
                alt="Luxury Car in Kanniyakumari"
                className="w-full h-44 sm:h-48 object-cover object-center transform hover:scale-105 transition duration-700"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-semibold">
                <span className="bg-blue-600/90 backdrop-blur-sm px-2.5 py-1 rounded-md">
                  Kanniyakumari Verified Fleet
                </span>
                <span className="bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-md text-slate-200">
                  TN-74 / TN-75 Hubs
                </span>
              </div>
            </div>
          </div>

          {/* Trust Points */}
          <div className="space-y-2 pt-2 border-t border-blue-200/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
              <span>Zero security deposit options &amp; instant keys</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ShieldCheck size={15} className="text-blue-600 shrink-0" />
              <span>Sanitized, GPS-enabled &amp; 100% verified fleet</span>
            </div>
          </div>

        </div>

        {/* ================= RIGHT SIDE: LOGIN FORM ================= */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            
            <div className="mb-8">
              <h1 className="font-display text-3xl font-black text-[#0A142F] tracking-tight">
                Welcome Back
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
                Sign in to your account to manage bookings and rentals
              </p>
            </div>

            {from && from.startsWith('/booking') && (
              <div className="mb-6 rounded-2xl bg-blue-50 border border-blue-200/80 p-3.5 text-xs text-blue-900 flex items-start gap-2.5 shadow-2xs">
                <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Log in to complete your vehicle booking</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Your vehicle, dates, and pickup station are preserved. Sign in to confirm your reservation.
                  </p>
                </div>
              </div>
            )}

            {errors.form && (
              <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700 flex items-start gap-2.5" role="alert">
                <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Google Sign-in Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-xs sm:text-sm font-bold text-slate-700 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Authenticating with Google...' : 'Continue with Google'}</span>
            </button>

            {/* OR Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold text-slate-700">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  className={`w-full rounded-xl border ${
                    errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                  } px-4 py-3 text-xs sm:text-sm font-semibold text-[#0A142F] focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-inner`}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`w-full rounded-xl border ${
                      errors.password ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                    } px-4 py-3 pr-11 text-xs sm:text-sm font-semibold text-[#0A142F] focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-inner`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center pt-1">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-slate-600 cursor-pointer">
                  Remember my session on this device
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3.5 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-md shadow-blue-600/25 active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2"
              >
                {submitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Quick Demo Access:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('priya.raman@example.com');
                    setPassword('PriyaSecure2026!');
                    setErrors({});
                  }}
                  className="text-xs bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  Customer Demo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@drivo.com');
                    setPassword('AdminSecure2026!');
                    setErrors({});
                  }}
                  className="text-xs bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  Admin Demo
                </button>
              </div>
            </div>

            {/* Link to Register */}
            <p className="mt-8 text-center text-xs sm:text-sm text-slate-600">
              Don't have an account yet?{' '}
              <Link
                to={from && from !== '/dashboard' ? `/register?redirect=${encodeURIComponent(from)}` : '/register'}
                state={{ from }}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Create Account
              </Link>
            </p>

          </div>
        </div>

      </div>

      {/* ================= FORGOT PASSWORD OTP MODAL ================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 sm:p-8 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {forgotStep === 1 ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-[#0A142F]">
                      Reset Password
                    </h3>
                    <p className="text-xs text-slate-500">
                      We'll send a 6-digit OTP code to your email
                    </p>
                  </div>
                </div>

                {forgotError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                    {forgotError}
                  </div>
                )}

                <form onSubmit={handleSendForgotOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Registered Email Address
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs sm:text-sm font-semibold text-[#0A142F] focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending OTP Code...' : 'Send Verification OTP'}
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-[#0A142F]">
                      Enter Verification Code
                    </h3>
                    <p className="text-xs text-slate-500">
                      Code sent to <span className="font-bold text-slate-700">{forgotEmail}</span>
                    </p>
                  </div>
                </div>

                {forgotError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                    {forgotError}
                  </div>
                )}

                <form onSubmit={handleVerifyForgotReset} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-center tracking-[8px] font-mono font-bold text-lg rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[#0A142F] focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={forgotShowPw ? 'text' : 'password'}
                        value={forgotNewPw}
                        onChange={(e) => setForgotNewPw(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-xs sm:text-sm font-semibold text-[#0A142F] focus:border-blue-600 focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setForgotShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {forgotShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={forgotShowPw ? 'text' : 'password'}
                      value={forgotConfirmPw}
                      onChange={(e) => setForgotConfirmPw(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0A142F] focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 mt-1"
                  >
                    {forgotLoading ? 'Updating Password...' : 'Reset & Save Password'}
                  </button>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                    >
                      Change Email
                    </button>
                    {forgotCooldown > 0 ? (
                      <span className="flex items-center gap-1 font-semibold text-slate-400">
                        <Clock size={12} /> Resend in {forgotCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendForgotOtp}
                        className="text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
