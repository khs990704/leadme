# API 초안 — LeadMe

> 버전: 0.1 (spec 초안)
> 작성일: 2026-04-09

---

## 1. 기본 정보

| 항목 | 값 |
|------|-----|
| Base URL | `/api/v1` |
| 인증 방식 | Google OAuth 2.0 → JWT (Bearer Token) |
| 응답 형식 | JSON |
| 에러 형식 | `{ "error": { "code": "string", "message": "string" } }` |

---

## 2. 인증 방식

```
1. 프론트엔드에서 Google OAuth 로그인 → authorization code 획득
2. POST /api/v1/auth/google 에 code 전달
3. 서버에서 Google 토큰 검증 → 사용자 조회/생성 → JWT 발급
4. 이후 모든 요청에 Authorization: Bearer <jwt> 헤더 포함
5. JWT 만료 시 POST /api/v1/auth/refresh 로 갱신
```

---

## 3. 엔드포인트 목록

### 3.1 인증 (Auth)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/auth/google` | Google OAuth 로그인 (code → JWT) | N |
| POST | `/auth/refresh` | JWT 토큰 갱신 | Y |
| POST | `/auth/logout` | 로그아웃 (리프레시 토큰 무효화) | Y |
| GET | `/auth/me` | 현재 사용자 정보 조회 | Y |

### 3.2 학습 계획 (Plans)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/plans` | 새 학습 계획 생성 (draft) | Y |
| GET | `/plans` | 내 학습 계획 목록 조회 | Y |
| GET | `/plans/:planId` | 학습 계획 상세 조회 (Goals/Milestones/Todos 포함) | Y |
| PATCH | `/plans/:planId/params` | 파라미터 업데이트 (질문 답변 저장) | Y |
| POST | `/plans/:planId/generate` | AI 계획 생성 요청 (1차 또는 2차) | Y |
| PUT | `/plans/:planId/confirm` | 계획 확정 (draft → active) | Y |
| DELETE | `/plans/:planId` | 학습 계획 삭제 | Y |

### 3.3 목표 계층 (Goals / Milestones)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/plans/:planId/goals` | Macro Goal 목록 조회 | Y |
| PUT | `/goals/:goalId` | Macro Goal 수정 | Y |
| GET | `/goals/:goalId/milestones` | Milestone 목록 조회 | Y |
| PUT | `/milestones/:milestoneId` | Milestone 수정 | Y |

### 3.4 칸반 노드 (Nodes)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/plans/:planId/nodes` | 칸반 Node 목록 (상태별 필터 가능) | Y |
| GET | `/nodes/:nodeId` | Node 상세 조회 (Study Guide + Reviews + Sessions) | Y |
| PATCH | `/nodes/:nodeId/status` | Node 상태 변경 (todo/in_progress/done) | Y |
| PATCH | `/nodes/:nodeId/order` | Node 순서 변경 (드래그&드롭) | Y |
| PUT | `/nodes/:nodeId` | Node 내용 수정 | Y |

### 3.5 학습 세션 (Sessions)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/sessions` | 학습 세션 시작 (nodeId, timerType) | Y |
| PATCH | `/sessions/:sessionId` | 세션 종료 (endTime, duration) | Y |
| GET | `/nodes/:nodeId/sessions` | Node의 세션 이력 조회 | Y |
| POST | `/sessions/:sessionId/logs` | 학습 중 상태 기록 추가 | Y |

### 3.6 리뷰 (Reviews)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/nodes/:nodeId/reviews` | 학습 리뷰 작성 | Y |
| GET | `/nodes/:nodeId/reviews` | Node의 리뷰 이력 조회 | Y |
| PUT | `/reviews/:reviewId` | 리뷰 수정 | Y |

### 3.7 피드백 (Feedback)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/feedback/generate` | AI 피드백 리포트 생성 요청 | Y |
| GET | `/nodes/:nodeId/feedback` | Node별 피드백 조회 | Y |
| GET | `/plans/:planId/feedback` | 계획 전체 피드백 조회 | Y |

### 3.8 자기 관리 (PreCheck) — P1

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/prechecks` | Pre-check 기록 생성 | Y |
| GET | `/prechecks` | Pre-check 이력 조회 | Y |

### 3.9 프로필 (Profile) — P2

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/profile/stats` | 학습 통계 (활동 매트릭스, 누적 시간) | Y |
| GET | `/profile/activity` | 날짜별 활동 데이터 | Y |

---

## 4. 주요 요청/응답 예시

### POST /api/v1/auth/google

**요청**:
```json
{
  "code": "4/0AX4XfWh..."
}
```

