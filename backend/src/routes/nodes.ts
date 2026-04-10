import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AuthenticatedRequest } from '../types/index.js';
import * as nodeService from '../services/node.service.js';

const router = Router();

// ===========================
// Zod Schemas
// ===========================

const updateNodeStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done']),
});

const updateNodeOrderSchema = z.object({
  order: z.number().int().min(0),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
});

const updateNodeSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    estimatedMinutes: z.number().int().min(1).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

const getNodesQuerySchema = z.object({
  milestoneId: z.string().optional(),
  status: z
    .string()
    .transform((val) => (val.includes(',') ? val.split(',') : val))
    .optional(),
});

// ===========================
// GET /plans/:planId/nodes
// ===========================

router.get(
  '/plans/:planId/nodes',
  authenticate,
  validate(getNodesQuerySchema, 'query'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = req.query as unknown as {
        milestoneId?: string;
        status?: string | string[];
      };

      const result = await nodeService.getNodesByPlan(
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

// ===========================
// GET /nodes/:nodeId
// ===========================

router.get(
  '/nodes/:nodeId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await nodeService.getNodeDetail(
        req.params.nodeId as string,
        req.user!.userId,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// PATCH /nodes/:nodeId/status
// ===========================

router.patch(
  '/nodes/:nodeId/status',
  authenticate,
  validate(updateNodeStatusSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await nodeService.updateNodeStatus(
        req.params.nodeId as string,
        req.user!.userId,
        req.body.status,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// PATCH /nodes/:nodeId/order
// ===========================

router.patch(
  '/nodes/:nodeId/order',
  authenticate,
  validate(updateNodeOrderSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await nodeService.updateNodeOrder(
        req.params.nodeId as string,
        req.user!.userId,
        req.body.order,
        req.body.status,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// PUT /nodes/:nodeId
// ===========================

router.put(
  '/nodes/:nodeId',
  authenticate,
  validate(updateNodeSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await nodeService.updateNode(
        req.params.nodeId as string,
        req.user!.userId,
        req.body,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
