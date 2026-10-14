import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="text-7xl font-extrabold tracking-tight">404</p>
        <h1 className="mt-3 text-2xl font-bold">This page does not exist</h1>
        <p className="mt-2 text-neutral-600">The link may be broken or the page may have moved.</p>
        <Link to="/" className="btn-primary mt-6">Back to home</Link>
      </div>
    </section>
  );
}
