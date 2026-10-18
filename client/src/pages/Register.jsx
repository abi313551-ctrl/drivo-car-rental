import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  UserPlus,
  Eye,
  EyeOff,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Mail,
  ArrowLeft,
  Clock,
  RotateCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

const cleanLicense = (s) => (s ? s.replace(/[\s-]/g, '').toUpperCase() : '');

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendRegisterOtp, verifyRegisterOtp, resendRegisterOtp, loginWithGoogle } = useAuth();
  const from =
    location.state?.from ||
    new URLSearchParams(location.search).get('from') ||
    new URLSearchParams(location.search).get('redirect') ||
    '/dashboard';

  // Step 1: Form, Step 2: Email OTP
  const [step, setStep] = useState('form');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    license: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });

  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const [smtpStatusInfo, setSmtpStatusInfo] = useState(null);

  const otpInputsRef = useRef([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step !== 'otp' || otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((c) => (c > 1 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, otpCooldown]);

  const setField = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    setErrors((er) => ({ ...er, [k]: undefined, form: undefined }));
  };

  const validateForm = () => {
    const e = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 3) {
      e.fullName = 'Full name must be at least 3 letters';
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = 'Enter a valid email address';
    }
    if (form.phone.trim()) {
      const p = form.phone.replace(/[\s-]/g, '');
      if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(p)) {
        e.phone = 'Enter a valid 10-digit Indian mobile number';
      }
    }
    if (form.license.trim()) {
      const cleaned = cleanLicense(form.license);
      if (!/^[A-Z]{2}\d{2}(19|20)\d{2}\d{7}$/.test(cleaned)) {
        e.license = 'Format: TN37 20190012345';
      }
    }
    if (!form.password || form.password.length < 6) {
      e.password = 'Password must be at least 6 characters';
    }
    if (form.confirmPassword !== form.password) {
      e.confirmPassword = 'Passwords do not match';
    }
    if (!form.agreeTerms) {
      e.agreeTerms = 'You must agree to the terms and Kanniyakumari guidelines';
    }
    return e;
  };

  // Step 1: Submit Form & Send OTP
  const handleInitiateRegister = async (ev) => {
    ev.preventDefault();
    const e = validateForm();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    setErrors({});
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        license: form.license.trim() ? cleanLicense(form.license) : undefined,
        password: form.password,
      };

      const res = await sendRegisterOtp(payload);
      setSmtpStatusInfo(res);
      setOtpCooldown(res.cooldown || 60);
      setStep('otp');
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError('');
      toast.success('6-digit verification code sent to your email!');

      // Focus first OTP input on next tick
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err) {
      const msg = err.message || 'Registration could not be started. Check your details.';
      setErrors({ form: msg });
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Handle 6-digit OTP input
  const handleOtpChange = (index, value) => {
    // Handle single digit input
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    setOtpError('');

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);
    const nextIndex = Math.min(pasted.length, 5);
    otpInputsRef.current[nextIndex]?.focus();
  };

  // Step 2: Verify OTP and complete registration
  const handleVerifyOtp = async (ev) => {
    ev.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setOtpError('Please enter all 6 digits of your verification code');
      return;
    }

    setSubmitting(true);
    setOtpError('');
    try {
      const res = await verifyRegisterOtp(form.email.trim(), fullOtp);
      toast.success(`Account verified! Welcome to DRIVO, ${res.user.fullName.split(' ')[0]}.`);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || 'Invalid or expired verification code.';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (otpCooldown > 0 || resending) return;
    setResending(true);
    setOtpError('');
    try {
      const res = await resendRegisterOtp(form.email.trim(), 'register');
      setSmtpStatusInfo(res);
      setOtpCooldown(res.cooldown || 60);
      toast.success('A new 6-digit OTP code has been sent!');
    } catch (err) {
      setOtpError(err.message || 'Could not resend OTP code.');
      toast.error(err.message || 'Resend failed');
    } finally {
      setResending(false);
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const promptEmail = form.email.trim() || 'customer.google@example.com';
      const promptName = form.fullName.trim() || (form.email.trim() ? form.email.split('@')[0] : 'Google Customer');

      const user = await loginWithGoogle({
        email: promptEmail,
        name: promptName,
        googleId: 'g_' + Math.random().toString(36).substring(2, 12),
      });
      toast.success(`Signed up with Google! Welcome to DRIVO, ${user.fullName.split(' ')[0]}.`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Google registration failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 lg:p-10 text-[#0A142F]">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
        
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
                Join thousands of verified drivers exploring Kanniyakumari. Enjoy contactless digital handovers at Nagercoil, Marthandam, Kanyakumari, and 14+ local hubs.
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
              <span>Instant digital booking with real email OTP verification</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ShieldCheck size={15} className="text-blue-600 shrink-0" />
              <span>100% verified fleet, comprehensive insurance included</span>
            </div>
          </div>

        </div>

        {/* ================= RIGHT SIDE: FORM / OTP ================= */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">

            {step === 'form' ? (
              /* --- STEP 1: REGISTRATION FORM --- */
              <div>
                <div className="mb-6">
                  <h1 className="font-display text-3xl font-black text-[#0A142F] tracking-tight">
                    Create Account
                  </h1>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
                    Verified registration for seamless rentals across Kanniyakumari
                  </p>
                </div>

                {from && from.startsWith('/booking') && (
                  <div className="mb-5 rounded-2xl bg-blue-50 border border-blue-200/80 p-3.5 text-xs text-blue-900 flex items-start gap-2.5 shadow-2xs">
                    <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Create an account to complete your booking</p>
                      <p className="text-[11px] text-blue-700 mt-0.5">
                        Your vehicle and dates are saved. Complete registration to confirm your reservation.
                      </p>
                    </div>
                  </div>
                )}

                {errors.form && (
                  <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700 flex items-start gap-2.5" role="alert">
                    <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                    <span>{errors.form}</span>
                  </div>
                )}

                {/* Google Sign-up Button */}
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
                  <span>{googleLoading ? 'Creating account with Google...' : 'Continue with Google'}</span>
                </button>

                {/* OR Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                      Or register with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleInitiateRegister} noValidate className="space-y-3.5">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="reg-name" className="mb-1 block text-xs font-bold text-slate-700">
                      Full Name *
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      className={`w-full rounded-xl border ${
                        errors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                      } px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0A142F] focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-inner`}
                      placeholder="e.g. Priya Raman"
                      value={form.fullName}
                      onChange={setField('fullName')}
                    />
                    {errors.fullName && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.fullName}</p>}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label htmlFor="reg-email" className="mb-1 block text-xs font-bold text-slate-700">
                      Email Address *
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      className={`w-full rounded-xl border ${
                        errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                      } px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0A142F] focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-inner`}
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={setField('email')}
                    />
                    {errors.email && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.email}</p>}
                  </div>

                  {/* Phone & License Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="reg-phone" className="mb-1 block text-xs font-bold text-slate-700">
                        Phone Number
                      </label>
                      <input
                        id="reg-phone"
                        type="tel"
                        className={`w-full rounded-xl border ${
                          errors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                        } px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0A142F] focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-inner`}
                        placeholder="98765 43210"
                        value={form.phone}
                        onChange={setField('phone')}
                      />
                      {errors.phone && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.phone}</p>}
                    </div>

                    <div>
                      <label htmlFor="reg-license" className="mb-1 block text-xs font-bold text-slate-700">
                        License (Optional)
                      </label>
                      <input
                        id="reg-license"
                        type="text"
                        className={`w-full rounded-xl border ${
                          errors.license ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                        } px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0A142F] focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-inner uppercase`}
                        placeholder="TN74 20240012"
                        value={form.license}
                        onChange={setField('license')}
                      />
                      {errors.license && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.license}</p>}
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="reg-password" className="mb-1 block text-xs font-bold text-slate-700">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          id="reg-password"
                          type={showPw ? 'text' : 'password'}
                          className={`w-full rounded-xl border ${
                            errors.password ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                          } px-4 py-2.5 pr-9 text-xs sm:text-sm font-semibold text-[#0A142F] focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-inner`}
                          placeholder="••••••••"
                          value={form.password}
                          onChange={setField('password')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {errors.password && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.password}</p>}
                    </div>

                    <div>
                      <label htmlFor="reg-confirm-pw" className="mb-1 block text-xs font-bold text-slate-700">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          id="reg-confirm-pw"
                          type={showConfirmPw ? 'text' : 'password'}
                          className={`w-full rounded-xl border ${
                            errors.confirmPassword ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                          } px-4 py-2.5 pr-9 text-xs sm:text-sm font-semibold text-[#0A142F] focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-inner`}
                          placeholder="••••••••"
                          value={form.confirmPassword}
                          onChange={setField('confirmPassword')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Agree Terms Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.agreeTerms}
                        onChange={setField('agreeTerms')}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                        I agree to Drivo's Terms of Service and Kanniyakumari district operating guidelines.
                      </span>
                    </label>
                    {errors.agreeTerms && (
                      <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.agreeTerms}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3.5 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-md shadow-blue-600/25 active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-3"
                  >
                    {submitting ? 'Sending Verification OTP...' : 'Continue & Verify Email'}
                  </button>
                </form>

                {/* Link to Login */}
                <p className="mt-6 text-center text-xs sm:text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link
                    to={from && from !== '/dashboard' ? `/login?redirect=${encodeURIComponent(from)}` : '/login'}
                    state={{ from }}
                    className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            ) : (
              /* --- STEP 2: 6-DIGIT EMAIL OTP VERIFICATION --- */
              <div className="animate-in fade-in duration-300">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition mb-6 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to details
                </button>

                <div className="mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-4">
                    <Mail size={24} />
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-[#0A142F] tracking-tight">
                    Verify Your Email
                  </h1>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
                    We sent a 6-digit verification code to{' '}
                    <span className="font-bold text-[#0A142F]">{form.email}</span>
                  </p>
                </div>

                {otpError && (
                  <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700 flex items-start gap-2.5" role="alert">
                    <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                    <span>{otpError}</span>
                  </div>
                )}

                {/* 6-Digit Code Input Form */}
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2.5 text-center">
                      Enter 6-Digit Verification Code
                    </label>

                    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputsRef.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-mono font-black rounded-xl border border-slate-300 bg-slate-50/70 text-[#0A142F] focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none transition shadow-sm"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3.5 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-md shadow-blue-600/25 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Verifying Code...' : 'Verify & Complete Registration'}
                  </button>

                  {/* Resend & Cooldown controls */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="font-medium">Didn't receive the code?</span>
                    {otpCooldown > 0 ? (
                      <span className="flex items-center gap-1 font-bold text-slate-400">
                        <Clock size={13} /> Resend in {otpCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resending}
                        className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        <RotateCw size={12} className={resending ? 'animate-spin' : ''} />
                        {resending ? 'Sending...' : 'Resend Code'}
                      </button>
                    )}
                  </div>
                </form>

                {/* Development & Server Notice */}
                {smtpStatusInfo && !smtpStatusInfo.smtpConfigured && (
                  <div className="mt-6 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/70 text-[11px] text-blue-800 leading-relaxed">
                    <div className="font-bold flex items-center gap-1 mb-1">
                      <Sparkles size={12} />
                      <span>Security &amp; Delivery Notice</span>
                    </div>
                    {smtpStatusInfo.statusMessage ||
                      'If SMTP is in test mode, the verification code was generated with SHA-256 security. Set SMTP_HOST in .env for production email delivery.'}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
