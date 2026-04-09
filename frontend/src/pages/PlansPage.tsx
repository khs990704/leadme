import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanList } from '@/components/plan/PlanList';
import { usePlans } from '@/hooks/usePlans';

export function PlansPage() {
  const { data: plansData, isLoading } = usePlans();

  const plans = plansData?.data ?? [];

  return (
    <div className="space-y-6" data-testid="plans-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">나의 학습 계획</h1>
        <Button asChild className="gap-2">
          <Link to="/plans/new">
            <Plus className="h-4 w-4" />
            새 학습 계획 만들기
          </Link>
        </Button>
      </div>

      <PlanList plans={plans} isLoading={isLoading} />
    </div>
  );
}
