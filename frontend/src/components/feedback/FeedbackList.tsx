import { FeedbackCard } from './FeedbackCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { FeedbackResponse } from '@/types/api';

interface FeedbackListProps {
  feedbacks: FeedbackResponse[];
  isLoading: boolean;
}

export function FeedbackList({ feedbacks, isLoading }: FeedbackListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        아직 피드백이 없습니다. 학습을 진행한 후 피드백을 받아보세요.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => (
        <FeedbackCard key={feedback.id} feedback={feedback} />
      ))}
    </div>
  );
}
