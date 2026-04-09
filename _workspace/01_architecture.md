# 아키텍처 설계 문서 — LeadMe

> 버전: 1.0
> 작성일: 2026-04-09
> 기반: spec/01_prd.md, spec/02_architecture_preview.md, spec/05_wireframe.md

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | LeadMe |
| 설명 | 학습 시작, 지속, 복기를 AI가 관리해주는 학습 관리 서비스 |
| 핵심 가치 | 계획 생성이 아닌 학습 지속성 유지와 실행 관리 |
| 타깃 사용자 | 학습 목표가 있지만 자기주도 학습에 어려움을 겪는 전 연령 사용자 |
| 프로젝트 규모 | 중규모 (MVP 4-6주, 향후 네이티브 앱 확장 고려) |

---

## 2. 기능 요구사항

| # | 기능 | 설명 | 우선순위 |
|---|------|------|---------|
| FR-1 | AI 기반 학습계획 생성 | 1차 필수 7문항 → 분량 기반 기본 계획, 2차 선택 9문항 → 구조 기반 정밀 계획. MacroGoal → Milestone → TodoNode 계층 생성. 사용자 검토/수정 후 확정 | P0 |
| FR-2 | 학습 노드 기반 칸반 시스템 | Todo/InProgress/Done 칸반 보드. 드래그&드롭 상태/순서 변경. Node Page에서 Study Guide, Review, Study Tracker 제공 | P0 |
| FR-3 | 학습 상태 추적 및 피드백 | 뽀모도로/스톱워치 타이머. 정기 상태 기록(진행도, 집중도, 방해요소). AI 피드백 리포트 생성. 학습 속도 시각화(예상 vs 실제) | P0 |
| FR-4 | 자기 관리 (Pre-check / Warm-up) | 학습 전 집중 상태 점검 체크리스트 5항목. 동기부여 문장 작성 또는 명상 타이머 | P1 |
| FR-5 | 프로필 및 활동 시각화 | GitHub 잔디 스타일 활동 매트릭스. 날짜별 학습 패턴, 누적 공부 시간, 목표 달성 흐름 | P2 |

---

## 3. 비기능 요구사항

| # | 항목 | 요구사항 |
|---|------|---------|
| NFR-1 | 성능 | 페이지 로드 3초 이내, AI 응답 10초 이내 (타임아웃 15초) |
| NFR-2 | 보안 | Google OAuth 2.0 + JWT (Access + Refresh), HTTPS 필수, CORS 화이트리스트 |
| NFR-3 | 반응형 | Mobile-first, 모바일/태블릿/데스크탑 지원 (breakpoints: 640/768/1024/1280px) |
| NFR-4 | 접근성 | 직관적 UI, 최소 터치 영역 44x44px, 키보드 네비게이션 지원 |
| NFR-5 | 가용성 | Vercel 기반 배포, 99.5% 이상 가용성 |
| NFR-6 | 확장성 | SPA + REST API 완전 분리, 향후 네이티브 앱에서 동일 API 사용 가능 |
| NFR-7 | AI 교체 용이성 | AI Service Layer 추상화 — OpenRouter 모델 교체 시 서비스 코드 변경 없음 |

---

## 4. 기술 스택

| 구분 | 기술 | 버전 | 선택 근거 |
|------|------|------|----------|
| 프론트엔드 | React + Vite + TypeScript | React 19, Vite 6 | SPA로 충분 (SEO 불필요), 빠른 HMR, TypeScript 타입 안전 |
| 상태관리 (전역) | Zustand | 5.x | 보일러플레이트 최소, 작은 번들 사이즈 |
| 서버 상태 | TanStack Query | 5.x | API 캐싱, 자동 재시도, 낙관적 업데이트 (칸반 드래그에 필수) |
| UI 프레임워크 | Tailwind CSS + shadcn/ui | Tailwind 4, shadcn latest | 반응형 빠른 구현, 컴포넌트 커스터마이징 용이 |
| 드래그&드롭 | @dnd-kit/core + @dnd-kit/sortable | 6.x | React 18/19 호환, 접근성 지원, 가벼운 번들 |
| 차트 | Recharts | 2.x | React 네이티브, 반응형 차트, 작은 번들 |
| 폼/검증 | React Hook Form + Zod | RHF 7, Zod 3 | 비제어 컴포넌트 성능, 스키마 기반 검증 (백엔드와 스키마 공유) |
| 라우터 | React Router | 7.x | SPA 라우팅 표준 |
| 백엔드 | Express + TypeScript | Express 5, TS 5.5 | Vercel Serverless 네이티브 지원, JS 풀스택 통일 |
| ORM | Prisma | 6.x | TypeScript 타입 생성, 스키마 기반 마이그레이션, 관계 쿼리 |
| DB | PostgreSQL (Supabase) | PG 16 | 계층적 관계 데이터, JSONB, Supabase 무료 티어(500MB) |
| 인증 | Passport.js + JWT | Passport 0.7 | Express 네이티브 통합, Google OAuth 2.0 Strategy, JWT로 무상태 세션 |
| 입력 검증 (서버) | Zod | 3.x | 프론트/백 스키마 공유, TypeScript 추론 |
| AI | OpenRouter API | - | google/gemma-4-26b-a4b-it:free. MVP 무료 검증, 모델 교체 용이 |
| 배포 (프론트) | Vercel | - | 정적 SPA 배포, 자동 프리뷰 배포, CDN |
| 배포 (백엔드) | Vercel Serverless Functions | - | Express adapter로 배포, 프론트와 동일 플랫폼. 트래픽 증가 시 Railway 전환 가능 |
| 모노레포 | 단순 폴더 분리 (frontend/ + backend/) | - | MVP 규모에서 Turborepo 오버헤드 불필요 |

