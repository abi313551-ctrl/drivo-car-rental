const styles = {
  Confirmed: 'bg-green-100 text-green-800', Pending: 'bg-amber-100 text-amber-800',
  Completed: 'bg-blue-100 text-blue-800', Cancelled: 'bg-red-100 text-red-800',
  Paid: 'bg-green-100 text-green-800', Failed: 'bg-red-100 text-red-800', Refunded: 'bg-neutral-200 text-neutral-800',
};

export default function StatusBadge({ status }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || 'bg-neutral-100 text-neutral-700'}`}>{status}</span>;
}
