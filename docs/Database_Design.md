# Database Design

# VulnGuard AI

## Phase A – Core System Database

---

# Table 1 – Organizations

| Column | Type | Description |
|---------|------|-------------|
| id | UUID | Primary Key |
| name | VARCHAR(255) | Organization Name |
| email | VARCHAR(255) | Organization Email |
| phone | VARCHAR(50) | Contact Number |
| website | VARCHAR(255) | Organization Website |
| industry | VARCHAR(100) | Industry Type |
| country | VARCHAR(100) | Country |
| status | ENUM | Active / Suspended |
| created_at | TIMESTAMP | Record Created Time |
| updated_at | TIMESTAMP | Record Updated Time |

---

# Table 2 – Users

| Column | Type |
|---------|------|
| id | UUID |
| organization_id | UUID |
| department_id | UUID |
| role_id | UUID |
| first_name | VARCHAR(100) |
| last_name | VARCHAR(100) |
| email | VARCHAR(255) |
| password | TEXT |
| phone | VARCHAR(30) |
| profile_image | TEXT |
| status | ENUM |
| last_login | TIMESTAMP |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

# Table 3 – Roles

| Column | Type |
|---------|------|
| id | UUID |
| role_name | VARCHAR(100) |
| description | TEXT |
| created_at | TIMESTAMP |

Example Roles

- Super Admin
- Organization Admin
- Security Analyst
- IT Technician

---

# Table 4 – Departments

| Column | Type |
|---------|------|
| id | UUID |
| organization_id | UUID |
| name | VARCHAR(100) |
| description | TEXT |
| created_at | TIMESTAMP |

Example Departments

- IT
- Finance
- HR
- Operations
- Security

---

# Relationships

Organization (1)
│
├───────────∞ Users 
│
└───────────∞ Departments

Department (1)
│
└───────────∞ Users

Role (1)
│
└───────────∞ Users

---

# Phase B – Software Inventory Database

---

# Table 5 – Devices

| Column | Type | Description |
|---------|------|-------------|
| id | UUID | Primary Key |
| organization_id | UUID | Organization |
| department_id | UUID | Department |
| device_name | VARCHAR(150) | Device Name |
| hostname | VARCHAR(150) | Computer Hostname |
| operating_system | VARCHAR(100) | Operating System |
| os_version | VARCHAR(100) | OS Version |
| ip_address | VARCHAR(50) | IP Address |
| status | ENUM | Online / Offline |
| last_scan | TIMESTAMP | Last Scan Time |
| created_at | TIMESTAMP | Created Date |

---

# Table 6 – Software Inventory

| Column | Type |
|---------|------|
| id | UUID |
| device_id | UUID |
| software_name | VARCHAR(255) |
| publisher | VARCHAR(255) |
| installed_version | VARCHAR(100) |
| installation_date | DATE |
| installation_path | TEXT |
| status | ENUM |
| created_at | TIMESTAMP |

---

# Table 7 – Software Versions

| Column | Type |
|---------|------|
| id | UUID |
| software_name | VARCHAR(255) |
| latest_version | VARCHAR(100) |
| release_date | DATE |
| support_status | ENUM |
| created_at | TIMESTAMP |

---

# Table 8 – Software Scans

| Column | Type |
|---------|------|
| id | UUID |
| device_id | UUID |
| scan_type | VARCHAR(100) |
| scan_status | ENUM |
| total_software | INTEGER |
| scan_started | TIMESTAMP |
| scan_completed | TIMESTAMP |

---

# Relationships

Organization (1)
│
└────────────∞ Devices

Department (1)
│
└────────────∞ Devices

Device (1)
│
├────────────∞ Software Inventory
│
└────────────∞ Software Scans

Software Versions (1)
│
└────────────∞ Software Inventory

---

# Phase C – Vulnerability & Remediation Database

---

# Table 9 – Vulnerabilities

| Column | Type | Description |
|---------|------|-------------|
| id | UUID | Primary Key |
| software_inventory_id | UUID | Related Installed Software |
| cve_id | VARCHAR(100) | CVE Identifier |
| title | VARCHAR(255) | Vulnerability Title |
| description | TEXT | Vulnerability Description |
| affected_version | VARCHAR(100) | Affected Version |
| fixed_version | VARCHAR(100) | Fixed Version |
| exploit_available | BOOLEAN | Exploit Availability |
| remediation_status | ENUM | Pending / In Progress / Resolved |
| discovered_at | TIMESTAMP | Detection Time |

---

# Table 10 – Remediation Tasks

| Column | Type |
|---------|------|
| id | UUID |
| vulnerability_id | UUID |
| assigned_to | UUID |
| assigned_by | UUID |
| title | VARCHAR(255) |
| description | TEXT |
| due_date | DATE |
| priority | ENUM |
| status | ENUM |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

# Table 11 – Task Comments

| Column | Type |
|---------|------|
| id | UUID |
| remediation_task_id | UUID |
| user_id | UUID |
| comment | TEXT |
| created_at | TIMESTAMP |

---

# Table 12 – Evidence Files

| Column | Type |
|---------|------|
| id | UUID |
| remediation_task_id | UUID |
| uploaded_by | UUID |
| file_name | VARCHAR(255) |
| file_url | TEXT |
| uploaded_at | TIMESTAMP |

---

# Relationships

Software Inventory (1)
│
└────────────∞ Vulnerabilities

Vulnerability (1)
│
└────────────∞ Remediation Tasks

Remediation Task (1)
│
├────────────∞ Task Comments
│
└────────────∞ Evidence Files

User (1)
│
└────────────∞ Assigned Tasks


---

# Phase D – AI & Analytics Database

---

# Table 13 – AI Conversations

| Column | Type | Description |
|---------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | User |
| vulnerability_id | UUID | Related Vulnerability |
| question | TEXT | User Question |
| response | TEXT | AI Response |
| model_name | VARCHAR(100) | AI Model Used |
| created_at | TIMESTAMP | Created Time |

---

# Table 14 – AI Reports

| Column | Type |
|---------|------|
| id | UUID |
| organization_id | UUID |
| generated_by | UUID |
| title | VARCHAR(255) |
| report_type | VARCHAR(100) |
| report_url | TEXT |
| generated_at | TIMESTAMP |

---

# Table 15 – Notifications

| Column | Type |
|---------|------|
| id | UUID |
| user_id | UUID |
| title | VARCHAR(255) |
| message | TEXT |
| type | VARCHAR(100) |
| is_read | BOOLEAN |
| created_at | TIMESTAMP |

---

# Table 16 – Audit Logs

| Column | Type |
|---------|------|
| id | UUID |
| user_id | UUID |
| action | VARCHAR(255) |
| module | VARCHAR(100) |
| description | TEXT |
| ip_address | VARCHAR(50) |
| created_at | TIMESTAMP |

---

# Table 17 – ML Predictions

| Column | Type |
|---------|------|
| id | UUID |
| vulnerability_id | UUID |
| predicted_action | VARCHAR(255) |
| confidence | DECIMAL(5,2) |
| model_version | VARCHAR(100) |
| predicted_at | TIMESTAMP |

---

# Relationships

User (1)
│
├────────────∞ AI Conversations
├────────────∞ AI Reports
├────────────∞ Notifications
└────────────∞ Audit Logs

Organization (1)
│
└────────────∞ AI Reports

Vulnerability (1)
│
├────────────∞ AI Conversations
└────────────∞ ML Predictions