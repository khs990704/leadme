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
├── shared/            # Shared types (optional)
├── spec/              # Planning documents
├── _workspace/        # Design documents
└── package.json       # Root workspace scripts
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16 (local) or Supabase account

### Setup

```bash
# 1. Clone
git clone https://github.com/<org>/leadme.git
cd leadme

# 2. Install dependencies
npm run setup

# 3. Configure environment
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
# Edit both .env files with your actual values

# 4. Database setup
npm run db:migrate
npm run db:seed        # optional seed data

# 5. Run development servers
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

### Available Scripts (Root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend dev servers |
| `npm run build` | Build both frontend and backend |
| `npm run lint` | Lint both projects |
| `npm run test` | Run tests in both projects |
| `npm run typecheck` | Type-check both projects |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run setup` | Install all dependencies + generate Prisma client |

## Environment Variables

See each `.env.example` file for required variables:

- `frontend/.env.example` -- Frontend env vars (VITE_API_BASE_URL, VITE_GOOGLE_CLIENT_ID)
- `backend/.env.example` -- Backend env vars (DATABASE_URL, OAuth, JWT, OpenRouter, etc.)

## Deployment

See `_workspace/05_deploy_guide.md` for full deployment instructions.

**Quick summary:**
1. Frontend and Backend are deployed as separate Vercel projects
2. Vercel Git Integration handles automatic deployments (main = production, PR = preview)
3. GitHub Actions CI runs lint + type-check + test on every PR

## License

See [LICENSE](./LICENSE).
