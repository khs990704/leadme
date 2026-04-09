# API 명세 — LeadMe

> 버전: 1.0
> 작성일: 2026-04-09
> 기반: spec/03_api_preview.md

---

## 1. 기본 정보

| 항목 | 값 |
|------|-----|
| Base URL | `/api/v1` |
| 인증 방식 | Google OAuth 2.0 → JWT (Bearer Token) |
| 응답 형식 | `application/json` |
| 인증 헤더 | `Authorization: Bearer <accessToken>` |
| 날짜/시간 | ISO 8601 (`2026-04-09T14:00:00.000Z`) |
| ID 형식 | Prisma CUID (`cly1a2b3c4d5e6f7g8`) |

---

## 2. 공통 타입 정의

### 2.1 공통 응답 래퍼

```typescript
// 성공 응답 — 데이터를 직접 반환 (래퍼 없음)
// 예: GET /plans → Plan[]
// 예: POST /plans → Plan

// 에러 응답
interface ApiError {
  error: {
    code: string;       // "INVALID_INPUT" | "UNAUTHORIZED" | ...
    message: string;    // 사용자 표시용 메시지
    details?: Record<string, string[]>; // 필드별 검증 에러 (선택)
  };
}
```

### 2.2 페이지네이션

```typescript
// 요청 쿼리
interface PaginationQuery {
  page?: number;        // 기본값: 1, 최소: 1
  limit?: number;       // 기본값: 20, 최소: 1, 최대: 100
  sort?: string;        // 정렬 필드 (기본값: "createdAt")
  order?: 'asc' | 'desc'; // 기본값: "desc"
}

// 페이지네이션 응답
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 2.3 공통 열거형

```typescript
type PlanStatus = 'draft' | 'active' | 'completed' | 'archived';
type NodeStatus = 'todo' | 'in_progress' | 'done';
type MilestoneStatus = 'pending' | 'in_progress' | 'completed';
type SessionStatus = 'active' | 'paused' | 'completed';
type TimerType = 'pomodoro' | 'stopwatch';
type GenerationMode = 'basic' | 'detailed';
type GenerationBasis = 'volume_based' | 'structure_based';
type DistractionType = 'internal' | 'external' | 'none';
type FeedbackScope = 'node' | 'plan';
type ManagementStyle = 'soft' | 'normal' | 'strict';
```

---

## 3. 에러 코드 규약

| HTTP | 코드 | 설명 | 발생 조건 |
|------|------|------|----------|
| 400 | `INVALID_INPUT` | 요청 데이터 유효성 검증 실패 | Zod 스키마 검증 실패 |
| 400 | `INVALID_PARAMS` | 필수 파라미터 누락 | 1차 질문 미완료 상태에서 generate 시도 |
| 400 | `INVALID_STATUS_TRANSITION` | 허용되지 않는 상태 전환 | done→todo 직접 전환 등 |
| 401 | `UNAUTHORIZED` | 인증 필요 | Authorization 헤더 없음 |
| 401 | `TOKEN_EXPIRED` | 토큰 만료 | JWT 만료 시간 초과 |
| 401 | `INVALID_TOKEN` | 토큰 검증 실패 | 위조/변조된 JWT |
| 403 | `FORBIDDEN` | 접근 권한 없음 | 다른 사용자의 리소스 접근 |
| 404 | `NOT_FOUND` | 리소스 없음 | 존재하지 않는 ID |
| 409 | `ALREADY_CONFIRMED` | 이미 확정된 계획 | active/completed 계획에 generate/confirm 시도 |
| 409 | `SESSION_ALREADY_ACTIVE` | 이미 진행 중인 세션 | 동일 노드에 active 세션 존재 시 새 세션 시작 |
| 429 | `RATE_LIMITED` | API 호출 제한 초과 | 분당 100회 초과 |
| 502 | `AI_SERVICE_ERROR` | AI 응답 파싱 실패 | OpenRouter 응답 포맷 오류, 재시도 실패 |
| 503 | `AI_SERVICE_UNAVAILABLE` | AI 서비스 연결 불가 | OpenRouter API 다운/타임아웃 |

---

## 4. 인증 API

### 4.1 POST /auth/google

Google OAuth authorization code로 로그인/회원가입.

**요청**:
```typescript
interface GoogleAuthRequest {
  code: string;           // Google OAuth authorization code (필수, 비어있지 않은 문자열)
  redirectUri: string;    // 프론트엔드 OAuth redirect URI (필수)
}
```

**Zod 스키마**:
```typescript
const googleAuthSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  redirectUri: z.string().url("Invalid redirect URI"),
});
```

**응답 (200)**:
```typescript
interface GoogleAuthResponse {
  accessToken: string;    // JWT Access Token (15분)
  refreshToken: string;   // JWT Refresh Token (7일)
  user: {
    id: string;           // CUID
    email: string;
    name: string;
    avatarUrl: string | null;
    createdAt: string;    // ISO 8601
  };
  isNewUser: boolean;     // 신규 가입 여부
}
```

**에러**: 401 `INVALID_TOKEN` (Google code 검증 실패)

---

### 4.2 POST /auth/refresh

Access Token 갱신 (Refresh Token Rotation).

**요청**:
```typescript
interface RefreshRequest {
  refreshToken: string;   // 현재 Refresh Token (필수)
}
```

**Zod 스키마**:
```typescript
const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
```

**응답 (200)**:
```typescript
interface RefreshResponse {
  accessToken: string;    // 새 Access Token
  refreshToken: string;   // 새 Refresh Token (이전 토큰 무효화)
}
```

**에러**: 401 `INVALID_TOKEN` (만료/무효/재사용된 Refresh Token)

---

### 4.3 POST /auth/logout

로그아웃 (Refresh Token 무효화).

**인증**: Required

**요청**: Body 없음

**응답 (204)**: No Content

---

### 4.4 GET /auth/me

현재 로그인한 사용자 정보 조회.

**인증**: Required

**응답 (200)**:
```typescript
interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## 5. 학습 계획 API

