import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { PlanListItem } from '@/types/api';

interface PlanCardProps {
  plan: PlanListItem;
}

export function PlanCard({ plan }: PlanCardProps) {
  const linkTo =
    plan.status === 'draft' ? `/plans/new?planId=${plan.id}` : `/plans/${plan.id}/kanban`;

  return (
    <Card data-testid={`plan-card-${plan.id}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{plan.title}</h3>
            {plan.lastStudiedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                최근 학습: {formatRelativeTime(plan.lastStudiedAt)}
              </p>
            )}
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              plan.status === 'active'
                ? 'bg-green-100 text-green-700'
                : plan.status === 'completed'
                  ? 'bg-blue-100 text-blue-700'
                  : plan.status === 'archived'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {plan.status === 'active'
              ? '진행 중'
              : plan.status === 'completed'
                ? '완료됨'
                : plan.status === 'archived'
                  ? '보관됨'
                  : '초안'}
          </span>
        </div>

        {plan.status !== 'draft' && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">진행률</span>
              <span>{plan.progress.percentage}%</span>
            </div>
            <Progress value={plan.progress.percentage} className="h-2" />
          </div>
        )}

        <Button asChild variant="ghost" size="sm" className="gap-1 w-full">
          <Link to={linkTo}>
            {plan.status === 'draft' ? '계획 계속 만들기' : '이어서 학습하기'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
