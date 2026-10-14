import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { cleanLicense } from '../utils/validation.js';

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

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined, form: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Enter your full name';
    else if (!/^[A-Za-z][A-Za-z .'-]{2,59}$/.test(form.fullName.trim())) e.fullName = 'Use letters only, at least 3 characters';

    if (!form.email.trim()) e.email = 'Enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = 'Enter a valid email address';

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
        phone: form.phone.trim(),
        license: form.license.trim() ? cleanLicense(form.license) : '',
        password: form.password,
      });
      toast.success(`Account created! Welcome, ${user.fullName.split(' ')[0]}.`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors({ form: err.message || 'Registration failed' });
      toast.error(err.message || 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-x grid min-h-[80vh] place-items-center py-12">
      <div className="w-full max-w-lg rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#75CFFF]/10 border border-[#75CFFF]/25 text-[#75CFFF]">
            <UserPlus size={22} />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-black text-[#F5F7FA]">Register Driver Account</h1>
            <p className="text-xs text-[#C6CDD5]">Verified membership for instant digital car reservations</p>
          </div>
        </div>

        {errors.form && (
          <div className="mt-5 rounded-2xl bg-rose-500/10 border border-rose-500/25 px-4 py-3 text-xs font-mono font-medium text-rose-400" role="alert">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-name" className="mb-1 block font-mono text-xs font-semibold text-[#75CFFF]">Full Name *</label>
              <input id="reg-name" className="field" placeholder="Priya Raman" value={form.fullName} onChange={setField('fullName')} aria-invalid={!!errors.fullName} />
              {errors.fullName && <p className="mt-1 font-mono text-xs text-rose-400" role="alert">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="reg-email" className="mb-1 block font-mono text-xs font-semibold text-[#75CFFF]">Email Address *</label>
              <input id="reg-email" type="email" className="field" placeholder="you@example.com" value={form.email} onChange={setField('email')} aria-invalid={!!errors.email} />
              {errors.email && <p className="mt-1 font-mono text-xs text-rose-400" role="alert">{errors.email}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-phone" className="mb-1 block font-mono text-xs font-semibold text-[#75CFFF]">Mobile Number (optional)</label>
              <input id="reg-phone" type="tel" className="field" placeholder="9876543210" value={form.phone} onChange={setField('phone')} aria-invalid={!!errors.phone} />
              {errors.phone && <p className="mt-1 font-mono text-xs text-rose-400" role="alert">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="reg-license" className="mb-1 block font-mono text-xs font-semibold text-[#75CFFF]">Driving Licence (optional)</label>
              <input id="reg-license" className="field uppercase font-mono" placeholder="TN37 20190012345" value={form.license} onChange={setField('license')} aria-invalid={!!errors.license} />
              {errors.license && <p className="mt-1 font-mono text-xs text-rose-400" role="alert">{errors.license}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-pw" className="mb-1 block font-mono text-xs font-semibold text-[#75CFFF]">Security Password *</label>
              <div className="relative">
                <input id="reg-pw" type={showPw ? 'text' : 'password'} className="field pr-10" placeholder="Min 6 characters" value={form.password} onChange={setField('password')} aria-invalid={!!errors.password} />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#75CFFF] transition" aria-label="Toggle password">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 font-mono text-xs text-rose-400" role="alert">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="reg-cpw" className="mb-1 block font-mono text-xs font-semibold text-[#75CFFF]">Confirm Password *</label>
              <input id="reg-cpw" type={showPw ? 'text' : 'password'} className="field" placeholder="Repeat password" value={form.confirmPassword} onChange={setField('confirmPassword')} aria-invalid={!!errors.confirmPassword} />
              {errors.confirmPassword && <p className="mt-1 font-mono text-xs text-rose-400" role="alert">{errors.confirmPassword}</p>}
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3 mt-2">
            {submitting ? 'Creating account...' : 'Create Driver Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#C6CDD5]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#75CFFF] hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
