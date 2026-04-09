# 마일스톤 — LeadMe

> 버전: 0.1 (spec 초안)
> 작성일: 2026-04-09

---

## 1. Phase 개요

| Phase | 이름 | 목표 | 기간 (예상) |
|-------|------|------|------------|
| Phase 1 | MVP | 핵심 루프 완성: 계획 생성 → 칸반 → 학습 → 피드백 | 4-6주 |
| Phase 2 | v1.0 | 안정화 + P1 기능 + UX 개선 | 3-4주 |
| Phase 3 | v2.0 | P2 기능 + 확장 + 최적화 | 4-6주 |

---

## 2. Phase 1 — MVP (P0 기능)

**목표**: 한 명의 사용자가 학습 계획을 생성하고, 칸반에서 학습을 진행하고, AI 피드백을 받을 수 있다.

### Sprint 1: 기반 구축 (1주)

| # | 작업 | 담당 | 산출물 |
|---|------|------|--------|
| 1-1 | 프로젝트 초기 설정 (React + Vite + Tailwind + shadcn) | Frontend | frontend/ 보일러플레이트 |
| 1-2 | 프로젝트 초기 설정 (Express + TypeScript + Prisma) | Backend | backend/ 보일러플레이트 |
| 1-3 | DB 스키마 정의 + 마이그레이션 | Backend | schema.prisma, 마이그레이션 파일 |
| 1-4 | Google OAuth + JWT 인증 구현 | Backend | auth 라우트, 미들웨어 |
| 1-5 | 로그인 페이지 + 인증 연동 | Frontend | /login, AuthProvider |
| 1-6 | Vercel 배포 파이프라인 설정 | DevOps | vercel.json, 환경변수 설정 |
| 1-7 | Supabase PostgreSQL 프로비저닝 | DevOps | DB 인스턴스, DATABASE_URL |

### Sprint 2: 계획 생성 (1.5주)

| # | 작업 | 담당 | 산출물 |
|---|------|------|--------|
| 2-1 | Plans CRUD API | Backend | /api/v1/plans 엔드포인트 |
| 2-2 | 파라미터 수집 API (1차/2차) | Backend | PATCH /plans/:id/params |
| 2-3 | OpenRouter AI 서비스 레이어 | Backend | ai.service.ts, 프롬프트 템플릿 |
| 2-4 | AI 계획 생성 API (basic/detailed) | Backend | POST /plans/:id/generate |
| 2-5 | Goals/Milestones/Nodes 일괄 생성 로직 | Backend | plan.service.ts |
| 2-6 | 계획 생성 위자드 UI (질문 스텝) | Frontend | PlanWizard, QuestionStep |
| 2-7 | 계획 프리뷰/수정/확정 UI | Frontend | PlanPreview, EditableGoal |
| 2-8 | 홈 대시보드 (활성 계획 표시) | Frontend | /, DashboardSummary |

### Sprint 3: 칸반 + 노드 (1.5주)

| # | 작업 | 담당 | 산출물 |
|---|------|------|--------|
| 3-1 | Nodes CRUD + 상태/순서 변경 API | Backend | /api/v1/nodes 엔드포인트 |
| 3-2 | 칸반 보드 UI (드래그&드롭) | Frontend | KanbanBoard, KanbanColumn, NodeCard |
| 3-3 | 노드 페이지 UI (Study Guide 표시) | Frontend | NodePage, StudyGuide |
| 3-4 | 집중 타이머 (뽀모도로/스톱워치) | Frontend | FocusTimer |
| 3-5 | Sessions CRUD API | Backend | /api/v1/sessions 엔드포인트 |
| 3-6 | 상태 기록 UI + API | Frontend + Backend | StatusRecorder, SessionLog API |

### Sprint 4: 리뷰 + 피드백 (1주)

| # | 작업 | 담당 | 산출물 |
|---|------|------|--------|
| 4-1 | Review CRUD API | Backend | /api/v1/reviews 엔드포인트 |
| 4-2 | Review 작성 UI | Frontend | ReviewForm |
| 4-3 | AI 피드백 생성 API | Backend | /api/v1/feedback/generate |
| 4-4 | 피드백 리포트 UI | Frontend | FeedbackCard, ProgressChart |
| 4-5 | E2E 테스트 (핵심 플로우) | QA | 로그인 → 계획 생성 → 학습 → 피드백 |
| 4-6 | MVP 배포 + 스모크 테스트 | DevOps | production 배포 |

### MVP 완료 기준

