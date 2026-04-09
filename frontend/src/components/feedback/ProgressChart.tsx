import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FeedbackResponse } from '@/types/api';

interface ProgressChartProps {
  feedbacks: FeedbackResponse[];
}

export function ProgressChart({ feedbacks }: ProgressChartProps) {
  const chartData = feedbacks
    .filter((f) => f.progressAnalysis)
    .map((f, i) => ({
      name: `#${i + 1}`,
      expected: f.progressAnalysis?.expected ?? 0,
      actual: f.progressAnalysis?.actual ?? 0,
    }))
    .reverse();

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">진행률 차트</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            피드백 데이터가 충분하지 않습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">예상 vs 실제 진행률</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="expected" fill="hsl(215, 20%, 65%)" name="예상" />
            <Bar dataKey="actual" fill="hsl(221, 83%, 53%)" name="실제" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
