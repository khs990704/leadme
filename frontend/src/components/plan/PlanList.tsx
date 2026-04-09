import { useState } from 'react';
import { PlanCard } from './PlanCard';
import { FilterTabs } from './FilterTabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlanListItem, PlanStatus } from '@/types/api';

interface PlanListProps {
  plans: PlanListItem[];
  isLoading: boolean;
}

export function PlanList({ plans, isLoading }: PlanListProps) {
  const [filter, setFilter] = useState<string>('active');

  const counts: Record<string, number> = {
    active: plans.filter((p) => p.status === 'active').length,
    completed: plans.filter((p) => p.status === 'completed').length,
    archived: plans.filter((p) => p.status === 'archived').length,
  };

  const filtered = plans.filter((p) => p.status === (filter as PlanStatus));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FilterTabs value={filter} onChange={setFilter} counts={counts} />

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">해당하는 계획이 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
