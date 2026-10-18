import React from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

export default function DeleteCarModal({
  carToDelete,
  onCancel,
  onConfirm,
  isDeleting,
}) {
  if (!carToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 text-[#0A142F] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-600 font-heading font-black text-base">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <ShieldAlert size={18} />
            </span>
            <span>Confirm Vehicle Deletion</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-700">
            Are you sure you want to remove <strong className="text-[#0A142F] font-bold">{carToDelete.name}</strong> from the fleet catalog?
          </p>

          {carToDelete.registrationNumber && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">Registration:</span>
              <span className="font-mono font-bold text-xs bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                {carToDelete.registrationNumber}
              </span>
            </div>
          )}

          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              <span>Safe Audit & History Guard</span>
            </div>
            <p className="text-[11px] text-amber-800">
              If this vehicle has past customer bookings or tax invoices, Drivo will safely mark it as <em>Unavailable (Deactivated)</em> rather than hard-deleting, preserving customer records and MySQL integrity.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Trash2 size={13} />
            <span>{isDeleting ? 'Deleting...' : 'Delete Vehicle'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
