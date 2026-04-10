import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest } from '../types/index';
import * as feedbackService from '../services/feedback.service';

const router = Router();

// ===========================
// Zod Schemas
// ===========================

const generateFeedbackSchema = z
  .object({
    nodeId: z.string().optional(),
    planId: z.string().optional(),
    scope: z.enum(['node', 'plan']),
  })
  .refine(
    (data) => {
      if (data.scope === 'node' && !data.nodeId) return false;
      if (data.scope === 'plan' && !data.planId) return false;
      return true;
    },
    {
      message:
        'nodeId is required for node scope, planId is required for plan scope',
    },
  );

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ===========================
// POST /feedback/generate
// ===========================

router.post(
  '/feedback/generate',
  authenticate,
  validate(generateFeedbackSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      let result;
      if (req.body.scope === 'node') {
        result = await feedbackService.generateNodeFeedback(
          req.body.nodeId,
          req.user!.userId,
        );
      } else {
        result = await feedbackService.generatePlanFeedback(
          req.body.planId,
          req.user!.userId,
        );
      }
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// GET /nodes/:nodeId/feedback
// ===========================

router.get(
  '/nodes/:nodeId/feedback',
  authenticate,
  validate(paginationQuerySchema, 'query'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = (req as any)._parsed_query as {
        page: number;
        limit: number;
        sort: string;
        order: 'asc' | 'desc';
      };

      const result = await feedbackService.getNodeFeedback(
        req.params.nodeId as string,
        req.user!.userId,
        query,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// GET /plans/:planId/feedback
// ===========================

router.get(
  '/plans/:planId/feedback',
  authenticate,
  validate(paginationQuerySchema, 'query'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = (req as any)._parsed_query as {
        page: number;
        limit: number;
        sort: string;
        order: 'asc' | 'desc';
      };

      const result = await feedbackService.getPlanFeedback(
        req.params.planId as string,
        req.user!.userId,
        query,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
