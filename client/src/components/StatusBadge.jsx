const styles = {
  Confirmed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
  Pending: 'bg-amber-500/10 text-amber-300 border border-amber-500/25',
  'In Progress': 'bg-[#75CFFF]/10 text-[#75CFFF] border border-[#75CFFF]/30',
  Completed: 'bg-blue-500/10 text-blue-400 border border-blue-500/25',
  Cancelled: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
  Paid: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
  Failed: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
  Refunded: 'bg-white/5 text-[#C6CDD5] border border-white/10',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide uppercase ${
        styles[status] || 'bg-white/5 text-[#C6CDD5] border border-white/10'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}
