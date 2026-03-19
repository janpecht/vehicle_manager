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

- **Authentication**: Register (restricted to configurable email domain), login, JWT access/refresh token flow, password reset via email code
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

## Deployment with Dokploy (recommended)

[Dokploy](https://dokploy.com) is a self-hosted PaaS that manages Docker Compose deployments with automatic SSL, environment variables, and GitHub integration.

### Prerequisites

- A server with Dokploy installed
- This repository connected to Dokploy (via GitHub)

### Setup in Dokploy

1. **Create a new Compose project** in Dokploy and connect this GitHub repo
2. **Set the Compose path** to `docker-compose.yml`
3. **Add environment variables** in the Dokploy UI (Settings > Environment):

   ```env
   # Required
   POSTGRES_PASSWORD=<generate a strong password>
   JWT_ACCESS_SECRET=<random string, min 32 chars>
   JWT_REFRESH_SECRET=<random string, min 32 chars>
   CORS_ORIGIN=https://your-domain.com
   ALLOWED_EMAIL_DOMAIN=your-company.com

   # Optional — SMTP for checklist alarm emails
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=user@example.com
   SMTP_PASS=password
   SMTP_FROM=noreply@example.com
   CHECKLIST_NOTIFY_EMAIL=fleet@example.com
   ```

4. **Configure the domain** in Dokploy for the `frontend` service (port 80). Dokploy will handle SSL/TLS via Let's Encrypt automatically
5. **Deploy** — Dokploy will build all containers and start them. The backend runs Prisma migrations automatically on startup

### First Login

Register at `https://your-domain.com/register` (email must match `ALLOWED_EMAIL_DOMAIN`).

### Architecture Notes

- **Only the frontend (nginx) is exposed** — it proxies `/api`, `/auth`, `/public`, `/api-docs` to the backend internally
- PostgreSQL and backend have no external ports (Docker-internal only)
- The backend runs `prisma migrate deploy` on every container start, so schema changes are applied automatically on redeployment
- Alarm emails are sent only when a checklist submission has problem conditions (new damage, dashboard warnings, dirty seats/cargo, smoking, etc.)

---

## Deployment with Docker Compose (manual)

For manual deployment without Dokploy.

### Prerequisites

- Docker & Docker Compose v2+
- A server or VM with port 80 available

### 1. Clone the repository

```bash
git clone https://github.com/janpecht/vehicle_manager.git
cd vehicle_manager
```

### 2. Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env
# Edit .env with your values
```

See [Environment Variables](#environment-variables) for all options.

### 3. Start all services

```bash
docker compose up -d --build
```

This will:
- Start PostgreSQL and wait until it's healthy
- Build and start the backend (runs Prisma migrations automatically on startup)
- Build and start the frontend (served via nginx on port 80)

### 4. Create the first admin user

Register via the frontend at `http://your-server/register` (email must match `ALLOWED_EMAIL_DOMAIN`).

### Access

| Service | URL |
|---------|-----|
| Frontend | `http://your-server` |
| API Docs (Swagger) | `http://your-server/api-docs` |
| Public Checklist | `http://your-server/checklist/:vehicleId` |

---

## Environment Variables

All backend environment variables are passed via `docker-compose.yml` or a root `.env` file:

| Variable | Required | Description | Default / Example |
|----------|----------|-------------|-------------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. In Docker Compose this is built from the postgres service settings. | `postgresql://sprinter:password@postgres:5432/vehicle_db?schema=public` |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing access tokens. **Must be at least 32 characters.** | — |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens. **Must be at least 32 characters.** Must differ from access secret. | — |
| `ACCESS_TOKEN_EXPIRES_IN` | No | Access token TTL (ms-compatible string) | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | No | Refresh token TTL in days | `7` |
| `BCRYPT_ROUNDS` | No | bcrypt hash rounds (minimum 10) | `12` |
| `PORT` | No | Backend server port | `3001` |
| `NODE_ENV` | No | `development`, `production`, or `test` | `development` |
| `CORS_ORIGIN` | Yes | Allowed frontend origin URL (must match where frontend is served) | `http://localhost:5173` |
| `ALLOWED_EMAIL_DOMAIN` | Yes | Only emails from this domain can register (e.g. `example.com`) | — |
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
| `POSTGRES_DB` | Database name | `vehicle_db` |

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
│   │   ├── auth/              # Registration, login, JWT, refresh tokens, password reset
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
│   │   │   ├── auth/          # Login, register, forgot/reset password pages
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
