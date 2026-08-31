# VulnGuard AI Release Audit

Audit date: 2026-08-27

## Release status

The application code, automated tests, builds, tenant-isolation controls,
configuration examples, CI workflow, and deployment documentation are ready for
a deployment candidate.

## Verified checks

| Area | Result |
| --- | --- |
| Backend unit and coverage suite | 165 tests passed across 32 suites |
| Backend organization-isolation E2E suite | 4 tests passed |
| FastAPI NVIDIA service | 6 tests passed |
| Backend production build | Passed |
| Frontend lint | Passed with zero warnings |
| Frontend production build | Passed |
| Global statement coverage | 79.02% |
| Global branch coverage | 67.54% |
| Global function coverage | 72.76% |
| Global line coverage | 80.44% |
| Prisma migration inventory | Eleven migrations present |
| CI workflow | Backend, frontend, and FastAPI checks configured |
| Backend production dependency audit | 0 known vulnerabilities |
| Frontend production dependency audit | 0 known vulnerabilities |
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
- FastAPI inference requires a timing-safe shared service-token check.
- Public-exploit email alerts are tenant-scoped and non-blocking.
- Repository scanning restricts remote hosts and dependency manifest limits.
- Remediation completion and verification rules are validated.

## Dependency audit

Production dependency audits were run against the npm registry. Initial backend
results identified high-severity issues in Swagger's YAML parser and Prisma
configuration's merge utility. `@nestjs/swagger` was upgraded to a fixed release
and `deepmerge-ts` was constrained to its fixed major version. Prisma client
generation, schema validation, all tests, and production builds passed afterward.

Final results:

- Backend production dependencies: 0 known vulnerabilities
- Frontend production dependencies: 0 known vulnerabilities

## Deployment-candidate checklist

- Configure production `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, and `PORT`.
- Configure `VITE_API_URL` before building the frontend.
- Store NVIDIA, OpenAI, SMTP, and repository-provider credentials in a secret manager.
- Back up PostgreSQL and run `npx prisma migrate deploy`.
- Continue running dependency audits before releases.
- Run the release verification commands from the deployment guide.
- Confirm HTTPS, monitoring, backups, and restore procedures.
- Create and verify the initial administrator and role assignments.

## Planned scope not yet implemented

The SRS remains the broader target specification. SSO, RAG, and custom model
training remain planned work and are not claimed as part of this release candidate.
