import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="container-x grid min-h-[65vh] place-items-center py-20 text-center">
      <div className="rounded-3xl border border-slate-200/90 bg-white p-12 max-w-lg shadow-sm">
        <p className="font-heading text-8xl font-black text-[#1E3A8A] tracking-tighter opacity-90">404</p>
        <h1 className="mt-3 font-heading text-2xl font-bold text-[#0A142F]">Page Not Found</h1>
        <p className="mt-2 text-xs text-slate-600">The requested vehicle or editorial page does not exist or has been relocated.</p>
        <Link to="/" className="btn-primary mt-8 inline-block">Return to Homepage</Link>
      </div>
    </section>
  );
}
