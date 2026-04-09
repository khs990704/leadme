import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, formatMinutes } from '@/lib/utils';
import type { PlanDetailResponse } from '@/types/api';

interface PlanOverviewProps {
  plan: PlanDetailResponse;
}

export function PlanOverview({ plan }: PlanOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{plan.title}</h1>
          <p className="text-sm text-muted-foreground">
            생성일: {formatDate(plan.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/plans/${plan.id}/kanban`}>칸반 보드</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/plans/${plan.id}/feedback`}>피드백</Link>
          </Button>
        </div>
      </div>

      {plan.goals.map((goal) => (
        <Card key={goal.id}>
          <CardHeader>
            <CardTitle className="text-lg">{goal.title}</CardTitle>
            {goal.description && (
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {goal.milestones.map((milestone) => (
              <div key={milestone.id} className="border rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{milestone.title}</h4>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      milestone.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : milestone.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {milestone.status === 'completed'
                      ? '완료'
                      : milestone.status === 'in_progress'
                        ? '진행 중'
                        : '대기'}
                  </span>
                </div>
                {milestone.targetDate && (
                  <p className="text-xs text-muted-foreground">
                    목표일: {milestone.targetDate}
                  </p>
                )}
                <ul className="space-y-1 pl-4">
                  {milestone.nodes.map((node) => (
                    <li key={node.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          node.status === 'done'
                            ? 'bg-green-500'
                            : node.status === 'in_progress'
                              ? 'bg-blue-500'
                              : 'bg-gray-300'
                        }`}
                      />
                      <Link
                        to={`/nodes/${node.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {node.title}
                      </Link>
                      {node.estimatedMinutes && (
                        <span className="text-xs text-muted-foreground">
                          ({formatMinutes(node.estimatedMinutes)})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
