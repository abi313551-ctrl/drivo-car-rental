import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import CompareFloatingBar from '../components/CompareFloatingBar.jsx';

export default function MainLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#0B1528]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-3 focus:py-2 text-[#0B1528]">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1"><Outlet /></main>
      <CompareFloatingBar />
      <Footer />
    </div>
  );
}
