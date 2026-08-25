# VulnGuard AI Release Audit

Audit date: 2026-08-25

## Release status

The application code, automated tests, builds, tenant-isolation controls,
configuration examples, CI workflow, and deployment documentation are ready for
a deployment candidate.

## Verified checks

| Area | Result |
| --- | --- |
| Backend unit and coverage suite | 125 tests passed |
| Backend organization-isolation E2E suite | 4 tests passed |
| Backend production build | Passed |
| Frontend lint | Passed with zero warnings |
| Frontend production build | Passed |
| Global statement coverage | 80.35% |
| Global branch coverage | 68.93% |
| Global function coverage | 69.38% |
| Global line coverage | 81.21% |
| Prisma migration inventory | Six migrations present |
| CI workflow | Backend and frontend checks configured |
| Secret-pattern review | No committed live application secrets found |
| TODO/FIXME/HACK review | No application markers found |
| Environment configuration | Backend/frontend examples documented |
| README discoverability | Root GitHub README restored |

## Security controls reviewed

- JWT secret is mandatory in production.
- Role guard denies missing or unauthorized identities.
- Organization scope is forwarded by controllers and enforced by services.
- Cross-tenant service behavior is covered by unit and E2E tests.
- Public registration locks after the initial administrator.
- Passwords are hashed and excluded from API responses.
- CORS origins and frontend API URL are environment-configurable.
- AI provider credentials remain server-side, with a deterministic fallback.
- Remediation completion and verification rules are validated.

## Dependency audit note

`npm audit --omit=dev --audit-level=high` was attempted for both applications.
The local npm registry connection rejected certificate verification, so npm did
not return an advisory report. TLS verification was not disabled.

Before production deployment, rerun the following in an environment with a
valid trusted certificate chain:

```powershell
cd backend
npm audit --omit=dev --audit-level=high

cd ..\frontend
npm audit --omit=dev --audit-level=high
```

Review and test dependency changes before applying any audit fix.

## Deployment-candidate checklist

- Configure production `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, and `PORT`.
- Configure `VITE_API_URL` before building the frontend.
- Store `OPENAI_API_KEY` in a secret manager when the OpenAI provider is used.
- Back up PostgreSQL and run `npx prisma migrate deploy`.
- Run the dependency audit noted above from the deployment environment.
- Run the release verification commands from the deployment guide.
- Confirm HTTPS, monitoring, backups, and restore procedures.
- Create and verify the initial administrator and role assignments.
