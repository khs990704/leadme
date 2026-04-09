import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { AppError, AuthenticatedRequest, JwtPayload } from '../types/index.js';

const router = Router();

// ===========================
// Zod Schemas
// ===========================

const googleAuthSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  redirectUri: z.string().url('Invalid redirect URI'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ===========================
// Helpers
// ===========================

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

async function verifyTokenHash(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

// ===========================
// POST /auth/google
// ===========================

router.post(
  '/google',
  validate(googleAuthSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, redirectUri } = req.body;

      // Exchange authorization code for tokens with Google
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        throw new AppError(401, 'INVALID_TOKEN', 'Failed to verify Google authorization code');
      }

      const tokenData = (await tokenResponse.json()) as {
        access_token: string;
        id_token: string;
      };

      // Get user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        },
      );

      if (!userInfoResponse.ok) {
        throw new AppError(401, 'INVALID_TOKEN', 'Failed to fetch Google user info');
      }

      const googleUser = (await userInfoResponse.json()) as {
        id: string;
        email: string;
        name: string;
        picture: string;
      };

      // Upsert user
      let isNewUser = false;
      let user = await prisma.user.findUnique({
        where: { googleId: googleUser.id },
      });

      if (!user) {
        isNewUser = true;
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl: googleUser.picture || null,
            googleId: googleUser.id,
          },
        });
      }

      // Generate tokens
      const jwtPayload: JwtPayload = { userId: user.id, email: user.email };
      const accessToken = generateAccessToken(jwtPayload);
      const refreshToken = generateRefreshToken(jwtPayload);

      // Store refresh token hash (Rotation: invalidates previous)
      const refreshHash = await hashToken(refreshToken);
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: refreshHash },
      });

      res.status(200).json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt.toISOString(),
        },
        isNewUser,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// POST /auth/refresh
// ===========================

router.post(
  '/refresh',
  validate(refreshSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      // Verify JWT
      let payload: JwtPayload;
      try {
        payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
      } catch {
        throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired refresh token');
      }

      // Verify user and stored hash
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.refreshTokenHash) {
        throw new AppError(401, 'INVALID_TOKEN', 'Invalid refresh token');
      }

      const isValid = await verifyTokenHash(refreshToken, user.refreshTokenHash);
      if (!isValid) {
        // Token reuse detected — invalidate all tokens
        await prisma.user.update({
          where: { id: user.id },
          data: { refreshTokenHash: null },
        });
        throw new AppError(401, 'INVALID_TOKEN', 'Refresh token has been revoked');
      }

      // Rotation: generate new token pair
      const jwtPayload: JwtPayload = { userId: user.id, email: user.email };
      const newAccessToken = generateAccessToken(jwtPayload);
      const newRefreshToken = generateRefreshToken(jwtPayload);

      const newHash = await hashToken(newRefreshToken);
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: newHash },
      });

      res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// POST /auth/logout
// ===========================

router.post(
  '/logout',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: { refreshTokenHash: null },
      });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ===========================
// GET /auth/me
// ===========================

router.get(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
      });

      if (!user) {
        throw new AppError(404, 'NOT_FOUND', 'User not found');
      }

      res.status(200).json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
