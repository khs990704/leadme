import { Skeleton } from '@/components/ui/skeleton';

export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((col) => (
        <div key={col} className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <Skeleton className="h-5 w-24" />
          {[1, 2].map((card) => (
            <Skeleton key={card} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}
