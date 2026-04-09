import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackList } from '@/components/feedback/FeedbackList';
import { ProgressChart } from '@/components/feedback/ProgressChart';
import { usePlanFeedback, useGenerateFeedback } from '@/hooks/useFeedback';
import { usePlanDetail } from '@/hooks/usePlans';

export function FeedbackPage() {
  const { planId } = useParams<{ planId: string }>();
  const { data: plan } = usePlanDetail(planId ?? '');
  const { data: feedbackData, isLoading } = usePlanFeedback(planId ?? '');
  const generateFeedback = useGenerateFeedback();

  const feedbacks = feedbackData?.data ?? [];

  const handleGenerate = () => {
    if (!planId) return;
    generateFeedback.mutate({ planId, scope: 'plan' });
  };

  return (
    <div className="space-y-6" data-testid="feedback-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to={`/plans/${planId}/kanban`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">
            {plan?.title ?? '학습 계획'} - 피드백 리포트
          </h1>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generateFeedback.isPending}
          size="sm"
        >
          {generateFeedback.isPending ? '생성 중...' : '새 피드백 받기'}
        </Button>
      </div>

      <ProgressChart feedbacks={feedbacks} />

      <FeedbackList feedbacks={feedbacks} isLoading={isLoading} />
    </div>
  );
}
