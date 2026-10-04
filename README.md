# GramShiksha AI — Rural School Intelligence & Explainable Educator Matching Platform

[![CI Pipeline](https://github.com/gramshiksha-ai/core/actions/workflows/ci.yml/badge.svg)](https://github.com/gramshiksha-ai/core/actions)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**GramShiksha AI** is a production-grade, secure, and explainable AI-powered education platform engineered for **Gram Panchayat, Zilla Parishad, and rural schools across India**. It addresses key real-world challenges in rural education: multi-grade classrooms, subject specialization deficits, regional medium instruction (Marathi, Hindi, English), foundational learning gaps under **NIPUN Bharat (FLN)**, and transparent school governance.

---

## 🏛️ System Architecture

```mermaid
graph TD
    A[Frontend: React 18 + Vite + Tailwind CSS] -->|Bearer JWT / Dev Token| B[FastAPI Backend API]
    B -->|Asymmetric JWKS Verify| C[Supabase Auth / Identity]
    B -->|SQLAlchemy 2 ORM / Alembic| D[(PostgreSQL / SQLite Database)]
    
    subgraph Core Intelligent Modules
        E[Explainable Teacher Matching Engine]
        F[NIPUN Bharat FLN Gap Detector]
        G[Multilingual Remedial Pathway Generator]
        H[School Attendance & Analytics Engine]
    end

    B --> E
    B --> F
    B --> G
    B --> H
```

---

## 🌟 Key Features

1. **Explainable AI Teacher Matching Studio**:
   - Multi-factor pedagogical matching considering subject expertise, regional language alignment, available workload capacity, and years of experience.
   - 100% transparent scores with mathematical factor breakdowns and human-readable explanations.
   - Missing data explicitly highlighted to prevent bias against newly onboarded teachers.
   - Administrative review workflow: school administrators can propose, approve, decline with recorded rationale, or reverse assignments.

2. **NIPUN Bharat Foundational Literacy & Numeracy (FLN) Analytics**:
   - Unit test recording with automatic learning gap flags when marks fall below passing criteria.
   - Subject health breakdown and gap rate analytics.
   - Auto-generated localized remedial pathways with concrete hands-on activities in Marathi (मराठी), Hindi (हिंदी), and English.

3. **Multi-Role School Workspace**:
   - **Headmaster / School Admin**: Complete access to teacher onboarding, school profile (UDISE code, Gram Panchayat), matching approvals, and governance audit ledger.
   - **Teacher (शिक्षक)**: Class roster, marks entry, learning pathway plans, and daily roll-call attendance.
   - **Panchayat Education Officer / Staff**: Analytics overview, attendance tracking, and official report exports.

4. **Classroom & Attendance Tracking**:
   - Daily roll-call attendance with one-click "Mark All Present", absent/excused toggles, and attendance percentage tracking.

5. **Official CSV Reports Center**:
   - Export standard RFC-4180 CSV reports for Students, Teachers, Unit Assessments, and AI Matching decisions.

6. **Enterprise Security & Privacy**:
   - Cryptographic Supabase JWT token verification (RS256/ES256 JWKS).
   - Strict school-level data isolation on every endpoint.
   - Zero hardcoded secrets; full audit event logging for administrative transparency.

---

## 🚀 Quick Start & Local Execution

### Prerequisites
- **Python 3.11+**
- **Node.js 20+** & npm
- (Optional) **Docker Desktop**

---

### 1. Backend Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env

# Run unit tests
pytest

# Start development API server (auto-initializes SQLite database and authentic sample data)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Interactive API Docs (Swagger UI):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Liveness Healthcheck:** [http://127.0.0.1:8000/health/live](http://127.0.0.1:8000/health/live)
- **Readiness Healthcheck:** [http://127.0.0.1:8000/health/ready](http://127.0.0.1:8000/health/ready)

---

### 2. Frontend Setup

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

- **Frontend Application URL:** [http://localhost:5173](http://localhost:5173)

---

## 🔑 Offline & Quick Demo Personas

When running locally without a live Supabase cloud connection, you can immediately switch between authentic test personas using the top-bar role selector or quick login tabs:

| Persona | Role | Key Capabilities |
| :--- | :--- | :--- |
| **Shri. Rameshwar Patil** | `school_admin` (Headmaster) | Full administrative access, AI matching approval/rejection, school settings, audit logs. |
| **Smt. Sunita Kadam** | `teacher` (Math & Science) | Student roster, marks entry, learning pathway plans, daily attendance. |
| **Panchayat Education Staff** | `staff` | Analytics overview, classroom review, official CSV reports. |

---

## 📡 API Endpoints Overview

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health/live` | Public | Liveness probe |
| `GET` | `/health/ready` | Public | Database readiness probe |
| `GET` | `/me` | Authenticated | Current user profile, role, and school |
| `GET` | `/school` | Authenticated | Retrieve school profile and UDISE data |
| `PATCH` | `/school` | `school_admin` | Update school details |
| `GET` | `/school/users` | `school_admin` | List staff user accounts |
| `POST` | `/school/users` | `school_admin` | Provision a new staff account |
| `GET` | `/school/classes` | Authenticated | List school class divisions |
| `POST` | `/school/classes` | `school_admin` | Create a new class division |
| `GET` | `/school/audit-logs` | `school_admin` | View immutable administrative audit trail |
| `GET` | `/students` | Authenticated | List students with search, grade, and language filters |
| `POST` | `/students` | `school_admin`, `teacher` | Register a student profile |
| `GET` | `/students/{id}` | Authenticated | Get student details |
| `PATCH` | `/students/{id}` | `school_admin`, `teacher` | Update student profile |
| `DELETE` | `/students/{id}` | `school_admin` | Deactivate student |
| `GET` | `/teachers` | Authenticated | List teachers with workload capacity slots |
| `POST` | `/teachers` | `school_admin` | Onboard a new teacher |
| `PATCH` | `/teachers/{id}` | `school_admin` | Update teacher qualifications and capacity |
| `POST` | `/matching/recommendations` | `school_admin`, `teacher` | Run explainable multi-factor teacher matching engine |
| `GET` | `/assignments` | Authenticated | List proposed and approved teacher assignments |
| `POST` | `/assignments/{id}/approve` | `school_admin` | Approve proposed teacher match |
| `POST` | `/assignments/{id}/reject` | `school_admin` | Decline match with recorded rationale |
| `DELETE` | `/assignments/{id}` | `school_admin` | Reverse teacher assignment |
| `GET` | `/assessments` | Authenticated | List unit assessments and class averages |
| `POST` | `/assessments` | `school_admin`, `teacher` | Create a unit assessment |
| `POST` | `/assessments/{id}/results` | `school_admin`, `teacher` | Record batch student marks and learning gap flags |
| `GET` | `/students/{id}/analytics` | Authenticated | Individual student learning gaps and performance radar |
| `POST` | `/students/{id}/pathways` | `school_admin`, `teacher` | Generate personalized NIPUN Bharat learning pathway |
| `POST` | `/attendance/batch` | `school_admin`, `teacher` | Record daily classroom attendance |
| `GET` | `/analytics/school-overview` | Authenticated | School-wide enrollment, attendance, and subject metrics |
| `GET` | `/reports/students.csv` | `school_admin`, `teacher` | Download student roster CSV |
| `GET` | `/reports/teachers.csv` | `school_admin` | Download teachers summary CSV |
| `GET` | `/reports/assessments.csv` | `school_admin`, `teacher` | Download assessment results CSV |
| `GET` | `/reports/matching-summary.csv` | `school_admin` | Download matching decision ledger CSV |

---

## 🐳 Docker Deployment

To launch PostgreSQL 16, the FastAPI backend, and the Nginx frontend in containerized mode:

```bash
docker compose up --build
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:8000`
- **PostgreSQL Database:** `localhost:5433`

---

## ☁️ Production Cloud Deployment Guide

### 1. GitHub Repository Setup
```bash
git remote add origin https://github.com/Aayan00/gramshiksha-ai.git
git branch -M main
git push -u origin main
```

### 2. Supabase PostgreSQL & Auth Setup
1. Create a project on [supabase.com](https://supabase.com).
2. Retrieve your PostgreSQL connection string from **Project Settings → Database** (URI format with `sslmode=require`).
3. Retrieve your project URL and publishable `anon` key from **Project Settings → API**.
4. Run Alembic migrations against Supabase:
   ```bash
   cd backend
   # In .env set DATABASE_URL=postgresql+psycopg://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
   alembic upgrade head
   ```
5. Refer to [`docs/supabase_setup.md`](docs/supabase_setup.md) for full Row Level Security (RLS) policies and authentication setup.

### 3. Backend Deployment (Render)
1. Go to [Render.com](https://render.com) and create a **New Web Service** linked to your GitHub repository `Aayan00/gramshiksha-ai`.
2. Configure the service:
   - **Environment:** Docker (or Python 3.12)
   - **Root Directory:** `./backend` (or use the included `render.yaml` Blueprint at the repository root)
   - **Docker Context:** `./backend`
   - **DockerfilePath:** `./backend/Dockerfile`
   - **Health Check Path:** `/health/live`
3. Set the following **Environment Variables**:
   | Variable | Example Value | Description |
   | :--- | :--- | :--- |
   | `APP_ENV` | `production` | Enables production mode |
   | `DATABASE_URL` | `postgresql+psycopg://...` | Supabase connection string |
   | `SUPABASE_URL` | `https://[PROJECT-REF].supabase.co` | Supabase project URL |
   | `JWT_AUDIENCE` | `authenticated` | Supabase JWT audience |
   | `CORS_ORIGINS` | `https://gramshiksha-ai.vercel.app` | Deployed frontend URL |
4. Deploy the service. Your backend will be available at `https://gramshiksha-api.onrender.com`.

### 4. Frontend Deployment (Vercel)
1. Go to [Vercel.com](https://vercel.com) and click **Add New → Project** from your GitHub repository `Aayan00/gramshiksha-ai`.
2. Configure the project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
3. Set the following **Environment Variables**:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://gramshiksha-api.onrender.com` | Deployed Render backend URL |
   | `VITE_SUPABASE_URL` | `https://[PROJECT-REF].supabase.co` | Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase publishable anon key |
4. Click **Deploy**. Vercel will automatically handle client-side SPA routing using the included [`frontend/vercel.json`](frontend/vercel.json).

---

## 🛡️ Security & Minors Safeguards

- **Strict School Isolation**: All database queries are filtered by the authenticated user's server-side `school_id`. Cross-school queries return `404 Not Found`.
- **Data Minimization**: Student profiles collect only essential educational fields (name, grade level, language medium, learning needs, guardian contact). No biometric, facial, or invasive surveillance data is collected.
- **Explainable Decisions**: AI matching algorithms use deterministic pedagogical criteria and never make unilateral autonomous decisions. Final approval resides with the human school administrator.

---

## 📄 License

This project is licensed under the MIT License.
