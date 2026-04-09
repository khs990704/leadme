# 아키텍처 초안 — LeadMe

> 버전: 0.1 (spec 초안)
> 작성일: 2026-04-09

---

## 1. 기술 스택 추천

| 구분 | 기술 | 선택 근거 |
|------|------|----------|
| 프론트엔드 | **React 19 + Vite** | 사용자 결정. SPA로 충분, SSR 불필요 (SEO 우선순위 낮음) |
| 상태관리 | **Zustand** | 사용자 결정. 가벼운 전역 상태 관리 |
| 서버 상태 | **TanStack Query (React Query)** | API 호출 캐싱, AI 응답 스트리밍 처리에 적합 |
| UI | **Tailwind CSS + shadcn/ui** | 반응형 빠른 구현, 컴포넌트 재사용 |
| 백엔드 | **Node.js + Express** | Vercel 배포 최적화, OpenRouter API 연동 용이, JS 풀스택 통일로 러닝커브 최소화 |
| ORM | **Prisma** | TypeScript 타입 안전, 스키마 기반 마이그레이션 |
| DB | **PostgreSQL (Supabase)** | 관계형 데이터 (계획-마일스톤-투두 계층), Supabase 무료 티어로 MVP 가능, Vercel 통합 용이 |
| 인증 | **NextAuth.js (Auth.js)** → 수정: **Passport.js + JWT** | Express 기반이므로 Passport.js로 Google OAuth 처리, JWT로 세션 관리. 향후 네이티브 앱 대응에 JWT가 유리 |
| AI | **OpenRouter API** (google/gemma-4-26b-a4b-it:free) | MVP 무료 검증, 모델 교체 용이 |
| 배포 | **Vercel** (프론트) + **Vercel Serverless Functions** 또는 **Railway** (백엔드) | 사용자 결정. Express 서버는 Vercel Serverless 또는 Railway에 배포 |
| 모노레포 | 선택사항: **Turborepo** 또는 단순 폴더 분리 | MVP 규모에서는 폴더 분리로 충분 |

### 백엔드 선택 근거: Express vs FastAPI

| 기준 | Express (Node.js) | FastAPI (Python) |
|------|-------------------|-----------------|
| Vercel 배포 | Serverless Functions 네이티브 지원 | 가능하나 설정 복잡 |
| OpenRouter 연동 | fetch/axios로 직접 호출, SSE 스트리밍 자연스러움 | httpx로 가능, 동등 |
| 프론트-백 언어 통일 | TypeScript 풀스택 (러닝커브 최소화) | 언어 전환 필요 |
| 향후 네이티브 앱 | REST API 동일 사용 | 동일 |
| 타입 안전 | TypeScript + Prisma | Pydantic |

**결론**: TypeScript 풀스택 + Vercel 네이티브 배포를 고려하여 **Express** 추천.

### DB 선택 근거: PostgreSQL (Supabase) vs SQLite

| 기준 | PostgreSQL (Supabase) | SQLite |
|------|----------------------|--------|
| 관계형 쿼리 | 복잡한 JOIN, 집계 최적 | 단순 쿼리에 적합 |
| 동시 접속 | 다수 사용자 지원 | 단일 연결 제한 |
| Vercel 통합 | Supabase 직접 연동 | Turso/Cloudflare 필요 |
| 향후 확장 | 네이티브 앱 공유 DB | 제한적 |
| 무료 티어 | Supabase 500MB 무료 | 파일 기반 무료 |

**결론**: 계층적 데이터 구조(Plan → Goal → Milestone → Todo)와 다중 사용자를 고려하여 **PostgreSQL (Supabase)** 추천.

---

## 2. 시스템 구성도

```mermaid
graph TB
    subgraph Client["Client (React + Vite)"]
        UI[React UI<br/>shadcn/ui + Tailwind]
        ZS[Zustand Store]
        RQ[TanStack Query]
    end

    subgraph Server["Server (Express + Node.js)"]
        AUTH[Auth Module<br/>Passport.js + JWT]
        API[REST API Routes]
        AI_SVC[AI Service Layer]
        BIZ[Business Logic]
    end

    subgraph External["External Services"]
        GOOGLE[Google OAuth 2.0]
        OPENROUTER[OpenRouter API<br/>gemma-4-26b]
    end

    subgraph Data["Data Layer"]
        PRISMA[Prisma ORM]
        PG[(PostgreSQL<br/>Supabase)]
    end

    UI --> ZS
    UI --> RQ
    RQ -->|HTTP/SSE| API
    API --> AUTH
    AUTH -->|OAuth| GOOGLE
    API --> BIZ
    BIZ --> AI_SVC
    AI_SVC -->|REST + SSE| OPENROUTER
    BIZ --> PRISMA
    PRISMA --> PG
```

