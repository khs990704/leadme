# LeadMe

학습 시작, 지속, 복기를 AI가 관리해주는 학습 관리 서비스.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 6 + TypeScript |
| State | Zustand (global) + TanStack Query (server) |
| UI | Tailwind CSS 4 + shadcn/ui |
| Backend | Express 5 + TypeScript |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 (Supabase) |
| Auth | Google OAuth 2.0 + JWT |
| AI | OpenRouter (google/gemma-4-26b-a4b-it:free) |
| Deploy | Vercel (Frontend SPA + Backend Serverless Functions) |

## Project Structure

```
leadme/
├── frontend/          # React 19 SPA
├── backend/           # Express 5 API server
├── spec/              # Planning documents
├── _workspace/        # Design documents
└── package.json       # Root workspace scripts
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Docker (PostgreSQL 컨테이너용)
- Google Cloud Console 계정 (OAuth 키 발급용)

### 1. Clone & Install

```bash
git clone https://github.com/khs990704/leadme.git
cd leadme

# 의존성 설치 (frontend + backend + Prisma client)
npm run setup
```

### 2. PostgreSQL (Docker)

```bash
# PostgreSQL 16 컨테이너 실행
docker run -d \
  --name leadme-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=leadme \
  -e POSTGRES_PASSWORD=leadme \
  -e POSTGRES_DB=leadme \
  postgres:16

# 확인
docker ps | grep leadme-postgres
```

> 이미 로컬에 PostgreSQL이 설치되어 있으면 Docker 없이 직접 사용해도 된다.

### 3. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 접속
2. 프로젝트 생성 (없으면) → 이름: `LeadMe`
3. **OAuth 동의 화면** 설정
   - 유형: 외부
   - 앱 이름: `LeadMe`
   - 범위(Scopes): `email`, `profile`, `openid`
   - 테스트 사용자: 본인 Gmail 추가
4. **사용자 인증 정보** → **OAuth 클라이언트 ID** 생성
   - 유형: 웹 애플리케이션
   - 승인된 자바스크립트 원본: `http://localhost:5173`
   - 승인된 리디렉션 URI: `http://localhost:5173/login/callback`
5. 생성된 **클라이언트 ID**와 **클라이언트 시크릿**을 메모

### 4. 환경변수 설정

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

**backend/.env** 필수 항목:

```env
# Docker PostgreSQL 사용 시
DATABASE_URL=postgresql://leadme:leadme@localhost:5432/leadme

# Google OAuth (3단계에서 발급받은 값)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# JWT 시크릿 생성
# openssl rand -base64 32  (2번 실행하여 각각 입력)
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# OpenRouter AI (https://openrouter.ai 에서 API key 발급)
OPENROUTER_API_KEY=your-openrouter-key
```

**frontend/.env** 필수 항목:

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_GOOGLE_CLIENT_ID=your-client-id  # backend와 동일한 값
```

### 5. Database 마이그레이션

```bash
npm run db:migrate
npm run db:seed        # (선택) 시드 데이터
```

### 6. 실행

```bash
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

> `npm run dev`는 concurrently로 프론트/백을 동시 실행한다.
> 개별 실행: `npm run dev:frontend` / `npm run dev:backend`

### Available Scripts (Root)

| Command | Description |
|---------|-------------|
| `npm run dev` | 프론트엔드 + 백엔드 dev server 동시 실행 |
| `npm run build` | 프론트엔드 + 백엔드 빌드 |
| `npm run lint` | 양쪽 Lint |
| `npm run test` | 양쪽 테스트 |
| `npm run typecheck` | 양쪽 타입 체크 |
| `npm run db:migrate` | Prisma 마이그레이션 (dev) |
| `npm run db:studio` | Prisma Studio (DB GUI) |
| `npm run setup` | 의존성 설치 + Prisma client 생성 |

## Environment Variables

각 `.env.example` 파일 참조:

- `frontend/.env.example` — VITE_API_BASE_URL, VITE_GOOGLE_CLIENT_ID
- `backend/.env.example` — DATABASE_URL, OAuth, JWT, OpenRouter 등

## Deployment

`_workspace/05_deploy_guide.md` 참조.

- Frontend/Backend를 각각 별도 Vercel 프로젝트로 배포
- Vercel Git Integration으로 main 머지 시 자동 배포
- GitHub Actions CI: PR마다 lint + type-check + test 실행

## License

See [LICENSE](./LICENSE).