### 5.1 POST /plans

새 학습 계획 생성 (draft 상태).

**인증**: Required

**요청**:
```typescript
interface CreatePlanRequest {
  title: string;          // 계획 제목 (1-200자)
}
```

**Zod 스키마**:
```typescript
const createPlanSchema = z.object({
  title: z.string().min(1).max(200, "Title must be 200 characters or less"),
});
```

**응답 (201)**:
```typescript
interface PlanResponse {
  id: string;
  userId: string;
  title: string;
  status: PlanStatus;            // "draft"
  params: PlanParams | null;     // null (아직 수집 안 됨)
  generationMode: GenerationMode | null;
  createdAt: string;
  updatedAt: string;
}
```

---

### 5.2 GET /plans

내 학습 계획 목록 조회.

**인증**: Required

**쿼리**:
```typescript
interface GetPlansQuery extends PaginationQuery {
  status?: PlanStatus | PlanStatus[];  // 필터: "active" 또는 "active,completed"
}
```

**응답 (200)**: `PaginatedResponse<PlanListItem>`

```typescript
interface PlanListItem {
  id: string;
  title: string;
  status: PlanStatus;
  generationMode: GenerationMode | null;
  progress: {                    // 계산 필드
    totalNodes: number;
    doneNodes: number;
    percentage: number;          // 0-100
  };
  lastStudiedAt: string | null;  // 가장 최근 세션 종료 시간
  createdAt: string;
  updatedAt: string;
}
```

---

### 5.3 GET /plans/:planId

학습 계획 상세 조회 (Goals/Milestones/Todos 계층 포함).

**인증**: Required
**소유권**: Required (403 FORBIDDEN)

**응답 (200)**:
```typescript
interface PlanDetailResponse {
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

interface MacroGoalWithChildren {
  id: string;
  title: string;
  description: string | null;
  order: number;
  milestones: MilestoneWithChildren[];
}

interface MilestoneWithChildren {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;     // ISO date "2026-04-30"
  status: MilestoneStatus;
  order: number;
  nodes: TodoNodeSummary[];
}

interface TodoNodeSummary {
  id: string;
  title: string;
  status: NodeStatus;
  order: number;
  estimatedMinutes: number | null;
}
```

