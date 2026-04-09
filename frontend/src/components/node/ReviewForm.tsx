import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateReview } from '@/hooks/useReviews';

interface ReviewFormProps {
  nodeId: string;
}

export function ReviewForm({ nodeId }: ReviewFormProps) {
  const [reflection, setReflection] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [distraction, setDistraction] = useState('');
  const [improvement, setImprovement] = useState('');

  const createReview = useCreateReview(nodeId);

  const handleSubmit = useCallback(async () => {
    const hasContent = reflection || difficulty || distraction || improvement;
    if (!hasContent) return;

    try {
      await createReview.mutateAsync({
        reflection: reflection || null,
        difficulty: difficulty || null,
        distraction: distraction || null,
        improvement: improvement || null,
      });

      setReflection('');
      setDifficulty('');
      setDistraction('');
      setImprovement('');
    } catch {
      // error handled
    }
  }, [reflection, difficulty, distraction, improvement, createReview]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="reflection">회고</Label>
          <Textarea
            id="reflection"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="오늘 학습에 대한 회고..."
            rows={2}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="difficulty">어려웠던 점</Label>
          <Textarea
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            placeholder="이해가 어려웠던 부분..."
            rows={2}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="distraction-review">방해 요소</Label>
          <Textarea
            id="distraction-review"
            value={distraction}
            onChange={(e) => setDistraction(e.target.value)}
            placeholder="학습을 방해한 요소..."
            rows={2}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="improvement">다음 보완점</Label>
          <Textarea
            id="improvement"
            value={improvement}
            onChange={(e) => setImprovement(e.target.value)}
            placeholder="다음에 개선할 점..."
            rows={2}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={
            createReview.isPending ||
            (!reflection && !difficulty && !distraction && !improvement)
          }
          className="w-full"
          size="sm"
        >
          {createReview.isPending ? '저장 중...' : '리뷰 저장'}
        </Button>
      </CardContent>
    </Card>
  );
}
