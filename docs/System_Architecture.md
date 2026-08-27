# VulnGuard AI System Architecture

## Overview

VulnGuard AI uses a multi-service architecture with a React frontend, NestJS
API, PostgreSQL database, and an optional Python AI microservice. The NestJS API
is the only application service that accesses tenant data.

```text
React frontend
      |
      | HTTPS + JWT
      v
NestJS API -----------------> PostgreSQL
      |
      | private URL + service token
      v
FastAPI AI service ---------> NVIDIA NIM / Nemotron
```

## Frontend

- React, TypeScript, Vite, and Tailwind CSS
- Authentication, role-specific navigation, dashboards, reports, and workflows
- Calls only the NestJS API; AI credentials are never exposed to the browser

## Backend API

- NestJS, TypeScript, Prisma, and JWT authentication
- Enforces role authorization and organization-level tenant isolation
- Manages assets, software, findings, remediation, reports, and notifications
- Routes AI requests to rules, OpenAI, or the protected FastAPI service
- Falls back to deterministic rules if an external AI provider is unavailable

## Database

- PostgreSQL managed through Prisma migrations
- Stores organizations, users, devices, software, vulnerability findings, and
  remediation actions

## NVIDIA AI service

- Python FastAPI service packaged with Docker
- Accepts only requests containing the shared `AI_SERVICE_TOKEN`
- Sends vulnerability context to NVIDIA's OpenAI-compatible NIM endpoint
- Validates Nemotron JSON output against a strict response model
- Does not access the VulnGuard database or accept arbitrary model prompts

## Deployment

Render deploys the frontend, backend, PostgreSQL database, and optional AI
service from `render.yaml`. An HTTPS service URL and generated shared token
connect the backend to FastAPI. Provider API keys remain secret runtime
environment variables.

For portable full-stack deployment, `compose.yaml` builds production frontend,
backend, and FastAPI images and connects them to PostgreSQL with health-ordered
startup and persistent storage.
