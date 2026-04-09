import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import { GripVertical, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatMinutes } from '@/lib/utils';
import type { NodeListItem } from '@/types/api';

interface NodeCardProps {
  node: NodeListItem;
}

export function NodeCard({ node }: NodeCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    data: { node },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const progressPercent =
    node.estimatedMinutes && node.estimatedMinutes > 0
      ? Math.min(100, Math.round((node.totalStudiedMinutes / node.estimatedMinutes) * 100))
      : 0;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="cursor-grab active:cursor-grabbing" data-testid={`node-card-${node.id}`}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 text-muted-foreground hover:text-foreground touch-none"
              aria-label="드래그하여 이동"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <Link
              to={`/nodes/${node.id}`}
              className="flex-1 text-sm font-medium hover:text-primary transition-colors"
            >
              {node.title}
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {node.estimatedMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatMinutes(node.estimatedMinutes)}
              </span>
            )}
          </div>

          {node.status !== 'todo' && (
            <div className="space-y-1">
              <Progress value={progressPercent} className="h-1.5" />
              <p className="text-xs text-muted-foreground text-right">{progressPercent}%</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
