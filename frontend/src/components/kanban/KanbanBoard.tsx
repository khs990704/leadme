import { useCallback, useState, useMemo } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { MilestoneFilter } from './MilestoneFilter';
import { KanbanSkeleton } from './KanbanSkeleton';
import { useUpdateNodeOrder } from '@/hooks/useNodes';
import type { NodeListItem, NodeStatus, MilestoneWithChildren } from '@/types/api';

interface KanbanBoardProps {
  nodes: NodeListItem[];
  milestones: MilestoneWithChildren[];
  isLoading: boolean;
  planId: string;
}

const STATUSES: NodeStatus[] = ['todo', 'in_progress', 'done'];

const VALID_TRANSITIONS: Record<NodeStatus, NodeStatus[]> = {
  todo: ['in_progress'],
  in_progress: ['todo', 'done'],
  done: ['in_progress'],
};

export function KanbanBoard({ nodes, milestones, isLoading, planId: _planId }: KanbanBoardProps) {
  const [milestoneFilter, setMilestoneFilter] = useState<string | null>(null);
  const updateOrder = useUpdateNodeOrder();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredNodes = useMemo(() => {
    if (!milestoneFilter) return nodes;
    return nodes.filter((n) => n.milestoneId === milestoneFilter);
  }, [nodes, milestoneFilter]);

  const columnNodes = useMemo(() => {
    const map: Record<NodeStatus, NodeListItem[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    filteredNodes.forEach((node) => {
      map[node.status].push(node);
    });
    return map;
  }, [filteredNodes]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const nodeId = active.id as string;
      const activeNode = nodes.find((n) => n.id === nodeId);
      if (!activeNode) return;

      // Determine target status
      let targetStatus: NodeStatus;
      if (STATUSES.includes(over.id as NodeStatus)) {
        targetStatus = over.id as NodeStatus;
      } else {
        const overNode = nodes.find((n) => n.id === over.id);
        if (!overNode) return;
        targetStatus = overNode.status;
      }

      // Validate status transition
      const currentStatus = activeNode.status;
      if (currentStatus !== targetStatus && !VALID_TRANSITIONS[currentStatus].includes(targetStatus)) {
        alert(`"${currentStatus}" 상태에서 "${targetStatus}" 상태로 이동할 수 없습니다.`);
        return;
      }

      // Determine order
      const targetColumnNodes = columnNodes[targetStatus];
      const overIndex = targetColumnNodes.findIndex((n) => n.id === over.id);
      const newOrder = overIndex >= 0 ? overIndex : targetColumnNodes.length;

      updateOrder.mutate(
        {
          nodeId,
          data: { order: newOrder, status: targetStatus },
        },
        {
          onError: (error) => {
            alert(`노드 이동에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
          },
        }
      );
    },
    [nodes, columnNodes, updateOrder]
  );

  if (isLoading) {
    return <KanbanSkeleton />;
  }

  return (
    <div className="space-y-4" data-testid="kanban-board">
      <div className="flex items-center gap-4">
        <MilestoneFilter
          milestones={milestones}
          value={milestoneFilter}
          onChange={setMilestoneFilter}
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUSES.map((status) => (
            <KanbanColumn key={status} status={status} nodes={columnNodes[status]} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
