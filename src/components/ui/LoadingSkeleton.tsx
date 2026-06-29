export function CardSkeleton() {
  return (
    <div className="h-48 rounded-2xl bg-surface animate-pulse border border-border" />
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-surface rounded-xl animate-pulse border border-border"
        />
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-20 bg-surface rounded-xl animate-pulse border border-border"
        />
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-20 bg-surface rounded-xl animate-pulse border border-border"
        />
      ))}
    </div>
  );
}
