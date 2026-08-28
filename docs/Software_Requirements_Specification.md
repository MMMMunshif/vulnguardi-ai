# Software Requirements Specification (SRS)

# Project Name

VulnGuard AI

## Project Title

AI-Powered Vulnerability Intelligence & Remediation Platform

---

# 1. Introduction

## 1.1 Purpose

VulnGuard AI is an enterprise cybersecurity platform designed to help organizations identify vulnerable software, analyze security risks using Artificial Intelligence, recommend remediation strategies, and manage the complete vulnerability remediation lifecycle.

The implemented platform combines modern web technologies, a deterministic
rules engine, and optional NVIDIA Nemotron or OpenAI providers to assist security
teams in making faster and more consistent remediation decisions. RAG and custom
model training remain possible future extensions.

### 1.1.1 Implementation status

This SRS defines the target product scope. The current release implements the
core authenticated multi-tenant inventory, vulnerability, repository scanning,
AI remediation, reporting, notification, dashboard, and deployment workflows.
Requirements for email verification, refresh tokens, SSO,
evidence uploads, RAG, and custom model training remain planned and must not be
interpreted as completed features.

---

## 1.2 Objectives

• Detect vulnerable software

• Analyze vulnerabilities

• Generate AI-powered remediation recommendations

• Assign remediation tasks

• Track remediation progress

• Generate reports

• Train and integrate a custom machine learning model

---

## 1.3 Target Users

• Super Administrator

• Organization Administrator

• Security Analyst

• IT Technician

---

## 1.4 Technologies

Frontend

- React
- Vite
- TypeScript
- Tailwind CSS

Backend

- Node.js
- NestJS
- TypeScript

Database

- PostgreSQL
- Prisma ORM

AI Service

- Python
- FastAPI

Artificial Intelligence

- NVIDIA Nemotron
- OpenAI
- Deterministic rules fallback

Planned AI extensions

- Retrieval-Augmented Generation (RAG)
- Custom machine learning models

Deployment

- Docker
- GitHub Actions

---

# 2. Functional Requirements

## 2.1 User Authentication

The system shall allow users to:

- Register an account
- Log in securely
- Log out
- Reset forgotten passwords
- Verify email addresses
- Change passwords
- Refresh authentication tokens
- Enable role-based access

---

## 2.2 Organization Management

The system shall allow Organization Administrators to:

- Create an organization
- Update organization information
- Invite users
- Remove users
- Assign user roles
- Manage departments
- Manage devices

---

## 2.3 User Management

The system shall allow administrators to:

- Create users
- Edit users
- Deactivate users
- Reactivate users
- Search users
- Filter users
- View user activity

---

## 2.4 Software Inventory

The system shall:

- Store installed software
- Store software versions
- Store publishers
- Import software inventory
- Upload dependency files
- Detect duplicate software
- Maintain scan history

---

## 2.5 Vulnerability Analysis

The system shall:

- Compare installed software versions
- Detect vulnerable software
- Identify outdated software
- Display vulnerability information
- Display affected versions
- Display available fixes
- Display software support status

---

## 2.6 AI Security Assistant

The AI assistant shall:

- Explain vulnerabilities
- Recommend remediation
- Answer security questions
- Generate security reports
- Summarize vulnerabilities
- Explain risks in simple language
- Suggest best practices

---

## 2.7 Remediation Management

The system shall:

- Create remediation tasks
- Assign tasks
- Update remediation status
- Track progress
- Upload evidence
- Add comments
- Approve completed tasks

---

## 2.8 Dashboard

The dashboard shall display:

- Total organizations
- Total users
- Total software
- Vulnerable software
- Pending remediations
- Completed remediations
- Latest scans
- AI recommendations

---

## 2.9 Reports

The system shall generate:

- Vulnerability reports
- Software inventory reports
- Remediation reports
- User activity reports
- Dashboard analytics
- Export reports as PDF and CSV

---

## 2.10 Audit Logs

The system shall:

- Record login history
- Record user actions
- Record remediation changes
- Record organization changes
- Record AI interactions

---

# 3. Non-Functional Requirements

## 3.1 Performance

- The system should load dashboard pages within 3 seconds under normal conditions.
- API responses should typically be returned within 2 seconds.
- Background scanning and AI processing should not block normal user operations.

---

## 3.2 Security

- Passwords shall be securely hashed.
- JWT-based authentication shall be used.
- Role-Based Access Control (RBAC) shall restrict access to authorized features.
- Sensitive data shall not be stored in plain text.
- API endpoints shall validate all user inputs.
- Audit logs shall record important user activities.

---

## 3.3 Scalability

- The system shall support multiple organizations.
- The architecture shall allow future microservice expansion.
- AI services shall be deployable independently from the main backend.

---

## 3.4 Reliability

- The application shall handle unexpected errors gracefully.
- Database transactions shall maintain data integrity.
- The system shall continue operating even if non-critical services become temporarily unavailable.

