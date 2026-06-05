export function CardSkeleton() {
  return (
    <div className="fifa-card p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <div className="h-3 w-16 bg-[#2D3748] rounded" />
          <div className="h-5 w-48 bg-[#2D3748] rounded" />
        </div>
        <div className="h-5 w-20 bg-[#2D3748] rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-36 bg-[#2D3748] rounded" />
        <div className="h-3 w-52 bg-[#2D3748] rounded" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-[#2D3748]">
          <div className="h-4 w-8 bg-[#2D3748] rounded" />
          <div className="h-8 w-8 bg-[#2D3748] rounded-full" />
          <div className="h-4 w-32 bg-[#2D3748] rounded flex-1" />
          <div className="h-4 w-12 bg-[#2D3748] rounded" />
          <div className="h-4 w-12 bg-[#2D3748] rounded" />
          <div className="h-5 w-16 bg-[#2D3748] rounded" />
        </div>
      ))}
    </div>
  );
}
