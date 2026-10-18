import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import CompareFloatingBar from '../components/CompareFloatingBar.jsx';

export default function MainLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <main id="main" className="min-h-screen bg-[#F8FAFC]">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] text-[#0F172A]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 text-[#0F172A] shadow-md font-semibold"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <CompareFloatingBar />
      <Footer />
    </div>
  );
}
