# Docker Deployment

The root `compose.yaml` runs the complete VulnGuard AI stack:

- React production build served by Nginx on `http://localhost:8080`
- NestJS API and Swagger on `http://localhost:3000/api`
- PostgreSQL 18 with a persistent named volume
- FastAPI NVIDIA service on `http://localhost:8000`

## Requirements

- Docker Desktop with Docker Compose v2
- At least 4 GB of free memory

## Configure

From the repository root, create the local Compose environment file:

```powershell
Copy-Item compose.env.example .env
notepad .env
```

Replace `POSTGRES_PASSWORD`, `JWT_SECRET`, and `AI_SERVICE_TOKEN` with strong,
unique values. `NVIDIA_API_KEY` is optional; without it, AI requests safely use
the rules fallback. Never commit `.env`.

## Start

```powershell
docker compose up --build -d
docker compose ps
```

The database health check must pass before the backend applies Prisma
migrations and the idempotent seed. The frontend starts after the backend health
check succeeds.

View logs:

```powershell
docker compose logs -f backend
docker compose logs -f ai-service
```

## Stop and restart

Stop containers while retaining database data:

```powershell
docker compose down
```

Restart:

```powershell
docker compose up -d
```

Remove containers and the local database volume only when the data is no longer
needed:

```powershell
docker compose down --volumes
```

The `--volumes` command permanently deletes the Compose-managed local database.

## Production notes

- Replace localhost frontend/backend URLs with public HTTPS origins at build and
  runtime.
- Store passwords and API keys in the target platform's secret manager.
- Terminate TLS at a trusted reverse proxy or load balancer.
- Back up the PostgreSQL volume before upgrades.
- PostgreSQL 18 stores data under a version-specific directory, so the Compose
  volume intentionally mounts `/var/lib/postgresql`.
