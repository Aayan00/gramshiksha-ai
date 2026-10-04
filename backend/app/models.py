import uuid
from datetime import datetime, date
import sqlalchemy as sa
from sqlalchemy import String, Integer, Boolean, Float, DateTime, Date, ForeignKey, CheckConstraint, JSON, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

def json_type():
    return JSON().with_variant(JSONB(), "postgresql")

def string_array_type():
    return JSON().with_variant(ARRAY(String()), "postgresql")

def uuid_col(primary_key: bool = False, default_gen: bool = False, nullable: bool = False, index: bool = False, fk: str | None = None):
    sqlite_uuid = sa.Uuid(as_uuid=True)
    pg_uuid = UUID(as_uuid=True)
    kwargs = {
        "primary_key": primary_key,
        "nullable": nullable,
        "index": index,
    }
    if default_gen:
        kwargs["default"] = uuid.uuid4
    if fk:
        return mapped_column(pg_uuid.with_variant(sqlite_uuid, "sqlite"), ForeignKey(fk, ondelete="CASCADE"), **kwargs)
    return mapped_column(pg_uuid.with_variant(sqlite_uuid, "sqlite"), **kwargs)


class School(Base):
    __tablename__ = "schools"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    udise_code: Mapped[str | None] = mapped_column(String(24), index=True)
    panchayat_name: Mapped[str | None] = mapped_column(String(160))
    district: Mapped[str | None] = mapped_column(String(120))
    state: Mapped[str | None] = mapped_column(String(120))
    contact_email: Mapped[str | None] = mapped_column(String(160))
    contact_phone: Mapped[str | None] = mapped_column(String(32))
    academic_year: Mapped[str] = mapped_column(String(16), default="2024-2025", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), primary_key=True)
    school_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("schools.id", ondelete="RESTRICT"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(32), nullable=False)  # 'school_admin', 'teacher', 'staff'
    display_name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str | None] = mapped_column(String(160))
    phone: Mapped[str | None] = mapped_column(String(32))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (CheckConstraint("role IN ('school_admin', 'teacher', 'staff', 'student')", name="ck_user_profiles_role"),)


class SchoolClass(Base):
    __tablename__ = "school_classes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), primary_key=True, default=uuid.uuid4)
    school_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)  # e.g., "Class 5th - A"
    grade_level: Mapped[int] = mapped_column(Integer, nullable=False)
    section: Mapped[str] = mapped_column(String(16), default="A", nullable=False)
    medium_of_instruction: Mapped[str] = mapped_column(String(40), default="Marathi", nullable=False)
    academic_year: Mapped[str] = mapped_column(String(16), default="2024-2025", nullable=False)
    room_number: Mapped[str | None] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (CheckConstraint("grade_level >= 1 AND grade_level <= 12", name="ck_classes_grade"),)


class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), primary_key=True, default=uuid.uuid4)
    school_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("schools.id", ondelete="RESTRICT"), nullable=False, index=True)
    class_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("school_classes.id", ondelete="SET NULL"), index=True)
    display_name: Mapped[str] = mapped_column(String(160), nullable=False)
    roll_number: Mapped[str | None] = mapped_column(String(32))
    grade_level: Mapped[int] = mapped_column(Integer, nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(40), default="Marathi", nullable=False)
    learning_needs: Mapped[str | None] = mapped_column(String(255))
    guardian_contact: Mapped[str | None] = mapped_column(String(40))
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (CheckConstraint("grade_level >= 1 AND grade_level <= 12", name="ck_students_grade"),)


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), primary_key=True, default=uuid.uuid4)
    school_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("schools.id", ondelete="RESTRICT"), nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str | None] = mapped_column(String(160))
    phone: Mapped[str | None] = mapped_column(String(32))
    qualification: Mapped[str | None] = mapped_column(String(120))  # e.g., "B.Ed, D.El.Ed, M.Sc Mathematics"
    subjects: Mapped[list[str]] = mapped_column(string_array_type(), default=list, nullable=False)
    languages: Mapped[list[str]] = mapped_column(string_array_type(), default=list, nullable=False)
    experience_years: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    effectiveness_score: Mapped[float | None] = mapped_column(Float)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("experience_years >= 0", name="ck_teachers_experience"),
        CheckConstraint("capacity >= 1", name="ck_teachers_capacity"),
        CheckConstraint("effectiveness_score IS NULL OR (effectiveness_score >= 0 AND effectiveness_score <= 1)", name="ck_teachers_effectiveness"),
    )


