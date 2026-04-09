import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNodeFeedback, useGenerateFeedback } from '@/hooks/useFeedback';
import { formatRelativeTime } from '@/lib/utils';

interface NodeFeedbackProps {
  nodeId: string;
}

export function NodeFeedback({ nodeId }: NodeFeedbackProps) {
  const { data: feedbackData } = useNodeFeedback(nodeId);
  const generateFeedback = useGenerateFeedback();

  const latestFeedback = feedbackData?.data?.[0];

  const handleGenerate = () => {
    generateFeedback.mutate({ nodeId, scope: 'node' });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">AI 피드백</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generateFeedback.isPending}
        >
          {generateFeedback.isPending ? '생성 중...' : '피드백 새로 받기'}
        </Button>
      </CardHeader>
      <CardContent>
        {generateFeedback.data ? (
          <div className="space-y-2 text-sm">
            <p>{generateFeedback.data.summary}</p>
            {generateFeedback.data.suggestions.length > 0 && (
              <ul className="list-disc list-inside text-muted-foreground">
                {generateFeedback.data.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
            {generateFeedback.data.motivationMessage && (
              <p className="text-primary italic">{generateFeedback.data.motivationMessage}</p>
            )}
          </div>
        ) : latestFeedback ? (
          <div className="space-y-2 text-sm">
            <p>{latestFeedback.summary}</p>
            {latestFeedback.suggestions.length > 0 && (
              <ul className="list-disc list-inside text-muted-foreground">
                {latestFeedback.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
            {latestFeedback.motivationMessage && (
              <p className="text-primary italic">{latestFeedback.motivationMessage}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(latestFeedback.createdAt)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            아직 피드백이 없습니다. 학습 후 피드백을 받아보세요.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
