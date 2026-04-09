import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { AppError, AuthenticatedRequest } from '../types/index.js';

const router = Router();

// ===========================
// Zod Schemas
// ===========================

const updateMilestoneSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(1000).nullable().optional(),
    targetDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
      .nullable()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// ===========================
// GET /goals/:goalId/milestones
// ===========================

router.get(
  '/goals/:goalId/milestones',
  authenticate,
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

      const milestones = await prisma.milestone.findMany({
        where: { goalId: req.params.goalId },
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
      });

      const result = milestones.map((ms) => ({
        id: ms.id,
        title: ms.title,
        description: ms.description,
        targetDate: ms.targetDate?.toISOString().split('T')[0] || null,
        status: ms.status,
        order: ms.order,
        nodes: ms.nodes,
      }));

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// PUT /milestones/:milestoneId
// ===========================

router.put(
  '/milestones/:milestoneId',
  authenticate,
  validate(updateMilestoneSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: req.params.milestoneId },
        include: {
          goal: {
            include: {
              plan: { select: { userId: true } },
            },
          },
        },
      });

      if (!milestone) throw new AppError(404, 'NOT_FOUND', 'Milestone not found');
      if (milestone.goal.plan.userId !== req.user!.userId) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }

      const updateData: Record<string, unknown> = {};
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.targetDate !== undefined) {
        updateData.targetDate = req.body.targetDate
          ? new Date(req.body.targetDate)
          : null;
      }

      const updated = await prisma.milestone.update({
        where: { id: req.params.milestoneId },
        data: updateData,
      });

      res.status(200).json({
        id: updated.id,
        goalId: updated.goalId,
        title: updated.title,
        description: updated.description,
        targetDate: updated.targetDate?.toISOString().split('T')[0] || null,
        status: updated.status,
        order: updated.order,
        createdAt: updated.createdAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