---

## 3. 주요 컴포넌트

### 프론트엔드

| 컴포넌트 | 역할 |
|---------|------|
| `AuthProvider` | Google OAuth 로그인/로그아웃, JWT 토큰 관리 |
| `PlanWizard` | 단계형 질문 UI (1차 7개 → 기본 계획 → 2차 9개 → 정밀 계획) |
| `KanbanBoard` | Todo/InProgress/Done 칸반 보드, 드래그&드롭 |
| `NodePage` | 개별 Todo Node 상세 페이지 (Study Guide + Review + Tracker) |
| `FocusTimer` | 뽀모도로 타이머 / 스톱워치 |
| `StatusRecorder` | 학습 중 상태 기록 폼 |
| `FeedbackReport` | AI 피드백 리포트 표시 |
| `PreCheck` | 학습 전 집중 상태 체크리스트 (P1) |
| `ProfileDashboard` | 학습 활동 시각화 (P2) |

### 백엔드

| 모듈 | 역할 |
|------|------|
| `auth/` | Google OAuth 콜백, JWT 발급/검증, 미들웨어 |
| `plans/` | 학습 계획 CRUD, 파라미터 수집, 계획 확정 |
| `nodes/` | 칸반 Node CRUD, 상태 변경, 순서 관리 |
| `sessions/` | 학습 세션 (타이머, 상태 기록) CRUD |
| `ai/` | OpenRouter 통신, 프롬프트 관리, 응답 파싱 |
| `feedback/` | 피드백 리포트 생성 요청, 결과 저장 |

### AI Service Layer

| 역할 | 설명 |
|------|------|
| 질문자 (Questioner) | 정해진 질문 순서에 따라 사용자 응답 수집 |
| 구조화자 (Structurer) | 사용자 응답을 파라미터 JSON으로 정리 |
| 계획 생성기 (Planner) | 파라미터 기반 Macro Goal → Milestone → Todo 생성 |
| 피드백 코치 (Coach) | 학습 기록 분석, 피드백 생성, 동기부여 메시지 |

---

## 4. 데이터 흐름

### 학습 계획 생성 흐름

```mermaid
sequenceDiagram
    actor User
    participant FE as React Client
    participant BE as Express Server
    participant AI as OpenRouter API
    participant DB as PostgreSQL

    User->>FE: "새 학습 계획" 클릭
    FE->>BE: POST /api/v1/plans (create draft)
    BE->>DB: StudyPlan 생성 (status: draft)
    BE-->>FE: planId 반환

    loop 1차 질문 (7개)
        FE->>User: 질문 표시
        User->>FE: 답변 입력
        FE->>BE: PATCH /api/v1/plans/:id/params
        BE->>DB: 파라미터 저장
    end

    FE->>BE: POST /api/v1/plans/:id/generate
    BE->>AI: 프롬프트 + 파라미터 전송
    AI-->>BE: 계획 JSON (Goals/Milestones/Todos)
    BE->>DB: MacroGoal, Milestone, TodoNode 일괄 생성
    BE-->>FE: 계획 초안 반환

    User->>FE: 초안 검토 및 수정
    FE->>BE: PUT /api/v1/plans/:id/confirm
    BE->>DB: status → active, Node 확정
    BE-->>FE: 칸반 보드 데이터 반환
```

### 학습 세션 흐름

