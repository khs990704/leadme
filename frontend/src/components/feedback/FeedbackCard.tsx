import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';
import type { FeedbackResponse } from '@/types/api';

interface FeedbackCardProps {
  feedback: FeedbackResponse;
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <Card data-testid={`feedback-card-${feedback.id}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {feedback.scope === 'node' ? '노드 피드백' : '계획 피드백'}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(feedback.createdAt)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{feedback.summary}</p>

        {feedback.progressAnalysis && (
          <div className="rounded-md bg-muted p-3 space-y-1">
            <p className="font-medium">진행 분석</p>
            <div className="flex gap-4 text-xs">
              <span>예상: {feedback.progressAnalysis.expected}%</span>
              <span>실제: {feedback.progressAnalysis.actual}%</span>
              <span
                className={
                  feedback.progressAnalysis.gap >= 0 ? 'text-green-600' : 'text-red-600'
                }
              >
                차이: {feedback.progressAnalysis.gap > 0 ? '+' : ''}
                {feedback.progressAnalysis.gap}%
              </span>
            </div>
          </div>
        )}

        {feedback.suggestions.length > 0 && (
          <div>
            <p className="font-medium mb-1">제안</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              {feedback.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {feedback.motivationMessage && (
          <p className="text-primary italic border-l-2 border-primary pl-3">
            {feedback.motivationMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
