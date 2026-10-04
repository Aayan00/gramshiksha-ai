from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, Field, ConfigDict

# --- School & User ---
class SchoolUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    udise_code: str | None = Field(default=None, max_length=24)
    panchayat_name: str | None = Field(default=None, max_length=160)
    district: str | None = Field(default=None, max_length=120)
    state: str | None = Field(default=None, max_length=120)
    contact_email: str | None = Field(default=None, max_length=160)
    contact_phone: str | None = Field(default=None, max_length=32)
    academic_year: str | None = Field(default=None, max_length=16)

class SchoolOut(BaseModel):
    id: UUID
    name: str
    udise_code: str | None
    panchayat_name: str | None
    district: str | None
    state: str | None
    contact_email: str | None
    contact_phone: str | None
    academic_year: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserProfileCreate(BaseModel):
    role: str = Field(pattern="^(school_admin|teacher|staff)$")
    display_name: str = Field(min_length=1, max_length=160)
    email: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=32)

class UserProfileOut(BaseModel):
    id: UUID
    school_id: UUID
    role: str
    display_name: str
    email: str | None
    phone: str | None
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Classes ---
class SchoolClassCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    grade_level: int = Field(ge=1, le=12)
    section: str = Field(default="A", max_length=16)
    medium_of_instruction: str = Field(default="Marathi", max_length=40)
    academic_year: str = Field(default="2024-2025", max_length=16)
    room_number: str | None = Field(default=None, max_length=32)

class SchoolClassOut(BaseModel):
    id: UUID
    school_id: UUID
    name: str
    grade_level: int
    section: str
    medium_of_instruction: str
    academic_year: str
    room_number: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Students ---
class StudentCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=160)
    grade_level: int = Field(ge=1, le=12)
    preferred_language: str = Field(default="Marathi", min_length=2, max_length=40)
    roll_number: str | None = Field(default=None, max_length=32)
    class_id: UUID | None = None
    learning_needs: str | None = Field(default=None, max_length=255)
    guardian_contact: str | None = Field(default=None, max_length=40)

class StudentUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=160)
    grade_level: int | None = Field(default=None, ge=1, le=12)
    preferred_language: str | None = Field(default=None, min_length=2, max_length=40)
    roll_number: str | None = Field(default=None, max_length=32)
    class_id: UUID | None = None
    learning_needs: str | None = Field(default=None, max_length=255)
    guardian_contact: str | None = Field(default=None, max_length=40)
    active: bool | None = None

class StudentOut(BaseModel):
    id: UUID
    school_id: UUID
    class_id: UUID | None
    display_name: str
    roll_number: str | None
    grade_level: int
    preferred_language: str
    learning_needs: str | None
    guardian_contact: str | None
    active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Teachers ---
class TeacherCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=160)
    email: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=32)
    qualification: str | None = Field(default=None, max_length=120)
    subjects: list[str] = Field(min_length=1, max_length=20)
    languages: list[str] = Field(min_length=1, max_length=10)
    experience_years: int = Field(ge=0, le=60)
    capacity: int = Field(default=30, ge=1, le=200)
    available: bool = True
    effectiveness_score: float | None = Field(default=None, ge=0, le=1)

class TeacherUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=160)
    email: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=32)
    qualification: str | None = Field(default=None, max_length=120)
    subjects: list[str] | None = Field(default=None, min_length=1, max_length=20)
    languages: list[str] | None = Field(default=None, min_length=1, max_length=10)
    experience_years: int | None = Field(default=None, ge=0, le=60)
    capacity: int | None = Field(default=None, ge=1, le=200)
    available: bool | None = None
    effectiveness_score: float | None = Field(default=None, ge=0, le=1)
    active: bool | None = None

class TeacherOut(BaseModel):
    id: UUID
    school_id: UUID
    display_name: str
    email: str | None
    phone: str | None
    qualification: str | None
    subjects: list[str]
    languages: list[str]
    experience_years: int
    capacity: int
    available: bool
    effectiveness_score: float | None
    active: bool
    created_at: datetime
    active_assignments_count: int | None = 0
    model_config = ConfigDict(from_attributes=True)


# --- Matching & Assignments ---
class MatchRequest(BaseModel):
    student_id: UUID
    subject: str = Field(min_length=1, max_length=80)
    support_hours_per_week: int = Field(default=2, ge=1, le=20)
    limit: int = Field(default=5, ge=1, le=20)

class MatchFactors(BaseModel):
    subject_match: float
    language_match: float
    experience_score: float
    workload_balance: float
    effectiveness_score: float

class MatchCandidate(BaseModel):
    assignment_id: UUID
    teacher_id: UUID
    teacher_name: str
    teacher_qualification: str | None
    score: float
    factors: MatchFactors
    reasons: list[str]
    missing_data_warnings: list[str] = []
    current_workload: int = 0
    max_capacity: int = 30

