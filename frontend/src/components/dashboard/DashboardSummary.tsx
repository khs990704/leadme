import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { PlanListItem } from '@/types/api';

interface DashboardSummaryProps {
  plan: PlanListItem | null;
}

export function DashboardSummary({ plan }: DashboardSummaryProps) {
  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">활성 계획</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            아직 진행 중인 학습 계획이 없습니다.
          </p>
          <Button asChild>
            <Link to="/plans/new">새 학습 계획 만들기</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">활성 계획</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <h3 className="font-semibold">{plan.title}</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">진행률</span>
            <span className="font-medium">{plan.progress.percentage}%</span>
          </div>
          <Progress value={plan.progress.percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {plan.progress.doneNodes} / {plan.progress.totalNodes} 완료
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={`/plans/${plan.id}/kanban`}>계획 보기</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