---

## 3.5 Usability

- The interface shall be clean and responsive.
- Navigation shall be simple and consistent.
- Error messages shall clearly explain the problem and possible solution.

---

## 3.6 Maintainability

- The project shall follow a modular architecture.
- Code shall follow consistent naming conventions.
- Business logic, API routes, and database access shall be separated.
- The project shall include technical documentation.

---

## 3.7 Compatibility

- The application shall support modern desktop browsers.
- The frontend shall be responsive for tablets and mobile devices where appropriate.

---

## 3.8 Availability

- The deployed application should be available 24/7, excluding scheduled maintenance.
- Backup and recovery procedures should be considered for production deployments.

---

## 3.9 Logging and Monitoring

- Important system events shall be logged.
- Errors shall be recorded for troubleshooting.
- User activities shall be tracked for auditing purposes.

---

## 3.10 Future Extensibility

The system architecture shall allow future integration with:

- Additional AI models
- Enterprise identity providers (SSO)
- SIEM platforms
- Cloud vulnerability scanners
- Endpoint agents
- Mobile applications

---

# 4. User Roles and Permissions

## 4.1 Super Administrator

The Super Administrator has complete access to the platform.

Responsibilities:

- Manage organizations
- View all organizations
- Suspend or activate organizations
- Manage platform settings
- View system analytics
- View audit logs
- Manage AI configuration
- Monitor system health

---

## 4.2 Organization Administrator

The Organization Administrator manages a single organization.

Responsibilities:

- Manage users
- Invite users
- Assign roles
- Manage departments
- Manage devices
- View dashboards
- Generate reports
- Approve remediation tasks

---

## 4.3 Security Analyst

The Security Analyst is responsible for vulnerability management.

Responsibilities:

- View vulnerabilities
- Analyze security findings
- Use AI assistant
- Create remediation plans
- Assign remediation tasks
- Generate vulnerability reports
- Monitor remediation progress

---

## 4.4 IT Technician / Developer

Responsibilities:

- View assigned tasks
- Update remediation status
- Upload evidence
- Add comments
- Mark remediation as completed
- View AI recommendations

---

## Permission Summary

| Feature            | Super Admin | Org Admin | Security Analyst | IT Technician |
|
| Manage Organizations |   Yes         | No           | No              | No |
| Manage Users         | Yes           | Yes          | No              | No |
| View Dashboard       | Yes           | Yes          | Yes             | Yes |
| View Vulnerabilities | Yes           | Yes          | Yes             | Yes |
| Use AI Assistant     | Yes           | Yes          | Yes             | Yes |
| Assign Remediation   | Yes           | Yes          | Yes             | No |
| Update Task Status   | Yes           | Yes          | Yes             | Yes |
| Generate Reports     | Yes           | Yes          | Yes             | No |
| View Audit Logs      | Yes           | Yes          | No              | No |

---

# 5. System Modules

The VulnGuard AI platform consists of the following major modules:

## 5.1 Authentication Module

Features:

- User Registration
- User Login
- JWT Authentication
- Refresh Token
- Forgot Password
- Reset Password
- Email Verification
- Role-Based Access Control (RBAC)

---

## 5.2 Organization Management Module

Features:

- Create Organization
- Update Organization
- Invite Users
- Manage Departments
- Manage Devices
- Organization Settings

---

## 5.3 User Management Module

Features:

- Create Users
- Update User Profiles
- Assign Roles
- Activate/Deactivate Users
- View User Activity

---

## 5.4 Software Inventory Module

Features:

- Add Software
- Import Software Inventory
- Upload Dependency Files
- Store Software Versions
- View Scan History

---

## 5.5 Vulnerability Analysis Module

Features:

- Detect Vulnerabilities
- Compare Software Versions
- Display Affected Versions
- Show Available Fixes
- Identify Unsupported Software

---

## 5.6 AI Security Assistant Module

Features:

- Explain Vulnerabilities
- AI Chat Assistant
- Generate Remediation Recommendations
- Summarize Security Risks
- Generate Security Reports
- Answer Security Questions

---

## 5.7 Remediation Management Module

Features:

- Create Remediation Tasks
- Assign Tasks
- Update Task Status
- Upload Evidence
- Add Comments
- Track Progress

---

## 5.8 Dashboard & Analytics Module

Features:

- Security Dashboard
- Vulnerability Statistics
- Remediation Progress
- AI Usage Statistics
- Organization Overview
- Trend Analysis

---

## 5.9 Reports Module

Features:

- Generate PDF Reports
- Generate CSV Reports
- Vulnerability Reports
- Software Inventory Reports
- Remediation Reports

---

## 5.10 Notification Module

Features:

- Email Notifications
- In-App Notifications
- Task Assignment Alerts
- Remediation Reminders
- Security Alerts

---

## 5.11 Audit Log Module

Features:

- Login History
- User Activity Logs
- Organization Activity Logs
- AI Interaction Logs
- Remediation History