class MatchResponse(BaseModel):
    student_id: UUID
    student_name: str
    student_grade: int
    preferred_language: str
    subject: str
    candidates: list[MatchCandidate]
    note: str = "Explainable fit score based on subject expertise, language fit, workload capacity, and recorded metrics. Scores are pedagogical heuristics, not guarantees."

class AssignmentReview(BaseModel):
    rejection_reason: str | None = Field(default=None, max_length=255)

class TeacherAssignmentOut(BaseModel):
    id: UUID
    school_id: UUID
    student_id: UUID
    student_name: str | None = None
    teacher_id: UUID
    teacher_name: str | None = None
    subject: str
    support_hours_per_week: int
    match_score: float
    explanation: dict
    status: str
    rejection_reason: str | None
    approved_by: UUID | None
    approved_at: datetime | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Assessments ---
class AssessmentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    subject: str = Field(min_length=1, max_length=80)
    grade_level: int = Field(ge=1, le=12)
    class_id: UUID | None = None
    total_marks: float = Field(default=50.0, gt=0)
    passing_marks: float = Field(default=17.5, ge=0)
    competency_tag: str | None = Field(default=None, max_length=100)
    assessment_date: date = Field(default_factory=date.today)

class AssessmentOut(BaseModel):
    id: UUID
    school_id: UUID
    class_id: UUID | None
    title: str
    subject: str
    grade_level: int
    total_marks: float
    passing_marks: float
    competency_tag: str | None
    assessment_date: date
    created_at: datetime
    results_count: int | None = 0
    average_score: float | None = None
    model_config = ConfigDict(from_attributes=True)

class AssessmentResultItem(BaseModel):
    student_id: UUID
    marks_obtained: float = Field(ge=0)
    weak_topics: list[str] = Field(default_factory=list)
    teacher_notes: str | None = Field(default=None, max_length=255)

class BatchAssessmentResultsCreate(BaseModel):
    results: list[AssessmentResultItem]

class StudentAssessmentResultOut(BaseModel):
    id: UUID
    school_id: UUID
    assessment_id: UUID
    assessment_title: str | None = None
    subject: str | None = None
    student_id: UUID
    student_name: str | None = None
    marks_obtained: float
    total_marks: float | None = None
    score_percentage: float
    is_learning_gap: bool
    weak_topics: list[str]
    teacher_notes: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Attendance ---
class AttendanceRecordItem(BaseModel):
    student_id: UUID
    status: str = Field(pattern="^(present|absent|excused|late)$")
    remarks: str | None = Field(default=None, max_length=160)

class BatchAttendanceCreate(BaseModel):
    class_id: UUID | None = None
    attendance_date: date = Field(default_factory=date.today)
    records: list[AttendanceRecordItem]

class AttendanceRecordOut(BaseModel):
    id: UUID
    school_id: UUID
    student_id: UUID
    student_name: str | None = None
    class_id: UUID | None
    attendance_date: date
    status: str
    remarks: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Learning Pathways ---
class LearningPathwayCreate(BaseModel):
    student_id: UUID
    subject: str = Field(min_length=1, max_length=80)
    target_competency: str = Field(min_length=1, max_length=160)
    identified_gaps: list[str] = Field(default_factory=list)
    recommended_topics: list[str] = Field(default_factory=list)

class LearningPathwayOut(BaseModel):
    id: UUID
    school_id: UUID
    student_id: UUID
    student_name: str | None = None
    subject: str
    current_level: str
    target_competency: str
    identified_gaps: list[str]
    recommended_topics: list[str]
    practice_activities: list[dict]
    status: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Analytics & Overview ---
class SubjectHealth(BaseModel):
    subject: str
    average_score: float
    students_assessed: int
    gap_rate_pct: float

class SchoolOverviewStats(BaseModel):
    total_students: int
    total_teachers: int
    total_classes: int
    active_assignments: int
    pending_assignments: int
    average_school_attendance_pct: float
    learning_gap_students_count: int
    subjects_health: list[SubjectHealth]
    recent_assessments: list[AssessmentOut]

class StudentAnalyticsOut(BaseModel):
    student_id: UUID
    student_name: str
    grade_level: int
    preferred_language: str
    total_assessments: int
    average_percentage: float
    attendance_rate_pct: float
    subject_scores: dict[str, float]
    identified_gaps: list[str]
    recent_results: list[StudentAssessmentResultOut]
    active_pathways: list[LearningPathwayOut]
    assigned_teachers: list[TeacherAssignmentOut]

class AuditEventOut(BaseModel):
    id: UUID
    school_id: UUID
    actor_id: UUID | None
    actor_role: str
    action: str
    entity_type: str
    entity_id: str | None
    details: dict
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