### 트레이드오프 기록

| 결정 | 대안 | 트레이드오프 |
|------|------|------------|
| Express (not Next.js API Routes) | Next.js full-stack | SPA 선택으로 SSR 불필요, Express가 Passport.js 통합 자연스러움, 향후 네이티브 앱 동일 서버 |
| Supabase PostgreSQL (not SQLite) | SQLite + Turso | 계층 JOIN 쿼리, 다중 사용자, JSONB 지원. Supabase 무료 티어 500MB로 MVP 충분 |
| JWT (not Session Cookie) | 서버 세션 | 향후 네이티브 앱 대응, 무상태 서버, Vercel Serverless 친화. 단, Refresh Token 관리 필요 |
| Zustand (not Redux Toolkit) | Redux Toolkit | 학습 관리 앱의 전역 상태가 크지 않음, Zustand으로 보일러플레이트 최소화 |
| @dnd-kit (not react-beautiful-dnd) | react-beautiful-dnd | rbd는 더 이상 적극 유지보수 안 됨, dnd-kit이 React 19 호환 및 접근성 우수 |

---

## 5. 시스템 아키텍처

```mermaid
graph TB
    subgraph Client["Client (React 19 + Vite)"]
        Router[React Router 7]
        Pages[Pages / Layouts]
        Components[UI Components<br/>shadcn/ui + Tailwind]
        ZS[Zustand Store<br/>auth, ui, timer]
        RQ[TanStack Query<br/>plans, nodes, sessions]
        DND["@dnd-kit<br/>칸반 드래그&드롭"]
    end

    subgraph Server["Server (Express 5 + TypeScript)"]
        MW[Middleware Layer<br/>auth, validate, error, cors, rateLimit]
        AUTH_R[Auth Routes<br/>/api/v1/auth/*]
        PLAN_R[Plan Routes<br/>/api/v1/plans/*]
        NODE_R[Node Routes<br/>/api/v1/nodes/*]
        SESSION_R[Session Routes<br/>/api/v1/sessions/*]
        REVIEW_R[Review Routes<br/>/api/v1/reviews/*]
        FEEDBACK_R[Feedback Routes<br/>/api/v1/feedback/*]
        AUTH_SVC[Auth Service<br/>Passport + JWT]
        PLAN_SVC[Plan Service]
        NODE_SVC[Node Service]
        SESSION_SVC[Session Service]
        REVIEW_SVC[Review Service]
        FEEDBACK_SVC[Feedback Service]
        AI_SVC[AI Service Layer<br/>OpenRouter Adapter]
        PROMPT[Prompt Manager<br/>planner, coach, structurer]
    end

    subgraph External["External Services"]
        GOOGLE[Google OAuth 2.0]
        OPENROUTER[OpenRouter API<br/>gemma-4-26b-a4b-it:free]
    end

    subgraph Data["Data Layer"]
        PRISMA[Prisma ORM<br/>Type-safe Client]
        PG[(PostgreSQL 16<br/>Supabase)]
    end

    Router --> Pages
    Pages --> Components
    Pages --> ZS
    Pages --> RQ
    Pages --> DND
    RQ -->|HTTP REST| MW
    MW --> AUTH_R
    MW --> PLAN_R
    MW --> NODE_R
    MW --> SESSION_R
    MW --> REVIEW_R
    MW --> FEEDBACK_R
    AUTH_R --> AUTH_SVC
    AUTH_SVC -->|OAuth 2.0| GOOGLE
    PLAN_R --> PLAN_SVC
    NODE_R --> NODE_SVC
    SESSION_R --> SESSION_SVC
    REVIEW_R --> REVIEW_SVC
    FEEDBACK_R --> FEEDBACK_SVC
    PLAN_SVC --> AI_SVC
    FEEDBACK_SVC --> AI_SVC
    AI_SVC --> PROMPT
    AI_SVC -->|REST| OPENROUTER
    PLAN_SVC --> PRISMA
    NODE_SVC --> PRISMA
    SESSION_SVC --> PRISMA
    REVIEW_SVC --> PRISMA
    FEEDBACK_SVC --> PRISMA
    AUTH_SVC --> PRISMA
    PRISMA --> PG
```

