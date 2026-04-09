import { prisma } from '../lib/prisma.js';
import { AppError, PlanParams } from '../types/index.js';
import { generateFeedback } from './ai.service.js';
import { CoachContext } from '../prompts/coach.js';

export async function generateNodeFeedback(nodeId: string, userId: string) {
  const node = await prisma.todoNode.findUnique({
    where: { id: nodeId },
    include: {
      milestone: {
        include: {
          goal: {
            include: {
              plan: { select: { id: true, userId: true, title: true, params: true } },
            },
          },
        },
      },
      sessions: {
        where: { status: 'completed' },
        select: { durationMinutes: true },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!node) throw new AppError(404, 'NOT_FOUND', 'Node not found');
  if (node.milestone.goal.plan.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  // Get session logs for this node
  const sessionLogs = await prisma.sessionLog.findMany({
    where: {
      session: { nodeId },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const totalStudiedMinutes = node.sessions.reduce(
    (sum, s) => sum + (s.durationMinutes || 0),
    0,
  );

  const params = node.milestone.goal.plan.params as PlanParams | null;

  const context: CoachContext = {
    scope: 'node',
    planTitle: node.milestone.goal.plan.title,
    managementStyle: params?.managementStyle || null,
    nodeTitle: node.title,
    nodeStatus: node.status,
    totalStudiedMinutes,
    estimatedMinutes: node.estimatedMinutes,
    sessionLogs: sessionLogs.map((l) => ({
      progressPercent: l.progressPercent,
      focusLevel: l.focusLevel,
      distractionType: l.distractionType,
      note: l.note,
    })),
    reviews: node.reviews.map((r) => ({
      reflection: r.reflection,
      difficulty: r.difficulty,
      distraction: r.distraction,
      improvement: r.improvement,
    })),
  };

  const aiResult = await generateFeedback(context);

  const feedback = await prisma.feedback.create({
    data: {
      nodeId,
      userId,
      scope: 'node',
      summary: aiResult.summary,
      progressAnalysis: aiResult.progressAnalysis as object | null,
      suggestions: aiResult.suggestions,
      motivationMessage: aiResult.motivationMessage,
    },
  });

  return {
    id: feedback.id,
    nodeId: feedback.nodeId,
    planId: feedback.planId,
    userId: feedback.userId,
    scope: feedback.scope,
    summary: feedback.summary,
    progressAnalysis: feedback.progressAnalysis,
    suggestions: feedback.suggestions,
    motivationMessage: feedback.motivationMessage,
    createdAt: feedback.createdAt.toISOString(),
  };
}

export async function generatePlanFeedback(planId: string, userId: string) {
  const plan = await prisma.studyPlan.findUnique({
    where: { id: planId },
    include: {
      goals: {
        include: {
          milestones: {
            include: {
              nodes: { select: { status: true } },
            },
          },
        },
      },
    },
  });

  if (!plan) throw new AppError(404, 'NOT_FOUND', 'Plan not found');
  if (plan.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  const allNodes = plan.goals.flatMap((g) =>
    g.milestones.flatMap((m) => m.nodes),
  );

  const params = plan.params as PlanParams | null;

  const milestones = plan.goals.flatMap((g) =>
    g.milestones.map((m) => ({
      title: m.title,
      status: m.status,
      nodeCount: m.nodes.length,
      doneCount: m.nodes.filter((n) => n.status === 'done').length,
    })),
  );

  const context: CoachContext = {
    scope: 'plan',
    planTitle: plan.title,
    managementStyle: params?.managementStyle || null,
    totalNodes: allNodes.length,
    doneNodes: allNodes.filter((n) => n.status === 'done').length,
    inProgressNodes: allNodes.filter((n) => n.status === 'in_progress').length,
    todoNodes: allNodes.filter((n) => n.status === 'todo').length,
    milestones,
  };

  const aiResult = await generateFeedback(context);

  const feedback = await prisma.feedback.create({
    data: {
      planId,
      userId,
      scope: 'plan',
      summary: aiResult.summary,
      progressAnalysis: aiResult.progressAnalysis as object | null,
      suggestions: aiResult.suggestions,
      motivationMessage: aiResult.motivationMessage,
    },
  });

  return {
    id: feedback.id,
    nodeId: feedback.nodeId,
    planId: feedback.planId,
    userId: feedback.userId,
    scope: feedback.scope,
    summary: feedback.summary,
    progressAnalysis: feedback.progressAnalysis,
    suggestions: feedback.suggestions,
    motivationMessage: feedback.motivationMessage,
    createdAt: feedback.createdAt.toISOString(),
  };
}

export async function getNodeFeedback(
  nodeId: string,
  userId: string,
  options: { page: number; limit: number; sort: string; order: 'asc' | 'desc' },
) {
  // Verify ownership
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

  const where = { nodeId, scope: 'node' };

  const [feedbacks, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { [options.sort]: options.order },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.feedback.count({ where }),
  ]);

  return {
    data: feedbacks.map((f) => ({
      id: f.id,
      nodeId: f.nodeId,
      planId: f.planId,
      userId: f.userId,
      scope: f.scope,
      summary: f.summary,
      progressAnalysis: f.progressAnalysis,
      suggestions: f.suggestions,
      motivationMessage: f.motivationMessage,
      createdAt: f.createdAt.toISOString(),
    })),
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
}

export async function getPlanFeedback(
  planId: string,
  userId: string,
  options: { page: number; limit: number; sort: string; order: 'asc' | 'desc' },
) {
  const plan = await prisma.studyPlan.findUnique({
    where: { id: planId },
    select: { userId: true },
  });

  if (!plan) throw new AppError(404, 'NOT_FOUND', 'Plan not found');
  if (plan.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  const where = { planId, scope: 'plan' };

  const [feedbacks, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { [options.sort]: options.order },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.feedback.count({ where }),
  ]);

  return {
    data: feedbacks.map((f) => ({
      id: f.id,
      nodeId: f.nodeId,
      planId: f.planId,
      userId: f.userId,
      scope: f.scope,
      summary: f.summary,
      progressAnalysis: f.progressAnalysis,
      suggestions: f.suggestions,
      motivationMessage: f.motivationMessage,
      createdAt: f.createdAt.toISOString(),
    })),
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
}
