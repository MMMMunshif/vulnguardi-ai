# VulnGuard AI Deployment Guide

This guide covers local setup, production configuration, database deployment,
verification, and common deployment problems.

For a ready-to-use Render Blueprint and dashboard walkthrough, see
[`Render_Deployment.md`](Render_Deployment.md).

## Requirements

- Node.js 22 and npm
- PostgreSQL
- Git
- Optional OpenAI API key for live AI remediation recommendations

## Services

- NestJS backend: `http://localhost:3000`
- Swagger API documentation: `http://localhost:3000/api`
- React/Vite frontend: `http://localhost:5173`
- PostgreSQL database accessed through Prisma

## Backend environment

Copy `backend/.env.example` to `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
JWT_SECRET="a-long-random-production-secret"
PORT="3000"
CORS_ORIGIN="https://your-frontend.example.com"
AI_PROVIDER="rules"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-5-mini"
```

`JWT_SECRET` is mandatory in production. `CORS_ORIGIN` accepts a comma-separated
list of trusted frontend origins.

Use `AI_PROVIDER="rules"` for deterministic local recommendations. For OpenAI,
set `AI_PROVIDER="openai"` and provide `OPENAI_API_KEY`. Provider failures fall
back to the rules engine.

## Frontend environment

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL="https://your-api.example.com"
```

Vite embeds this URL at build time, so rebuild after changing it.

## Local setup

Backend:

```powershell
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

The seed creates the default organization, department, and roles. Create the
initial administrator through registration. Public registration is disabled
automatically after the first user exists.

Frontend, in another terminal:

```powershell
cd frontend
npm ci
npm run dev
```

## Database changes

Create a migration during local development:

```powershell
cd backend
npx prisma migrate dev --name describe_the_change
```

Apply committed migrations in production:

```powershell
cd backend
npx prisma generate
npx prisma migrate deploy
```

Back up production data before applying migrations.

## Production build

Backend:

```powershell
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start:prod
```

Frontend:

```powershell
cd frontend
npm ci
npm run build
```

Serve `frontend/dist` with a static host and configure SPA fallback to
`index.html`.

## Release verification

```powershell
cd backend
npm run test:cov -- --runInBand
npm run test:e2e -- --runInBand
npm run build

cd ..\frontend
npm run lint
npm run build
```

GitHub Actions runs these checks for pushes and pull requests to `main`.

## Production security checklist

- Use a unique, long `JWT_SECRET`; never commit it.
- Use a restricted PostgreSQL account and encrypted database connection.
- Restrict `CORS_ORIGIN` to trusted frontend domains.
- Serve the API and frontend over HTTPS.
- Store `OPENAI_API_KEY` in the host's secret manager.
- Review organization and role assignments before activating users.
- Schedule database backups and test restoration.
- Monitor overdue remediation actions and failed verifications.

## Troubleshooting

- Database failure: verify `DATABASE_URL`, network access, and migrations.
- Prisma client error: run `npx prisma generate` in `backend`.
- Browser CORS error: add the exact frontend origin to `CORS_ORIGIN` and restart.
- Frontend calls localhost: set `VITE_API_URL` before `npm run build`.
- Production JWT error: configure `JWT_SECRET` in the backend runtime.
- AI provider error: verify the provider, API key, and model; the rules provider
  remains available as fallback.
