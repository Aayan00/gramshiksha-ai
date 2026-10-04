from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_expanded_schema"
down_revision = "0001_initial"
branch_labels = None
depends_on = None

def upgrade():
    # 1. Update schools table with additional fields
    op.add_column("schools", sa.Column("udise_code", sa.String(24), nullable=True))
    op.add_column("schools", sa.Column("contact_email", sa.String(160), nullable=True))
    op.add_column("schools", sa.Column("contact_phone", sa.String(32), nullable=True))
    op.add_column("schools", sa.Column("academic_year", sa.String(16), server_default="2024-2025", nullable=False))
    op.create_index("ix_schools_udise_code", "schools", ["udise_code"])

    # 2. Update user_profiles
    op.add_column("user_profiles", sa.Column("email", sa.String(160), nullable=True))
    op.add_column("user_profiles", sa.Column("phone", sa.String(32), nullable=True))

    # 3. Create school_classes
    op.create_table(
        "school_classes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("grade_level", sa.Integer(), nullable=False),
        sa.Column("section", sa.String(16), server_default="A", nullable=False),
        sa.Column("medium_of_instruction", sa.String(40), server_default="Marathi", nullable=False),
        sa.Column("academic_year", sa.String(16), server_default="2024-2025", nullable=False),
        sa.Column("room_number", sa.String(32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("grade_level >= 1 AND grade_level <= 12", name="ck_classes_grade"),
    )

    # 4. Update students table
    op.add_column("students", sa.Column("class_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("school_classes.id", ondelete="SET NULL"), nullable=True))
    op.add_column("students", sa.Column("roll_number", sa.String(32), nullable=True))
    op.add_column("students", sa.Column("learning_needs", sa.String(255), nullable=True))
    op.add_column("students", sa.Column("guardian_contact", sa.String(40), nullable=True))
    op.create_index("ix_students_class_id", "students", ["class_id"])

    # 5. Update teachers table
    op.add_column("teachers", sa.Column("email", sa.String(160), nullable=True))
    op.add_column("teachers", sa.Column("phone", sa.String(32), nullable=True))
    op.add_column("teachers", sa.Column("qualification", sa.String(120), nullable=True))

    # 6. Update teacher_assignments table
    op.add_column("teacher_assignments", sa.Column("subject", sa.String(80), server_default="General", nullable=False))
    op.add_column("teacher_assignments", sa.Column("support_hours_per_week", sa.Integer(), server_default="2", nullable=False))
    op.add_column("teacher_assignments", sa.Column("rejection_reason", sa.String(255), nullable=True))
    op.add_column("teacher_assignments", sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))

    # 7. Create assessments
    op.create_table(
        "assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("class_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("school_classes.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("subject", sa.String(80), nullable=False),
        sa.Column("grade_level", sa.Integer(), nullable=False),
        sa.Column("total_marks", sa.Float(), server_default="50.0", nullable=False),
        sa.Column("passing_marks", sa.Float(), server_default="17.5", nullable=False),
        sa.Column("competency_tag", sa.String(100), nullable=True),
        sa.Column("assessment_date", sa.Date(), server_default=sa.func.current_date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 8. Create student_assessment_results
    op.create_table(
        "student_assessment_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("marks_obtained", sa.Float(), nullable=False),
        sa.Column("score_percentage", sa.Float(), nullable=False),
        sa.Column("is_learning_gap", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("weak_topics", postgresql.ARRAY(sa.String()), server_default="{}", nullable=False),
        sa.Column("teacher_notes", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("marks_obtained >= 0", name="ck_result_marks"),
        sa.CheckConstraint("score_percentage >= 0 AND score_percentage <= 100", name="ck_result_percentage"),
    )

    # 9. Create attendance_records
    op.create_table(
        "attendance_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("class_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("school_classes.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("attendance_date", sa.Date(), server_default=sa.func.current_date(), nullable=False, index=True),
        sa.Column("status", sa.String(16), server_default="present", nullable=False),
        sa.Column("remarks", sa.String(160), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('present', 'absent', 'excused', 'late')", name="ck_attendance_status"),
    )

    # 10. Create learning_pathways
    op.create_table(
        "learning_pathways",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("subject", sa.String(80), nullable=False),
        sa.Column("current_level", sa.String(40), server_default="Needs Support", nullable=False),
        sa.Column("target_competency", sa.String(160), nullable=False),
        sa.Column("identified_gaps", postgresql.ARRAY(sa.String()), server_default="{}", nullable=False),
        sa.Column("recommended_topics", postgresql.ARRAY(sa.String()), server_default="{}", nullable=False),
        sa.Column("practice_activities", postgresql.JSONB(), server_default="[]", nullable=False),
        sa.Column("status", sa.String(24), server_default="active", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 11. Create audit_events
    op.create_table(
        "audit_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("actor_role", sa.String(32), server_default="system", nullable=False),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("entity_type", sa.String(48), nullable=False),
        sa.Column("entity_id", sa.String(64), nullable=True),
        sa.Column("details", postgresql.JSONB(), server_default="{}", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

def downgrade():
    op.drop_table("audit_events")
    op.drop_table("learning_pathways")
    op.drop_table("attendance_records")
    op.drop_table("student_assessment_results")
    op.drop_table("assessments")
    op.drop_column("teacher_assignments", "approved_at")
    op.drop_column("teacher_assignments", "rejection_reason")
    op.drop_column("teacher_assignments", "support_hours_per_week")
    op.drop_column("teacher_assignments", "subject")
    op.drop_column("teachers", "qualification")
    op.drop_column("teachers", "phone")
    op.drop_column("teachers", "email")
    op.drop_index("ix_students_class_id", "students")
    op.drop_column("students", "guardian_contact")
    op.drop_column("students", "learning_needs")
    op.drop_column("students", "roll_number")
    op.drop_column("students", "class_id")
    op.drop_table("school_classes")
    op.drop_column("user_profiles", "phone")
    op.drop_column("user_profiles", "email")
    op.drop_index("ix_schools_udise_code", "schools")
    op.drop_column("schools", "academic_year")
    op.drop_column("schools", "contact_phone")
    op.drop_column("schools", "contact_email")
    op.drop_column("schools", "udise_code")
