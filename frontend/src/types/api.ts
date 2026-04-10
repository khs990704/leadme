// ===== Common Types =====

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

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

// ===== Enums =====

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

// ===== Auth =====

export interface GoogleAuthRequest {
  code: string;
  redirectUri: string;
}

export interface GoogleAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
  isNewUser: boolean;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt?: string;
}

// ===== Plans =====

export interface CreatePlanRequest {
  title: string;
}

export interface PlanResponse {
  id: string;
  userId: string;
  title: string;
  status: PlanStatus;
  params: PlanParams | null;
  generationMode: GenerationMode | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanListItem {
  id: string;
  title: string;
  status: PlanStatus;
  generationMode: GenerationMode | null;
  progress: {
    totalNodes: number;
    doneNodes: number;
    percentage: number;
  };
  lastStudiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDetailResponse {
  id: string;
  userId: string;
  title: string;
  status: PlanStatus;
  params: PlanParams | null;
  generationMode: GenerationMode | null;
  paramCompleteness: ParamCompleteness;
  goals: MacroGoalWithChildren[];
  createdAt: string;
  updatedAt: string;
}

export interface MacroGoalWithChildren {
  id: string;
  title: string;
  description: string | null;
  order: number;
  milestones: MilestoneWithChildren[];
}

export interface MilestoneWithChildren {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: MilestoneStatus;
  order: number;
  nodes: TodoNodeSummary[];
}

export interface TodoNodeSummary {
  id: string;
  title: string;
  status: NodeStatus;
  order: number;
  estimatedMinutes: number | null;
}

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

export interface ParamCompleteness {
  primary: number;
  primaryTotal: 7;
  secondary: number;
  secondaryTotal: 9;
  isReadyForBasic: boolean;
  isReadyForDetailed: boolean;
}

export interface UpdatePlanParamsRequest {
  studyMaterial?: {
    subject?: string;
    sources?: Array<{
      type?: string;
      name?: string | null;
      totalVolume?: string | null;
      additionalInfo?: string | null;
    }>;
  };
  finalGoal?: string;
  deadline?: string;
  availableTime?: string;
  currentLevel?: string;
  managementStyle?: ManagementStyle;
  contentStructure?: string | null;
  focusArea?: string | null;
  studyMode?: string | null;
  weeklyGoal?: string | null;
  notificationFrequency?: string | null;
  motivationFocus?: string | null;
}

export interface UpdateParamsResponse {
  id: string;
  params: PlanParams;
  paramCompleteness: ParamCompleteness;
}

export interface GeneratePlanRequest {
  mode: GenerationMode;
}

export interface StudyGuide {
  objective: string;
  prerequisites: string[];
  generationBasis: GenerationBasis;
  notes: string | null;
}

export interface GeneratePlanResponse {
  planId: string;
  generationMode: GenerationMode;
  macroGoals: Array<{
    id: string;
    title: string;
    description: string | null;
    order: number;
    milestones: Array<{
      id: string;
      title: string;
      description: string | null;
      targetDate: string | null;
      order: number;
      todos: Array<{
        id: string;
        title: string;
        estimatedMinutes: number;
        order: number;
        studyGuide: StudyGuide;
      }>;
    }>;
  }>;
  isDraft: true;
}

export interface ConfirmPlanResponse {
  id: string;
  status: 'active';
  confirmedAt: string;
}

// ===== Nodes =====

export interface NodeListItem {
  id: string;
  milestoneId: string;
  milestoneName: string;
  title: string;
  status: NodeStatus;
  order: number;
  estimatedMinutes: number | null;
  totalStudiedMinutes: number;
  generationBasis: GenerationBasis | null;
  createdAt: string;
  updatedAt: string;
}

export interface NodeDetailResponse {
  id: string;
  milestoneId: string;
  milestone: {
    id: string;
    title: string;
    goalId: string;
    goalTitle: string;
    planId: string;
  };
  title: string;
  status: NodeStatus;
  order: number;
  estimatedMinutes: number | null;
  generationBasis: GenerationBasis | null;
  studyGuide: StudyGuide | null;
  totalStudiedMinutes: number;
  activeSession: {
    id: string;
    timerType: TimerType;
    startTime: string;
    status: SessionStatus;
  } | null;
  recentReviews: Array<{
    id: string;
    reflection: string | null;
    difficulty: string | null;
    createdAt: string;
  }>;
  recentFeedback: Array<{
    id: string;
    summary: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNodeStatusRequest {
  status: NodeStatus;
}

export interface UpdateNodeStatusResponse {
  id: string;
  status: NodeStatus;
  updatedAt: string;
}

export interface UpdateNodeOrderRequest {
  order: number;
  status?: NodeStatus;
}

export interface UpdateNodeOrderResponse {
  nodes: Array<{
    id: string;
    order: number;
    status: NodeStatus;
  }>;
}

// ===== Sessions =====

export interface CreateSessionRequest {
  nodeId: string;
  timerType: TimerType;
}

export interface SessionResponse {
  id: string;
  nodeId: string;
  userId: string;
  timerType: TimerType;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  status: SessionStatus;
  createdAt: string;
}

export interface UpdateSessionRequest {
  status: 'active' | 'paused' | 'completed';
  endTime?: string;
}

export interface UpdateSessionResponse {
  id: string;
  status: SessionStatus;
  endTime: string | null;
  durationMinutes: number | null;
  updatedAt: string;
}

export interface CreateSessionLogRequest {
  progressPercent?: number | null;
  focusLevel?: number | null;
  distractionType?: DistractionType | null;
  distractionDetail?: string | null;
  note?: string | null;
}

export interface SessionLogResponse {
  id: string;
  sessionId: string;
  progressPercent: number | null;
  focusLevel: number | null;
  distractionType: DistractionType | null;
  distractionDetail: string | null;
  note: string | null;
  createdAt: string;
}

// ===== Reviews =====

export interface CreateReviewRequest {
  reflection?: string | null;
  difficulty?: string | null;
  distraction?: string | null;
  improvement?: string | null;
}

export interface ReviewResponse {
  id: string;
  nodeId: string;
  userId: string;
  reflection: string | null;
  difficulty: string | null;
  distraction: string | null;
  improvement: string | null;
  createdAt: string;
  updatedAt: string;
}

// ===== Feedback =====

export interface GenerateFeedbackRequest {
  nodeId?: string;
  planId?: string;
  scope: FeedbackScope;
}

export interface ProgressAnalysis {
  expected: number;
  actual: number;
  gap: number;
}

export interface FeedbackResponse {
  id: string;
  nodeId: string | null;
  planId: string | null;
  userId: string;
  scope: FeedbackScope;
  summary: string;
  progressAnalysis: ProgressAnalysis | null;
  suggestions: string[];
  motivationMessage: string | null;
  createdAt: string;
}
