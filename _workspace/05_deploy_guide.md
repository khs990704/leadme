# 배포 가이드 — LeadMe

> 버전: 1.0
> 작성일: 2026-04-09
> 기반: _workspace/01_architecture.md (14절 DevOps 전달 사항)

---

## 1. 인프라 개요

```mermaid
graph TB
    subgraph Vercel["Vercel Platform"]
        FE["Frontend<br/>React 19 + Vite<br/>정적 SPA 배포"]
        BE["Backend<br/>Express 5<br/>Serverless Functions"]
    end

    subgraph Supabase["Supabase"]
        PG[(PostgreSQL 16<br/>Connection Pooling)]
    end

    subgraph External["External Services"]
        GOOGLE["Google OAuth 2.0"]
        OPENROUTER["OpenRouter API"]
    end

    subgraph CI["GitHub Actions"]
        LINT["Lint + Type Check"]
        TEST["Unit / Integration Tests"]
    end

    User -->|HTTPS| FE
    FE -->|REST API| BE
    BE --> PG
    BE --> GOOGLE
    BE --> OPENROUTER
    CI -->|PR| LINT
    CI -->|PR| TEST
    Vercel -->|Git Integration| CI
```

**배포 전략**: Vercel Git Integration을 기본으로 사용한다. `main` 브랜치에 push 시 프로덕션 배포, PR 생성 시 프리뷰 배포가 자동으로 수행된다. GitHub Actions는 CI(lint, type-check, test)만 담당한다.

---

## 2. 외부 서비스 프로비저닝

### 2.1 Supabase PostgreSQL

