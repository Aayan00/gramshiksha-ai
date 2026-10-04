# Supabase Architecture & Security Guide — GramShiksha AI

This document provides complete instructions for setting up Supabase Authentication, PostgreSQL Database, and Row Level Security (RLS) policies for **GramShiksha AI**.

---

## 1. Supabase Project Setup

1. Sign in to your [Supabase Dashboard](https://supabase.com/dashboard) and click **New Project**.
2. Set a secure database password and choose your preferred cloud region (e.g., `ap-south-1` for Mumbai, India).
3. Under **Project Settings -> API**, copy:
   - **Project URL** (e.g., `https://your-project-ref.supabase.co`)
   - **anon / public key** (Used on frontend)
   - *Never expose your service_role secret in the frontend application.*

---

## 2. JWT & JWKS Asymmetric Verification

GramShiksha AI verifies access tokens on the FastAPI backend using Supabase's **JWKS endpoint**:
`https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/.well-known/jwks.json`

### Signing Algorithm Requirements:
- In **Supabase Authentication -> Advanced Settings / JWT Settings**, ensure your project issues asymmetric **RS256** or **ES256** signed tokens supported by the JWKS public keys.
- If using legacy symmetric **HS256** secrets, keep the secret strictly in backend environment variables and adapt the backend verification secret. Never share this secret with clients.

---

## 3. Database Schema & Alembic Migrations

GramShiksha uses SQLAlchemy models and Alembic migrations.

To apply database migrations to your Supabase PostgreSQL instance:

```bash
cd backend
# Set DATABASE_URL in backend/.env:
# DATABASE_URL=postgresql+psycopg://postgres.your-project-ref:YOUR_DB_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require

alembic upgrade head
```

The migrations create:
- `schools` — School entities with UDISE code and Gram Panchayat information.
- `user_profiles` — Binds authenticated Supabase user UUIDs (`auth.users.id`) to a specific school and role.
- `school_classes` — Class sections, divisions, and mediums.
- `students` — Student records with grade level and learning needs.
- `teachers` — Teacher qualifications, subjects, and workload limits.
- `teacher_assignments` — Proposed and approved AI matches.
- `assessments` — Unit tests and NIPUN Bharat competency evaluations.
- `student_assessment_results` — Marks and learning gap flags.
- `attendance_records` — Daily classroom attendance records.
- `learning_pathways` — Personalized remedial revision plans.
- `audit_events` — Immutable ledger of administrative actions.

---

## 4. Row Level Security (RLS) Policies

For direct PostgreSQL client access or hybrid access through Supabase client libraries, enable Row Level Security on all tables:

```sql
-- Enable RLS on all domain tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Helper function to retrieve authenticated user's school ID
CREATE OR REPLACE FUNCTION get_current_user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.user_profiles
  WHERE id = auth.uid() AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if authenticated user is school_admin
CREATE OR REPLACE FUNCTION is_school_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'school_admin' AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- School Isolation Policy: Students
CREATE POLICY "Students are isolated by school"
ON public.students
FOR ALL
USING (school_id = get_current_user_school_id());

-- School Isolation Policy: Teachers
CREATE POLICY "Teachers are isolated by school"
ON public.teachers
FOR SELECT
USING (school_id = get_current_user_school_id());

CREATE POLICY "Teachers can only be modified by school admin"
ON public.teachers
FOR ALL
USING (school_id = get_current_user_school_id() AND is_school_admin());

-- School Isolation Policy: Teacher Assignments
CREATE POLICY "Assignments are isolated by school"
ON public.teacher_assignments
FOR ALL
USING (school_id = get_current_user_school_id());
```

---

## 5. Provisioning Initial School Administrators

In a production deployment, initial headmaster and administrative user profiles should be provisioned through a trusted administrative script or backend invite workflow:

```sql
INSERT INTO public.user_profiles (id, school_id, role, display_name, email, is_active)
VALUES (
  'YOUR_SUPABASE_USER_UUID',
  'YOUR_SCHOOL_UUID',
  'school_admin',
  'Shri. Rameshwar Patil',
  'admin@school.gov.in',
  true
);
```
