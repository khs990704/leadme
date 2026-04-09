# 코드 리뷰 & 테스트 보고서 -- LeadMe

> 버전: 1.0
> 작성일: 2026-04-09
> 리뷰어: QA Engineer

---

## 1. 종합 평가

| 항목 | 상태 |
|------|------|
| 배포 준비 상태 | 수정 후 배포 가능 |
| 전체 품질 등급 | B+ |
| 총평 | 아키텍처 설계가 견고하고 API spec-코드 일치도가 높음. 보안(JWT Rotation, Helmet, CORS, Rate Limiting)이 적절히 구현됨. 몇 가지 버그와 성능 이슈를 수정하면 MVP 배포 가능한 수준. |

---

## 2. 발견 사항

### 2.1 필수 수정 (보안/기능)

#### [RED-1] session.service.ts -- updatedAt 필드 반환 오류 (수정 완료)

- **파일**: `backend/src/services/session.service.ts:125`
- **문제**: `updateSession` 함수가 `updated.createdAt`을 `updatedAt`으로 반환. StudySession 모델에는 `updatedAt` 컬럼이 없음(createdAt만 존재).
- **영향**: 프론트엔드가 받는 updatedAt 값이 항상 createdAt과 동일하여 실제 업데이트 시간 추적 불가.
- **수정**: `new Date().toISOString()`으로 변경 완료.

#### [RED-2] updateSessionSchema -- endTime 필수 조건과 서버 fallback 불일치

- **파일**: `backend/src/routes/sessions.ts:22-30` + `backend/src/services/session.service.ts:106`
- **문제**: Zod 스키마에서 `status === 'completed'`이면 `endTime`을 필수로 요구하는 refine이 있지만, `session.service.ts`에서는 `endTime`이 없을 때 `new Date()`로 fallback 처리. 둘 중 하나의 전략으로 통일해야 함.
- **영향**: 프론트엔드가 endTime 없이 요청하면 Zod에서 차단되어 서버 fallback에 도달하지 못함. 현재는 프론트엔드가 항상 endTime을 보내므로 런타임 에러는 없으나 스펙 불일치.
- **권장**: API spec에서 endTime을 completed 시 필수로 정의하므로 현재 Zod 검증이 올바름. 서비스의 fallback 코드를 제거하거나 주석으로 방어적 코드임을 명시.

#### [RED-3] FocusTimer -- resetTimer 호출 시 세션 미종료

- **파일**: `frontend/src/components/node/FocusTimer.tsx:188-195`
- **문제**: 타이머 진행 중 resetTimer를 호출하면 로컬 타이머 상태만 초기화되고 서버의 active 세션이 종료되지 않음. 이후 같은 노드에서 새 세션 시작 시 `SESSION_ALREADY_ACTIVE` 에러 발생.
- **영향**: 사용자가 리셋 버튼을 누르면 고아 세션이 남아 해당 노드에서 다시 학습 시작 불가.
- **권장**: resetTimer 버튼에 세션 종료 API 호출을 추가하거나, 리셋 시 세션 완료 처리.

### 2.2 권장 수정 (품질/성능)

#### [YELLOW-1] getPlans -- N+1 쿼리 (lastSession 개별 조회)

- **파일**: `backend/src/services/plan.service.ts:150-161`
- **문제**: 계획 목록 조회 시 각 계획에 대해 개별 `findFirst` 쿼리로 마지막 세션을 조회. 계획 10개면 추가 10개 쿼리 발생.
- **영향**: 목록이 길어지면 응답 시간 증가.
- **권장**: raw SQL 또는 Prisma의 `include`와 `take: 1`로 단일 쿼리에 포함시키거나, 계획 테이블에 `lastStudiedAt` 캐시 필드 추가.

#### [YELLOW-2] KanbanBoard -- 드래그 시 이중 API 호출

- **파일**: `frontend/src/components/kanban/KanbanBoard.tsx:78-86`
- **문제**: 드래그로 칼럼 이동 시 `updateStatus.mutate`와 `updateOrder.mutate`를 동시에 호출. 서버에서 두 요청이 경합(race condition) 가능. 또한 `updateOrder` API가 이미 status 변경을 포함하므로 중복.
- **권장**: `updateOrder`만 호출하고 status를 함께 전달. `updateStatus` 호출 제거.

#### [YELLOW-3] PlanWizard -- 에러 시 phase 롤백 로직 오류

- **파일**: `frontend/src/components/plan/PlanWizard.tsx:203-205`
- **문제**: `handleNext`에서 에러 시 `setPhase(phase === 'secondary' ? 'secondary' : 'primary')`로 롤백하지만, 이 시점에서 `phase`는 이미 `'generating'`으로 변경된 상태. 클로저 캡처 시점의 값에 의존하므로 실제로는 항상 `'primary'`로 롤백됨.
- **영향**: secondary 단계에서 에러 발생 시 primary로 잘못 돌아감.
- **권장**: 에러 핸들러에서 이전 phase를 별도 변수로 저장하거나 ref 사용.

#### [YELLOW-4] Prisma schema -- FK 컬럼 길이 제한 30자

- **파일**: `backend/prisma/schema.prisma` (여러 위치)
- **문제**: `userId`, `planId`, `goalId`, `milestoneId`, `nodeId`, `sessionId` 등 FK 컬럼이 `@db.VarChar(30)`으로 설정. CUID는 기본 25자이지만 Prisma의 `cuid()` 구현에 따라 길이가 달라질 수 있으며, 향후 UUID 등으로 변경 시 문제.
- **권장**: VARCHAR(36) 이상으로 여유 확보하거나 Text로 변경.

#### [YELLOW-5] ai.service.ts -- 재시도 미구현

