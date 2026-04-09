import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AuthenticatedRequest } from '../types/index.js';
import * as planService from '../services/plan.service.js';

const router = Router();

// ===========================
// Zod Schemas
// ===========================

const createPlanSchema = z.object({
  title: z.string().min(1).max(200, 'Title must be 200 characters or less'),
});

const getPlansQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  status: z
    .string()
    .transform((val) => (val.includes(',') ? val.split(',') : val))
    .optional(),
});

const sourceSchema = z.object({
  type: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).nullable().optional(),
  totalVolume: z.string().min(1).max(200).nullable().optional(),
  additionalInfo: z.string().min(1).max(500).nullable().optional(),
});

const updatePlanParamsSchema = z
  .object({
    studyMaterial: z
      .object({
        subject: z.string().min(1).max(200).optional(),
        sources: z.array(sourceSchema).optional(),
      })
      .optional(),
    finalGoal: z.string().min(1).max(500).optional(),
    deadline: z.string().min(1).max(100).optional(),
    availableTime: z.string().min(1).max(100).optional(),
    currentLevel: z.string().min(1).max(50).optional(),
    managementStyle: z.enum(['soft', 'normal', 'strict']).optional(),
    contentStructure: z.string().min(1).max(2000).nullable().optional(),
    focusArea: z.string().min(1).max(500).nullable().optional(),
    studyMode: z.string().min(1).max(200).nullable().optional(),
    weeklyGoal: z.string().min(1).max(500).nullable().optional(),
    notificationFrequency: z.string().min(1).max(100).nullable().optional(),
    motivationFocus: z.string().min(1).max(200).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one parameter must be provided',
  });

const generatePlanSchema = z.object({
  mode: z.enum(['basic', 'detailed']),
});

// ===========================
// POST /plans
// ===========================

router.post(
  '/',
  authenticate,
  validate(createPlanSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const plan = await planService.createPlan(req.user!.userId, req.body.title);
      res.status(201).json(plan);
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// GET /plans
// ===========================

router.get(
  '/',
  authenticate,
  validate(getPlansQuerySchema, 'query'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = req.query as unknown as {
        page: number;
        limit: number;
        sort: string;
        order: 'asc' | 'desc';
        status?: string | string[];
      };

      const result = await planService.getPlans(req.user!.userId, query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// GET /plans/:planId
// ===========================

router.get(
  '/:planId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await planService.getPlanDetail(req.params.planId, req.user!.userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// PATCH /plans/:planId/params
// ===========================

router.patch(
  '/:planId/params',
  authenticate,
  validate(updatePlanParamsSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await planService.updatePlanParams(
        req.params.planId,
        req.user!.userId,
        req.body,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// POST /plans/:planId/generate
// ===========================

router.post(
  '/:planId/generate',
  authenticate,
  validate(generatePlanSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await planService.generatePlanContent(
        req.params.planId,
        req.user!.userId,
        req.body.mode,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// PUT /plans/:planId/confirm
// ===========================

router.put(
  '/:planId/confirm',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await planService.confirmPlan(req.params.planId, req.user!.userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// DELETE /plans/:planId
// ===========================

router.delete(
  '/:planId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await planService.deletePlan(req.params.planId, req.user!.userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