---

### 5.4 PATCH /plans/:planId/params

파라미터 업데이트 (질문 답변 저장). 부분 업데이트 가능.

**인증**: Required
**소유권**: Required
**제약**: status가 `draft`인 경우만 허용 (409 `ALREADY_CONFIRMED`)

**요청**:
```typescript
interface UpdatePlanParamsRequest {
  studyMaterial?: {
    subject?: string;                    // 1-200자
    sources?: Array<{
      type?: string;                     // "book" | "lecture" | "exam" | "stack" | "web_resource"
      name?: string | null;              // 1-200자 또는 null
      totalVolume?: string | null;       // 1-200자 또는 null
      additionalInfo?: string | null;    // 1-500자 또는 null
    }>;
  };
  finalGoal?: string;                    // 1-500자
  deadline?: string;                     // ISO date 또는 자유형식 ("3주", "2개월")
  availableTime?: string;               // 자유형식 ("하루 2시간")
  currentLevel?: string;                // "입문" | "초급" | "중급" | "고급" 또는 자유형식
  managementStyle?: ManagementStyle;     // "soft" | "normal" | "strict"
  contentStructure?: string | null;      // 1-2000자 또는 null
  focusArea?: string | null;             // 1-500자 또는 null
  studyMode?: string | null;            // 1-200자 또는 null
  weeklyGoal?: string | null;           // 1-500자 또는 null
  notificationFrequency?: string | null; // 자유형식 또는 null
  motivationFocus?: string | null;       // 자유형식 또는 null
}
```

**Zod 스키마**:
```typescript
const sourceSchema = z.object({
  type: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).nullable().optional(),
  totalVolume: z.string().min(1).max(200).nullable().optional(),
  additionalInfo: z.string().min(1).max(500).nullable().optional(),
});

const updatePlanParamsSchema = z.object({
  studyMaterial: z.object({
    subject: z.string().min(1).max(200).optional(),
    sources: z.array(sourceSchema).optional(),
  }).optional(),
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
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one parameter must be provided",
});
```

**응답 (200)**:
```typescript
interface UpdateParamsResponse {
  id: string;
  params: PlanParams;
  paramCompleteness: ParamCompleteness;
}

interface PlanParams {
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

interface ParamCompleteness {
  primary: number;       // 완료된 1차 질문 수 (0-7)
  primaryTotal: 7;       // 고정
  secondary: number;     // 완료된 2차 질문 수 (0-9)
  secondaryTotal: 9;     // 고정
  isReadyForBasic: boolean;    // primary === 7
  isReadyForDetailed: boolean; // primary === 7 && secondary >= 1
}
```

---

### 5.5 POST /plans/:planId/generate

AI 계획 생성 요청. 기존 Goals/Milestones/Nodes를 삭제하고 새로 생성.

**인증**: Required
**소유권**: Required
**제약**: status가 `draft`인 경우만 (409 `ALREADY_CONFIRMED`), `isReadyForBasic`이 true여야 함 (400 `INVALID_PARAMS`)

**요청**:
```typescript
interface GeneratePlanRequest {
  mode: GenerationMode;  // "basic" | "detailed"
}
```

**Zod 스키마**:
```typescript
const generatePlanSchema = z.object({
  mode: z.enum(['basic', 'detailed']),
});
```

**응답 (200)**:
```typescript
interface GeneratePlanResponse {
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
  isDraft: true;         // 아직 draft 상태 (confirm 전)
}

interface StudyGuide {
  objective: string;           // 학습 목표
  prerequisites: string[];     // 사전 지식 목록
  generationBasis: GenerationBasis; // "volume_based" | "structure_based"
  notes: string | null;        // 추가 메모
}
```

**에러**: 400 `INVALID_PARAMS` (1차 질문 미완료), 502 `AI_SERVICE_ERROR`, 503 `AI_SERVICE_UNAVAILABLE`

