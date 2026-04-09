import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatMinutes } from '@/lib/utils';
import type { GeneratePlanResponse } from '@/types/api';

interface PlanPreviewProps {
  preview: GeneratePlanResponse;
  onConfirm: () => void;
  onRefine: () => void;
  onRegenerate: () => void;
  isConfirming: boolean;
}

export function PlanPreview({
  preview,
  onConfirm,
  onRefine,
  onRegenerate,
  isConfirming,
}: PlanPreviewProps) {
  return (
    <div className="space-y-6" data-testid="plan-preview">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">생성된 학습 계획 (초안)</h2>
        <Button variant="outline" size="sm" onClick={onRefine}>
          정밀화하기
        </Button>
      </div>

      {preview.macroGoals.map((goal) => (
        <div key={goal.id} className="space-y-3">
          <h3 className="font-semibold text-lg">
            Macro Goal: {goal.title}
          </h3>
          {goal.description && (
            <p className="text-sm text-muted-foreground">{goal.description}</p>
          )}

          {goal.milestones.map((milestone) => (
            <Card key={milestone.id} className="ml-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{milestone.title}</span>
                  {milestone.targetDate && (
                    <span className="text-xs text-muted-foreground font-normal">
                      목표일: {milestone.targetDate}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {milestone.todos.map((todo) => (
                    <li
                      key={todo.id}
                      className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                    >
                      <span>{todo.title}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatMinutes(todo.estimatedMinutes)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onRegenerate}>
          다시 생성
        </Button>
        <Button onClick={onConfirm} disabled={isConfirming}>
          {isConfirming ? '확정 중...' : '이 계획으로 시작하기'}
        </Button>
      </div>
    </div>
  );
}
