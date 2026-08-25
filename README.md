# VulnGuard AI

VulnGuard AI is a multi-tenant cybersecurity vulnerability management platform
for tracking assets, software versions, vulnerabilities, AI-assisted fixes, and
remediation progress.

## Core workflow

```text
Organization -> Department -> User -> Device -> Software Inventory
             -> Update Finding -> Vulnerability -> Remediation -> Verification
```

## Features

- JWT authentication and role-based access control
- Organization-level tenant isolation
- Organization, department, user, and device management
- Software inventory and update-status tracking
- CVE and vulnerability finding management
- Rules-based or OpenAI remediation recommendations with safe fallback
- Remediation assignment, due dates, lifecycle, and security verification
- Role-specific dashboards and navigation for administrators, analysts, and technicians
- Dashboard analytics, overdue alerts, search, filters, CSV exports, and downloadable PDF security reports
- Swagger API documentation
- Automated unit, E2E, coverage, lint, and production-build checks

## Technology

- Backend: NestJS, TypeScript, Prisma, PostgreSQL
- Frontend: React, TypeScript, Vite, Tailwind CSS
- AI: deterministic rules engine with optional OpenAI Responses API provider
- CI: GitHub Actions

## Quick start

```powershell
cd backend
Copy-Item .env.example .env
npm ci
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

In another terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- Swagger: `http://localhost:3000/api`

Create the first administrator through registration. Registration locks after
the initial account is created.

## Documentation

- [Deployment guide](docs/Deployment_Guide.md)
- [Release audit](docs/Release_Audit.md)
- [System architecture](docs/System_Architecture.md)
- [Database design](docs/Database_Design.md)
- [Software requirements](docs/Software_Requirements_Specification.md)
- [Project proposal](docs/Project_Proposal.md)

## Verification

```powershell
cd backend
npm run test:cov -- --runInBand
npm run test:e2e -- --runInBand
npm run build

cd ..\frontend
npm run lint
npm run build
```

See the deployment guide for production environment variables, migrations,
security controls, and troubleshooting.