---

### 5.6 PUT /plans/:planId/confirm

계획 확정 (draft → active). 이후 칸반에서 관리 시작.

**인증**: Required
**소유권**: Required
**제약**: status가 `draft`이고 Goals/Milestones/Nodes가 존재해야 함

**요청**: Body 없음

**응답 (200)**:
```typescript
interface ConfirmPlanResponse {
  id: string;
  status: 'active';       // 확정됨
  confirmedAt: string;     // ISO 8601
}
```

**에러**: 409 `ALREADY_CONFIRMED`, 400 `INVALID_PARAMS` (생성된 계획 없음)

---

### 5.7 DELETE /plans/:planId

학습 계획 삭제 (하드 삭제, 연관 Goals/Milestones/Nodes/Sessions/Reviews/Feedback 캐스케이드).

**인증**: Required
**소유권**: Required

**응답 (204)**: No Content

---

## 6. 목표 계층 API

### 6.1 GET /plans/:planId/goals

Macro Goal 목록 조회.

**인증**: Required
**소유권**: Required (planId 기준)

**응답 (200)**: `MacroGoalWithChildren[]` (5.3절 타입 참조)

---

### 6.2 PUT /goals/:goalId

Macro Goal 수정.

**인증**: Required
**소유권**: Required

**요청**:
```typescript
interface UpdateGoalRequest {
  title?: string;         // 1-200자
  description?: string | null; // 1-1000자 또는 null
}
```

**Zod 스키마**:
```typescript
const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).nullable().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});
```

**응답 (200)**:
```typescript
interface GoalResponse {
  id: string;
  planId: string;
  title: string;
  description: string | null;
  order: number;
  createdAt: string;
}
```

---

### 6.3 GET /goals/:goalId/milestones

Milestone 목록 조회.

**인증**: Required
**소유권**: Required

**응답 (200)**: `MilestoneWithChildren[]` (5.3절 타입 참조)

---

### 6.4 PUT /milestones/:milestoneId

Milestone 수정.

**인증**: Required
**소유권**: Required

**요청**:
```typescript
interface UpdateMilestoneRequest {
  title?: string;              // 1-200자
  description?: string | null; // 1-1000자 또는 null
  targetDate?: string | null;  // ISO date 또는 null
}
```

**Zod 스키마**:
```typescript
const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).nullable().optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format").nullable().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});
```

**응답 (200)**:
```typescript
interface MilestoneResponse {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: MilestoneStatus;
  order: number;
  createdAt: string;
}
```

---

## 7. 칸반 노드 API

### 7.1 GET /plans/:planId/nodes

칸반 Node 목록 조회 (Milestone 필터, 상태 필터).

**인증**: Required
**소유권**: Required

**쿼리**:
```typescript
interface GetNodesQuery {
  milestoneId?: string;              // 특정 Milestone의 Node만
  status?: NodeStatus | NodeStatus[]; // "todo" 또는 "todo,in_progress"
}
```

**응답 (200)**:
```typescript
interface NodeListItem {
  id: string;
  milestoneId: string;
  milestoneName: string;     // JOIN으로 포함
  title: string;
  status: NodeStatus;
  order: number;
  estimatedMinutes: number | null;
  totalStudiedMinutes: number; // 계산: 해당 노드 세션 총 시간
  generationBasis: GenerationBasis | null;
  createdAt: string;
  updatedAt: string;
}
```

---

### 7.2 GET /nodes/:nodeId

Node 상세 조회 (Study Guide + 최근 세션 + 최근 리뷰 + 최근 피드백 포함).

**인증**: Required
**소유권**: Required

**응답 (200)**:
```typescript
interface NodeDetailResponse {
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
  activeSession: {               // 진행 중인 세션 (없으면 null)
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
  }>;                            // 최근 3개
  recentFeedback: Array<{
    id: string;
    summary: string;
    createdAt: string;
  }>;                            // 최근 3개
  createdAt: string;
  updatedAt: string;
}
```

---

### 7.3 PATCH /nodes/:nodeId/status