---

## 6. 프론트엔드 컴포넌트 구조

### 6.1 라우팅

| 경로 | 페이지 컴포넌트 | 인증 | 레이아웃 | 설명 |
|------|---------------|------|---------|------|
| `/login` | `LoginPage` | Public | `AuthLayout` | Google 소셜 로그인 |
| `/` | `DashboardPage` | Protected | `AppLayout` | 활성 계획 요약, 오늘 할 일, 최근 피드백 |
| `/plans` | `PlansPage` | Protected | `AppLayout` | 전체 계획 목록 (탭 필터: 진행 중/완료/보관) |
| `/plans/new` | `PlanWizardPage` | Protected | `WizardLayout` | AI 질문 기반 계획 생성 위자드 |
| `/plans/:planId` | `PlanDetailPage` | Protected | `AppLayout` | 계획 상세 (Goal/Milestone/Todo 계층 뷰) |
| `/plans/:planId/kanban` | `KanbanPage` | Protected | `AppLayout` | 칸반 보드 (Milestone 필터) |
| `/nodes/:nodeId` | `NodePage` | Protected | `AppLayout` | Study Guide + Timer + 상태 기록 + Review + Feedback |
| `/plans/:planId/feedback` | `FeedbackPage` | Protected | `AppLayout` | 계획 전체 AI 피드백 리포트 |
| `/precheck` | `PreCheckPage` | Protected | `AppLayout` | 학습 전 자기 관리 (P1) |
| `/profile` | `ProfilePage` | Protected | `AppLayout` | 활동 매트릭스, 누적 통계 (P2) |

### 6.2 레이아웃 구조

```
AuthLayout          — 로그인 페이지 전용 (센터 정렬, 최소 UI)
WizardLayout        — 위자드 전용 (진행 표시줄, 뒤로 가기)
AppLayout           — 메인 앱 (Header + Sidebar/BottomNav + Content)
  ├── Header        — 로고, 프로필 아바타, 로그아웃
  ├── Sidebar       — 데스크탑: 사이드 네비게이션 (홈, 계획, 프리체크, 프로필)
  ├── BottomNav     — 모바일: 하단 네비게이션 바
  └── Content       — 페이지 렌더링 영역
```

### 6.3 주요 컴포넌트 트리

