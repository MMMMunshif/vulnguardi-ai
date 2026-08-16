# System Architecture

# VulnGuard AI

## Overview

VulnGuard AI follows a modular enterprise architecture where the frontend, backend, AI service, and database are separated into independent components.

This architecture improves scalability, maintainability, and future expansion.

---

## Architecture Components

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS

Responsibilities

- User Interface
- Authentication
- Dashboard
- Reports
- AI Chat
- Software Management

---

### Backend API

- Node.js
- Express.js
- TypeScript

Responsibilities

- Authentication
- Authorization
- Business Logic
- API Endpoints
- Notifications
- Report Generation

---

### Database

- PostgreSQL
- Prisma ORM

Responsibilities

- User Management
- Organization Management
- Software Inventory
- Vulnerability Data
- Remediation Tasks
- Audit Logs

---

### AI Service

- Python
- FastAPI

Responsibilities

- AI Chat
- NVIDIA Nemotron Integration
- RAG Pipeline
- Machine Learning Prediction
- Security Report Generation

---

## High-Level Data Flow

User

↓

React Frontend

↓

Express Backend API

↓

PostgreSQL Database

↓

FastAPI AI Service

↓

NVIDIA AI Models

↓

AI Response