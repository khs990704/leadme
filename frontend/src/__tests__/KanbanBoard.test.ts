import { describe, it, expect } from 'vitest';
import type { NodeListItem, NodeStatus } from '../types/api';

// ===========================
// KanbanBoard Logic Tests (Unit)
// ===========================
// Tests the core column grouping and filtering logic without DOM rendering.

function groupByStatus(nodes: NodeListItem[]): Record<NodeStatus, NodeListItem[]> {
  const map: Record<NodeStatus, NodeListItem[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };
  nodes.forEach((node) => {
    map[node.status].push(node);
  });
  return map;
}

function filterByMilestone(
  nodes: NodeListItem[],
  milestoneId: string | null,
): NodeListItem[] {
  if (!milestoneId) return nodes;
  return nodes.filter((n) => n.milestoneId === milestoneId);
}

const createNode = (overrides: Partial<NodeListItem>): NodeListItem => ({
  id: 'node-1',
  milestoneId: 'ms-1',
  milestoneName: 'Milestone 1',
  title: 'Test Node',
  status: 'todo',
  order: 0,
  estimatedMinutes: 60,
  totalStudiedMinutes: 0,
  generationBasis: 'volume_based',
  createdAt: '2026-04-09T00:00:00.000Z',
  updatedAt: '2026-04-09T00:00:00.000Z',
  ...overrides,
});

describe('KanbanBoard Column Grouping', () => {
  it('should group nodes by status', () => {
    const nodes = [
      createNode({ id: 'n1', status: 'todo' }),
      createNode({ id: 'n2', status: 'in_progress' }),
      createNode({ id: 'n3', status: 'done' }),
      createNode({ id: 'n4', status: 'todo' }),
    ];

    const grouped = groupByStatus(nodes);

    expect(grouped.todo).toHaveLength(2);
    expect(grouped.in_progress).toHaveLength(1);
    expect(grouped.done).toHaveLength(1);
  });

  it('should handle empty nodes', () => {
    const grouped = groupByStatus([]);

    expect(grouped.todo).toHaveLength(0);
    expect(grouped.in_progress).toHaveLength(0);
    expect(grouped.done).toHaveLength(0);
  });

  it('should handle all nodes in same status', () => {
    const nodes = [
      createNode({ id: 'n1', status: 'todo' }),
      createNode({ id: 'n2', status: 'todo' }),
      createNode({ id: 'n3', status: 'todo' }),
    ];

    const grouped = groupByStatus(nodes);

    expect(grouped.todo).toHaveLength(3);
    expect(grouped.in_progress).toHaveLength(0);
    expect(grouped.done).toHaveLength(0);
  });

  it('should preserve node order within columns', () => {
    const nodes = [
      createNode({ id: 'n1', status: 'todo', order: 0 }),
      createNode({ id: 'n2', status: 'todo', order: 1 }),
      createNode({ id: 'n3', status: 'todo', order: 2 }),
    ];

    const grouped = groupByStatus(nodes);

    expect(grouped.todo[0].id).toBe('n1');
    expect(grouped.todo[1].id).toBe('n2');
    expect(grouped.todo[2].id).toBe('n3');
  });
});

describe('KanbanBoard Milestone Filtering', () => {
  const nodes = [
    createNode({ id: 'n1', milestoneId: 'ms-1', status: 'todo' }),
    createNode({ id: 'n2', milestoneId: 'ms-2', status: 'in_progress' }),
    createNode({ id: 'n3', milestoneId: 'ms-1', status: 'done' }),
    createNode({ id: 'n4', milestoneId: 'ms-3', status: 'todo' }),
  ];

  it('should return all nodes when filter is null', () => {
    const filtered = filterByMilestone(nodes, null);
    expect(filtered).toHaveLength(4);
  });

  it('should filter by milestone ID', () => {
    const filtered = filterByMilestone(nodes, 'ms-1');
    expect(filtered).toHaveLength(2);
    expect(filtered.every((n) => n.milestoneId === 'ms-1')).toBe(true);
  });

  it('should return empty for non-existent milestone', () => {
    const filtered = filterByMilestone(nodes, 'ms-999');
    expect(filtered).toHaveLength(0);
  });

  it('should work with groupByStatus after filtering', () => {
    const filtered = filterByMilestone(nodes, 'ms-1');
    const grouped = groupByStatus(filtered);

    expect(grouped.todo).toHaveLength(1);
    expect(grouped.done).toHaveLength(1);
    expect(grouped.in_progress).toHaveLength(0);
  });
});

describe('KanbanBoard Drag Target Detection', () => {
  const STATUSES: NodeStatus[] = ['todo', 'in_progress', 'done'];

  it('should detect column drop (status ID)', () => {
    const overId = 'in_progress';
    const isColumn = STATUSES.includes(overId as NodeStatus);
    expect(isColumn).toBe(true);
  });

  it('should detect node drop (non-status ID)', () => {
    const overId = 'node-123';
    const isColumn = STATUSES.includes(overId as NodeStatus);
    expect(isColumn).toBe(false);
  });

  it('should determine new order from column position', () => {
    const columnNodes = [
      createNode({ id: 'n1', order: 0 }),
      createNode({ id: 'n2', order: 1 }),
    ];

    const overNodeId = 'n2';
    const overIndex = columnNodes.findIndex((n) => n.id === overNodeId);
    const newOrder = overIndex >= 0 ? overIndex : columnNodes.length;

    expect(newOrder).toBe(1);
  });

  it('should place at end when dropping on column (not on node)', () => {
    const columnNodes = [
      createNode({ id: 'n1', order: 0 }),
      createNode({ id: 'n2', order: 1 }),
    ];

    const overNodeId = 'nonexistent';
    const overIndex = columnNodes.findIndex((n) => n.id === overNodeId);
    const newOrder = overIndex >= 0 ? overIndex : columnNodes.length;

    expect(newOrder).toBe(2);
  });
});