```
components/
├── auth/
│   ├── GoogleLoginButton.tsx     — Google OAuth 로그인 버튼
│   ├── AuthGuard.tsx             — 인증 라우트 가드 (미인증 시 /login 리디렉트)
│   └── AuthProvider.tsx          — JWT 토큰 관리, 자동 갱신, 로그아웃
├── layout/
│   ├── AppLayout.tsx             — 메인 앱 레이아웃
│   ├── AuthLayout.tsx            — 로그인 레이아웃
│   ├── WizardLayout.tsx          — 위자드 레이아웃
│   ├── Header.tsx                — 상단 헤더
│   ├── Sidebar.tsx               — 데스크탑 사이드바
│   └── BottomNav.tsx             — 모바일 하단 네비게이션
├── dashboard/
│   ├── DashboardSummary.tsx      — 활성 계획 카드 (진행률 바)
│   ├── TodayTodos.tsx            — 오늘 할 일 목록
│   ├── QuickActions.tsx          — 빠른 진입 버튼 (새 계획, 이어서 학습)
│   └── RecentFeedback.tsx        — 최근 AI 피드백 요약
├── plan/
│   ├── PlanList.tsx              — 계획 목록 (필터 탭 포함)
│   ├── PlanCard.tsx              — 계획 카드 (제목, 진행률, 최근 학습)
│   ├── FilterTabs.tsx            — 상태 필터 탭 (진행 중/완료/보관)
│   ├── PlanWizard.tsx            — 위자드 컨테이너 (스텝 관리)
│   ├── QuestionStep.tsx          — 개별 질문 스텝 (텍스트/선택/날짜 입력)
│   ├── AnswerSummary.tsx         — 이전 답변 요약 표시
│   ├── PlanPreview.tsx           — AI 생성 계획 초안 프리뷰
│   ├── EditableGoal.tsx          — 수정 가능한 Goal/Milestone/Todo 트리
│   └── PlanOverview.tsx          — 계획 상세 계층 뷰
├── kanban/
│   ├── KanbanBoard.tsx           — 칸반 보드 컨테이너 (dnd-kit DndContext)
│   ├── KanbanColumn.tsx          — 상태별 칼럼 (Todo/InProgress/Done)
│   ├── NodeCard.tsx              — 노드 카드 (제목, 예상 시간, 진행률)
│   ├── MilestoneFilter.tsx       — 마일스톤 선택 드롭다운
│   └── KanbanSkeleton.tsx        — 로딩 스켈레톤
├── node/
│   ├── StudyGuide.tsx            — 학습 가이드 표시 (목표, 사전지식, 생성근거)
│   ├── FocusTimer.tsx            — 뽀모도로/스톱워치 타이머
│   ├── TimerControls.tsx         — 타이머 시작/일시정지/종료 버튼
│   ├── StatusRecorder.tsx        — 상태 기록 폼 (진행도, 집중도, 방해요소, 메모)
│   ├── StatusTimeline.tsx        — 상태 기록 타임라인 표시
│   ├── ReviewForm.tsx            — 학습 리뷰 작성 폼
│   └── NodeFeedback.tsx          — 노드별 AI 피드백 표시
├── feedback/
│   ├── FeedbackCard.tsx          — 피드백 카드 (요약, 제안, 동기부여)
│   ├── ProgressChart.tsx         — 예상 vs 실제 진행률 차트 (Recharts)
│   └── FeedbackList.tsx          — 피드백 이력 목록
├── precheck/                     — P1
│   ├── PreCheckForm.tsx          — 체크리스트 5항목
│   └── WarmupTimer.tsx           — 명상 타이머
├── profile/                      — P2
│   ├── ActivityMatrix.tsx        — GitHub 잔디 스타일 매트릭스
│   └── StatsChart.tsx            — 누적 통계 차트
└── ui/                           — shadcn/ui 공통 컴포넌트
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── input.tsx
    ├── select.tsx
    ├── tabs.tsx
    ├── progress.tsx
    ├── skeleton.tsx
    ├── toast.tsx
    └── ... (shadcn/ui 기본 컴포넌트)
```

### 6.4 Zustand 스토어

| 스토어 | 상태 | 용도 |
|--------|------|------|
| `useAuthStore` | `user`, `accessToken`, `refreshToken`, `isAuthenticated` | JWT 토큰 관리, 사용자 정보 |
| `useTimerStore` | `timerType`, `status`, `elapsed`, `sessionId`, `pomodoroCount` | 타이머 상태 (브라우저 탭 유지) |
| `useUIStore` | `sidebarOpen`, `currentMilestoneId`, `wizardStep` | UI 상태 |

### 6.5 TanStack Query 키 설계

| Query Key | 엔드포인트 | staleTime | 비고 |
|-----------|-----------|-----------|------|
| `['auth', 'me']` | GET /auth/me | 5분 | 토큰 갱신 시 invalidate |
| `['plans']` | GET /plans | 30초 | 목록 캐싱 |
| `['plans', planId]` | GET /plans/:planId | 30초 | 상세 (Goals/Milestones/Todos 포함) |
| `['plans', planId, 'nodes']` | GET /plans/:planId/nodes | 10초 | 칸반 보드 (낙관적 업데이트 사용) |
| `['nodes', nodeId]` | GET /nodes/:nodeId | 30초 | 노드 상세 |
| `['nodes', nodeId, 'sessions']` | GET /nodes/:nodeId/sessions | 1분 | 세션 이력 |
| `['nodes', nodeId, 'reviews']` | GET /nodes/:nodeId/reviews | 1분 | 리뷰 이력 |
| `['nodes', nodeId, 'feedback']` | GET /nodes/:nodeId/feedback | 5분 | 노드별 피드백 |
| `['plans', planId, 'feedback']` | GET /plans/:planId/feedback | 5분 | 계획 전체 피드백 |
| `['profile', 'stats']` | GET /profile/stats | 5분 | P2 프로필 |

