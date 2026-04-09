import { useParams } from 'react-router-dom';
import { PlanOverview } from '@/components/plan/PlanOverview';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlanDetail } from '@/hooks/usePlans';

export function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const { data: plan, isLoading, error } = usePlanDetail(planId ?? '');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">계획을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return <PlanOverview plan={plan} />;
}
