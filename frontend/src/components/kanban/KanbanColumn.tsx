import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { NodeCard } from './NodeCard';
import type { NodeListItem, NodeStatus } from '@/types/api';

const COLUMN_LABELS: Record<NodeStatus, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
};

const COLUMN_COLORS: Record<NodeStatus, string> = {
  todo: 'border-t-gray-400',
  in_progress: 'border-t-blue-500',
  done: 'border-t-green-500',
};

interface KanbanColumnProps {
  status: NodeStatus;
  nodes: NodeListItem[];
}

export function KanbanColumn({ status, nodes }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const sortedNodes = [...nodes].sort((a, b) => a.order - b.order);
  const nodeIds = sortedNodes.map((n) => n.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border-t-4 bg-muted/30 p-3 min-h-[200px] ${COLUMN_COLORS[status]} ${
        isOver ? 'ring-2 ring-primary/30' : ''
      }`}
      data-testid={`kanban-column-${status}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{COLUMN_LABELS[status]}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {nodes.length}
        </span>
      </div>

      <SortableContext items={nodeIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 flex-1">
          {sortedNodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
