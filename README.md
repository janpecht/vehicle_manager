# Vehicle Manager

A web application for documenting and tracking damage on a fleet of delivery vans. Each vehicle shows an interactive 4-side view (front, rear, left, right) where damages can be marked as circles or rectangles, categorized by severity, and later marked as repaired. Includes a public vehicle checklist form (DE/EN) and an admin dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express 5, TypeScript, Prisma 5, PostgreSQL |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Konva.js |
| Auth | JWT access tokens (in-memory) + httpOnly refresh token cookies |
| Testing | Vitest 3, Supertest, Testing Library |
| Deployment | Docker Compose (PostgreSQL + Backend + Frontend/nginx) |

## Features

- **Authentication**: Register (restricted to @dieeisfabrik.de emails), login, JWT access/refresh token flow
- **Vehicle Management**: CRUD with German license plate validation, search, vehicle types with custom images
- **4-Side Damage View**: Interactive Konva.js canvas with front, rear, left, right views (custom vehicle type images supported)
- **Damage Marking**: Draw circles or rectangles via drag, set severity (low/medium/high), add descriptions, drag to reposition
- **Repair Tracking**: Mark damages as repaired with audit trail, toggle visibility filter
- **Public Checklist Form**: `/checklist/:vehicleId` - shift-start vehicle checklist with photo upload (DE/EN)
- **Checklist Admin**: View submissions, filter by vehicle/driver/date, photo gallery overlay
- **Damage Reports**: Summary page with all 4 views + damage table, print-optimized
- **PNG Export**: Export current canvas view as high-resolution PNG
- **Embeddable**: `/embed/vehicles/:id` route for iframe embedding
- **API Docs**: Swagger UI at `/api-docs`

---

## Deployment with Docker Compose

This is the recommended way to deploy the full stack (PostgreSQL + Backend + Frontend).

### Prerequisites

- Docker & Docker Compose v2+
- A server or VM with ports 5173 (frontend) and 3001 (backend) available

### 1. Clone the repository

```bash
git clone https://github.com/janpecht/vehicle_manager.git
cd vehicle_manager
```

### 2. Configure environment variables

Edit `docker-compose.yml` to set your environment variables (see section below), or use a `.env` file at the project root:

```bash
# Example: create a .env file for Docker Compose
cat > .env <<EOF
POSTGRES_USER=sprinter
POSTGRES_PASSWORD=your_secure_db_password
POSTGRES_DB=sprinter_damage_db
JWT_ACCESS_SECRET=your-access-secret-min-32-characters-long!!
JWT_REFRESH_SECRET=your-refresh-secret-min-32-characters-long!!
CORS_ORIGIN=http://your-domain:5173
EOF
```

### 3. Start all services

```bash
docker compose up -d --build
```

This will:
- Start PostgreSQL and wait until it's healthy
- Build and start the backend (runs Prisma migrations automatically on startup)
- Build and start the frontend (served via nginx)

### 4. Create the first admin user

Register via the frontend at `http://your-server:5173/register` (email must end with `@dieeisfabrik.de`).

### Access

| Service | URL |
|---------|-----|
| Frontend | `http://your-server:5173` |
| Backend API | `http://your-server:3001/api` |
| API Docs (Swagger) | `http://your-server:3001/api-docs` |
| Public Checklist | `http://your-server:5173/checklist/:vehicleId` |

---

## Environment Variables

All backend environment variables are passed via `docker-compose.yml` or a root `.env` file:

| Variable | Required | Description | Default / Example |
|----------|----------|-------------|-------------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. In Docker Compose this is built from the postgres service settings. | `postgresql://sprinter:password@postgres:5432/sprinter_damage_db?schema=public` |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing access tokens. **Must be at least 32 characters.** | — |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens. **Must be at least 32 characters.** Must differ from access secret. | — |
| `ACCESS_TOKEN_EXPIRES_IN` | No | Access token TTL (ms-compatible string) | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | No | Refresh token TTL in days | `7` |
| `BCRYPT_ROUNDS` | No | bcrypt hash rounds (minimum 10) | `12` |
| `PORT` | No | Backend server port | `3001` |
| `NODE_ENV` | No | `development`, `production`, or `test` | `development` |
| `CORS_ORIGIN` | Yes | Allowed frontend origin URL (must match where frontend is served) | `http://localhost:5173` |
| `SMTP_HOST` | No | SMTP server for checklist email notifications | — |
| `SMTP_PORT` | No | SMTP port | `587` |
| `SMTP_SECURE` | No | Use TLS (`true`/`false`) | `false` |
| `SMTP_USER` | No | SMTP username | — |
| `SMTP_PASS` | No | SMTP password | — |
| `SMTP_FROM` | No | Sender email address | — |
| `CHECKLIST_NOTIFY_EMAIL` | No | Recipient for checklist notifications | — |

### PostgreSQL variables (in `docker-compose.yml` under `postgres.environment`):

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Database user | `sprinter` |
| `POSTGRES_PASSWORD` | Database password | `sprinter_dev_password` |
| `POSTGRES_DB` | Database name | `sprinter_damage_db` |

> **Important for production:** Change `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `POSTGRES_PASSWORD` to strong, unique values. Never use the default development secrets in production.

---

## Local Development (without Docker for app)

If you prefer to run the backend and frontend natively (only PostgreSQL in Docker):

```bash
# 1. Start only PostgreSQL
docker compose up -d postgres

# 2. Install dependencies
npm install

# 3. Configure backend environment
cp backend/.env.example backend/.env  # edit as needed

# 4. Run database migrations
npx prisma migrate deploy --schema=backend/prisma/schema.prisma

# 5. Start development servers
npm run dev:backend    # http://localhost:3001
npm run dev:frontend   # http://localhost:5173
```

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

## Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── auth/              # Registration, login, JWT, refresh tokens
│   │   ├── vehicles/          # Vehicle CRUD with German plate validation
│   │   ├── vehicle-types/     # Vehicle types with custom side images
│   │   ├── damages/           # Damage marking CRUD + repair
│   │   ├── checklists/        # Checklist submissions + photo uploads
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── utils/             # Helpers (ID extraction, errors)
│   │   ├── openapi.ts         # OpenAPI 3.0 spec
│   │   └── app.ts             # Express app setup
│   ├── prisma/                # Schema & migrations
│   └── tests/                 # Backend integration tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # Login & register pages
│   │   │   ├── vehicles/      # Vehicle list, detail, report pages
│   │   │   ├── damage-canvas/ # Konva.js canvas, toolbar, dialogs
│   │   │   ├── checklist/     # Public checklist form + admin list
│   │   │   ├── layout/        # App shell, protected routes
│   │   │   └── ui/            # Shared UI components
│   │   ├── hooks/             # Auth hooks
│   │   ├── services/          # API client services
│   │   ├── stores/            # Zustand auth store
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Canvas export, error helpers
│   └── tests/                 # Frontend component tests
├── docker-compose.yml         # Full stack deployment
└── package.json               # Workspace root
```
