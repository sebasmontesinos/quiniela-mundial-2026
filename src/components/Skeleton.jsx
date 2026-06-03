export function CardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <div className="h-3 w-16 bg-white/10 rounded" />
          <div className="h-5 w-48 bg-white/10 rounded" />
        </div>
        <div className="h-5 w-20 bg-white/10 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-36 bg-white/10 rounded" />
        <div className="h-3 w-52 bg-white/10 rounded" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-white/5">
          <div className="h-4 w-8 bg-white/10 rounded" />
          <div className="h-8 w-8 bg-white/10 rounded-full" />
          <div className="h-4 w-32 bg-white/10 rounded flex-1" />
          <div className="h-4 w-12 bg-white/10 rounded" />
          <div className="h-4 w-12 bg-white/10 rounded" />
          <div className="h-5 w-16 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}
