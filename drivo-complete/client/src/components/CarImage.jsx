import { useEffect, useState } from 'react';

const FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='900' height='600'><rect width='100%' height='100%' fill='%23e5e5e5'/><text x='50%' y='50%' text-anchor='middle' fill='%23888' font-family='sans-serif' font-size='28'>Image unavailable</text></svg>";

export default function CarImage({ src, alt, className = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  return <img src={failed ? FALLBACK : src} alt={alt} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} className={className} />;
}
