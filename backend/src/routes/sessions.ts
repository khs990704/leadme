import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AuthenticatedRequest } from '../types/index.js';
import * as sessionService from '../services/session.service.js';

const router = Router();

// ===========================
// Zod Schemas
// ===========================

const createSessionSchema = z.object({
  nodeId: z.string().min(1),
  timerType: z.enum(['pomodoro', 'stopwatch']),
});

const updateSessionSchema = z
  .object({
    status: z.enum(['paused', 'completed']),
    endTime: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'completed' && !data.endTime) return false;
      return true;
    },
    { message: 'endTime is required when completing a session' },
  );

const createSessionLogSchema = z
  .object({
    progressPercent: z.number().int().min(0).max(100).nullable().optional(),
    focusLevel: z.number().int().min(1).max(5).nullable().optional(),
    distractionType: z
      .enum(['internal', 'external', 'none'])
      .nullable()
      .optional(),
    distractionDetail: z.string().min(1).max(500).nullable().optional(),
    note: z.string().min(1).max(1000).nullable().optional(),
  })
  .refine(
    (data) => {
      return Object.values(data).some((v) => v !== undefined && v !== null);
    },
    { message: 'At least one field must be provided' },
  );

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ===========================
// POST /sessions
// ===========================

router.post(
  '/sessions',
  authenticate,
  validate(createSessionSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await sessionService.createSession(
        req.user!.userId,
        req.body.nodeId,
        req.body.timerType,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// PATCH /sessions/:sessionId
// ===========================

router.patch(
  '/sessions/:sessionId',
  authenticate,
  validate(updateSessionSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await sessionService.updateSession(
        req.params.sessionId,
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
// GET /nodes/:nodeId/sessions
// ===========================

router.get(
  '/nodes/:nodeId/sessions',
  authenticate,
  validate(paginationQuerySchema, 'query'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = req.query as unknown as {
        page: number;
        limit: number;
        sort: string;
        order: 'asc' | 'desc';
      };

      const result = await sessionService.getNodeSessions(
        req.params.nodeId,
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
// POST /sessions/:sessionId/logs
// ===========================

router.post(
  '/sessions/:sessionId/logs',
  authenticate,
  validate(createSessionLogSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await sessionService.createSessionLog(
        req.params.sessionId,
        req.user!.userId,
        req.body,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