```mermaid
sequenceDiagram
    actor User
    participant FE as React Client
    participant BE as Express Server
    participant AI as OpenRouter API
    participant DB as PostgreSQL

    User->>FE: Node 선택, 타이머 시작
    FE->>BE: POST /api/v1/sessions (nodeId, startTime)
    BE->>DB: StudySession 생성

    loop 학습 중
        User->>FE: 상태 기록 작성
        FE->>BE: POST /api/v1/sessions/:id/logs
        BE->>DB: SessionLog 저장
    end

    User->>FE: 타이머 종료
    FE->>BE: PATCH /api/v1/sessions/:id (endTime, duration)
    BE->>DB: 세션 업데이트

    User->>FE: Review 작성
    FE->>BE: POST /api/v1/nodes/:id/reviews
    BE->>DB: Review 저장

    FE->>BE: POST /api/v1/feedback/generate (nodeId)
    BE->>AI: 학습 기록 + 프롬프트
    AI-->>BE: 피드백 JSON
    BE->>DB: Feedback 저장
    BE-->>FE: 피드백 리포트 반환
```

---

## 5. 확장 고려사항

| 항목 | 현재 (MVP) | 향후 확장 |
|------|-----------|----------|
| 백엔드 | Express Serverless Functions | 트래픽 증가 시 Railway/Render 상시 서버 전환 |
| AI 모델 | gemma-4-26b (무료) | 품질 이슈 시 OpenRouter에서 다른 모델로 교체 (인터페이스 동일) |
| DB | Supabase 무료 티어 | 유료 플랜 또는 AWS RDS 전환 |
| 인증 | Google OAuth만 | Apple/Kakao 로그인 추가 |
| 플랫폼 | 웹 (반응형) | React Native 또는 Capacitor로 네이티브 앱 (API 동일 사용) |
| 실시간 | HTTP 폴링 | WebSocket/SSE로 AI 스트리밍 응답 |
| 캐싱 | 없음 | Redis (세션, 빈번 조회 데이터) |
| 알림 | 인앱 (브라우저 탭 내) | Web Push → 네이티브 Push |

---

## 6. 디렉토리 구조 (예시)

```
leadme/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/            # 로그인 관련
│   │   │   ├── plan/            # 계획 생성 위자드
│   │   │   ├── kanban/          # 칸반 보드
│   │   │   ├── node/            # 노드 페이지
│   │   │   ├── timer/           # 집중 타이머
│   │   │   ├── feedback/        # 피드백 리포트
│   │   │   ├── precheck/        # 자기 관리 (P1)
│   │   │   ├── profile/         # 프로필 (P2)
│   │   │   └── ui/              # shadcn/ui 공통 컴포넌트
│   │   ├── hooks/               # 커스텀 훅
│   │   ├── stores/              # Zustand 스토어
│   │   ├── services/            # API 호출 함수
│   │   ├── types/               # TypeScript 타입
│   │   ├── utils/               # 유틸리티
│   │   ├── pages/               # 라우트 페이지
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── backend/                     # Express + TypeScript
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── plans.ts
│   │   │   ├── nodes.ts
│   │   │   ├── sessions.ts
│   │   │   └── feedback.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts    # OpenRouter 통신
│   │   │   ├── plan.service.ts
│   │   │   ├── node.service.ts
│   │   │   └── session.service.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT 검증
│   │   │   └── validate.ts      # 입력 검증
│   │   ├── config/
│   │   │   ├── passport.ts      # Google OAuth 설정
│   │   │   └── env.ts           # 환경변수
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── prompts/             # AI 프롬프트 템플릿
│   │   │   ├── planner.ts
│   │   │   ├── coach.ts
│   │   │   └── structurer.ts
│   │   ├── types/
│   │   └── app.ts
│   ├── tsconfig.json
│   └── package.json
├── spec/                        # 이 문서들
├── _workspace/                  # 상세 설계 (fullstack-webapp 시 생성)
└── README.md
```

---

## 7. 환경변수 목록

| 변수명 | 용도 | 예시 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | `postgresql://user:pass@host:5432/leadme` |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 시크릿 | `GOCSPX-xxx` |
| `JWT_SECRET` | JWT 서명 키 | 32자 이상 랜덤 문자열 |
| `OPENROUTER_API_KEY` | OpenRouter API 키 | `sk-or-v1-xxx` |
| `OPENROUTER_MODEL` | 사용 모델 ID | `google/gemma-4-26b-a4b-it:free` |
| `FRONTEND_URL` | 프론트엔드 URL (CORS) | `https://leadme.vercel.app` |
| `NODE_ENV` | 환경 구분 | `development` / `production` |
