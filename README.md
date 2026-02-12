# Sprinter Damage Manager

A web application for documenting and tracking damage on a fleet of Mercedes Benz Sprinter delivery vans. Each vehicle shows an interactive 4-side view (front, rear, left, right) where damages can be marked as circles or rectangles, categorized by severity, and later marked as repaired.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express 5, TypeScript, Prisma 5, PostgreSQL |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Konva.js |
| Auth | JWT access tokens (in-memory) + httpOnly refresh token cookies |
| Testing | Vitest 3, Supertest, Testing Library |

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm 8+

## Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd sprinter-damage-manager

# 2. Start PostgreSQL
docker compose up -d

# 3. Install dependencies
npm install

# 4. Configure environment
cp backend/.env.example backend/.env   # or use the provided .env

# 5. Run database migrations
npx prisma migrate deploy --schema=backend/prisma/schema.prisma

# 6. Start development servers
npm run dev:backend    # http://localhost:3001
npm run dev:frontend   # http://localhost:5173
```

## Environment Variables

All variables are set in `backend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://sprinter:sprinter_dev_password@localhost:5432/sprinter_damage_db` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens (min 32 chars) | — |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (min 32 chars) | — |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token TTL | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Refresh token TTL in days | `7` |
| `BCRYPT_ROUNDS` | bcrypt hash rounds (min 10) | `12` |
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |

## Available Scripts

```bash
# Development
npm run dev:backend        # Start backend dev server
npm run dev:frontend       # Start frontend dev server

# Build
npm run build:backend      # Compile backend TypeScript
npm run build:frontend     # Build frontend for production

# Testing
npm run test:backend       # Run backend tests
npm run test:frontend      # Run frontend tests
npm test                   # Run all tests

# Code quality
npm run lint               # Lint all workspaces
npm run format             # Format with Prettier
```

## API Documentation

When the backend is running in development mode, Swagger UI is available at:

**http://localhost:3001/api-docs**

## Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── auth/           # Registration, login, JWT, refresh tokens
│   │   ├── vehicles/       # Vehicle CRUD with German plate validation
│   │   ├── damages/        # Damage marking CRUD + repair
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── utils/          # Helpers (ID extraction, errors)
│   │   ├── openapi.ts      # OpenAPI 3.0 spec
│   │   └── app.ts          # Express app setup
│   ├── prisma/             # Schema & migrations
│   └── tests/              # Backend integration tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/           # Login & register pages
│   │   │   ├── vehicles/      # Vehicle list, detail, report pages
│   │   │   ├── damage-canvas/ # Konva.js canvas, toolbar, dialogs
│   │   │   ├── layout/        # App shell, protected routes
│   │   │   └── ui/            # Shared UI components
│   │   ├── hooks/          # Auth hooks
│   │   ├── services/       # API client services
│   │   ├── stores/         # Zustand auth store
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Canvas export utility
│   └── tests/              # Frontend component tests
├── docker-compose.yml
└── package.json            # Workspace root
```

## Features

- **Authentication**: Register, login, JWT access/refresh token flow
- **Vehicle Management**: CRUD with German license plate validation and search
- **4-Side Damage View**: Interactive Konva.js canvas with front, rear, left, right views
- **Damage Marking**: Place circles or rectangles, set severity (low/medium/high), add descriptions
- **Repair Tracking**: Mark damages as repaired with audit trail, toggle visibility
- **Damage Reports**: Summary page with all 4 views + damage table, print-optimized
- **PNG Export**: Export current canvas view as high-resolution PNG
- **Embeddable**: `/embed/vehicles/:id` route for iframe embedding
