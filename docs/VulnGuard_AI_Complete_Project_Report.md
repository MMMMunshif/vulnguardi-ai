# VulnGuard AI — Complete Project Development Report

**Project title:** AI-Powered Vulnerability Intelligence and Remediation Platform  
**Project type:** Full-stack, multi-tenant cybersecurity vulnerability management platform  
**Report date:** 31 August 2026  
**Repository:** `MMMunshif/vulnguardi-ai`  

## 1. Executive Summary

VulnGuard AI is a production-oriented cybersecurity web platform developed to help organizations register assets, maintain software inventories, identify outdated or vulnerable software, retrieve real CVE intelligence, generate AI-assisted remediation recommendations, assign corrective actions, collect remediation evidence, and verify that security issues have been resolved.

The application is a multi-tenant full-stack system. Each organization's records are isolated from other tenants. Access to functions is controlled through four roles: Super Administrator, Organization Administrator, Security Analyst, and IT Technician. The platform combines deterministic security rules, NVIDIA NIM/Nemotron, optional OpenAI inference, and tenant-scoped retrieval-augmented generation (RAG).

The completed solution contains a React frontend, NestJS API, PostgreSQL database, Prisma ORM, Python FastAPI AI service, Docker deployment, Render cloud deployment, automated tests, CI checks, Swagger documentation, reporting, notifications, and security auditing.

## 2. Project Purpose

The project addresses the difficulty of tracking software vulnerabilities and remediation work across an organization. Its main objectives are to:

- Maintain organizations, departments, users, devices, and installed software.
- Detect outdated software and record vulnerability findings.
- Retrieve authoritative CVE information from the NVD API.
- Prioritize vulnerabilities using exploit and fix availability.
- Explain vulnerabilities and recommend actionable remediation.
- Assign, track, complete, and verify remediation tasks.
- Produce dashboards, CSV exports, and PDF reports.
- Maintain secure audit and evidence records.
- Support cloud and container-based production deployment.

## 3. Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Axios |
| Backend | Node.js, NestJS, TypeScript, Swagger |
| Database | PostgreSQL, Prisma ORM and migrations |
| Authentication | JWT access tokens, rotating refresh tokens, bcrypt |
| AI service | Python, FastAPI, NVIDIA NIM/Nemotron |
| Additional AI | Rules engine and optional OpenAI Responses API |
| Vulnerability data | NVD API and CISA KEV context |
| Repository scanning | GitHub/GitLab APIs and OSV.dev advisories |
| Email | Nodemailer and configurable SMTP |
| Deployment | Render Blueprint, Docker Compose, Nginx |
| Automation | GitHub Actions, Jest, Pytest, frontend lint/build checks |

## 4. System Architecture

```text
User Browser
    |
    | HTTPS, JWT access token
    v
React Frontend
    |
    v
NestJS API ----------------------> PostgreSQL Database
    |                                  |
    | protected service token          | tenant data, audit logs,
    v                                  | tokens and evidence
Python FastAPI AI Service
    |
    v
NVIDIA NIM / Nemotron API

NestJS API ---> NVD API / GitHub / GitLab / OSV / SMTP
```

Only the NestJS API accesses application tenant data. The browser never receives NVIDIA, OpenAI, SMTP, database, or repository-provider secrets. The FastAPI AI service accepts protected requests using a shared service token and does not access the PostgreSQL database.

## 5. Main Application Workflow

```text
Organization
  -> Department
  -> User
  -> Device
  -> Software Inventory
  -> Software Update Finding
  -> Vulnerability Finding
  -> AI Recommendation
  -> Remediation Action
  -> Evidence
  -> Completion and Security Verification
```

## 6. Completed Functional Modules

### 6.1 Authentication and Account Security

- Initial administrator registration with automatic public-registration lock.
- Secure login using bcrypt password verification.
- JWT access tokens with a 15-minute lifetime.
- Seven-day rotating refresh tokens stored as hashes in PostgreSQL.
- Automatic frontend session renewal after access-token expiry.
- Server-side refresh-token revocation during logout.
- Forgot-password and reset-password workflow.
- Random, one-time password-reset tokens with a 30-minute expiry.
- Email verification with one-time 24-hour links and resend support.
- Generic responses that prevent account enumeration.
- Existing production users preserved safely during verification migration.

### 6.2 Role-Based Access Control

Four roles are implemented:

- **Super Administrator:** platform-wide organization and system access.
- **Organization Administrator:** administration within one organization.
- **Security Analyst:** vulnerability analysis, AI recommendations, and remediation planning.
- **IT Technician:** assigned operational remediation work and evidence submission.

Backend guards enforce permissions, while the frontend displays role-specific navigation and dashboards.

### 6.3 Multi-Tenant Organization Management

- Organization CRUD and activation/suspension controls.
- Department CRUD linked to organizations.
- User creation, editing, role assignment, activation, and deactivation.
- Organization-level scope checks across controllers and services.
- Cross-tenant access prevention covered by unit and E2E tests.

### 6.4 Device and Software Inventory

