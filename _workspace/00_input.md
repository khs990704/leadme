# 입력 정리 — LeadMe

> 작성일: 2026-04-09
> 출처: idea.md, idea_inquiry.md, spec/*

---

## 1. 서비스 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | LeadMe |
| 한 줄 설명 | 학습 시작, 지속, 복기를 AI가 관리해주는 학습 관리 서비스 |
| 핵심 가치 | 계획 생성이 아닌 **학습 지속성 유지와 실행 관리** |
| 타겟 사용자 | 학습 목표가 있지만 자기주도 학습에 어려움을 겪는 전 연령 사용자 |
| 플랫폼 | 웹 (반응형, Mobile-first), 향후 네이티브 앱 고려 |

---

## 2. 기술 스택 (확정)

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 19 + Vite + TypeScript |
| 상태관리 | Zustand (전역) + TanStack Query (서버 상태) |
| UI | Tailwind CSS + shadcn/ui |
| 백엔드 | Node.js + Express + TypeScript |
| ORM | Prisma |
| DB | PostgreSQL (Supabase) |
| 인증 | Passport.js + JWT (Google OAuth 2.0) |
| AI | OpenRouter API (google/gemma-4-26b-a4b-it:free) |
| 배포 | Vercel (프론트) + Vercel Serverless Functions 또는 Railway (백엔드) |

---

## 3. MVP 핵심 기능 (P0)

### FR-1: AI 기반 학습계획 생성
- 1차 필수 질문 7개 → 분량 기반 기본 계획 생성 (Macro Goal → Milestone → Todo)
- 2차 선택 질문 9개 → 구조 기반 정밀 계획 생성
- 사용자 검토/수정 후 확정 → 칸반 Node 자동 생성

### FR-2: 학습 노드 기반 칸반 시스템
- Todo/In Progress/Done 드래그&드롭 칸반 보드
- Node Page: Study Guide + Review + Study Tracker

### FR-3: 학습 상태 추적 및 피드백
- 뽀모도로 타이머 / 스톱워치
- 정기 상태 기록 (진행도, 집중도, 방해 요소)
- AI 피드백 리포트 생성
- 학습 속도 시각화 (예상 vs 실제)

---

## 4. P1/P2 기능 (후순위)

- **P1**: Pre-check/Warm-up (학습 전 자기 관리)
- **P2**: 프로필 및 활동 시각화 (학습 활동 매트릭스, 누적 통계)

---

## 5. 인증 흐름

1. Google OAuth 로그인 → authorization code
2. POST /api/v1/auth/google → JWT 발급 (access + refresh)
3. 모든 API 요청에 Bearer token 포함
4. MVP부터 로그인 필수 (게스트 모드 없음)

---

## 6. 핵심 데이터 계층

```
User (1) ─── (N) StudyPlan
StudyPlan (1) ─── (N) MacroGoal
MacroGoal (1) ─── (N) Milestone
Milestone (1) ─── (N) TodoNode
TodoNode (1) ─── (N) StudySession / Review / Feedback
StudySession (1) ─── (N) SessionLog
```

---

## 7. 페이지 구조 (P0)

| 경로 | 페이지 | 핵심 컴포넌트 |
|------|--------|-------------|
| `/login` | 로그인 | GoogleLoginButton |
| `/` | 홈/대시보드 | DashboardSummary, TodayTodos |
| `/plans` | 계획 목록 | PlanList, PlanCard |
| `/plans/new` | 계획 생성 위자드 | PlanWizard, QuestionStep, PlanPreview |
| `/plans/:id` | 계획 상세 | PlanOverview, KanbanBoard |
| `/plans/:id/kanban` | 칸반 보드 | KanbanColumn, NodeCard, DragDrop |
| `/nodes/:id` | 노드 페이지 | StudyGuide, ReviewForm, FocusTimer, StatusRecorder |
| `/plans/:id/feedback` | 피드백 | FeedbackCard, ProgressChart |

---

## 8. API 엔드포인트 요약

- **Auth**: POST /auth/google, POST /auth/refresh, POST /auth/logout, GET /auth/me
- **Plans**: CRUD + PATCH params + POST generate + PUT confirm
- **Goals/Milestones**: GET/PUT
- **Nodes**: GET list + GET detail + PATCH status + PATCH order + PUT
- **Sessions**: POST start + PATCH end + GET history + POST logs
- **Reviews**: POST + GET + PUT
- **Feedback**: POST generate + GET by node/plan

---

## 9. 비기능 요구사항

- 페이지 로드 3초 이내, AI 응답 10초 이내
- HTTPS 필수, JWT 기반 세션
- Mobile-first 반응형
- 향후 네이티브 앱 대응을 위한 API 분리
- OpenRouter 모델 교체 시 인터페이스 변경 없이 동작

---

## 10. 참조 문서

| 문서 | 경로 |
|------|------|
| 원본 아이디어 | `idea.md` |
| 아이디어 구체화 | `idea_inquiry.md` |
| PRD | `spec/01_prd.md` |
| 아키텍처 초안 | `spec/02_architecture_preview.md` |
| API 초안 | `spec/03_api_preview.md` |
| DB 초안 | `spec/04_db_preview.md` |
| 와이어프레임 | `spec/05_wireframe.md` |
| 마일스톤 | `spec/06_milestones.md` |