---

## 7. 백엔드 모듈 구조

### 7.1 계층 구조

```
Request → Middleware → Route → Controller → Service → Repository (Prisma) → DB
                                                  ↘ AI Service → OpenRouter
```

### 7.2 모듈별 책임

| 모듈 | 파일 | 책임 |
|------|------|------|
| **auth** | `routes/auth.ts`, `services/auth.service.ts`, `middleware/auth.ts`, `config/passport.ts` | Google OAuth 콜백, JWT 발급/갱신/검증, 사용자 조회/생성, 인증 미들웨어 |
| **plans** | `routes/plans.ts`, `services/plan.service.ts` | 학습 계획 CRUD, 파라미터 수집/검증, 계획 확정(draft→active), AI 계획 생성 트리거 |
| **goals** | `routes/goals.ts`, `services/goal.service.ts` | MacroGoal/Milestone 조회/수정 |
| **nodes** | `routes/nodes.ts`, `services/node.service.ts` | TodoNode CRUD, 상태 변경(todo/in_progress/done), 순서 변경(batch), 소유권 검증 |
| **sessions** | `routes/sessions.ts`, `services/session.service.ts` | 학습 세션 시작/종료, 세션 로그 추가, 세션 이력 조회 |
| **reviews** | `routes/reviews.ts`, `services/review.service.ts` | 학습 리뷰 CRUD, 노드별 리뷰 조회 |
| **feedback** | `routes/feedback.ts`, `services/feedback.service.ts` | AI 피드백 생성 트리거, 노드/계획별 피드백 조회 |
| **ai** | `services/ai.service.ts`, `prompts/*.ts` | OpenRouter API 통신, 프롬프트 조합, 응답 파싱, 재시도, 타임아웃 |
| **middleware** | `middleware/auth.ts`, `middleware/validate.ts`, `middleware/error.ts`, `middleware/rateLimit.ts` | JWT 검증, Zod 스키마 검증, 전역 에러 핸들러, Rate Limiting |
| **config** | `config/env.ts`, `config/passport.ts`, `config/cors.ts` | 환경변수 파싱(Zod), Passport 전략, CORS 설정 |

### 7.3 AI Service Layer 상세

```typescript
// ai.service.ts 구조

interface AIServiceConfig {
  apiKey: string;
  model: string;        // default: "google/gemma-4-26b-a4b-it:free"
  baseUrl: string;      // "https://openrouter.ai/api/v1"
  timeout: number;      // 15000ms
  maxRetries: number;   // 2
}

interface AIRequest {
  role: 'planner' | 'coach' | 'structurer';
  prompt: string;
  params: Record<string, unknown>;
  temperature?: number;  // planner: 0.7, coach: 0.8, structurer: 0.3
}

interface AIResponse<T> {
  success: boolean;
  data: T | null;
  rawResponse: string;
  tokenUsage: { prompt: number; completion: number };
}
```

**역할별 프롬프트**:

| 역할 | 파일 | 입력 | 출력 | temperature |
|------|------|------|------|-------------|
| Structurer | `prompts/structurer.ts` | 사용자 자연어 답변 | 구조화된 파라미터 JSON | 0.3 |
| Planner (basic) | `prompts/planner.ts` | 1차 파라미터 | MacroGoal → Milestone → Todo JSON | 0.7 |
| Planner (detailed) | `prompts/planner.ts` | 1차+2차 파라미터 | 구조 기반 정밀 계획 JSON | 0.7 |
| Coach | `prompts/coach.ts` | 학습 기록 (세션, 로그, 리뷰) + management_style | 피드백 리포트 JSON | 0.8 |

**AI 응답 파싱 전략**:
- 모든 AI 응답은 JSON 모드로 요청 (`response_format: { type: "json_object" }`)
- 응답을 Zod 스키마로 검증 — 실패 시 1회 재시도 (프롬프트에 에러 메시지 포함)
- 2회 연속 파싱 실패 시 `AI_SERVICE_ERROR` 반환
- 타임아웃: 15초 (AI 응답 10초 NFR + 네트워크 마진)

---

## 8. 디렉토리 구조

