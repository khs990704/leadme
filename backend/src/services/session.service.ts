import { prisma } from '../lib/prisma';
import { AppError } from '../types/index';

export async function createSession(
  userId: string,
  nodeId: string,
  timerType: string,
) {
  // Verify node exists and user owns it
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

  // Check for active session on this node
  const activeSession = await prisma.studySession.findFirst({
    where: { nodeId, status: 'active' },
  });

  if (activeSession) {
    throw new AppError(
      409,
      'SESSION_ALREADY_ACTIVE',
      'An active session already exists for this node',
    );
  }

  // Auto-transition node from todo to in_progress
  if (node.status === 'todo') {
    await prisma.todoNode.update({
      where: { id: nodeId },
      data: { status: 'in_progress' },
    });

    // Propagate: milestone pending -> in_progress
    const milestone = await prisma.milestone.findUnique({
      where: { id: node.milestoneId },
    });
    if (milestone && milestone.status === 'pending') {
      await prisma.milestone.update({
        where: { id: node.milestoneId },
        data: { status: 'in_progress' },
      });
    }
  }

  const session = await prisma.studySession.create({
    data: {
      nodeId,
      userId,
      timerType,
      startTime: new Date(),
      status: 'active',
    },
  });

  return {
    id: session.id,
    nodeId: session.nodeId,
    userId: session.userId,
    timerType: session.timerType,
    startTime: session.startTime.toISOString(),
    endTime: null,
    durationMinutes: null,
    status: session.status,
    createdAt: session.createdAt.toISOString(),
  };
}

export async function updateSession(
  sessionId: string,
  userId: string,
  data: { status: 'paused' | 'completed'; endTime?: string },
) {
  const session = await prisma.studySession.findUnique({
    where: { id: sessionId },
  });

  if (!session) throw new AppError(404, 'NOT_FOUND', 'Session not found');
  if (session.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  if (session.status === 'completed') {
    throw new AppError(400, 'INVALID_STATUS_TRANSITION', 'Session is already completed');
  }

  const updateData: Record<string, unknown> = { status: data.status };

  if (data.status === 'completed') {
    const endTime = data.endTime ? new Date(data.endTime) : new Date();
    const durationMs = endTime.getTime() - session.startTime.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    updateData.endTime = endTime;
    updateData.durationMinutes = durationMinutes;
  }

  const updated = await prisma.studySession.update({
    where: { id: sessionId },
    data: updateData,
  });

  return {
    id: updated.id,
    status: updated.status,
    endTime: updated.endTime?.toISOString() || null,
    durationMinutes: updated.durationMinutes,
    updatedAt: new Date().toISOString(),
  };
}

export async function getNodeSessions(
  nodeId: string,
  userId: string,
  options: { page: number; limit: number; sort: string; order: 'asc' | 'desc' },
) {
  // Verify ownership through node -> milestone -> goal -> plan
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

  const where = { nodeId };

  const [sessions, total] = await Promise.all([
    prisma.studySession.findMany({
      where,
      orderBy: { [options.sort]: options.order },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.studySession.count({ where }),
  ]);

  return {
    data: sessions.map((s) => ({
      id: s.id,
      nodeId: s.nodeId,
      userId: s.userId,
      timerType: s.timerType,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime?.toISOString() || null,
      durationMinutes: s.durationMinutes,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    })),
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
}

export async function createSessionLog(
  sessionId: string,
  userId: string,
  data: {
    progressPercent?: number | null;
    focusLevel?: number | null;
    distractionType?: string | null;
    distractionDetail?: string | null;
    note?: string | null;
  },
) {
  const session = await prisma.studySession.findUnique({
    where: { id: sessionId },
  });

  if (!session) throw new AppError(404, 'NOT_FOUND', 'Session not found');
  if (session.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  if (session.status === 'completed') {
    throw new AppError(400, 'INVALID_STATUS_TRANSITION', 'Cannot add log to a completed session');
  }

  const log = await prisma.sessionLog.create({
    data: {
      sessionId,
      progressPercent: data.progressPercent ?? null,
      focusLevel: data.focusLevel ?? null,
      distractionType: data.distractionType ?? null,
      distractionDetail: data.distractionDetail ?? null,
      note: data.note ?? null,
    },
  });

  return {
    id: log.id,
    sessionId: log.sessionId,
    progressPercent: log.progressPercent,
    focusLevel: log.focusLevel,
    distractionType: log.distractionType,
    distractionDetail: log.distractionDetail,
    note: log.note,
    createdAt: log.createdAt.toISOString(),
  };
}
