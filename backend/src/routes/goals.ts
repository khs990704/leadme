import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { AppError, AuthenticatedRequest } from '../types/index.js';
import { verifyPlanOwnership } from '../services/plan.service.js';

const router = Router();

// ===========================
// Zod Schemas
// ===========================

const updateGoalSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(1000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// ===========================
// GET /plans/:planId/goals
// ===========================

router.get(
  '/plans/:planId/goals',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await verifyPlanOwnership(req.params.planId, req.user!.userId);

      const goals = await prisma.macroGoal.findMany({
        where: { planId: req.params.planId },
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
      });

      const result = goals.map((goal) => ({
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
      }));

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// PUT /goals/:goalId
// ===========================

router.put(
  '/goals/:goalId',
  authenticate,
  validate(updateGoalSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const goal = await prisma.macroGoal.findUnique({
        where: { id: req.params.goalId },
        include: {
          plan: { select: { userId: true } },
        },
      });

      if (!goal) throw new AppError(404, 'NOT_FOUND', 'Goal not found');
      if (goal.plan.userId !== req.user!.userId) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }

      const updated = await prisma.macroGoal.update({
        where: { id: req.params.goalId },
        data: req.body,
      });

      res.status(200).json({
        id: updated.id,
        planId: updated.planId,
        title: updated.title,
        description: updated.description,
        order: updated.order,
        createdAt: updated.createdAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