Node 상태 변경 (칸반 드래그).

**인증**: Required
**소유권**: Required

**요청**:
```typescript
interface UpdateNodeStatusRequest {
  status: NodeStatus;     // "todo" | "in_progress" | "done"
}
```

**Zod 스키마**:
```typescript
const updateNodeStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done']),
});
```

**상태 전환 규칙**:
| From | To | 허용 |
|------|----|------|
| todo | in_progress | O |
| in_progress | todo | O (되돌리기) |
| in_progress | done | O |
| done | in_progress | O (재학습) |
| todo | done | X (400 `INVALID_STATUS_TRANSITION`) |
| done | todo | X (400 `INVALID_STATUS_TRANSITION`) |

**응답 (200)**:
```typescript
interface UpdateNodeStatusResponse {
  id: string;
  status: NodeStatus;
  updatedAt: string;
}
```

**부수 효과**:
- Node가 done으로 변경 → 해당 Milestone의 모든 Node가 done이면 Milestone status를 `completed`로 자동 변경
- Milestone이 completed → 해당 Plan의 모든 Milestone이 completed이면 Plan status를 `completed`로 자동 변경
- Node가 in_progress로 변경 → Milestone status를 `in_progress`로 자동 변경 (pending인 경우)

---

### 7.4 PATCH /nodes/:nodeId/order

Node 순서 변경 (칸반 내 드래그&드롭).

**인증**: Required
**소유권**: Required

**요청**:
```typescript
interface UpdateNodeOrderRequest {
  order: number;          // 새 순서 값 (0 이상 정수)
  status?: NodeStatus;    // 다른 칼럼으로 이동 시 상태도 함께 변경
}
```

**Zod 스키마**:
```typescript
const updateNodeOrderSchema = z.object({
  order: z.number().int().min(0),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
});
```

**응답 (200)**:
```typescript
// 영향받은 모든 노드의 새 순서 반환 (프론트에서 낙관적 업데이트 검증용)
interface UpdateNodeOrderResponse {
  nodes: Array<{
    id: string;
    order: number;
    status: NodeStatus;
  }>;
}
```

**로직**: 드래그한 노드의 order를 지정 값으로 설정하고, 같은 칼럼(status) 내 다른 노드들의 order를 재계산.

---

### 7.5 PUT /nodes/:nodeId

Node 내용 수정.

**인증**: Required
**소유권**: Required

**요청**:
```typescript
interface UpdateNodeRequest {
  title?: string;                    // 1-300자
  estimatedMinutes?: number | null;  // 1 이상 정수 또는 null
}
```

**Zod 스키마**:
```typescript
const updateNodeSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  estimatedMinutes: z.number().int().min(1).nullable().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});
```

