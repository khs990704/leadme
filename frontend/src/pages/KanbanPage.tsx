import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { usePlanDetail, usePlanNodes } from '@/hooks/usePlans';

export function KanbanPage() {
  const { planId } = useParams<{ planId: string }>();
  const { data: plan, isLoading: planLoading } = usePlanDetail(planId ?? '');
  const { data: nodes, isLoading: nodesLoading } = usePlanNodes(planId ?? '');

  const allMilestones =
    plan?.goals.flatMap((g) => g.milestones) ?? [];

  return (
    <div className="space-y-4" data-testid="kanban-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to={`/plans/${planId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{plan?.title ?? '학습 계획'}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to={`/plans/${planId}/feedback`}>
              <MessageSquare className="h-4 w-4" />
              피드백
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to={`/plans/${planId}`}>
              <FileText className="h-4 w-4" />
              계획 상세
            </Link>
          </Button>
        </div>
      </div>

      <KanbanBoard
        nodes={nodes ?? []}
        milestones={allMilestones}
        isLoading={planLoading || nodesLoading}
        planId={planId ?? ''}
      />
    </div>
  );
}
