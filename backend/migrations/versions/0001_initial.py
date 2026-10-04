from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "schools",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("panchayat_name", sa.String(160), nullable=True),
        sa.Column("district", sa.String(120), nullable=True),
        sa.Column("state", sa.String(120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "user_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("role", sa.String(32), nullable=False),
        sa.Column("display_name", sa.String(160), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("role IN ('school_admin', 'teacher', 'student')", name="ck_user_profiles_role"),
    )
    op.create_table(
        "students",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("display_name", sa.String(160), nullable=False),
        sa.Column("grade_level", sa.Integer(), nullable=False),
        sa.Column("preferred_language", sa.String(40), nullable=False, server_default="Marathi"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("grade_level >= 1 AND grade_level <= 12", name="ck_students_grade"),
    )
    op.create_table(
        "teachers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("display_name", sa.String(160), nullable=False),
        sa.Column("subjects", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("languages", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("experience_years", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("capacity", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("available", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("effectiveness_score", sa.Float(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("experience_years >= 0", name="ck_teachers_experience"),
        sa.CheckConstraint("capacity >= 1", name="ck_teachers_capacity"),
        sa.CheckConstraint("effectiveness_score IS NULL OR (effectiveness_score >= 0 AND effectiveness_score <= 1)", name="ck_teachers_effectiveness"),
    )
    op.create_table(
        "teacher_assignments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("students.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("teacher_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("teachers.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("match_score", sa.Float(), nullable=False),
        sa.Column("explanation", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("status", sa.String(24), nullable=False, server_default="proposed"),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("match_score >= 0 AND match_score <= 100", name="ck_assignment_score"),
        sa.CheckConstraint("status IN ('proposed', 'approved', 'rejected')", name="ck_assignment_status"),
    )

def downgrade():
    op.drop_table("teacher_assignments")
    op.drop_table("teachers")
    op.drop_table("students")
    op.drop_table("user_profiles")
    op.drop_table("schools")