- **파일**: `backend/src/services/ai.service.ts`
- **문제**: 아키텍처 문서(7.3절)에서 "파싱 실패 시 1회 재시도, 2회 실패 시 에러"를 명시했으나, 실제 코드에 재시도 로직이 없음.
- **권장**: callOpenRouter 호출에 1회 재시도 로직 추가.

#### [YELLOW-6] callOpenRouter -- temperature 하드코딩

- **파일**: `backend/src/services/ai.service.ts:40`
- **문제**: 아키텍처에서 역할별 temperature를 다르게 지정(planner: 0.7, coach: 0.8, structurer: 0.3)했으나, `callOpenRouter`에서 항상 0.7로 고정.
- **권장**: temperature를 파라미터로 받도록 변경.

### 2.3 참고 사항

#### [GREEN-1] Passport.js 설정 미사용

- **파일**: `backend/src/config/passport.ts`
- **문제**: Passport Google Strategy가 정의되어 있으나, 실제 인증은 `routes/auth.ts`에서 직접 Google OAuth token exchange를 수행. passport.ts의 `configurePassport()`가 호출되지 않음.
- **영향**: 기능에 영향 없음. 데드 코드.
- **권장**: 사용하지 않는 passport.ts를 제거하거나, 향후 Passport 기반으로 전환 시 주석 명시.

#### [GREEN-2] 프론트엔드 타입 중복

- **파일**: `frontend/src/types/api.ts`, `backend/src/types/index.ts`
- **문제**: 동일한 타입(PlanParams, ParamCompleteness 등)이 프론트/백엔드에 각각 정의. 향후 불일치 위험.
- **권장**: 공유 타입 패키지(shared/) 또는 OpenAPI 스키마 자동 생성 고려.

#### [GREEN-3] 테스트 프레임워크 미설치

- **파일**: `backend/package.json`, `frontend/package.json`
- **문제**: Vitest, Testing Library 등 테스트 의존성이 package.json에 없음.
- **권장**: 테스트 실행 전 devDependencies에 vitest, @testing-library/react, @testing-library/jest-dom, jsdom 설치 필요.

#### [GREEN-4] 환경별 OPENROUTER_URL 불일치

- **파일**: `backend/src/services/ai.service.ts:8` vs `backend/src/config/env.ts:23`
- **문제**: env.ts에서 `OPENROUTER_BASE_URL`을 환경변수로 관리하지만, ai.service.ts에서는 하드코딩된 `OPENROUTER_URL` 상수 사용.
- **권장**: `env.OPENROUTER_BASE_URL`을 사용하도록 변경.

---

## 3. 정합성 매트릭스

| 검증 항목 | 상태 | 비고 |
|----------|:----:|------|
| 아키텍처 <-> 코드 | OK | 계층 구조, 모듈 분리 일치 |
| API 명세 <-> 백엔드 구현 | 주의 | endTime 필수/fallback 불일치(RED-2), temperature 차이(YELLOW-6) |
| DB 스키마 <-> Prisma | OK | schema.prisma와 03_db_schema.md 완전 일치 |
| 프론트엔드 <-> 백엔드 연동 | OK | 타입 정의 일치, API 경로 매핑 정확 |
| 보안 체크리스트 | OK | Helmet, CORS, Rate Limit, JWT Rotation, ownership 검증 |
| 에러 코드 규약 | OK | API spec 에러 코드와 구현 일치 |
| Zod 스키마 | OK | API spec 정의와 구현 일치 |

---

## 4. 보안 점검 결과

| 항목 | 상태 | 비고 |
|------|:----:|------|
| SQL Injection | 안전 | Prisma parameterized queries 사용 |
| XSS | 안전 | React DOM escaping + Helmet CSP |
| CSRF | 안전 | JWT Bearer 인증 (쿠키 미사용) |
| JWT 보안 | 양호 | Access 15분, Refresh 7일, Rotation, bcrypt hash |
| 비밀 정보 노출 | 안전 | env.ts Zod 검증, 프로덕션 에러 메시지 마스킹 |
| Rate Limiting | 구현됨 | 분당 100회, /api/ 경로 |
| CORS | 구현됨 | FRONTEND_URL 화이트리스트 |
| 입력 검증 | 구현됨 | 모든 엔드포인트 Zod 스키마 적용 |
| 소유권 검증 | 구현됨 | 모든 보호 리소스에 userId 확인 |

---

## 5. 테스트 커버리지 현황

| 항목 | 현재 | 목표 |
|------|:----:|:----:|
| Backend 단위 테스트 | 작성됨 (신규) | 80% |
| Backend 통합 테스트 | 미작성 | 70% |
| Frontend 컴포넌트 테스트 | 작성됨 (신규) | 80% |
| Frontend E2E 테스트 | 미작성 | 핵심 플로우 2개 |

---

## 6. 수정 우선순위 요약

| 순위 | ID | 수정 내용 | 난이도 |
|:----:|-----|---------|:-----:|
| 1 | RED-3 | FocusTimer resetTimer 세션 미종료 | 중 |
| 2 | YELLOW-2 | KanbanBoard 이중 API 호출 | 하 |
| 3 | YELLOW-3 | PlanWizard phase 롤백 오류 | 하 |
| 4 | YELLOW-5 | AI 서비스 재시도 미구현 | 중 |
| 5 | YELLOW-6 | temperature 하드코딩 | 하 |
| 6 | YELLOW-1 | N+1 쿼리 최적화 | 중 |
| 7 | GREEN-4 | OPENROUTER_URL 하드코딩 | 하 |

(RED-1은 이미 수정 완료, RED-2는 현재 동작에 영향 없음)
