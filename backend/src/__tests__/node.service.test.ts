import { describe, it, expect, vi, beforeEach } from 'vitest';

// ===========================
// Node Status Transition Rules
// ===========================

// Extracted transition map for unit testing without DB dependency
const VALID_TRANSITIONS: Record<string, string[]> = {
  todo: ['in_progress'],
  in_progress: ['todo', 'done'],
  done: ['in_progress'],
};

function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

describe('Node Status Transition Rules', () => {
  describe('allowed transitions', () => {
    it('should allow todo -> in_progress', () => {
      expect(isValidTransition('todo', 'in_progress')).toBe(true);
    });

    it('should allow in_progress -> todo (rollback)', () => {
      expect(isValidTransition('in_progress', 'todo')).toBe(true);
    });

    it('should allow in_progress -> done', () => {
      expect(isValidTransition('in_progress', 'done')).toBe(true);
    });

    it('should allow done -> in_progress (re-study)', () => {
      expect(isValidTransition('done', 'in_progress')).toBe(true);
    });
  });

  describe('blocked transitions', () => {
    it('should block todo -> done (skip in_progress)', () => {
      expect(isValidTransition('todo', 'done')).toBe(false);
    });

    it('should block done -> todo (skip in_progress)', () => {
      expect(isValidTransition('done', 'todo')).toBe(false);
    });

    it('should block same status transition todo -> todo', () => {
      expect(isValidTransition('todo', 'todo')).toBe(false);
    });

    it('should block same status transition done -> done', () => {
      expect(isValidTransition('done', 'done')).toBe(false);
    });

    it('should block invalid source status', () => {
      expect(isValidTransition('invalid', 'todo')).toBe(false);
    });
  });
});

// ===========================
// Milestone Status Propagation Logic
// ===========================

describe('Milestone Status Propagation', () => {
  function shouldMilestoneBeCompleted(nodeStatuses: string[]): boolean {
    return nodeStatuses.length > 0 && nodeStatuses.every((s) => s === 'done');
  }

  function shouldMilestoneBeInProgress(
    currentMilestoneStatus: string,
    newNodeStatus: string,
  ): boolean {
    return currentMilestoneStatus === 'pending' && newNodeStatus === 'in_progress';
  }

  it('should complete milestone when all nodes are done', () => {
    expect(shouldMilestoneBeCompleted(['done', 'done', 'done'])).toBe(true);
  });

  it('should not complete milestone when some nodes are not done', () => {
    expect(shouldMilestoneBeCompleted(['done', 'in_progress', 'done'])).toBe(false);
  });

  it('should not complete milestone when some nodes are todo', () => {
    expect(shouldMilestoneBeCompleted(['done', 'done', 'todo'])).toBe(false);
  });

  it('should not complete milestone with empty nodes', () => {
    expect(shouldMilestoneBeCompleted([])).toBe(false);
  });

  it('should transition milestone from pending to in_progress', () => {
    expect(shouldMilestoneBeInProgress('pending', 'in_progress')).toBe(true);
  });

  it('should not transition milestone if already in_progress', () => {
    expect(shouldMilestoneBeInProgress('in_progress', 'in_progress')).toBe(false);
  });

  it('should not transition milestone if not triggered by in_progress', () => {
    expect(shouldMilestoneBeInProgress('pending', 'done')).toBe(false);
  });
});

// ===========================
// Plan Completion Propagation Logic
// ===========================

describe('Plan Completion Propagation', () => {
  function shouldPlanBeCompleted(milestoneStatuses: string[]): boolean {
    return (
      milestoneStatuses.length > 0 &&
      milestoneStatuses.every((s) => s === 'completed')
    );
  }

  it('should complete plan when all milestones are completed', () => {
    expect(shouldPlanBeCompleted(['completed', 'completed', 'completed'])).toBe(true);
  });

  it('should not complete plan when some milestones are in_progress', () => {
    expect(shouldPlanBeCompleted(['completed', 'in_progress'])).toBe(false);
  });

  it('should not complete plan when some milestones are pending', () => {
    expect(shouldPlanBeCompleted(['completed', 'pending'])).toBe(false);
  });

  it('should not complete plan with no milestones', () => {
    expect(shouldPlanBeCompleted([])).toBe(false);
  });
});

// ===========================
// Node Order Reordering Logic
// ===========================

describe('Node Order Reordering', () => {
  interface NodeOrder {
    id: string;
    order: number;
  }

  function reorderNodes(
    siblings: NodeOrder[],
    nodeId: string,
    newOrder: number,
  ): NodeOrder[] {
    const result: NodeOrder[] = [];
    const filteredSiblings = siblings.filter((s) => s.id !== nodeId);

    let orderIndex = 0;
    let inserted = false;

    for (const sibling of filteredSiblings) {
      if (orderIndex === newOrder && !inserted) {
        result.push({ id: nodeId, order: orderIndex });
        orderIndex++;
        inserted = true;
      }
      result.push({ id: sibling.id, order: orderIndex });
      orderIndex++;
    }

    if (!inserted) {
      result.push({ id: nodeId, order: orderIndex });
    }

    return result;
  }

  it('should insert node at beginning', () => {
    const siblings = [
      { id: 'a', order: 0 },
      { id: 'b', order: 1 },
      { id: 'c', order: 2 },
    ];

    const result = reorderNodes(siblings, 'new', 0);

    expect(result[0]).toEqual({ id: 'new', order: 0 });
    expect(result[1]).toEqual({ id: 'a', order: 1 });
    expect(result[2]).toEqual({ id: 'b', order: 2 });
    expect(result[3]).toEqual({ id: 'c', order: 3 });
  });

  it('should insert node at end', () => {
    const siblings = [
      { id: 'a', order: 0 },
      { id: 'b', order: 1 },
    ];

    const result = reorderNodes(siblings, 'new', 5);

    expect(result.length).toBe(3);
    expect(result[2]).toEqual({ id: 'new', order: 2 });
  });

  it('should insert node in middle', () => {
    const siblings = [
      { id: 'a', order: 0 },
      { id: 'b', order: 1 },
      { id: 'c', order: 2 },
    ];

    const result = reorderNodes(siblings, 'new', 1);

    expect(result[0]).toEqual({ id: 'a', order: 0 });
    expect(result[1]).toEqual({ id: 'new', order: 1 });
    expect(result[2]).toEqual({ id: 'b', order: 2 });
    expect(result[3]).toEqual({ id: 'c', order: 3 });
  });

  it('should handle empty siblings', () => {
    const result = reorderNodes([], 'new', 0);

    expect(result).toEqual([{ id: 'new', order: 0 }]);
  });

  it('should handle reordering existing node', () => {
    const siblings = [
      { id: 'a', order: 0 },
      { id: 'b', order: 1 },
      { id: 'c', order: 2 },
    ];

    const result = reorderNodes(siblings, 'a', 2);

    expect(result[0]).toEqual({ id: 'b', order: 0 });
    expect(result[1]).toEqual({ id: 'c', order: 1 });
    expect(result[2]).toEqual({ id: 'a', order: 2 });
  });
});
