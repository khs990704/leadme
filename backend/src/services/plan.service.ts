import { prisma } from '../lib/prisma';
import { AppError, PlanParams, ParamCompleteness, PlanStatus } from '../types/index';
import { generatePlan } from './ai.service';

// ===========================
// Param Completeness Calculation
// ===========================

const PRIMARY_FIELDS: (keyof PlanParams)[] = [
  'studyMaterial',
  'finalGoal',
  'deadline',
  'availableTime',
  'currentLevel',
  'managementStyle',
  // studyMaterial.sources[0].type counts as part of studyMaterial
];

// Primary: studyMaterial.subject, studyMaterial.sources (at least 1), finalGoal, deadline, availableTime, currentLevel, managementStyle = 7
const SECONDARY_FIELDS: (keyof PlanParams)[] = [
  'contentStructure',
  'focusArea',
  'studyMode',
  'weeklyGoal',
  'notificationFrequency',
  'motivationFocus',
  // Plus 3 more from sources detail (name, totalVolume, additionalInfo) = 9
];

export function calculateParamCompleteness(params: PlanParams | null): ParamCompleteness {
  if (!params) {
    return {
      primary: 0,
      primaryTotal: 7,
      secondary: 0,
      secondaryTotal: 9,
      isReadyForBasic: false,
      isReadyForDetailed: false,
    };
  }

  let primary = 0;
  // 1. subject
  if (params.studyMaterial?.subject) primary++;
  // 2. sources (at least one source with type)
  if (params.studyMaterial?.sources?.length && params.studyMaterial.sources[0]?.type) primary++;
  // 3. finalGoal
  if (params.finalGoal) primary++;
  // 4. deadline
  if (params.deadline) primary++;
  // 5. availableTime
  if (params.availableTime) primary++;
  // 6. currentLevel
  if (params.currentLevel) primary++;
  // 7. managementStyle
  if (params.managementStyle) primary++;

  let secondary = 0;
  // 1. contentStructure
  if (params.contentStructure) secondary++;
  // 2. focusArea
  if (params.focusArea) secondary++;
  // 3. studyMode
  if (params.studyMode) secondary++;
  // 4. weeklyGoal
  if (params.weeklyGoal) secondary++;
  // 5. notificationFrequency
  if (params.notificationFrequency) secondary++;
  // 6. motivationFocus
  if (params.motivationFocus) secondary++;
  // 7-9. source details (name, totalVolume, additionalInfo of first source)
  const firstSource = params.studyMaterial?.sources?.[0];
  if (firstSource?.name) secondary++;
  if (firstSource?.totalVolume) secondary++;
  if (firstSource?.additionalInfo) secondary++;

  return {
    primary,
    primaryTotal: 7,
    secondary,
    secondaryTotal: 9,
    isReadyForBasic: primary === 7,
    isReadyForDetailed: primary === 7 && secondary >= 1,
  };
}

// ===========================
// Plan CRUD
// ===========================

export async function createPlan(userId: string, title: string) {
  return prisma.studyPlan.create({
    data: { userId, title },
  });
}