```
leadme/
├── frontend/                          # React 19 + Vite + TypeScript
│   ├── src/
│   │   ├── components/                # 6.3절 참조
│   │   │   ├── auth/
│   │   │   ├── layout/
│   │   │   ├── dashboard/
│   │   │   ├── plan/
│   │   │   ├── kanban/
│   │   │   ├── node/
│   │   │   ├── feedback/
│   │   │   ├── precheck/              # P1
│   │   │   ├── profile/               # P2
│   │   │   └── ui/                    # shadcn/ui
│   │   ├── hooks/
│   │   │   ├── useAuth.ts             # 인증 훅 (로그인/로그아웃/토큰 갱신)
│   │   │   ├── usePlans.ts            # 계획 CRUD 쿼리 훅
│   │   │   ├── useNodes.ts            # 노드 쿼리 + 낙관적 업데이트
│   │   │   ├── useSessions.ts         # 세션 쿼리 훅
│   │   │   ├── useTimer.ts            # 타이머 로직 훅
│   │   │   └── useFeedback.ts         # 피드백 쿼리 훅
│   │   ├── stores/
│   │   │   ├── authStore.ts           # Zustand: 인증 상태
│   │   │   ├── timerStore.ts          # Zustand: 타이머 상태
│   │   │   └── uiStore.ts            # Zustand: UI 상태
│   │   ├── services/
│   │   │   └── api.ts                 # Axios 인스턴스, 인터셉터 (JWT 자동 첨부, 401 갱신)
│   │   ├── types/
│   │   │   ├── api.ts                 # API 요청/응답 타입
│   │   │   ├── models.ts             # 도메인 모델 타입
│   │   │   └── common.ts             # 공통 타입 (Pagination, ApiError 등)
│   │   ├── lib/
│   │   │   ├── validations.ts         # Zod 스키마 (백엔드와 공유 가능)
│   │   │   └── utils.ts              # 유틸리티 (날짜 포맷, 진행률 계산 등)
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PlansPage.tsx
│   │   │   ├── PlanWizardPage.tsx
│   │   │   ├── PlanDetailPage.tsx
│   │   │   ├── KanbanPage.tsx
│   │   │   ├── NodePage.tsx
│   │   │   ├── FeedbackPage.tsx
│   │   │   ├── PreCheckPage.tsx       # P1
│   │   │   └── ProfilePage.tsx        # P2
│   │   ├── router.tsx                 # React Router 설정
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── components.json               # shadcn/ui 설정
│   └── package.json
│
├── backend/                           # Express 5 + TypeScript
│   ├── src/
│   │   ├── routes/
│   │   │   ├── index.ts               # 라우터 등록
│   │   │   ├── auth.routes.ts
│   │   │   ├── plans.routes.ts
│   │   │   ├── goals.routes.ts
│   │   │   ├── nodes.routes.ts
│   │   │   ├── sessions.routes.ts
│   │   │   ├── reviews.routes.ts
│   │   │   └── feedback.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── plan.service.ts
│   │   │   ├── goal.service.ts
│   │   │   ├── node.service.ts
│   │   │   ├── session.service.ts
│   │   │   ├── review.service.ts
│   │   │   ├── feedback.service.ts
│   │   │   └── ai.service.ts          # OpenRouter 통신 추상화
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts      # JWT 검증
│   │   │   ├── validate.middleware.ts  # Zod 스키마 검증
│   │   │   ├── error.middleware.ts     # 전역 에러 핸들러
│   │   │   ├── rateLimit.middleware.ts # Rate Limiting
│   │   │   └── ownership.middleware.ts # 리소스 소유권 검증
│   │   ├── config/
│   │   │   ├── env.ts                 # 환경변수 Zod 파싱
│   │   │   ├── passport.ts            # Google OAuth Strategy
│   │   │   └── cors.ts               # CORS 설정
│   │   ├── prompts/
│   │   │   ├── planner.ts             # 계획 생성 프롬프트
│   │   │   ├── coach.ts              # 피드백 코치 프롬프트
│   │   │   └── structurer.ts          # 응답 구조화 프롬프트
│   │   ├── schemas/                   # Zod 검증 스키마
│   │   │   ├── auth.schema.ts
│   │   │   ├── plan.schema.ts
│   │   │   ├── node.schema.ts
│   │   │   ├── session.schema.ts
│   │   │   ├── review.schema.ts
│   │   │   └── feedback.schema.ts
│   │   ├── types/
│   │   │   ├── express.d.ts           # Express Request 확장 (req.user)
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── errors.ts             # 커스텀 에러 클래스 (AppError)
│   │   │   └── logger.ts             # 로거
│   │   └── app.ts                     # Express 앱 초기화
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts                    # 시드 데이터
│   ├── tsconfig.json
│   ├── vercel.json                    # Vercel Serverless 설정
│   └── package.json
│
├── shared/                            # 프론트/백 공유 타입 (선택)
│   └── types/
│       └── index.ts                   # 공유 인터페이스, 열거형
│
├── spec/                              # 기획 문서 (이 파일들)
├── _workspace/                        # 상세 설계 문서
├── idea.md
├── idea_inquiry.md
└── README.md
```

