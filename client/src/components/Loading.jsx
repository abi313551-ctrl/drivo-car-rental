export default function Loading({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading cars">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-3xl border border-neutral-200">
          <div className="aspect-[3/2] bg-neutral-200" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-2/3 rounded bg-neutral-200" />
            <div className="h-3 w-1/2 rounded bg-neutral-200" />
            <div className="h-6 w-1/3 rounded bg-neutral-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