export async function getPlans(
  userId: string,
  options: {
    status?: string | string[];
    page: number;
    limit: number;
    sort: string;
    order: 'asc' | 'desc';
  },
) {
  const statusFilter = options.status
    ? Array.isArray(options.status)
      ? { in: options.status }
      : options.status
    : undefined;

  const where = {
    userId,
    ...(statusFilter && { status: statusFilter }),
  };

  const [plans, total] = await Promise.all([
    prisma.studyPlan.findMany({
      where,
      include: {
        goals: {
          include: {
            milestones: {
              include: {
                nodes: {
                  select: { status: true },
                },
              },
            },
          },
        },
      },
      orderBy: { [options.sort]: options.order },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.studyPlan.count({ where }),
  ]);

  const data = await Promise.all(
    plans.map(async (plan) => {
      const allNodes = plan.goals.flatMap((g) =>
        g.milestones.flatMap((m) => m.nodes),
      );
      const totalNodes = allNodes.length;
      const doneNodes = allNodes.filter((n) => n.status === 'done').length;

      // Get last studied session
      const lastSession = await prisma.studySession.findFirst({
        where: {
          node: {
            milestone: {
              goal: { planId: plan.id },
            },
          },
          endTime: { not: null },
        },
        orderBy: { endTime: 'desc' },
        select: { endTime: true },
      });

      return {
        id: plan.id,
        title: plan.title,
        status: plan.status,
        generationMode: plan.generationMode,
        progress: {
          totalNodes,
          doneNodes,
          percentage: totalNodes > 0 ? Math.round((doneNodes / totalNodes) * 100) : 0,
        },
        lastStudiedAt: lastSession?.endTime?.toISOString() || null,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      };
    }),
  );

  return {
    data,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
}

export async function getPlanDetail(planId: string, userId: string) {
  const plan = await prisma.studyPlan.findUnique({
    where: { id: planId },
    include: {
      goals: {
        orderBy: { order: 'asc' },
        include: {
          milestones: {
            orderBy: { order: 'asc' },
            include: {
              nodes: {
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  title: true,
                  status: true,
                  order: true,
                  estimatedMinutes: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    throw new AppError(404, 'NOT_FOUND', 'Plan not found');
  }

  if (plan.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  const params = plan.params as PlanParams | null;

  return {
    id: plan.id,
    userId: plan.userId,
    title: plan.title,
    status: plan.status,
    params,
    generationMode: plan.generationMode,
    paramCompleteness: calculateParamCompleteness(params),
    goals: plan.goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      order: goal.order,
      milestones: goal.milestones.map((ms) => ({
        id: ms.id,
        title: ms.title,
        description: ms.description,
        targetDate: ms.targetDate?.toISOString().split('T')[0] || null,
        status: ms.status,
        order: ms.order,
        nodes: ms.nodes,
      })),
    })),
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

export async function updatePlanParams(
  planId: string,
  userId: string,
  updates: Partial<PlanParams>,
) {
  const plan = await prisma.studyPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new AppError(404, 'NOT_FOUND', 'Plan not found');
  }

  if (plan.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  if (plan.status !== 'draft') {
    throw new AppError(409, 'ALREADY_CONFIRMED', 'Cannot modify params of a confirmed plan');
  }

  const currentParams = (plan.params as PlanParams | null) || {
    studyMaterial: null,
    finalGoal: null,
    deadline: null,
    availableTime: null,
    currentLevel: null,
    managementStyle: null,
    contentStructure: null,
    focusArea: null,
    studyMode: null,
    weeklyGoal: null,
    notificationFrequency: null,
    motivationFocus: null,
  };

  // Deep merge studyMaterial
  let mergedMaterial = currentParams.studyMaterial;
  if (updates.studyMaterial) {
    mergedMaterial = {
      subject: updates.studyMaterial.subject ?? mergedMaterial?.subject ?? '',
      sources: updates.studyMaterial.sources ?? mergedMaterial?.sources ?? [],
    };
  }

  const newParams: PlanParams = {
    ...currentParams,
    ...updates,
    studyMaterial: mergedMaterial,
  };

  const updated = await prisma.studyPlan.update({
    where: { id: planId },
    data: { params: newParams as object },
  });

  return {
    id: updated.id,
    params: newParams,
    paramCompleteness: calculateParamCompleteness(newParams),
  };
}

export async function generatePlanContent(
  planId: string,
  userId: string,
  mode: 'basic' | 'detailed',
) {
  const plan = await prisma.studyPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new AppError(404, 'NOT_FOUND', 'Plan not found');
  }

  if (plan.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  if (plan.status !== 'draft') {
    throw new AppError(409, 'ALREADY_CONFIRMED', 'Cannot generate for a confirmed plan');
  }

  const params = plan.params as PlanParams | null;
  const completeness = calculateParamCompleteness(params);

  if (!completeness.isReadyForBasic) {
    throw new AppError(400, 'INVALID_PARAMS', 'Primary parameters are incomplete. Complete all 7 primary questions first.');
  }

  if (mode === 'detailed' && !completeness.isReadyForDetailed) {
    throw new AppError(400, 'INVALID_PARAMS', 'At least one secondary parameter is required for detailed mode.');
  }

  // Call AI to generate plan
  const aiResult = await generatePlan(params!, mode);

  // Delete existing goals/milestones/nodes
  await prisma.macroGoal.deleteMany({ where: { planId } });

  // Create new hierarchy in transaction
  const createdGoals = await prisma.$transaction(async (tx) => {
    const goals = [];
    for (const goalData of aiResult.macroGoals) {
      const goal = await tx.macroGoal.create({
        data: {
          planId,
          title: goalData.title,
          description: goalData.description,
          order: goalData.order,
        },
      });

      const milestones = [];
      for (const msData of goalData.milestones) {
        const milestone = await tx.milestone.create({
          data: {
            goalId: goal.id,
            title: msData.title,
            description: msData.description,
            targetDate: msData.targetDate ? new Date(msData.targetDate) : null,
            order: msData.order,
          },
        });

        const todos = [];
        for (const todoData of msData.todos) {
          const node = await tx.todoNode.create({
            data: {
              milestoneId: milestone.id,
              title: todoData.title,
              estimatedMinutes: todoData.estimatedMinutes,
              order: todoData.order,
              generationBasis: todoData.studyGuide.generationBasis,
              studyGuide: todoData.studyGuide as object,
            },
          });
          todos.push({
            id: node.id,
            title: node.title,
            estimatedMinutes: node.estimatedMinutes,
            order: node.order,
            studyGuide: todoData.studyGuide,
          });
        }

        milestones.push({
          id: milestone.id,
          title: milestone.title,
          description: milestone.description,
          targetDate: milestone.targetDate?.toISOString().split('T')[0] || null,
          order: milestone.order,
          todos,
        });
      }

      goals.push({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        order: goal.order,
        milestones,
      });
    }

    // Update generation mode
    await tx.studyPlan.update({
      where: { id: planId },
      data: { generationMode: mode },
    });

    return goals;
  });

  return {
    planId,
    generationMode: mode,
    macroGoals: createdGoals,
    isDraft: true as const,
  };
}

export async function confirmPlan(planId: string, userId: string) {
  const plan = await prisma.studyPlan.findUnique({
    where: { id: planId },
    include: {
      goals: {
        include: {
          milestones: {
            include: {
              nodes: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    throw new AppError(404, 'NOT_FOUND', 'Plan not found');
  }

  if (plan.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  if (plan.status !== 'draft') {
    throw new AppError(409, 'ALREADY_CONFIRMED', 'Plan is already confirmed');
  }

  const hasContent = plan.goals.some((g) =>
    g.milestones.some((m) => m.nodes.length > 0),
  );

  if (!hasContent) {
    throw new AppError(400, 'INVALID_PARAMS', 'Plan has no generated content. Generate a plan first.');
  }

  const updated = await prisma.studyPlan.update({
    where: { id: planId },
    data: { status: 'active' },
  });

  return {
    id: updated.id,
    status: 'active' as const,
    confirmedAt: updated.updatedAt.toISOString(),
  };
}

export async function deletePlan(planId: string, userId: string) {
  const plan = await prisma.studyPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new AppError(404, 'NOT_FOUND', 'Plan not found');
  }

  if (plan.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  await prisma.studyPlan.delete({ where: { id: planId } });
}

// ===========================
// Ownership helpers
// ===========================

export async function verifyPlanOwnership(planId: string, userId: string) {
  const plan = await prisma.studyPlan.findUnique({
    where: { id: planId },
    select: { userId: true },
  });

  if (!plan) {
    throw new AppError(404, 'NOT_FOUND', 'Plan not found');
  }

  if (plan.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }
}
