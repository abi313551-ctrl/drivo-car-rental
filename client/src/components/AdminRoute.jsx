import { Navigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0B1528] border-t-transparent" />
      </div>
    );
  }

  // Not logged in or logged in as customer -> Strictly block with 403 Forbidden
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
            <ShieldAlert size={28} />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-black text-[#0B1528]">
            403 Access Restricted
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            You do not have authorization to view this resource.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B1528] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#1E293B]"
            >
              <ArrowLeft size={14} /> Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