1. [supabase.com](https://supabase.com)에 가입/로그인
2. "New Project" 클릭
   - Organization: 기존 또는 새로 생성
   - Project name: `leadme`
   - Database Password: 강력한 비밀번호 생성 (별도 보관)
   - Region: `Northeast Asia (Tokyo)` — 한국 사용자 기준 최저 레이턴시
   - Plan: Free (500MB, 충분)
3. 프로젝트 생성 완료 후 Settings > Database로 이동
4. **Connection string** 복사:
   - Mode: `Transaction` (Serverless 환경 필수 — Connection Pooling)
   - URI 형식: `postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`
5. 이 값을 `DATABASE_URL` 환경변수로 사용

**주의사항**:
- Serverless Functions에서는 반드시 **Transaction Mode** (포트 6543)를 사용한다. Session Mode (포트 5432)는 커넥션이 풀에 반환되지 않아 고갈될 수 있다.
- Prisma에서 `?pgbouncer=true&connection_limit=1` 파라미터를 CONNECTION_URL에 추가한다.

### 2.2 Google OAuth 2.0 클라이언트

1. [Google Cloud Console](https://console.cloud.google.com)에 접속
2. 프로젝트 생성: `LeadMe`
3. APIs & Services > OAuth consent screen 설정
   - User Type: External
   - App name: `LeadMe`
   - Authorized domains: `vercel.app` (프리뷰 배포 포함)
   - Scopes: `email`, `profile`, `openid`
4. APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
   - Application type: Web application
   - Name: `LeadMe Web`
   - Authorized JavaScript origins:
     - `http://localhost:5173` (개발)
     - `https://leadme.vercel.app` (프로덕션, 또는 커스텀 도메인)
   - Authorized redirect URIs:
     - `http://localhost:3001/api/v1/auth/google/callback` (개발)
     - `https://api-leadme.vercel.app/api/v1/auth/google/callback` (프로덕션)
5. Client ID / Client Secret 복사 후 환경변수에 설정

### 2.3 OpenRouter API 키

1. [openrouter.ai](https://openrouter.ai)에 가입/로그인
2. Settings > API Keys > "Create Key"
3. Name: `leadme-production`
4. 생성된 키(`sk-or-v1-...`) 복사 후 환경변수에 설정
5. 기본 모델: `google/gemma-4-26b-a4b-it:free` (무료 티어, MVP 검증용)

---

## 3. 환경변수

### 3.1 전체 목록

#### Backend 환경변수

| 변수명 | 필수 | 설명 | 예시 |
|--------|------|------|------|
| `DATABASE_URL` | Y | PostgreSQL 연결 문자열 (Supabase Transaction Mode) | `postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
| `GOOGLE_CLIENT_ID` | Y | Google OAuth 클라이언트 ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Y | Google OAuth 시크릿 | `GOCSPX-xxx` |
| `GOOGLE_CALLBACK_URL` | Y | OAuth 콜백 URL | `https://api-leadme.vercel.app/api/v1/auth/google/callback` |
| `JWT_ACCESS_SECRET` | Y | Access Token 서명 키 (32자 이상) | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Y | Refresh Token 서명 키 (32자 이상) | `openssl rand -base64 32` |
| `JWT_ACCESS_EXPIRES_IN` | N | Access Token 만료 시간 | `15m` (기본값) |
| `JWT_REFRESH_EXPIRES_IN` | N | Refresh Token 만료 시간 | `7d` (기본값) |
| `OPENROUTER_API_KEY` | Y | OpenRouter API 키 | `sk-or-v1-xxx` |
| `OPENROUTER_MODEL` | N | AI 모델 ID | `google/gemma-4-26b-a4b-it:free` (기본값) |
| `OPENROUTER_BASE_URL` | N | OpenRouter 엔드포인트 | `https://openrouter.ai/api/v1` (기본값) |
| `FRONTEND_URL` | Y | 프론트엔드 URL (CORS 허용) | `https://leadme.vercel.app` |
| `NODE_ENV` | N | 환경 구분 | `production` |
| `PORT` | N | 서버 포트 (로컬 전용) | `3001` |
| `RATE_LIMIT_WINDOW_MS` | N | Rate Limit 윈도우 | `60000` (기본값) |
| `RATE_LIMIT_MAX` | N | Rate Limit 최대 요청 수 | `100` (기본값) |

#### Frontend 환경변수

| 변수명 | 필수 | 설명 | 예시 |
|--------|------|------|------|
| `VITE_API_BASE_URL` | Y | 백엔드 API URL | `https://api-leadme.vercel.app/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | Y | Google OAuth 클라이언트 ID | `xxx.apps.googleusercontent.com` |

### 3.2 시크릿 생성 방법

```bash
# JWT 시크릿 생성 (macOS/Linux)
openssl rand -base64 32

# 또는 Node.js로 생성
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 4. Vercel 프로젝트 설정

### 4.1 Frontend 프로젝트

1. [vercel.com](https://vercel.com)에서 "Add New Project"
2. GitHub 레포지토리 `leadme` 연결
3. 프로젝트 설정:
   - **Project Name**: `leadme`
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Environment Variables 설정:
   - `VITE_API_BASE_URL` = `https://api-leadme.vercel.app/api/v1`
   - `VITE_GOOGLE_CLIENT_ID` = (Google Console에서 복사한 값)
5. Deploy 클릭

### 4.2 Backend 프로젝트

1. Vercel에서 별도 프로젝트로 "Add New Project"
2. 동일한 GitHub 레포지토리 `leadme` 연결
3. 프로젝트 설정:
   - **Project Name**: `api-leadme`
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: (비워 둠)
   - **Install Command**: `npm install`
4. Environment Variables 설정 (3.1절 Backend 환경변수 전체)
5. `backend/vercel.json`이 Serverless Functions 라우팅을 처리

### 4.3 환경별 설정

| 환경 | 브랜치 | Frontend URL | Backend URL |
|------|--------|-------------|-------------|
| Production | `main` | `leadme.vercel.app` | `api-leadme.vercel.app` |
| Preview | PR 브랜치 | `leadme-xxx-pr-N.vercel.app` | `api-leadme-xxx-pr-N.vercel.app` |
| Development | 로컬 | `http://localhost:5173` | `http://localhost:3001` |

Vercel Dashboard에서 환경변수를 Environment(Production / Preview / Development)별로 다르게 설정할 수 있다.

---

## 5. CI/CD 파이프라인

### 5.1 전체 흐름

```
PR 생성/업데이트
  ├── GitHub Actions: lint + type-check + test (ci.yml)
  └── Vercel: 프리뷰 배포 (자동)

main 머지
  └── Vercel: 프로덕션 배포 (자동, Git Integration)
```

### 5.2 GitHub Actions CI

`.github/workflows/ci.yml`이 PR 이벤트에서 다음을 수행한다:
- frontend: lint, type-check, test (Vitest)
- backend: lint, type-check, test (Vitest), Prisma generate

### 5.3 Vercel Git Integration

Vercel이 자동으로 처리하는 항목:
- `main` push 시 프로덕션 배포
- PR 생성 시 프리뷰 배포 + 코멘트에 URL 첨부
- 프리뷰 환경에서 Preview 환경변수 적용

별도의 `deploy.yml` 워크플로우는 Vercel Git Integration이 처리하므로 불필요하다. 만약 수동 배포가 필요한 경우를 위해 `deploy.yml`도 포함하였으며, `vercel --prod` CLI를 사용한다.

---

## 6. 배포 절차

### 6.1 최초 배포

```bash
# 1. 레포지토리 클론
git clone https://github.com/<org>/leadme.git
cd leadme

# 2. 환경변수 파일 생성
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
# 각 .env 파일을 실제 값으로 채운다

# 3. Supabase 프로비저닝 (2.1절 참조)
# DATABASE_URL을 backend/.env에 설정

# 4. Google OAuth 클라이언트 설정 (2.2절 참조)
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET을 backend/.env에 설정

# 5. OpenRouter API 키 발급 (2.3절 참조)
# OPENROUTER_API_KEY를 backend/.env에 설정

# 6. DB 마이그레이션
cd backend
npx prisma migrate deploy
npx prisma generate
cd ..

# 7. 로컬 확인
cd frontend && npm run dev &
cd backend && npm run dev &
# http://localhost:5173 에서 동작 확인

# 8. Vercel 프로젝트 설정 (4.1, 4.2절 참조)
# GitHub 레포 연결 + 환경변수 설정 + 배포
```

### 6.2 업데이트 배포 (일상)

```bash
# 1. 기능 브랜치에서 개발
git checkout -b feat/some-feature

# 2. 커밋 + PR 생성
git add .
git commit -m "feat: add some feature"
git push -u origin feat/some-feature
gh pr create --title "feat: some feature"

# 3. CI 통과 확인 (GitHub Actions)
# 4. 프리뷰 배포 확인 (Vercel이 PR 코멘트에 URL 제공)
# 5. 코드 리뷰 후 main에 머지
# 6. Vercel이 자동으로 프로덕션 배포

# DB 스키마 변경이 있는 경우:
# - 머지 전에 Supabase에서 마이그레이션 실행
# - 또는 Vercel Build Command에 prisma migrate deploy 포함
```

### 6.3 DB 마이그레이션 (스키마 변경 시)

```bash
# 개발 환경에서 마이그레이션 생성
cd backend
npx prisma migrate dev --name add_some_field

# 프로덕션에 적용 (배포 전)
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

---

## 7. 도메인 설정

### 7.1 기본 도메인 (Vercel 제공)

- Frontend: `leadme.vercel.app`
- Backend: `api-leadme.vercel.app`

### 7.2 커스텀 도메인 (선택)

1. 도메인 구매 (예: `leadme.app`)
2. Vercel Dashboard > Project > Settings > Domains
3. Frontend: `leadme.app` + `www.leadme.app`
4. Backend: `api.leadme.app`
5. DNS 설정:
   - `A` 레코드: `76.76.21.21` (Vercel)
   - `CNAME`: `cname.vercel-dns.com`
6. SSL은 Vercel이 자동으로 Let's Encrypt 인증서 발급

커스텀 도메인 설정 후 환경변수 업데이트:
- `FRONTEND_URL` = `https://leadme.app`
- `GOOGLE_CALLBACK_URL` = `https://api.leadme.app/api/v1/auth/google/callback`
- `VITE_API_BASE_URL` = `https://api.leadme.app/api/v1`
- Google OAuth Console에서 Authorized origins/redirect URIs 추가

---

## 8. 모니터링

| 항목 | 도구 | 설정 |
|------|------|------|
| 프론트엔드 성능 | Vercel Analytics | Vercel Dashboard > Analytics 탭에서 활성화 (무료) |
| Serverless 로그 | Vercel Functions Log | Vercel Dashboard > Logs 탭에서 실시간 로그 확인 |
| 에러 트래킹 | Sentry (향후) | `@sentry/node` + `@sentry/react` 패키지 추가, DSN 환경변수 설정 |
| DB 모니터링 | Supabase Dashboard | Database > Monitoring 탭에서 쿼리 성능, 커넥션 수 확인 |
| 가동 시간 | Vercel Uptime (또는 UptimeRobot) | 헬스체크 엔드포인트 `GET /api/v1/health` 모니터링 |

---

## 9. 롤백 절차

### 9.1 Vercel 롤백 (즉시)

1. Vercel Dashboard > Deployments
2. 이전 정상 배포를 찾아 "..." > "Promote to Production" 클릭
3. 즉시 이전 버전으로 트래픽 전환

### 9.2 DB 롤백 (주의)

```bash
# 마이그레이션 롤백은 Prisma가 직접 지원하지 않으므로:
# 1. 역방향 마이그레이션 SQL을 수동으로 작성
# 2. Supabase SQL Editor에서 실행
# 3. prisma/migrations 폴더에서 해당 마이그레이션 삭제
# 4. prisma migrate resolve --rolled-back <migration_name>
```

### 9.3 긴급 대응

1. Vercel에서 즉시 이전 배포로 롤백
2. 원인 분석 (Vercel Logs, Supabase Logs)
3. 핫픽스 브랜치 생성 → 수정 → PR → 머지
4. 정상 배포 확인 후 핫픽스 브랜치 삭제

---

## 10. 보안 체크리스트

- [ ] HTTPS 강제 (Vercel 기본 제공)
- [ ] 환경변수는 Vercel Dashboard에서만 관리 (코드에 하드코딩 금지)
- [ ] `.env` 파일은 `.gitignore`에 포함
- [ ] CORS: `FRONTEND_URL`만 허용 (백엔드 `config/cors.ts`)
- [ ] Rate Limiting: 분당 100요청 제한 (AI 엔드포인트는 분당 10 별도 제한 권장)
- [ ] JWT Access Token 15분 만료 + Refresh Token Rotation
- [ ] Refresh Token은 DB에 bcrypt 해시로 저장
- [ ] Prisma: `$queryRawUnsafe` 사용 금지 (SQL Injection 방지)
- [ ] 입력 검증: 모든 API 엔드포인트에 Zod 스키마 적용
- [ ] CSP 헤더: Vercel `headers` 설정으로 Content-Security-Policy 추가
- [ ] Google OAuth: 프로덕션 배포 전 OAuth consent screen을 "Publishing status: In production"으로 변경
- [ ] Supabase: Row Level Security(RLS) 비활성 확인 (Prisma ORM이 직접 접근하므로 RLS 불필요, 단 Direct Access 차단)

---

## 11. 트러블슈팅

### Vercel Serverless Functions 콜드 스타트

- 증상: 첫 요청이 느림 (2-5초)
- 원인: Serverless Functions는 요청 시 인스턴스를 생성
- 완화: Vercel Pro 플랜의 "Always On" 옵션, 또는 cron으로 주기적 핑

### Prisma + Serverless 커넥션 이슈

- 증상: `Too many connections` 에러
- 원인: 각 Serverless 인스턴스가 별도 커넥션 풀 생성
- 해결: Supabase Transaction Mode (포트 6543) 사용 + `connection_limit=1` 설정

### Google OAuth 리디렉트 에러

- 증상: `redirect_uri_mismatch`
- 원인: Google Console의 Authorized redirect URIs와 `GOOGLE_CALLBACK_URL`이 불일치
- 해결: 정확한 URL(프로토콜, 포트 포함)이 일치하는지 확인

### CORS 에러

- 증상: 브라우저에서 `Access-Control-Allow-Origin` 에러
- 원인: `FRONTEND_URL` 환경변수가 실제 프론트엔드 URL과 불일치
- 해결: Vercel 환경변수에서 `FRONTEND_URL`을 프론트엔드 배포 URL로 정확히 설정

### Vercel 빌드 실패

- 증상: 배포 시 빌드 에러
- 확인: Vercel Dashboard > Deployments > 해당 배포 > Build Logs
- 흔한 원인: TypeScript 타입 에러, 환경변수 누락, 의존성 버전 충돌
