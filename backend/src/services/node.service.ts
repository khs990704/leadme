import { prisma } from '../lib/prisma.js';
import { AppError, NodeStatus } from '../types/index.js';

// ===========================
// Status Transition Rules
// ===========================

const VALID_TRANSITIONS: Record<NodeStatus, NodeStatus[]> = {
  todo: ['in_progress'],
  in_progress: ['todo', 'done'],
  done: ['in_progress'],
};

// ===========================
// Node Queries
// ===========================

export async function getNodesByPlan(
  planId: string,
  userId: string,
  filters: { milestoneId?: string; status?: string | string[] },
) {
  // Verify plan ownership
  const plan = await prisma.studyPlan.findUnique({
    where: { id: planId },
    select: { userId: true },
  });

  if (!plan) throw new AppError(404, 'NOT_FOUND', 'Plan not found');
  if (plan.userId !== userId) throw new AppError(403, 'FORBIDDEN', 'Access denied');

  const statusFilter = filters.status
    ? Array.isArray(filters.status)
      ? { in: filters.status }
      : filters.status
    : undefined;

  const nodes = await prisma.todoNode.findMany({
    where: {
      milestone: {
        goal: { planId },
        ...(filters.milestoneId && { id: filters.milestoneId }),
      },
      ...(statusFilter && { status: statusFilter }),
    },
    include: {
      milestone: { select: { title: true } },
      sessions: {
        where: { status: 'completed' },
        select: { durationMinutes: true },
      },
    },
    orderBy: { order: 'asc' },
  });

  return nodes.map((node) => ({
    id: node.id,
    milestoneId: node.milestoneId,
    milestoneName: node.milestone.title,
    title: node.title,
    status: node.status,
    order: node.order,
    estimatedMinutes: node.estimatedMinutes,
    totalStudiedMinutes: node.sessions.reduce(
      (sum, s) => sum + (s.durationMinutes || 0),
      0,
    ),
    generationBasis: node.generationBasis,
    createdAt: node.createdAt.toISOString(),
    updatedAt: node.updatedAt.toISOString(),
  }));
}

export async function getNodeDetail(nodeId: string, userId: string) {
  const node = await prisma.todoNode.findUnique({
    where: { id: nodeId },
    include: {
      milestone: {
        include: {
          goal: {
            include: {
              plan: { select: { id: true, userId: true } },
            },
          },
        },
      },
      sessions: {
        select: { durationMinutes: true, status: true, id: true, timerType: true, startTime: true },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          reflection: true,
          difficulty: true,
          createdAt: true,
        },
      },
      feedback: {
        where: { scope: 'node' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          summary: true,
          createdAt: true,
        },
      },
    },
  });

  if (!node) {
    throw new AppError(404, 'NOT_FOUND', 'Node not found');
  }

  if (node.milestone.goal.plan.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  const completedSessions = node.sessions.filter((s) => s.status === 'completed');
  const totalStudiedMinutes = completedSessions.reduce(
    (sum, s) => sum + (s.durationMinutes || 0),
    0,
  );

  const activeSession = node.sessions.find((s) => s.status === 'active');

  return {
    id: node.id,
    milestoneId: node.milestoneId,
    milestone: {
      id: node.milestone.id,
      title: node.milestone.title,
      goalId: node.milestone.goalId,
      goalTitle: node.milestone.goal.title,
      planId: node.milestone.goal.planId,
    },
    title: node.title,
    status: node.status,
    order: node.order,
    estimatedMinutes: node.estimatedMinutes,
    generationBasis: node.generationBasis,
    studyGuide: node.studyGuide,
    totalStudiedMinutes,
    activeSession: activeSession
      ? {
          id: activeSession.id,
          timerType: activeSession.timerType,
          startTime: activeSession.startTime.toISOString(),
          status: activeSession.status,
        }
      : null,
    recentReviews: node.reviews.map((r) => ({
      id: r.id,
      reflection: r.reflection,
      difficulty: r.difficulty,
      createdAt: r.createdAt.toISOString(),
    })),
    recentFeedback: node.feedback.map((f) => ({
      id: f.id,
      summary: f.summary,
      createdAt: f.createdAt.toISOString(),
    })),
    createdAt: node.createdAt.toISOString(),
    updatedAt: node.updatedAt.toISOString(),
  };
}

// ===========================
// Node Status Change + Propagation
// ===========================

