import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { AppError, AuthenticatedRequest } from '../types/index.js';
import { verifyNodeOwnership } from '../services/node.service.js';

const router = Router();

// ===========================
// Zod Schemas
// ===========================

const createReviewSchema = z
  .object({
    reflection: z.string().min(1).max(2000).nullable().optional(),
    difficulty: z.string().min(1).max(2000).nullable().optional(),
    distraction: z.string().min(1).max(1000).nullable().optional(),
    improvement: z.string().min(1).max(2000).nullable().optional(),
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
// POST /nodes/:nodeId/reviews
// ===========================

router.post(
  '/nodes/:nodeId/reviews',
  authenticate,
  validate(createReviewSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await verifyNodeOwnership(req.params.nodeId, req.user!.userId);

      const review = await prisma.review.create({
        data: {
          nodeId: req.params.nodeId,
          userId: req.user!.userId,
          reflection: req.body.reflection ?? null,
          difficulty: req.body.difficulty ?? null,
          distraction: req.body.distraction ?? null,
          improvement: req.body.improvement ?? null,
        },
      });

      res.status(201).json({
        id: review.id,
        nodeId: review.nodeId,
        userId: review.userId,
        reflection: review.reflection,
        difficulty: review.difficulty,
        distraction: review.distraction,
        improvement: review.improvement,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// GET /nodes/:nodeId/reviews
// ===========================

router.get(
  '/nodes/:nodeId/reviews',
  authenticate,
  validate(paginationQuerySchema, 'query'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await verifyNodeOwnership(req.params.nodeId, req.user!.userId);

      const query = req.query as unknown as {
        page: number;
        limit: number;
        sort: string;
        order: 'asc' | 'desc';
      };

      const where = { nodeId: req.params.nodeId };

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          orderBy: { [query.sort]: query.order },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        prisma.review.count({ where }),
      ]);

      res.status(200).json({
        data: reviews.map((r) => ({
          id: r.id,
          nodeId: r.nodeId,
          userId: r.userId,
          reflection: r.reflection,
          difficulty: r.difficulty,
          distraction: r.distraction,
          improvement: r.improvement,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// PUT /reviews/:reviewId
// ===========================

router.put(
  '/reviews/:reviewId',
  authenticate,
  validate(createReviewSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const review = await prisma.review.findUnique({
        where: { id: req.params.reviewId },
      });

      if (!review) throw new AppError(404, 'NOT_FOUND', 'Review not found');
      if (review.userId !== req.user!.userId) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }

      const updated = await prisma.review.update({
        where: { id: req.params.reviewId },
        data: {
          reflection: req.body.reflection ?? review.reflection,
          difficulty: req.body.difficulty ?? review.difficulty,
          distraction: req.body.distraction ?? review.distraction,
          improvement: req.body.improvement ?? review.improvement,
        },
      });

      res.status(200).json({
        id: updated.id,
        nodeId: updated.nodeId,
        userId: updated.userId,
        reflection: updated.reflection,
        difficulty: updated.difficulty,
        distraction: updated.distraction,
        improvement: updated.improvement,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
