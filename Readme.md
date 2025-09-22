# Financial Tracking System – Docker Setup

## Prerequisites
- Docker Engine 24+
- Docker Compose v2 (ships with recent Docker Desktop/CLI)

## First-Time Build
```bash
docker compose up --build
```
The command builds both images, runs database migrations, and starts the stack:
- Backend API on http://localhost:5051
- Next.js frontend on http://localhost:3000

## Environment Variables
The compose file exposes sensible defaults. Override them by exporting variables before `docker compose` or by creating a local `.env` file in the project root. Frequently customized values:
- `SECRET_KEY`
- `WTF_CSRF_SECRET_KEY`
- `DATABASE_URL` (defaults to SQLite at `/data/hostel.db`)
- `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:5051`)

## Persistent Data
Two named volumes are created:
- `backend-data` holds the SQLite database at `/data/hostel.db`
- `uploads` stores files in `static/uploads`

## Common Tasks
- Rebuild after dependency changes: `docker compose build`
- Run in detached mode: `docker compose up -d`
- Stop services: `docker compose down`
- Reset persistent volumes (destructive): `docker compose down -v`