- [ ] Google 로그인으로 진입할 수 있다
- [ ] AI 질문 7개 응답 후 학습 계획이 생성된다
- [ ] 칸반 보드에서 Node를 드래그하여 상태를 변경할 수 있다
- [ ] Node 페이지에서 타이머를 사용하고 상태를 기록할 수 있다
- [ ] 학습 후 Review를 작성할 수 있다
- [ ] AI 피드백 리포트를 받을 수 있다
- [ ] Vercel에 배포되어 접근 가능하다

---

## 3. Phase 2 — v1.0 (P1 + 안정화)

**목표**: 자기 관리 기능 추가, 2차 질문 정밀화 완성, UX 개선

| # | 작업 | 우선순위 |
|---|------|---------|
| 5-1 | Pre-check / Warm-up 기능 | P1 |
| 5-2 | 2차 질문 기반 정밀 계획 생성 고도화 | P1 |
| 5-3 | Milestone별 칸반 필터링 | P1 |
| 5-4 | 학습 속도 시각화 (예상 vs 실제 차트) | P1 |
| 5-5 | 동기부여 메시지 (management_style 반영) | P1 |
| 5-6 | 에러 핸들링/로딩 상태 개선 | 안정화 |
| 5-7 | 모바일 반응형 최적화 | 안정화 |
| 5-8 | API Rate Limiting | 보안 |
| 5-9 | 입력 검증 강화 (Zod) | 보안 |

---

## 4. Phase 3 — v2.0 (P2 + 확장)

**목표**: 프로필/통계, 다중 계획, 성능 최적화, 네이티브 앱 준비

| # | 작업 | 우선순위 |
|---|------|---------|
| 6-1 | 프로필 페이지 (활동 매트릭스, 누적 시간) | P2 |
| 6-2 | 다중 학습 계획 관리 | P2 |
| 6-3 | 알림 시스템 (인앱 → Web Push) | P2 |
| 6-4 | AI 모델 교체 지원 (OpenRouter 내) | 확장 |
| 6-5 | PWA 또는 React Native 검토 | 확장 |
| 6-6 | 성능 최적화 (Redis 캐싱, 쿼리 최적화) | 최적화 |
| 6-7 | 추가 소셜 로그인 (Apple, Kakao) | 확장 |

---

## 5. 칸반 보드 초안 (MVP 기준)

```
┌─── Backlog ────┐  ┌─── Todo ──────┐  ┌── In Progress ──┐  ┌──── Done ─────┐
│                │  │               │  │                 │  │               │
│ Pre-check(P1)  │  │ DB 스키마     │  │                 │  │               │
│ 프로필(P2)     │  │ Google OAuth  │  │                 │  │               │
│ 알림 시스템    │  │ 로그인 UI     │  │                 │  │               │
│ PWA           │  │ Plans API     │  │                 │  │               │
│               │  │ AI 서비스     │  │                 │  │               │
│               │  │ 위자드 UI     │  │                 │  │               │
│               │  │ 칸반 보드     │  │                 │  │               │
│               │  │ 노드 페이지   │  │                 │  │               │
│               │  │ 타이머       │  │                 │  │               │
│               │  │ 리뷰/피드백   │  │                 │  │               │
│               │  │ Vercel 배포   │  │                 │  │               │
│               │  │ E2E 테스트    │  │                 │  │               │
└────────────────┘  └───────────────┘  └─────────────────┘  └───────────────┘
```

---

## 6. 기술 부채 / 이후 결정 항목

| 항목 | 현재 상태 | 결정 시점 |
|------|----------|----------|
| 수익 모델 | 미정 | Phase 2 이후 |
| 동시 학습 계획 제한 | 미정 (MVP에서는 제한 없음) | Phase 2 |
| 소프트 삭제 | 미적용 (하드 삭제) | Phase 2 (필요 시 deleted_at 추가) |
| AI 응답 스트리밍 | HTTP 응답 대기 | Phase 2 (SSE 검토) |
| 오프라인 지원 | 없음 | Phase 3 (PWA 검토 시) |
| 알림 전달 방식 | 인앱 (브라우저 탭 내) | Phase 2 (Web Push 검토) |
| 테스트 커버리지 목표 | E2E 핵심 플로우만 | Phase 2 (단위 테스트 70% 목표) |
| AI 프롬프트 버전 관리 | 파일 기반 | Phase 2 (DB 기반 A/B 테스트 검토) |
| 에빙하우스 복습 주기 | 기본 계획에 기계적 배치 | Phase 2 (학습 기록 기반 동적 조정) |
| 다국어 | 한국어 전용 | Phase 3 |
