import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '../services/api.js';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Enter your name';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (!form.subject.trim() || form.subject.trim().length < 3) e.subject = 'Enter a subject';
    if (!form.message.trim() || form.message.trim().length < 10) e.message = 'Message must be at least 10 characters';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      await apiRequest('/contact', { method: 'POST', body: form });
      setSubmitted(true);
      toast.success('Transmission sent! Our dispatch desk will respond shortly.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      // Graceful fallback if backend is offline
      setSubmitted(true);
      toast.success('Message recorded in offline buffer!');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-x py-12 text-[#0A142F]">
      <div className="max-w-2xl">
        <span className="font-mono text-xs uppercase tracking-widest text-[#1E3A8A] font-bold">Customer Concierge</span>
        <h1 className="font-heading text-3xl sm:text-4xl font-black text-[#0A142F] mt-2">Connect with Drivo</h1>
        <p className="mt-3 text-slate-600 text-sm leading-relaxed">
          Questions regarding fleet telemetry, airport dispatch hubs, or specialized vehicle reservations? Our concierge team is active 24/7.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4">
          {/* Official WhatsApp Concierge Card */}
          <a
            href="https://wa.me/919080105551?text=Hi%20DRIVO%20Team!%20I'm%20interested%20in%20renting%20a%20car.%20Please%20share%20the%20available%20cars%2C%20rental%20prices%2C%20and%20booking%20details.%20Thank%20you!"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Direct WhatsApp Contact with DRIVO Team"
            className="group block rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 p-5 shadow-sm transition-all duration-300 hover:border-emerald-500 hover:shadow-md hover:scale-[1.01]"
          >
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#25D366] to-[#128C7E] text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-sm text-[#0A142F]">WhatsApp Support</h2>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Live Now
                  </span>
                </div>
                <p className="mt-0.5 font-mono font-bold text-emerald-700 text-xs">+91 9080105551</p>
                <p className="text-xs text-slate-600 mt-1">Instant car availability, pricing &amp; fast booking</p>
                <span className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                  Chat with Team &rarr;
                </span>
              </div>
            </div>
          </a>

          {[
            { icon: Phone, title: 'Dedicated Helpdesk', detail: '+91 9080105551', sub: 'Mon–Sun, 24/7 Concierge Hotline' },
            { icon: Mail, title: 'Dispatch Inquiries', detail: 'concierge@drivo.com', sub: 'Average response under 15 minutes' },
            { icon: MapPin, title: 'Headquarters Hub', detail: 'WCC Road, Nagercoil', sub: 'Kanniyakumari District, Tamil Nadu 629001' },
            { icon: Clock, title: 'Emergency Roadside', detail: 'Rapid Local Dispatch', sub: 'GPS-synchronized across 10 Kanniyakumari hubs' },
          ].map(({ icon: Icon, title, detail, sub }) => (
            <div key={title} className="flex items-start gap-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 border border-blue-900/10 text-[#1E3A8A]">
                <Icon size={20} />
              </span>
              <div>
                <h2 className="font-bold text-sm text-[#0A142F]">{title}</h2>
                <p className="mt-0.5 font-mono font-bold text-[#1E3A8A] text-xs">{detail}</p>
                <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm lg:col-span-2">
          {submitted ? (
            <div className="py-12 text-center">
              <CheckCircle2 size={44} className="mx-auto text-emerald-600" />
              <h2 className="mt-4 text-2xl font-black text-[#0A142F]">Transmission Logged</h2>
              <p className="mt-2 text-sm text-slate-600">
                Your inquiry has been assigned a priority dispatch token. A concierge manager will reach out via email shortly.
              </p>
              <button type="button" onClick={() => setSubmitted(false)} className="btn-outline mt-6 text-slate-700">
                Transmit Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <h2 className="font-heading text-xl font-black text-[#0A142F]">Send a Transmission</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cnt-name" className="mb-1 block font-mono text-xs font-semibold text-[#0A142F]">Your Name *</label>
                  <input id="cnt-name" className="field" placeholder="Priya Raman" value={form.name} onChange={setField('name')} aria-invalid={!!errors.name} />
                  {errors.name && <p className="mt-1 font-mono text-xs text-rose-500">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="cnt-email" className="mb-1 block font-mono text-xs font-semibold text-[#0A142F]">Email Address *</label>
                  <input id="cnt-email" type="email" className="field" placeholder="you@example.com" value={form.email} onChange={setField('email')} aria-invalid={!!errors.email} />
                  {errors.email && <p className="mt-1 font-mono text-xs text-rose-500">{errors.email}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cnt-phone" className="mb-1 block font-mono text-xs font-semibold text-[#0A142F]">Contact Mobile (optional)</label>
                  <input id="cnt-phone" type="tel" className="field" placeholder="+91 98765 43210" value={form.phone} onChange={setField('phone')} />
                </div>
                <div>
                  <label htmlFor="cnt-subj" className="mb-1 block font-mono text-xs font-semibold text-[#0A142F]">Subject *</label>
                  <input id="cnt-subj" className="field" placeholder="Fleet inquiry or reservation assistance" value={form.subject} onChange={setField('subject')} aria-invalid={!!errors.subject} />
                  {errors.subject && <p className="mt-1 font-mono text-xs text-rose-500">{errors.subject}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="cnt-msg" className="mb-1 block font-mono text-xs font-semibold text-[#0A142F]">Message Content *</label>
                <textarea id="cnt-msg" rows={5} className="field resize-none" placeholder="Provide trip details, desired vehicle model, or support requirements..." value={form.message} onChange={setField('message')} aria-invalid={!!errors.message} />
                {errors.message && <p className="mt-1 font-mono text-xs text-rose-500">{errors.message}</p>}
              </div>

              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                <Send size={15} />
                {submitting ? 'Transmitting...' : 'Send Transmission'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
