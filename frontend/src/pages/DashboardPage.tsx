import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { TodayTodos } from '@/components/dashboard/TodayTodos';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentFeedback } from '@/components/dashboard/RecentFeedback';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlans, usePlanNodes } from '@/hooks/usePlans';
import { usePlanFeedback } from '@/hooks/useFeedback';

export function DashboardPage() {
  const { data: plansData, isLoading: plansLoading } = usePlans('active');

  const activePlan = plansData?.data?.[0] ?? null;
  const activePlanId = activePlan?.id ?? '';

  const { data: nodesData } = usePlanNodes(activePlanId, {
    status: ['todo', 'in_progress'],
  });

  const { data: feedbackData } = usePlanFeedback(activePlanId);

  const todayNodes = (nodesData ?? []).slice(0, 5);
  const latestFeedback = feedbackData?.data?.[0] ?? null;

  if (plansLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <h1 className="text-2xl font-bold">대시보드</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardSummary plan={activePlan} />
        <TodayTodos nodes={todayNodes} />
      </div>

      <QuickActions hasActivePlan={!!activePlan} activePlanId={activePlan?.id} />

      <RecentFeedback feedback={latestFeedback} planId={activePlan?.id} />
    </div>
  );
}
