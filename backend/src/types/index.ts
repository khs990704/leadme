import { Request } from 'express';

// ===========================
// Auth Types
// ===========================

export interface JwtPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User {
      [key: string]: unknown;
      userId: string;
      email: string;
    }
  }
}

export type AuthenticatedRequest = Request;

// ===========================
// Enum Types
// ===========================

export type PlanStatus = 'draft' | 'active' | 'completed' | 'archived';
export type NodeStatus = 'todo' | 'in_progress' | 'done';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';
export type SessionStatus = 'active' | 'paused' | 'completed';
export type TimerType = 'pomodoro' | 'stopwatch';
export type GenerationMode = 'basic' | 'detailed';
export type GenerationBasis = 'volume_based' | 'structure_based';
export type DistractionType = 'internal' | 'external' | 'none';
export type FeedbackScope = 'node' | 'plan';
export type ManagementStyle = 'soft' | 'normal' | 'strict';

// ===========================
// JSONB Types
// ===========================

export interface PlanParams {
  studyMaterial: {
    subject: string;
    sources: Array<{
      type: string;
      name: string | null;
      totalVolume: string | null;
      additionalInfo: string | null;
    }>;
  } | null;
  finalGoal: string | null;
  deadline: string | null;
  availableTime: string | null;
  currentLevel: string | null;
  managementStyle: ManagementStyle | null;
  contentStructure: string | null;
  focusArea: string | null;
  studyMode: string | null;
  weeklyGoal: string | null;
  notificationFrequency: string | null;
  motivationFocus: string | null;
}

export interface StudyGuide {
  objective: string;
  prerequisites: string[];
  generationBasis: GenerationBasis;
  notes: string | null;
}

export interface ProgressAnalysis {
  expected: number;
  actual: number;
  gap: number;
}

export interface ParamCompleteness {
  primary: number;
  primaryTotal: 7;
  secondary: number;
  secondaryTotal: 9;
  isReadyForBasic: boolean;
  isReadyForDetailed: boolean;
}

// ===========================
// Pagination
// ===========================

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===========================
// Error Types
// ===========================

export type ErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_PARAMS'
  | 'INVALID_STATUS_TRANSITION'
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED'
  | 'INVALID_TOKEN'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'ALREADY_CONFIRMED'
  | 'SESSION_ALREADY_ACTIVE'
  | 'RATE_LIMITED'
  | 'AI_SERVICE_ERROR'
  | 'AI_SERVICE_UNAVAILABLE';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, string[]>;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ===========================
// AI Service Types
// ===========================

export interface AIGeneratedPlan {
  macroGoals: Array<{
    title: string;
    description: string | null;
    order: number;
    milestones: Array<{
      title: string;
      description: string | null;
      targetDate: string | null;
      order: number;
      todos: Array<{
        title: string;
        estimatedMinutes: number;
        order: number;
        studyGuide: StudyGuide;
      }>;
    }>;
  }>;
}

export interface AIFeedbackResult {
  summary: string;
  progressAnalysis: ProgressAnalysis | null;
  suggestions: string[];
  motivationMessage: string | null;
}
