import { useEffect, useState } from 'react';
import { resolveImageUrl } from '../utils/imageUrl.js';

// URL-encoded clean SVG fallback that is 100% compliant across all browsers
const DEFAULT_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Cg fill='%2394a3b8' transform='translate(260, 150) scale(1.1)'%3E%3Cpath d='M250,150 L230,120 Q220,105 200,105 L80,105 Q60,105 50,120 L30,150 L10,155 Q0,158 0,175 L0,205 Q0,215 10,215 L30,215 A25,25 0 0,0 75,215 L205,215 A25,25 0 0,0 250,215 L270,215 Q280,215 280,205 L280,175 Q280,158 270,155 Z' fill='%23cbd5e1'/%3E%3Ccircle cx='52' cy='215' r='20' fill='%2364748b'/%3E%3Ccircle cx='52' cy='215' r='9' fill='%23f8fafc'/%3E%3Ccircle cx='228' cy='215' r='20' fill='%2364748b'/%3E%3Ccircle cx='228' cy='215' r='9' fill='%23f8fafc'/%3E%3Cpath d='M75,115 L135,115 L135,148 L50,148 Z' fill='%23e2e8f0'/%3E%3Cpath d='M145,115 L200,115 L225,148 L145,148 Z' fill='%23e2e8f0'/%3E%3C/g%3E%3Ctext x='50%25' y='400' text-anchor='middle' fill='%2364748b' font-family='system-ui, sans-serif' font-weight='600' font-size='20'%3EDrivo Vehicle%3C/text%3E%3C/svg%3E";

export default function CarImage({ src, alt = 'Car', className = '', eager = false, fallback = DEFAULT_FALLBACK }) {
  const initial = resolveImageUrl(src);
  const [imgSrc, setImgSrc] = useState(initial || fallback);

  useEffect(() => {
    const next = resolveImageUrl(src);
    if (!next || next.trim() === '') {
      setImgSrc(fallback);
    } else {
      setImgSrc(next);
    }
  }, [src, fallback]);

  const handleError = () => {
    if (imgSrc !== fallback) {
      setImgSrc(fallback);
    }
  };

  return (
    <img
      src={imgSrc || fallback}
      alt={alt || 'Vehicle'}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={handleError}
      className={className}
    />
  );
}