**응답 (200)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g...",
  "user": {
    "id": "clx1234",
    "email": "user@gmail.com",
    "name": "홍길동",
    "avatarUrl": "https://lh3.googleusercontent.com/...",
    "createdAt": "2026-04-09T10:00:00Z"
  }
}
```

### POST /api/v1/plans

**요청**:
```json
{
  "title": "정보처리기사 합격"
}
```

**응답 (201)**:
```json
{
  "id": "plan_abc123",
  "title": "정보처리기사 합격",
  "status": "draft",
  "params": {},
  "createdAt": "2026-04-09T10:00:00Z"
}
```

### PATCH /api/v1/plans/:planId/params

**요청**:
```json
{
  "studyMaterial": {
    "subject": "정보처리기사",
    "sources": [
      {
        "type": "book",
        "name": "시나공 정보처리기사",
        "totalVolume": "900페이지",
        "additionalInfo": "하루 최소 1단원"
      }
    ]
  },
  "finalGoal": "정보처리기사 필기 합격",
  "deadline": "2026-06-15",
  "availableTime": "하루 2시간",
  "currentLevel": "입문",
  "managementStyle": "보통",
  "contentStructure": null,
  "focusArea": null,
  "studyMode": null
}
```

**응답 (200)**:
```json
{
  "id": "plan_abc123",
  "params": { ... },
  "paramCompleteness": {
    "primary": 7,
    "primaryTotal": 7,
    "secondary": 1,
    "secondaryTotal": 9
  }
}
```

### POST /api/v1/plans/:planId/generate

**요청**:
```json
{
  "mode": "basic"
}
```
- `mode`: `"basic"` (1차 질문만) 또는 `"detailed"` (2차 질문 포함)

**응답 (200)**:
```json
{
  "planId": "plan_abc123",
  "macroGoal": {
    "id": "goal_1",
    "title": "정보처리기사 필기 합격",
    "milestones": [
      {
        "id": "ms_1",
        "title": "1과목 소프트웨어 설계 1회독",
        "targetDate": "2026-04-30",
        "todos": [
          {
            "id": "todo_1",
            "title": "1장 요구사항 확인 (p.1-45)",
            "estimatedMinutes": 120,
            "order": 1,
            "studyGuide": {
              "objective": "요구사항 분석 기법 이해",
              "prerequisites": ["없음"],
              "generationBasis": "volume_based"
            }
          }
        ]
      }
    ]
  },
  "generationMode": "basic",
  "isDraft": true
}
```

### POST /api/v1/sessions

**요청**:
```json
{
  "nodeId": "todo_1",
  "timerType": "pomodoro"
}
```

**응답 (201)**:
```json
{
  "id": "session_xyz",
  "nodeId": "todo_1",
  "timerType": "pomodoro",
  "startTime": "2026-04-09T14:00:00Z",
  "status": "active"
}
```

### POST /api/v1/sessions/:sessionId/logs

**요청**:
```json
{
  "progressPercent": 40,
  "focusLevel": 3,
  "distraction": {
    "type": "external",
    "detail": "스마트폰 알림"
  },
  "note": "1장 절반 진행, 개념 이해됨"
}
```

### POST /api/v1/feedback/generate

**요청**:
```json
{
  "nodeId": "todo_1",
  "scope": "node"
}
```
- `scope`: `"node"` (단일 노드) 또는 `"plan"` (전체 계획)

**응답 (200)**:
```json
{
  "id": "fb_001",
  "nodeId": "todo_1",
  "summary": "학습 속도가 계획보다 약간 느립니다.",
  "progressAnalysis": {
    "expected": 45,
    "actual": 40,
    "gap": -5
  },
  "suggestions": [
    "내일은 25분 뽀모도로를 4세트로 늘려보세요.",
    "스마트폰을 다른 방에 두면 집중도가 높아집니다."
  ],
  "motivationMessage": "꾸준히 진행하고 계시네요. 이 페이스라면 충분히 달성 가능합니다!",
  "createdAt": "2026-04-09T16:00:00Z"
}
```

---

## 5. 에러 코드 규약

| HTTP 코드 | 에러 코드 | 설명 |
|-----------|----------|------|
| 400 | `INVALID_INPUT` | 요청 데이터 유효성 검증 실패 |
| 400 | `INVALID_PARAMS` | 필수 파라미터 누락 (1차 질문 미완료 상태에서 generate 시도) |
| 401 | `UNAUTHORIZED` | JWT 토큰 없음 또는 만료 |
| 401 | `INVALID_TOKEN` | JWT 토큰 검증 실패 |
| 403 | `FORBIDDEN` | 다른 사용자의 리소스 접근 시도 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `ALREADY_CONFIRMED` | 이미 확정된 계획을 다시 생성 시도 |
| 429 | `RATE_LIMITED` | API 호출 제한 초과 |
| 502 | `AI_SERVICE_ERROR` | OpenRouter API 응답 오류 |
| 503 | `AI_SERVICE_UNAVAILABLE` | OpenRouter API 연결 불가 |

---

## 6. 공통 규약

- **날짜/시간**: ISO 8601 형식 (`2026-04-09T14:00:00Z`)
- **ID 형식**: Prisma CUID (`clx1234abcd`)
- **페이지네이션**: `?page=1&limit=20` (기본 20건)
- **정렬**: `?sort=createdAt&order=desc`
- **필터**: `?status=todo,in_progress`
- **인증 헤더**: `Authorization: Bearer <jwt>`