class TeacherAssignment(Base):
    __tablename__ = "teacher_assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), primary_key=True, default=uuid.uuid4)
    school_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("schools.id", ondelete="RESTRICT"), nullable=False, index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String(80), default="General", nullable=False)
    support_hours_per_week: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    match_score: Mapped[float] = mapped_column(Float, nullable=False)
    explanation: Mapped[dict] = mapped_column(json_type(), default=dict, nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="proposed", nullable=False)  # 'proposed', 'approved', 'rejected'
    rejection_reason: Mapped[str | None] = mapped_column(String(255))
    approved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("match_score >= 0 AND match_score <= 100", name="ck_assignment_score"),
        CheckConstraint("status IN ('proposed', 'approved', 'rejected')", name="ck_assignment_status"),
    )


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), primary_key=True, default=uuid.uuid4)
    school_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("school_classes.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)  # e.g., "Unit 1: Basic Numeracy & Operations"
    subject: Mapped[str] = mapped_column(String(80), nullable=False)
    grade_level: Mapped[int] = mapped_column(Integer, nullable=False)
    total_marks: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    passing_marks: Mapped[float] = mapped_column(Float, default=17.5, nullable=False)
    competency_tag: Mapped[str | None] = mapped_column(String(100))  # e.g. "FLN_NUMERACY_L3", "READING_COMPREHENSION"
    assessment_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class StudentAssessmentResult(Base):
    __tablename__ = "student_assessment_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), primary_key=True, default=uuid.uuid4)
    school_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    marks_obtained: Mapped[float] = mapped_column(Float, nullable=False)
    score_percentage: Mapped[float] = mapped_column(Float, nullable=False)
    is_learning_gap: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    weak_topics: Mapped[list[str]] = mapped_column(string_array_type(), default=list, nullable=False)
    teacher_notes: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("marks_obtained >= 0", name="ck_result_marks"),
        CheckConstraint("score_percentage >= 0 AND score_percentage <= 100", name="ck_result_percentage"),
    )


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), primary_key=True, default=uuid.uuid4)
    school_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("school_classes.id", ondelete="SET NULL"), index=True)
    attendance_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(16), default="present", nullable=False)  # 'present', 'absent', 'excused', 'late'
    remarks: Mapped[str | None] = mapped_column(String(160))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (CheckConstraint("status IN ('present', 'absent', 'excused', 'late')", name="ck_attendance_status"),)


class LearningPathway(Base):
    __tablename__ = "learning_pathways"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), primary_key=True, default=uuid.uuid4)
    school_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String(80), nullable=False)
    current_level: Mapped[str] = mapped_column(String(40), default="Needs Support", nullable=False)  # 'Foundational', 'Needs Support', 'Proficient', 'Advanced'
    target_competency: Mapped[str] = mapped_column(String(160), nullable=False)
    identified_gaps: Mapped[list[str]] = mapped_column(string_array_type(), default=list, nullable=False)
    recommended_topics: Mapped[list[str]] = mapped_column(string_array_type(), default=list, nullable=False)
    practice_activities: Mapped[list[dict]] = mapped_column(json_type(), default=list, nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="active", nullable=False)  # 'active', 'in_progress', 'completed'
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), primary_key=True, default=uuid.uuid4)
    school_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True).with_variant(sa.Uuid(as_uuid=True), "sqlite"))
    actor_role: Mapped[str] = mapped_column(String(32), default="system", nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)  # e.g., "STUDENT_CREATED", "ASSIGNMENT_APPROVED"
    entity_type: Mapped[str] = mapped_column(String(48), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(64))
    details: Mapped[dict] = mapped_column(json_type(), default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
