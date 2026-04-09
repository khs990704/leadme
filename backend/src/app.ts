import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

// Route imports
import authRoutes from './routes/auth.js';
import planRoutes from './routes/plans.js';
import goalRoutes from './routes/goals.js';
import milestoneRoutes from './routes/milestones.js';
import nodeRoutes from './routes/nodes.js';
import sessionRoutes from './routes/sessions.js';
import reviewRoutes from './routes/reviews.js';
import feedbackRoutes from './routes/feedback.js';

const app = express();

// ===========================
// Global Middleware
// ===========================

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
});
app.use('/api/', limiter);

// ===========================
// Health Check
// ===========================

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===========================
// API v1 Routes
// ===========================
//
// Route mapping:
//   POST/GET     /auth/*                     -> authRoutes
//   POST/GET     /plans                      -> planRoutes
//   GET/DELETE   /plans/:planId              -> planRoutes
//   PATCH        /plans/:planId/params       -> planRoutes
//   POST         /plans/:planId/generate     -> planRoutes
//   PUT          /plans/:planId/confirm      -> planRoutes
//   GET          /plans/:planId/goals        -> goalRoutes    (mounted at /api/v1)
//   GET          /plans/:planId/nodes        -> nodeRoutes    (mounted at /api/v1)
//   GET          /plans/:planId/feedback     -> feedbackRoutes(mounted at /api/v1)
//   PUT          /goals/:goalId             -> goalRoutes    (mounted at /api/v1)
//   GET          /goals/:goalId/milestones  -> milestoneRoutes(mounted at /api/v1)
//   PUT          /milestones/:milestoneId   -> milestoneRoutes(mounted at /api/v1)
//   GET/PATCH/PUT /nodes/:nodeId/*          -> nodeRoutes    (mounted at /api/v1)
//   POST/PATCH   /sessions/*                -> sessionRoutes (mounted at /api/v1)
//   GET          /nodes/:nodeId/sessions    -> sessionRoutes (mounted at /api/v1)
//   POST/GET     /nodes/:nodeId/reviews     -> reviewRoutes  (mounted at /api/v1)
//   PUT          /reviews/:reviewId         -> reviewRoutes  (mounted at /api/v1)
//   POST         /feedback/generate         -> feedbackRoutes(mounted at /api/v1)
//   GET          /nodes/:nodeId/feedback    -> feedbackRoutes(mounted at /api/v1)

const v1 = '/api/v1';

// Auth: /api/v1/auth/*
app.use(`${v1}/auth`, authRoutes);

// Plans: /api/v1/plans/*
app.use(`${v1}/plans`, planRoutes);

// Goals: /api/v1/plans/:planId/goals, /api/v1/goals/:goalId
app.use(v1, goalRoutes);

// Milestones: /api/v1/goals/:goalId/milestones, /api/v1/milestones/:milestoneId
app.use(v1, milestoneRoutes);

// Nodes: /api/v1/plans/:planId/nodes, /api/v1/nodes/:nodeId/*
app.use(v1, nodeRoutes);

// Sessions: /api/v1/sessions/*, /api/v1/nodes/:nodeId/sessions
app.use(v1, sessionRoutes);

// Reviews: /api/v1/nodes/:nodeId/reviews, /api/v1/reviews/:reviewId
app.use(v1, reviewRoutes);

// Feedback: /api/v1/feedback/*, /api/v1/nodes/:nodeId/feedback, /api/v1/plans/:planId/feedback
app.use(v1, feedbackRoutes);

// ===========================
// Error Handling
// ===========================

app.use(notFoundHandler);
app.use(errorHandler);

// ===========================
// Start Server
// ===========================

if (env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`[LeadMe] Server running on port ${env.PORT}`);
    console.log(`[LeadMe] Environment: ${env.NODE_ENV}`);
    console.log(`[LeadMe] CORS origin: ${env.FRONTEND_URL}`);
  });
}

export default app;
