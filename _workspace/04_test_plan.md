# 테스트 계획 -- LeadMe

> 버전: 1.0
> 작성일: 2026-04-09
> 기반: 01_architecture.md, 02_api_spec.md, 03_db_schema.md

---

## 1. 테스트 전략

| 항목 | 내용 |
|------|------|
| 커버리지 목표 | 80% 이상 (핵심 비즈니스 로직 90%) |
| 테스트 레벨 | 단위 (70%) > 통합 (20%) > E2E (10%) |
| 테스트 패턴 | AAA (Arrange-Act-Assert) |
| 테스트 프레임워크 | Vitest (단위/통합), React Testing Library (컴포넌트), Playwright (E2E) |
| 목(Mock) 전략 | Prisma Client Mock, Axios Mock, Timer Mock |
| CI 통합 | PR 시 단위/통합 자동 실행, 머지 전 E2E 실행 |

---

## 2. 테스트 매트릭스

| 기능 (FR) | 단위 테스트 | 통합 테스트 | E2E 테스트 | 우선순위 |
|-----------|:---------:|:---------:|:---------:|:-------:|
| FR-1 AI 기반 학습계획 생성 | O | O | O | P0 |
| FR-2 칸반 시스템 | O | O | O | P0 |
| FR-3 학습 상태 추적 및 피드백 | O | O | - | P0 |
| FR-4 Pre-check / Warm-up | - | - | - | P1 (미구현) |
| FR-5 프로필 및 활동 시각화 | - | - | - | P2 (미구현) |
| 인증 (Auth) | O | O | O | P0 |

---

## 3. 테스트 시나리오

### 3.1 인증 (Auth)

| # | 시나리오 | 입력 | 기대 결과 | 유형 |
|---|---------|------|----------|------|
| A-1 | Google OAuth 코드 교환 | 유효 code + redirectUri | 200 + accessToken, refreshToken, user | 통합 |
| A-2 | 무효 OAuth 코드 | 잘못된 code | 401 INVALID_TOKEN | 통합 |
| A-3 | Access Token 갱신 | 유효 refreshToken | 200 + 새 토큰 쌍 | 단위 |
| A-4 | 만료된 Refresh Token | 만료 토큰 | 401 INVALID_TOKEN | 단위 |
| A-5 | Refresh Token 재사용 감지 | 이미 사용된 토큰 | 401 + 모든 토큰 무효화 | 단위 |
| A-6 | 로그아웃 | 인증된 요청 | 204 + refreshTokenHash null | 통합 |
| A-7 | /auth/me 조회 | 유효 토큰 | 200 + user 정보 | 통합 |
| A-8 | 인증 없이 보호 API 접근 | Authorization 없음 | 401 UNAUTHORIZED | 단위 |
| A-9 | 만료 토큰으로 보호 API 접근 | 만료된 JWT | 401 TOKEN_EXPIRED | 단위 |

### 3.2 학습 계획 (Plans)

| # | 시나리오 | 입력 | 기대 결과 | 유형 |
|---|---------|------|----------|------|
| P-1 | 계획 생성 | { title } | 201 + draft 상태 plan | 통합 |
| P-2 | 빈 제목으로 생성 | { title: "" } | 400 INVALID_INPUT | 단위 |
| P-3 | 계획 목록 조회 | status=active | 200 + 필터된 목록 | 통합 |
| P-4 | 계획 상세 조회 | planId | 200 + goals/milestones/nodes 포함 | 통합 |
| P-5 | 다른 사용자 계획 접근 | 타인 planId | 403 FORBIDDEN | 단위 |
| P-6 | 파라미터 업데이트 | subject, finalGoal | 200 + merged params + completeness | 단위 |
| P-7 | 확정 계획 파라미터 수정 | active plan params | 409 ALREADY_CONFIRMED | 단위 |
| P-8 | ParamCompleteness 계산 | 7개 1차 필드 완성 | primary=7, isReadyForBasic=true | 단위 |
| P-9 | ParamCompleteness null | params=null | primary=0, isReadyForBasic=false | 단위 |
| P-10 | AI 계획 생성 | basic mode + 완성 params | 200 + macroGoals hierarchy | 통합 |
| P-11 | 1차 미완료 상태 생성 | primary < 7 | 400 INVALID_PARAMS | 단위 |
| P-12 | 계획 확정 | draft + content 있음 | 200 + status=active | 통합 |
| P-13 | 콘텐츠 없는 확정 | draft + goals 없음 | 400 INVALID_PARAMS | 단위 |
| P-14 | 계획 삭제 | planId | 204 + cascade 삭제 | 통합 |

### 3.3 노드 (Nodes)

| # | 시나리오 | 입력 | 기대 결과 | 유형 |
|---|---------|------|----------|------|
| N-1 | 칸반 노드 목록 | planId + milestoneId | 200 + filtered nodes | 통합 |
| N-2 | 노드 상세 | nodeId | 200 + studyGuide, sessions, reviews | 통합 |
| N-3 | todo -> in_progress | status=in_progress | 200 + milestone auto in_progress | 단위 |
| N-4 | in_progress -> done | status=done | 200 + milestone auto completed (all done) | 단위 |
| N-5 | todo -> done (차단) | status=done | 400 INVALID_STATUS_TRANSITION | 단위 |
| N-6 | done -> todo (차단) | status=todo | 400 INVALID_STATUS_TRANSITION | 단위 |
| N-7 | done -> in_progress | status=in_progress | 200 (재학습) | 단위 |
| N-8 | 전체 노드 done -> Plan 완료 | last node done | Plan status=completed | 단위 |
| N-9 | 순서 변경 | order=2 | 200 + 리오더된 노드 목록 | 단위 |
| N-10 | 노드 수정 | title, estimatedMinutes | 200 + 수정된 노드 | 통합 |

