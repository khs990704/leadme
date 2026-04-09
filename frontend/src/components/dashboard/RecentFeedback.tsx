import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { FeedbackResponse } from '@/types/api';

interface RecentFeedbackProps {
  feedback: FeedbackResponse | null;
  planId?: string;
}

export function RecentFeedback({ feedback, planId }: RecentFeedbackProps) {
  if (!feedback) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">최근 피드백</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          &quot;{feedback.summary}&quot;
        </p>
        {planId && (
          <Button asChild variant="link" size="sm" className="px-0">
            <Link to={`/plans/${planId}/feedback`}>자세히 보기</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