---

## 9. 환경변수 목록

### Backend (.env)

| 변수명 | 필수 | 설명 | 예시 |
|--------|------|------|------|
| `DATABASE_URL` | Y | PostgreSQL 연결 문자열 (Supabase) | `postgresql://user:pass@host:5432/leadme?sslmode=require` |
| `GOOGLE_CLIENT_ID` | Y | Google OAuth 클라이언트 ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Y | Google OAuth 시크릿 | `GOCSPX-xxx` |
| `GOOGLE_CALLBACK_URL` | Y | OAuth 콜백 URL | `https://api.leadme.app/api/v1/auth/google/callback` |
| `JWT_ACCESS_SECRET` | Y | Access Token 서명 키 (32자 이상) | `random-string-32+` |
| `JWT_REFRESH_SECRET` | Y | Refresh Token 서명 키 (32자 이상) | `different-random-string-32+` |
| `JWT_ACCESS_EXPIRES_IN` | N | Access Token 만료 시간 | `15m` (기본값) |
| `JWT_REFRESH_EXPIRES_IN` | N | Refresh Token 만료 시간 | `7d` (기본값) |
| `OPENROUTER_API_KEY` | Y | OpenRouter API 키 | `sk-or-v1-xxx` |
| `OPENROUTER_MODEL` | N | AI 모델 ID | `google/gemma-4-26b-a4b-it:free` (기본값) |
| `OPENROUTER_BASE_URL` | N | OpenRouter 엔드포인트 | `https://openrouter.ai/api/v1` (기본값) |
| `FRONTEND_URL` | Y | 프론트엔드 URL (CORS, OAuth redirect) | `https://leadme.vercel.app` |
| `NODE_ENV` | N | 환경 구분 | `development` / `production` |
| `PORT` | N | 서버 포트 | `3001` (기본값) |
| `RATE_LIMIT_WINDOW_MS` | N | Rate Limit 윈도우 (ms) | `60000` (기본값) |
| `RATE_LIMIT_MAX` | N | Rate Limit 최대 요청 수 | `100` (기본값) |

### Frontend (.env)

| 변수명 | 필수 | 설명 | 예시 |
|--------|------|------|------|
| `VITE_API_BASE_URL` | Y | 백엔드 API URL | `https://api.leadme.app/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | Y | Google OAuth 클라이언트 ID | `xxx.apps.googleusercontent.com` |

---

## 10. 인증 흐름 상세

### 10.1 로그인 흐름

```mermaid
sequenceDiagram
    actor User
    participant FE as React Client
    participant BE as Express Server
    participant Google as Google OAuth

    User->>FE: "Google로 계속하기" 클릭
    FE->>Google: OAuth 동의 화면 리디렉트<br/>(client_id, redirect_uri, scope: email profile)
    Google-->>User: 동의 요청
    User->>Google: 동의
    Google-->>FE: redirect with authorization code
    FE->>BE: POST /api/v1/auth/google { code }
    BE->>Google: code → access_token 교환
    Google-->>BE: access_token, id_token
    BE->>Google: id_token 검증 → email, name, picture, sub
    BE->>BE: User 조회 (googleId)<br/>없으면 신규 생성
    BE->>BE: JWT 발급 (access: 15m, refresh: 7d)
    BE->>BE: refreshToken을 DB에 해시 저장
    BE-->>FE: { accessToken, refreshToken, user }
    FE->>FE: Zustand에 토큰/유저 저장<br/>localStorage에 refreshToken 저장
```

### 10.2 토큰 갱신 흐름

```mermaid
sequenceDiagram
    participant FE as React Client
    participant BE as Express Server

    FE->>BE: API 요청 (accessToken 만료)
    BE-->>FE: 401 UNAUTHORIZED
    FE->>FE: Axios 인터셉터 → 갱신 트리거
    FE->>BE: POST /api/v1/auth/refresh { refreshToken }
    BE->>BE: refreshToken 검증 + DB 해시 비교
    alt 유효
        BE->>BE: 새 accessToken + refreshToken 발급<br/>이전 refreshToken 무효화 (Rotation)
        BE-->>FE: { accessToken, refreshToken }
        FE->>FE: 토큰 교체 후 원래 요청 재시도
    else 무효/만료
        BE-->>FE: 401 INVALID_TOKEN
        FE->>FE: 로그아웃 → /login 리디렉트
    end