### 3.4 학습 세션 (Sessions)

| # | 시나리오 | 입력 | 기대 결과 | 유형 |
|---|---------|------|----------|------|
| S-1 | 세션 시작 | nodeId + pomodoro | 201 + active session | 통합 |
| S-2 | 중복 세션 시작 | active 세션 있는 nodeId | 409 SESSION_ALREADY_ACTIVE | 단위 |
| S-3 | todo 노드 세션 시작 | todo node | 201 + node auto in_progress | 단위 |
| S-4 | 세션 종료 | status=completed + endTime | 200 + durationMinutes 계산 | 단위 |
| S-5 | 완료 세션 재종료 | completed session | 400 INVALID_STATUS_TRANSITION | 단위 |
| S-6 | 세션 로그 추가 | progressPercent, focusLevel | 201 + log | 통합 |
| S-7 | 완료 세션에 로그 추가 | completed session | 400 | 단위 |
| S-8 | 세션 이력 조회 | nodeId + pagination | 200 + paginated sessions | 통합 |

### 3.5 피드백 (Feedback)

| # | 시나리오 | 입력 | 기대 결과 | 유형 |
|---|---------|------|----------|------|
| F-1 | 노드 피드백 생성 | scope=node + nodeId | 200 + AI feedback | 통합 |
| F-2 | 계획 피드백 생성 | scope=plan + planId | 200 + AI feedback | 통합 |
| F-3 | 노드 피드백 조회 | nodeId | 200 + paginated feedback | 통합 |
| F-4 | 계획 피드백 조회 | planId | 200 + paginated feedback | 통합 |

---

## 4. 프론트엔드 테스트 시나리오

### 4.1 컴포넌트 테스트

| # | 컴포넌트 | 시나리오 | 기대 결과 | 유형 |
|---|---------|---------|----------|------|
| FE-1 | AuthGuard | 미인증 상태 | /login 리다이렉트 | 단위 |
| FE-2 | AuthGuard | 로딩 중 | 스켈레톤 표시 | 단위 |
| FE-3 | AuthGuard | 인증 상태 | children 렌더링 | 단위 |
| FE-4 | PlanWizard | 스텝 전환 | 다음/이전 이동, 프로그레스 업데이트 | 단위 |
| FE-5 | PlanWizard | 필수 답변 미입력 | 다음 버튼 비활성 | 단위 |
| FE-6 | KanbanBoard | 칼럼별 노드 분류 | todo/in_progress/done 칼럼 | 단위 |
| FE-7 | KanbanBoard | 마일스톤 필터 | 선택한 마일스톤 노드만 표시 | 단위 |
| FE-8 | FocusTimer | 타이머 시작/정지/재개 | 상태 전환, 시간 표시 | 단위 |
| FE-9 | FocusTimer | 뽀모도로 자동 전환 | work -> break 전환 | 단위 |

### 4.2 스토어 테스트

| # | 스토어 | 시나리오 | 기대 결과 | 유형 |
|---|--------|---------|----------|------|
| ST-1 | authStore | setAuth | user/tokens 설정 + localStorage | 단위 |
| ST-2 | authStore | logout | 상태 초기화 + localStorage 제거 | 단위 |
| ST-3 | authStore | hydrateFromStorage | localStorage에서 복원 | 단위 |
| ST-4 | timerStore | tick | elapsed 1초 증가 | 단위 |
| ST-5 | timerStore | pomodoro 완료 | phase 전환 + count 증가 | 단위 |

---

## 5. E2E 핵심 플로우

### Flow 1: 회원가입 -> 계획 생성 -> 칸반

1. /login 접속 -> Google 로그인 버튼 클릭
2. OAuth 콜백 -> /plans/new 리다이렉트 (신규 유저)
3. 7개 질문 답변 -> 계획 생성하기
4. AI 생성 대기 -> 프리뷰 확인 -> 확정
5. /plans/:planId/kanban 이동 -> 3개 칼럼 확인
6. 노드 드래그 -> 상태 변경 확인

### Flow 2: 학습 세션 -> 리뷰 -> 피드백

1. 칸반에서 노드 클릭 -> /nodes/:nodeId 이동
2. Study Guide 확인
3. 타이머 시작 -> 일시정지 -> 종료
4. 상태 기록 입력 -> 저장
5. 학습 리뷰 작성 -> 저장
6. AI 피드백 생성 -> 결과 확인

---

## 6. 코드 리뷰 체크리스트

- [x] TypeScript 타입 안전성 (any 미사용)
- [x] 입력 검증 (Zod 스키마)
- [x] 에러 처리 일관성 (AppError 패턴)
- [x] SQL 인젝션 방지 (Prisma 파라미터 바인딩)
- [x] XSS 방지 (React DOM escaping, Helmet)
- [x] 환경변수 하드코딩 없음 (env.ts Zod 검증)
- [x] 소유권 검증 (모든 보호 API에 ownership check)
- [ ] N+1 쿼리 (getPlans에서 lastSession 개별 조회 -- 개선 필요)
- [x] JWT Refresh Token Rotation
- [x] CORS 화이트리스트
- [x] Rate Limiting

---

## 7. 테스트 환경 설정

### Backend

```bash
# vitest.config.ts
# Prisma Client Mock 사용
# 환경변수: .env.test
```

### Frontend

```bash
# vitest.config.ts
# jsdom 환경
# @testing-library/react
# axios mock
```
