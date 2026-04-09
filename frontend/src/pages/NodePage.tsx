import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StudyGuide } from '@/components/node/StudyGuide';
import { FocusTimer } from '@/components/node/FocusTimer';
import { StatusRecorder } from '@/components/node/StatusRecorder';
import { ReviewForm } from '@/components/node/ReviewForm';
import { NodeFeedback } from '@/components/node/NodeFeedback';
import { useNodeDetail } from '@/hooks/useNodes';
import { formatMinutes } from '@/lib/utils';
import type { NodeStatus } from '@/types/api';

const STATUS_LABELS: Record<NodeStatus, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
};

const STATUS_COLORS: Record<NodeStatus, string> = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
};

export function NodePage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const { data: node, isLoading, error } = useNodeDetail(nodeId ?? '');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !node) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">노드를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="node-page">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1 mb-2">
          <Link to={`/plans/${node.milestone.planId}/kanban`}>
            <ArrowLeft className="h-4 w-4" />
            칸반으로
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{node.title}</h1>
          <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[node.status]}`}>
            {STATUS_LABELS[node.status]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {node.estimatedMinutes ? `예상: ${formatMinutes(node.estimatedMinutes)}` : ''}
          {node.estimatedMinutes && node.milestone.title ? ' | ' : ''}
          Milestone: {node.milestone.title}
        </p>
      </div>

      {/* Study Guide */}
      <StudyGuide guide={node.studyGuide} />

      {/* Focus Timer */}
      <FocusTimer nodeId={node.id} />

      {/* Status Recorder */}
      <StatusRecorder />

      {/* Review */}
      <ReviewForm nodeId={node.id} />

      {/* AI Feedback */}
      <NodeFeedback nodeId={node.id} />
    </div>
  );
}
