import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="container-x grid min-h-[65vh] place-items-center py-20 text-center">
      <div className="rounded-3xl border border-[rgba(198,205,213,0.12)] bg-[#161A22] p-12 max-w-lg shadow-2xl">
        <p className="font-heading text-8xl font-black text-[#75CFFF] tracking-tighter opacity-90">404</p>
        <h1 className="mt-3 font-heading text-2xl font-bold text-[#F5F7FA]">Trajectory Not Found</h1>
        <p className="mt-2 text-xs text-[#C6CDD5]">The requested destination coordinate does not exist or has been relocated.</p>
        <Link to="/" className="btn-primary mt-8 inline-block">Return to Showroom</Link>
      </div>
    </section>
  );
}
