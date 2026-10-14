import { Link } from 'react-router-dom';

export default function Placeholder({ title, stage }) {
  return (
    <section className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <h1 className="heading">{title}</h1>
        <p className="mt-3 text-neutral-600">This page will be built in Stage {stage}.</p>
        <Link to="/" className="btn-outline mt-6">Back to home</Link>
      </div>
    </section>
  );
}