**응답 (200)**:
```typescript
interface NodeResponse {
  id: string;
  milestoneId: string;
  title: string;
  status: NodeStatus;
  order: number;
  estimatedMinutes: number | null;
  generationBasis: GenerationBasis | null;
  studyGuide: StudyGuide | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## 8. 학습 세션 API

### 8.1 POST /sessions

학습 세션 시작.

**인증**: Required

**요청**:
```typescript
interface CreateSessionRequest {
  nodeId: string;          // 학습할 노드 ID (필수)
  timerType: TimerType;    // "pomodoro" | "stopwatch" (필수)
}
```

**Zod 스키마**:
```typescript
const createSessionSchema = z.object({
  nodeId: z.string().min(1),
  timerType: z.enum(['pomodoro', 'stopwatch']),
});
```

**응답 (201)**:
```typescript
interface SessionResponse {
  id: string;
  nodeId: string;
  userId: string;
  timerType: TimerType;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  status: SessionStatus;         // "active"
  createdAt: string;
}
```

**에러**: 409 `SESSION_ALREADY_ACTIVE` (해당 노드에 active 세션 존재)

**부수 효과**: Node status가 `todo`이면 자동으로 `in_progress`로 변경

---

### 8.2 PATCH /sessions/:sessionId

세션 종료 또는 일시정지.

**인증**: Required
**소유권**: Required (userId 기준)

**요청**:
```typescript
interface UpdateSessionRequest {
  status: 'paused' | 'completed';   // "paused" | "completed"
  endTime?: string;                  // ISO 8601 (completed일 때 필수)
}
```

**Zod 스키마**:
```typescript
const updateSessionSchema = z.object({
  status: z.enum(['paused', 'completed']),
  endTime: z.string().datetime().optional(),
}).refine(data => {
  if (data.status === 'completed' && !data.endTime) return false;
  return true;
}, { message: "endTime is required when completing a session" });
```

**응답 (200)**:
```typescript
interface UpdateSessionResponse {
  id: string;
  status: SessionStatus;
  endTime: string | null;
  durationMinutes: number | null;   // 서버 계산: (endTime - startTime) in minutes
  updatedAt: string;
}
```

---

### 8.3 GET /nodes/:nodeId/sessions

Node의 세션 이력 조회.

**인증**: Required
**소유권**: Required (nodeId → plan → userId)

**쿼리**: `PaginationQuery`

**응답 (200)**: `PaginatedResponse<SessionResponse>`

---

### 8.4 POST /sessions/:sessionId/logs

학습 중 상태 기록 추가.

**인증**: Required
**소유권**: Required (sessionId → userId)
**제약**: session status가 `active` 또는 `paused`인 경우만

**요청**:
```typescript
interface CreateSessionLogRequest {
  progressPercent?: number | null;        // 0-100 정수
  focusLevel?: number | null;             // 1-5 정수
  distractionType?: DistractionType | null; // "internal" | "external" | "none"
  distractionDetail?: string | null;      // 1-500자
  note?: string | null;                   // 1-1000자
}
```

**Zod 스키마**:
```typescript
const createSessionLogSchema = z.object({
  progressPercent: z.number().int().min(0).max(100).nullable().optional(),
  focusLevel: z.number().int().min(1).max(5).nullable().optional(),
  distractionType: z.enum(['internal', 'external', 'none']).nullable().optional(),
  distractionDetail: z.string().min(1).max(500).nullable().optional(),
  note: z.string().min(1).max(1000).nullable().optional(),
}).refine(data => {
  // 최소 하나의 필드는 입력되어야 함
  return Object.values(data).some(v => v !== undefined && v !== null);
}, { message: "At least one field must be provided" });
```

**응답 (201)**:
```typescript
interface SessionLogResponse {
  id: string;
  sessionId: string;
  progressPercent: number | null;
  focusLevel: number | null;
  distractionType: DistractionType | null;
  distractionDetail: string | null;
  note: string | null;
  createdAt: string;
}
```

---

## 9. 리뷰 API

### 9.1 POST /nodes/:nodeId/reviews

학습 리뷰 작성.

**인증**: Required
**소유권**: Required

**요청**:
```typescript
interface CreateReviewRequest {
  reflection?: string | null;     // 학습 회고 (1-2000자)
  difficulty?: string | null;     // 어려웠던 점 (1-2000자)
  distraction?: string | null;    // 방해 요소 (1-1000자)
  improvement?: string | null;    // 다음 보완점 (1-2000자)
}
```

**Zod 스키마**:
```typescript
const createReviewSchema = z.object({
  reflection: z.string().min(1).max(2000).nullable().optional(),
  difficulty: z.string().min(1).max(2000).nullable().optional(),
  distraction: z.string().min(1).max(1000).nullable().optional(),
  improvement: z.string().min(1).max(2000).nullable().optional(),
}).refine(data => {
  return Object.values(data).some(v => v !== undefined && v !== null);
}, { message: "At least one field must be provided" });
```

**응답 (201)**:
```typescript
interface ReviewResponse {
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
```

---

### 9.2 GET /nodes/:nodeId/reviews

Node의 리뷰 이력 조회.

**인증**: Required
**소유권**: Required

**쿼리**: `PaginationQuery`

**응답 (200)**: `PaginatedResponse<ReviewResponse>`

---

### 9.3 PUT /reviews/:reviewId

리뷰 수정.

**인증**: Required
**소유권**: Required (userId 기준)

**요청**: `CreateReviewRequest`와 동일

**응답 (200)**: `ReviewResponse`

---

## 10. 피드백 API

### 10.1 POST /feedback/generate

AI 피드백 리포트 생성 요청.

**인증**: Required

**요청**:
```typescript
interface GenerateFeedbackRequest {
  nodeId?: string;       // node scope일 때 (nodeId 또는 planId 중 하나 필수)
  planId?: string;       // plan scope일 때
  scope: FeedbackScope;  // "node" | "plan"
}
```

**Zod 스키마**:
```typescript
const generateFeedbackSchema = z.object({
  nodeId: z.string().optional(),
  planId: z.string().optional(),
  scope: z.enum(['node', 'plan']),
}).refine(data => {
  if (data.scope === 'node' && !data.nodeId) return false;
  if (data.scope === 'plan' && !data.planId) return false;
  return true;
}, { message: "nodeId is required for node scope, planId is required for plan scope" });
```

**응답 (200)**:
```typescript
interface FeedbackResponse {
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

interface ProgressAnalysis {
  expected: number;      // 예상 진행률 (0-100)
  actual: number;        // 실제 진행률 (0-100)
  gap: number;           // actual - expected (음수면 뒤처짐)
}
```

**에러**: 502 `AI_SERVICE_ERROR`, 503 `AI_SERVICE_UNAVAILABLE`

---

### 10.2 GET /nodes/:nodeId/feedback

Node별 피드백 조회.

**인증**: Required
**소유권**: Required

**쿼리**: `PaginationQuery`

**응답 (200)**: `PaginatedResponse<FeedbackResponse>`

---

### 10.3 GET /plans/:planId/feedback

계획 전체 피드백 조회.

**인증**: Required
**소유권**: Required

**쿼리**: `PaginationQuery`

**응답 (200)**: `PaginatedResponse<FeedbackResponse>`

---

## 11. 자기 관리 API (P1)

### 11.1 POST /prechecks

Pre-check 기록 생성.

**인증**: Required

**요청**:
```typescript
interface CreatePreCheckRequest {
  sessionId?: string | null;       // 연결할 세션 ID (선택)
  mentalReady: boolean;
  environmentReady: boolean;
  noiseBlocked: boolean;
  noDistraction: boolean;
  noConflictSchedule: boolean;
  warmupNote?: string | null;      // 1-1000자
}
```

**Zod 스키마**:
```typescript
const createPreCheckSchema = z.object({
  sessionId: z.string().nullable().optional(),
  mentalReady: z.boolean(),
  environmentReady: z.boolean(),
  noiseBlocked: z.boolean(),
  noDistraction: z.boolean(),
  noConflictSchedule: z.boolean(),
  warmupNote: z.string().min(1).max(1000).nullable().optional(),
});
```

**응답 (201)**:
```typescript
interface PreCheckResponse {
  id: string;
  userId: string;
  sessionId: string | null;
  mentalReady: boolean;
  environmentReady: boolean;
  noiseBlocked: boolean;
  noDistraction: boolean;
  noConflictSchedule: boolean;
  warmupNote: string | null;
  createdAt: string;
}
```

---

### 11.2 GET /prechecks

Pre-check 이력 조회.

**인증**: Required

**쿼리**: `PaginationQuery`

**응답 (200)**: `PaginatedResponse<PreCheckResponse>`

---

## 12. 프로필 API (P2)

### 12.1 GET /profile/stats

학습 통계.

**인증**: Required

**응답 (200)**:
```typescript
interface ProfileStatsResponse {
  totalStudyMinutes: number;       // 누적 공부 시간 (분)
  totalCompletedNodes: number;     // 완료 노드 수
  totalNodes: number;              // 전체 노드 수
  currentStreak: number;           // 연속 학습일 수
  longestStreak: number;           // 최장 연속 학습일
  activePlansCount: number;        // 진행 중 계획 수
}
```

---

### 12.2 GET /profile/activity

날짜별 활동 데이터 (활동 매트릭스용).

**인증**: Required

**쿼리**:
```typescript
interface ActivityQuery {
  startDate: string;    // ISO date "2026-01-01"
  endDate: string;      // ISO date "2026-04-09"
}
```

**Zod 스키마**:
```typescript
const activityQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
```

**응답 (200)**:
```typescript
interface ActivityResponse {
  activities: Array<{
    date: string;              // "2026-04-09"
    studyMinutes: number;      // 해당 날짜 총 공부 시간 (분)
    completedNodes: number;    // 해당 날짜 완료 노드 수
    sessionsCount: number;     // 해당 날짜 세션 수
  }>;
}
```

---

## 13. API 엔드포인트 요약 테이블

| # | Method | Path | 설명 | 인증 | 우선순위 |
|---|--------|------|------|------|---------|
| 1 | POST | `/auth/google` | Google OAuth 로그인 | N | P0 |
| 2 | POST | `/auth/refresh` | JWT 토큰 갱신 | Y | P0 |
| 3 | POST | `/auth/logout` | 로그아웃 | Y | P0 |
| 4 | GET | `/auth/me` | 현재 사용자 조회 | Y | P0 |
| 5 | POST | `/plans` | 새 학습 계획 생성 | Y | P0 |
| 6 | GET | `/plans` | 계획 목록 조회 | Y | P0 |
| 7 | GET | `/plans/:planId` | 계획 상세 조회 | Y | P0 |
| 8 | PATCH | `/plans/:planId/params` | 파라미터 업데이트 | Y | P0 |
| 9 | POST | `/plans/:planId/generate` | AI 계획 생성 | Y | P0 |
| 10 | PUT | `/plans/:planId/confirm` | 계획 확정 | Y | P0 |
| 11 | DELETE | `/plans/:planId` | 계획 삭제 | Y | P0 |
| 12 | GET | `/plans/:planId/goals` | Goal 목록 | Y | P0 |
| 13 | PUT | `/goals/:goalId` | Goal 수정 | Y | P0 |
| 14 | GET | `/goals/:goalId/milestones` | Milestone 목록 | Y | P0 |
| 15 | PUT | `/milestones/:milestoneId` | Milestone 수정 | Y | P0 |
| 16 | GET | `/plans/:planId/nodes` | Node 목록 (칸반) | Y | P0 |
| 17 | GET | `/nodes/:nodeId` | Node 상세 | Y | P0 |
| 18 | PATCH | `/nodes/:nodeId/status` | Node 상태 변경 | Y | P0 |
| 19 | PATCH | `/nodes/:nodeId/order` | Node 순서 변경 | Y | P0 |
| 20 | PUT | `/nodes/:nodeId` | Node 수정 | Y | P0 |
| 21 | POST | `/sessions` | 세션 시작 | Y | P0 |
| 22 | PATCH | `/sessions/:sessionId` | 세션 종료/일시정지 | Y | P0 |
| 23 | GET | `/nodes/:nodeId/sessions` | 세션 이력 | Y | P0 |
| 24 | POST | `/sessions/:sessionId/logs` | 상태 기록 | Y | P0 |
| 25 | POST | `/nodes/:nodeId/reviews` | 리뷰 작성 | Y | P0 |
| 26 | GET | `/nodes/:nodeId/reviews` | 리뷰 이력 | Y | P0 |
| 27 | PUT | `/reviews/:reviewId` | 리뷰 수정 | Y | P0 |
| 28 | POST | `/feedback/generate` | AI 피드백 생성 | Y | P0 |
| 29 | GET | `/nodes/:nodeId/feedback` | Node 피드백 | Y | P0 |
| 30 | GET | `/plans/:planId/feedback` | 계획 피드백 | Y | P0 |
| 31 | POST | `/prechecks` | Pre-check 생성 | Y | P1 |
| 32 | GET | `/prechecks` | Pre-check 이력 | Y | P1 |
| 33 | GET | `/profile/stats` | 학습 통계 | Y | P2 |
| 34 | GET | `/profile/activity` | 활동 데이터 | Y | P2 |