```

### 10.3 Refresh Token 관리 정책

| 항목 | 정책 |
|------|------|
| 저장 위치 (서버) | `users` 테이블의 `refresh_token_hash` 컬럼 (bcrypt 해시) |
| 저장 위치 (클라이언트) | localStorage (MVP), 향후 httpOnly cookie 검토 |
| Rotation | 갱신 시 이전 토큰 무효화 + 새 토큰 발급 |
| 만료 시간 | 7일 |
| 동시 세션 | MVP에서는 단일 세션 (마지막 로그인의 refreshToken만 유효) |

---

## 11. 프론트엔드 전달 사항

- **라우팅**: React Router 7, `AuthGuard`로 Protected 라우트 감싸기
- **API 통신**: Axios 인스턴스에 JWT 자동 첨부 인터셉터 + 401 시 토큰 갱신 로직
- **칸반 드래그**: `@dnd-kit/core` + `@dnd-kit/sortable` 사용, 낙관적 업데이트로 UX 확보 (실패 시 롤백)
- **타이머**: `useTimerStore`에서 관리, `setInterval` 기반, 브라우저 탭 비활성 시 `document.hidden` 감지하여 경과 시간 보정
- **위자드 상태**: `PlanWizard`에서 로컬 상태로 관리, 각 스텝 완료 시 서버에 `PATCH /plans/:id/params` 호출
- **Mobile-first**: Tailwind breakpoints 사용, 칸반은 모바일에서 세로 스크롤 (칼럼 세로 배치)
- **로딩/에러**: TanStack Query의 `isLoading`, `isError` + shadcn/ui Skeleton, Toast

## 12. 백엔드 전달 사항

- **미들웨어 순서**: cors → rateLimit → bodyParser → passport.initialize → routes → errorHandler
- **인증 미들웨어**: `authMiddleware`는 JWT 검증 + `req.user`에 사용자 정보 부착
- **소유권 검증**: `ownershipMiddleware`로 plan/node가 `req.user.id` 소유인지 확인 (403 FORBIDDEN)
- **입력 검증**: `validateMiddleware(schema)`로 Zod 스키마 적용 (body, params, query 별도)
- **에러 핸들링**: `AppError` 클래스 상속, `errorMiddleware`에서 통일된 에러 응답 형식
- **AI 호출**: `ai.service.ts`에서 OpenRouter 추상화, 프롬프트는 `prompts/` 디렉토리에서 관리, 응답은 Zod 스키마로 검증
- **트랜잭션**: 계획 생성 (`generate`) 시 MacroGoal + Milestone + TodoNode 일괄 생성은 `prisma.$transaction` 사용
- **계획 확정**: `confirm` 시 status를 `active`로 변경하고, 이미 `active`/`completed`인 경우 409 반환

## 13. QA 전달 사항

- **핵심 E2E 시나리오**: 로그인 → 계획 생성 (7문항) → 계획 프리뷰 → 확정 → 칸반 드래그 → 노드 진입 → 타이머 → 상태 기록 → 리뷰 → 피드백
- **인증 테스트**: 토큰 만료 시 자동 갱신, 무효 토큰 시 로그아웃
- **칸반 테스트**: 드래그&드롭 상태 변경, 순서 변경, 낙관적 업데이트 롤백
- **AI 테스트**: OpenRouter 타임아웃, 파싱 실패, 재시도 로직
- **API 테스트**: 모든 엔드포인트의 성공/실패/인증/소유권 케이스
- **반응형 테스트**: 모바일(375px), 태블릿(768px), 데스크탑(1280px)

## 14. DevOps 전달 사항

- **Vercel 배포**: 프론트엔드는 Vite 빌드 → Vercel 정적 배포, 백엔드는 `vercel.json`으로 Serverless Functions 배포
- **환경변수**: Vercel Dashboard에서 설정, `.env.example` 파일로 문서화
- **Supabase**: PostgreSQL 프로비저닝, `DATABASE_URL` 발급, Connection Pooling 활성화 (Serverless 환경 필수)
- **도메인**: 프론트 `leadme.vercel.app`, 백엔드 `api-leadme.vercel.app` (또는 커스텀 도메인)
- **CORS**: 백엔드에서 `FRONTEND_URL`만 허용
- **프리뷰 배포**: PR별 자동 프리뷰 배포 (Vercel 기본 기능)
- **모니터링**: Vercel Analytics (프론트), Vercel Functions Log (백엔드), 향후 Sentry 검토