- Device registration with hostname, address, OS, type, status, and assigned user.
- Device lifecycle and retirement handling.
- Installed software records linked to devices and organizations.
- Publisher, version, install path, source, dates, and status tracking.
- Duplicate and relationship validation.
- Software update findings and version-status comparison.

### 6.5 Vulnerability Intelligence

- Manual and scanner-sourced vulnerability findings.
- CVE ID, title, description, affected/fixed versions, dates, references, and status.
- Exploit and fix availability tracking.
- Official NVD lookup for real CVE metadata.
- CVSS, CWE, reference, and CISA Known Exploited Vulnerabilities context.
- Vulnerability-to-device and vulnerability-to-software relationships.

### 6.6 Repository and Dependency Scanning

- Public GitHub and GitLab repository scanning.
- Optional provider tokens for higher limits or private access.
- Supported dependency manifest discovery.
- Dependency vulnerability lookup through OSV.dev.
- Remote-host and manifest-size security restrictions.
- Scan findings integrated into vulnerability workflows.

### 6.7 AI Vulnerability Explanation and Remediation

- Plain-language vulnerability explanations.
- Recommended fix, priority, remediation action type, and ordered steps.
- Critical, High, Medium, and Low SLA suggestions.
- NVIDIA NIM/Nemotron integration through a protected FastAPI service.
- Optional OpenAI structured-response provider.
- Deterministic rules engine for offline operation and provider fallback.
- Strict AI response validation.
- Render cold-start retry and provider-label fixes.
- No AI key or service token exposed to the browser.

### 6.8 Tenant-Scoped RAG

Before producing a new recommendation, the backend retrieves up to three relevant remediation records from the authenticated organization. Only completed and verified outcomes are eligible. Similarity is based on matching CVE or software context. Retrieved history is added to the AI context, and the UI displays the number of verified RAG sources used. Data from another organization is never retrieved.

### 6.9 Remediation Management

- Create and assign remediation actions.
- Track Pending, In Progress, Completed, and Cancelled states.
- Record due dates, start/completion dates, notes, and recommended fixes.
- Enforce verification rules before resolving vulnerabilities.
- Synchronize remediation progress with vulnerability status.
- Display overdue and due-soon tasks.

### 6.10 Remediation Evidence

- Upload PNG, JPEG, PDF, and text evidence.
- Maximum file size of 5 MB.
- Evidence metadata and binary content stored in PostgreSQL rather than ephemeral Render disk.
- Authenticated, tenant-scoped download.
- Role-controlled deletion.
- Protection against cross-organization evidence access.

### 6.11 Dashboards, Reports, and Exports

- Role-specific dashboards.
- Organization, user, device, software, vulnerability, and remediation summaries.
- Recent activity and deadline insights.
- Search, status filters, exploit filters, and remediation filters.
- Secure CSV exports.
- Downloadable PDF security reports.

### 6.12 Notifications

- Tenant-scoped email notification service.
- Alerts for publicly exploitable, high-priority vulnerabilities.
- Password-reset and email-verification mail templates.
- Configurable SMTP host, port, security, credentials, sender, and frontend URL.
- Non-blocking delivery for vulnerability alerts.

### 6.13 Audit Logs

- Successful login events.
- Authenticated create, update, and delete activity.
- Actor, action, resource, response status, organization, and timestamp.
- Admin-only search, filter, viewing, and CSV export.
- Passwords, tokens, and request bodies are not stored in the audit log.

## 7. Security Controls

- Mandatory production JWT secret.
- Password hashing with bcrypt.
- Hashed password-reset, verification, and refresh tokens.
- Short-lived access tokens and refresh-token rotation.
- Backend role guards and organization-level tenant isolation.
- Input validation, DTO whitelisting, and unknown-field rejection.
- Environment-controlled CORS origins.
- Secret-free repository configuration examples.
- Protected AI service token.
- Strict AI JSON response validation and safe rules fallback.
- Tenant-scoped email recipients, evidence, audit logs, and RAG retrieval.
- Dependency security audit with zero known production npm vulnerabilities at release review.
- Security response headers on the deployed frontend.

## 8. Deployment and DevOps

### Render

The repository includes a Render Blueprint that deploys:

- `vulnguard-ai-frontend` — React static frontend.
- `vulnguard-ai-api` — NestJS backend.
- `vulnguard-ai-db` — PostgreSQL database.
- `vulnguard-ai-nvidia` — Dockerized FastAPI AI service.

Deployment issues encountered and solved included missing build dependencies, compiled backend entry-point selection, database-independent E2E execution, Swagger health-check routing, FastAPI port exposure, public HTTPS AI-service connectivity, NVIDIA provider persistence, cold starts, and correct NVIDIA provider labels.

### Docker

A complete Docker Compose deployment is available with frontend/Nginx, NestJS backend, FastAPI AI service, PostgreSQL, health checks, startup ordering, environment configuration, and persistent database storage.

### CI/CD

GitHub Actions runs backend tests/build, frontend lint/build, and FastAPI tests for pushes and pull requests. Coverage thresholds prevent regressions.

## 9. Verification Status

At the latest verified release:

- Backend unit tests: **166 passed across 32 suites**.
- Organization-isolation E2E tests: **4 passed**.
- FastAPI AI tests: **6 passed**.
- Backend production build: **Passed**.
- Frontend lint: **Passed with zero warnings**.
- Frontend production build: **Passed**.
- Prisma migrations: **11 present**.
- Production npm dependency audit: **0 known backend and frontend vulnerabilities**.
- No live application secrets were committed.

## 10. Development Timeline

### July 2026 — Analysis and Design

- **09 July:** Finalized the VulnGuard AI idea, objectives, technology stack, folder structure, and project proposal.
- **10 July:** Started the SRS and documented functional/non-functional requirements, roles, and modules.
- **13–17 July:** Improved proposal and SRS, studied vulnerability-management workflows, designed system architecture, database entities, relationships, and backend development plan.
- **20–24 July:** Set up NestJS, PostgreSQL, Prisma, Swagger, JWT authentication, RBAC, organizations, and departments.
- **27–31 July:** Implemented users, devices, software inventory, update findings, and vulnerability findings.

### Early August 2026 — Core Backend Completion

- **03–04 August:** Implemented remediation actions, lifecycle, verification, and end-to-end data-flow testing.
- **05–14 August:** Continued core integration, validation, API testing, frontend planning, and documentation activities.

### 16–20 August 2026 — Full-Stack Application

- Implemented and committed authentication, RBAC, organization, department, user, device, software, update, vulnerability, remediation, and dashboard backend modules.
- Built frontend login, dashboard, main layout, navigation, and CRUD pages.
- Connected frontend and backend and completed initial end-to-end workflow testing.

### 22–24 August 2026 — AI, Security, and Test Expansion

- Added AI remediation backend and complete frontend workflow.
- Enforced organization-level isolation.
- Hardened registration and JWT configuration.
- Added optional OpenAI provider and deterministic fallback.
- Added CI checks and expanded security, tenant-boundary, inventory, device, department, authentication, and vulnerability tests.

### 25 August 2026 — Production Deployment and Reporting

- Hardened role guards and remediation lifecycle rules.
- Expanded dashboard and controller tenant-scope tests.
- Created deployment/environment documentation and release audit.
- Added Render Blueprint.
- Diagnosed and fixed backend Render build/start, E2E, and health-check problems.
- Added role-based dashboards, PDF reporting, and official NVD CVE lookup.

### 26–27 August 2026 — Scanning, Notifications, NVIDIA, and Production Readiness

- Added GitHub/GitLab dependency scanning and OSV advisories.
- Added high-priority vulnerability email alerts.
- Integrated NVIDIA Nemotron through Python FastAPI.
- Fixed AI service port, HTTPS communication, provider configuration, cold-start retry, and UI label.
- Added full Docker deployment and completed production dependency/security audit.
- Added tenant-scoped audit logs.

### 28 August 2026 — Authentication Security Enhancements

- Added secure forgot/reset password flow.
- Added email verification and resend flow.
- Added rotating refresh-token sessions and server-side logout revocation.

### 31 August 2026 — Evidence and RAG

- Added database-backed remediation evidence upload, protected download, and deletion.
- Added tenant-scoped RAG using previously verified remediation outcomes.

## 11. Important Git Milestones

| Commit | Description |
| --- | --- |
| `9a91e85` | Initial NestJS, Prisma, PostgreSQL, and authentication setup |
| `dc88752` | Completed AI remediation workflow and dashboard insights |
| `893aabb` | Enforced organization-level data isolation |
| `9994bec` | Added Render Blueprint configuration |
| `d9fde9c` | Added role dashboards and PDF reporting |
| `7109c03` | Added official NVD lookup |
| `273e78b` | Added repository dependency scanning |
| `2663a54` | Integrated NVIDIA Nemotron AI service |
| `f0f2932` | Added full-stack Docker deployment |
| `9d279ee` | Added tenant-scoped audit logs |
| `1657dc5` | Added secure password reset |
| `615362e` | Added email verification |
| `b74afca` | Added rotating refresh-token sessions |
| `d7f68df` | Added remediation evidence uploads |
| `2e12200` | Added tenant-scoped remediation RAG |

## 12. Future Work

The core project and the originally listed future enhancements are complete. Possible enterprise extensions include:

- SSO using Microsoft Entra ID, Google Workspace, or another OpenID Connect provider.
- Custom model training and controlled model evaluation.
- SIEM integration and endpoint agents.
- Object storage and malware scanning for larger evidence files.
- Scheduled scans, in-app notifications, and background job queues.
- Production backup/restore automation and expanded monitoring.

## 13. Conclusion

VulnGuard AI has progressed from a documented project idea into a tested, deployed, full-stack cybersecurity platform. It supports the complete vulnerability-management lifecycle: inventory, intelligence, prioritization, AI guidance, remediation assignment, evidence, verification, reporting, auditing, and deployment. The implementation demonstrates full-stack development, relational database design, secure authentication, multi-tenant authorization, third-party API integration, AI microservices, testing, CI/CD, Docker, and cloud deployment.

---

**Security note:** This report intentionally excludes real passwords, API keys, SMTP credentials, database credentials, JWT secrets, and service tokens.
