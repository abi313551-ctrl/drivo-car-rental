const styles = {
  Confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  'In Progress': 'bg-blue-50 text-[#1E3A8A] border border-blue-200',
  Completed: 'bg-slate-100 text-slate-700 border border-slate-200',
  Cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
  Paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Failed: 'bg-rose-50 text-rose-700 border border-rose-200',
  Refunded: 'bg-slate-100 text-slate-600 border border-slate-200',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide uppercase ${
        styles[status] || 'bg-slate-100 text-slate-600 border border-slate-200'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}