export async function updateNodeStatus(
  nodeId: string,
  userId: string,
  newStatus: NodeStatus,
) {
  const node = await prisma.todoNode.findUnique({
    where: { id: nodeId },
    include: {
      milestone: {
        include: {
          goal: {
            include: {
              plan: { select: { id: true, userId: true, status: true } },
            },
          },
        },
      },
    },
  });

  if (!node) throw new AppError(404, 'NOT_FOUND', 'Node not found');
  if (node.milestone.goal.plan.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  const currentStatus = node.status as NodeStatus;
  const allowed = VALID_TRANSITIONS[currentStatus];

  if (!allowed.includes(newStatus)) {
    throw new AppError(
      400,
      'INVALID_STATUS_TRANSITION',
      `Cannot transition from '${currentStatus}' to '${newStatus}'`,
    );
  }

  // Update node status
  const updated = await prisma.todoNode.update({
    where: { id: nodeId },
    data: { status: newStatus },
  });

  // Status propagation
  await propagateStatus(node.milestoneId, node.milestone.goalId, node.milestone.goal.planId, newStatus);

  return {
    id: updated.id,
    status: updated.status,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

async function propagateStatus(
  milestoneId: string,
  goalId: string,
  planId: string,
  newNodeStatus: NodeStatus,
) {
  if (newNodeStatus === 'in_progress') {
    // If node is in_progress, set milestone to in_progress if pending
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
    });
    if (milestone && milestone.status === 'pending') {
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: { status: 'in_progress' },
      });
    }
  }

  if (newNodeStatus === 'done') {
    // Check if all nodes in milestone are done
    const milestoneNodes = await prisma.todoNode.findMany({
      where: { milestoneId },
      select: { status: true },
    });

    const allDone = milestoneNodes.every((n) => n.status === 'done');

    if (allDone) {
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: { status: 'completed' },
      });

      // Check if all milestones in plan are completed
      const goal = await prisma.macroGoal.findUnique({
        where: { id: goalId },
        select: { planId: true },
      });

      if (goal) {
        const allMilestones = await prisma.milestone.findMany({
          where: { goal: { planId: goal.planId } },
          select: { status: true },
        });

        const allCompleted = allMilestones.every((m) => m.status === 'completed');

        if (allCompleted) {
          await prisma.studyPlan.update({
            where: { id: planId },
            data: { status: 'completed' },
          });
        }
      }
    }
  }
}

// ===========================
// Node Order Change
// ===========================

export async function updateNodeOrder(
  nodeId: string,
  userId: string,
  newOrder: number,
  newStatus?: NodeStatus,
) {
  const node = await prisma.todoNode.findUnique({
    where: { id: nodeId },
    include: {
      milestone: {
        include: {
          goal: {
            include: {
              plan: { select: { userId: true } },
            },
          },
        },
      },
    },
  });

  if (!node) throw new AppError(404, 'NOT_FOUND', 'Node not found');
  if (node.milestone.goal.plan.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  const targetStatus = newStatus || (node.status as NodeStatus);

  // If status is changing, validate transition
  if (newStatus && newStatus !== node.status) {
    const allowed = VALID_TRANSITIONS[node.status as NodeStatus];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        400,
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from '${node.status}' to '${newStatus}'`,
      );
    }
  }

  // Get all sibling nodes in the same milestone with the target status
  const siblings = await prisma.todoNode.findMany({
    where: {
      milestoneId: node.milestoneId,
      status: targetStatus,
      id: { not: nodeId },
    },
    orderBy: { order: 'asc' },
  });

  // Insert at new position
  const updatedNodes: Array<{ id: string; order: number; status: string }> = [];

  // Recalculate orders
  let orderIndex = 0;
  let inserted = false;
  for (const sibling of siblings) {
    if (orderIndex === newOrder && !inserted) {
      updatedNodes.push({ id: nodeId, order: orderIndex, status: targetStatus });
      orderIndex++;
      inserted = true;
    }
    updatedNodes.push({ id: sibling.id, order: orderIndex, status: sibling.status });
    orderIndex++;
  }

  if (!inserted) {
    updatedNodes.push({ id: nodeId, order: orderIndex, status: targetStatus });
  }

  // Batch update in transaction
  await prisma.$transaction(
    updatedNodes.map((n) =>
      prisma.todoNode.update({
        where: { id: n.id },
        data: { order: n.order, status: n.status },
      }),
    ),
  );

  // Propagate status if changed
  if (newStatus && newStatus !== node.status) {
    await propagateStatus(node.milestoneId, node.milestone.goalId, node.milestone.goal.planId, newStatus);
  }

  return {
    nodes: updatedNodes.map((n) => ({
      id: n.id,
      order: n.order,
      status: n.status as NodeStatus,
    })),
  };
}

// ===========================
// Node Update
// ===========================

export async function updateNode(
  nodeId: string,
  userId: string,
  data: { title?: string; estimatedMinutes?: number | null },
) {
  const node = await prisma.todoNode.findUnique({
    where: { id: nodeId },
    include: {
      milestone: {
        include: {
          goal: {
            include: {
              plan: { select: { userId: true } },
            },
          },
        },
      },
    },
  });

  if (!node) throw new AppError(404, 'NOT_FOUND', 'Node not found');
  if (node.milestone.goal.plan.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  const updated = await prisma.todoNode.update({
    where: { id: nodeId },
    data,
  });

  return {
    id: updated.id,
    milestoneId: updated.milestoneId,
    title: updated.title,
    status: updated.status,
    order: updated.order,
    estimatedMinutes: updated.estimatedMinutes,
    generationBasis: updated.generationBasis,
    studyGuide: updated.studyGuide,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

// ===========================
// Ownership helpers
// ===========================

export async function verifyNodeOwnership(nodeId: string, userId: string) {
  const node = await prisma.todoNode.findUnique({
    where: { id: nodeId },
    include: {
      milestone: {
        include: {
          goal: {
            include: {
              plan: { select: { userId: true } },
            },
          },
        },
      },
    },
  });

  if (!node) throw new AppError(404, 'NOT_FOUND', 'Node not found');
  if (node.milestone.goal.plan.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  return node;
}
