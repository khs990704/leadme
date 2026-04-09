import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight } from 'lucide-react';

interface QuickActionsProps {
  hasActivePlan: boolean;
  activePlanId?: string;
}

export function QuickActions({ hasActivePlan, activePlanId }: QuickActionsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {hasActivePlan && activePlanId && (
        <Button asChild className="gap-2">
          <Link to={`/plans/${activePlanId}/kanban`}>
            이어서 학습하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
      <Button asChild variant="outline" className="gap-2">
        <Link to="/plans">
          나의 학습 계획 목록 보기
        </Link>
      </Button>
      <Button asChild variant="outline" className="gap-2">
        <Link to="/plans/new">
          <Plus className="h-4 w-4" />
          새 계획 만들기
        </Link>
      </Button>
    </div>
  );
}
