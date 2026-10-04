import csv
import io
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, date
from uuid import UUID
from fastapi import FastAPI, Depends, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, func, case
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db, engine
from app.db.base import Base
from app.auth import CurrentUser, get_current_user, require_roles
from app.models import (
    School,
    UserProfile,
    SchoolClass,
    Student,
    Teacher,
    TeacherAssignment,
    Assessment,
    StudentAssessmentResult,
    AttendanceRecord,
    LearningPathway,
    AuditEvent,
)
from app.schemas import (
    SchoolOut,
    SchoolUpdate,
    UserProfileCreate,
    UserProfileOut,
    SchoolClassCreate,
    SchoolClassOut,
    StudentCreate,
    StudentUpdate,
    StudentOut,
    TeacherCreate,
    TeacherUpdate,
    TeacherOut,
    MatchRequest,
    MatchResponse,
    MatchCandidate,
    MatchFactors,
    AssignmentReview,
    TeacherAssignmentOut,
    AssessmentCreate,
    AssessmentOut,
    BatchAssessmentResultsCreate,
    StudentAssessmentResultOut,
    BatchAttendanceCreate,
    AttendanceRecordOut,
    LearningPathwayCreate,
    LearningPathwayOut,
    SchoolOverviewStats,
    SubjectHealth,
    StudentAnalyticsOut,
    AuditEventOut,
)
from app.matching import rank_teachers
from app.learning_analytics import analyze_student_learning_gaps, generate_learning_pathway_plan

def seed_sample_data(db: Session, school: School, admin_user: UserProfile):
    """Seed authentic, realistic rural school demo dataset (Zilla Parishad Primary School)."""
    # 1. Classes
    classes_data = [
        {"name": "Class 3rd (A)", "grade_level": 3, "section": "A", "medium": "Marathi", "room": "Room 101"},
        {"name": "Class 4th (A)", "grade_level": 4, "section": "A", "medium": "Marathi", "room": "Room 102"},
        {"name": "Class 5th (A)", "grade_level": 5, "section": "A", "medium": "Marathi", "room": "Room 103"},
        {"name": "Class 6th (A)", "grade_level": 6, "section": "A", "medium": "Semi-English", "room": "Room 201"},
        {"name": "Class 7th (A)", "grade_level": 7, "section": "A", "medium": "Semi-English", "room": "Room 202"},
    ]
    created_classes = []
    for cd in classes_data:
        sc = SchoolClass(
            school_id=school.id,
            name=cd["name"],
            grade_level=cd["grade_level"],
            section=cd["section"],
            medium_of_instruction=cd["medium"],
            academic_year="2024-2025",
            room_number=cd["room"],
        )
        db.add(sc)
        created_classes.append(sc)
    db.commit()

    # 2. Teachers
    teachers_data = [
        {
            "display_name": "Smt. Sunita Ananda Kadam",
            "email": "sunita.kadam@gramshiksha.org",
            "qualification": "B.Sc, B.Ed (Mathematics & Science)",
            "subjects": ["Mathematics", "Science"],
            "languages": ["Marathi", "Hindi", "English"],
            "experience_years": 8,
            "capacity": 35,
            "available": True,
            "effectiveness_score": 0.88,
        },
        {
            "display_name": "Shri. Prakash Eknath Deshmukh",
            "email": "prakash.deshmukh@gramshiksha.org",
            "qualification": "M.A, B.Ed (Marathi Literature & Social Studies)",
            "subjects": ["Marathi", "Social Science"],
            "languages": ["Marathi", "Hindi"],
            "experience_years": 14,
            "capacity": 30,
            "available": True,
            "effectiveness_score": 0.92,
        },
        {
            "display_name": "Smt. Rohini Sanjay Shinde",
            "email": "rohini.shinde@gramshiksha.org",
            "qualification": "B.A (English), D.El.Ed",
            "subjects": ["English", "Social Science"],
            "languages": ["English", "Marathi", "Hindi"],
            "experience_years": 6,
            "capacity": 25,
            "available": True,
            "effectiveness_score": 0.81,
        },
        {
            "display_name": "Shri. Ganesh Tukaram Gadekar",
            "email": "ganesh.gadekar@gramshiksha.org",
            "qualification": "M.Sc (Physics), B.Ed",
            "subjects": ["Science", "Mathematics"],
            "languages": ["Marathi", "English"],
            "experience_years": 4,
            "capacity": 30,
            "available": True,
            "effectiveness_score": None, # New teacher with no historical metrics
        },
    ]
    created_teachers = []
    for td in teachers_data:
        t = Teacher(school_id=school.id, **td)
        db.add(t)
        created_teachers.append(t)
    db.commit()

    # 3. Students
    students_data = [
        {"name": "Aarav Santosh Gaikwad", "grade": 5, "class_idx": 2, "roll": "01", "lang": "Marathi", "needs": "Foundational fractions & arithmetic", "contact": "9822011234"},
        {"name": "Ananya Dnyaneshwar Pawar", "grade": 5, "class_idx": 2, "roll": "02", "lang": "Marathi", "needs": "English vocabulary & phonics", "contact": "9822055678"},
        {"name": "Pranav Vijay Shirole", "grade": 6, "class_idx": 3, "roll": "03", "lang": "Marathi", "needs": "Science conceptual diagrams", "contact": "9822099887"},
        {"name": "Snehal Maruti Jagtap", "grade": 4, "class_idx": 1, "roll": "04", "lang": "Marathi", "needs": "Basic division & word problems", "contact": "9822033445"},
        {"name": "Aditya Balasaheb Chavan", "grade": 3, "class_idx": 0, "roll": "05", "lang": "Marathi", "needs": "Reading fluency & sentence building", "contact": "9822077112"},
        {"name": "Pooja Pandurang Mane", "grade": 7, "class_idx": 4, "roll": "06", "lang": "Marathi", "needs": "Algebraic equations practice", "contact": "9822044332"},
        {"name": "Omkar Gorakhnath Bhise", "grade": 5, "class_idx": 2, "roll": "07", "lang": "Hindi", "needs": "Marathi reading comprehension", "contact": "9822088990"},
        {"name": "Tanvi Sachin Kute", "grade": 4, "class_idx": 1, "roll": "08", "lang": "Marathi", "needs": "Environmental science project guidance", "contact": "9822066554"},
    ]
    created_students = []
    for sd in students_data:
        st = Student(
            school_id=school.id,
            class_id=created_classes[sd["class_idx"]].id,
            display_name=sd["name"],
            grade_level=sd["grade"],
            roll_number=sd["roll"],
            preferred_language=sd["lang"],
            learning_needs=sd["needs"],
            guardian_contact=sd["contact"],
            active=True,
        )
        db.add(st)
        created_students.append(st)
    db.commit()

    # 4. Assessments & Results
    math_assessment = Assessment(
        school_id=school.id,
        class_id=created_classes[2].id,
        title="Mid-Term Math: Fractions & Operations",
        subject="Mathematics",
        grade_level=5,
        total_marks=50.0,
        passing_marks=17.5,
        competency_tag="FLN_MATH_L5",
        assessment_date=date(2024, 9, 15),
    )
    db.add(math_assessment)
    db.commit()

    results_data = [
        {"student_idx": 0, "marks": 22.0, "pct": 44.0, "gap": True, "weak": ["Fraction Addition", "Denominator Normalization"], "notes": "Struggles with unlike denominators."},
        {"student_idx": 1, "marks": 41.5, "pct": 83.0, "gap": False, "weak": [], "notes": "Strong grasp of basic operations."},
        {"student_idx": 6, "marks": 28.0, "pct": 56.0, "gap": True, "weak": ["Word Problem Comprehension"], "notes": "Understands math logic, needs language decoding assistance."},
    ]
    for rd in results_data:
        res = StudentAssessmentResult(
            school_id=school.id,
            assessment_id=math_assessment.id,
            student_id=created_students[rd["student_idx"]].id,
            marks_obtained=rd["marks"],
            score_percentage=rd["pct"],
            is_learning_gap=rd["gap"],
            weak_topics=rd["weak"],
            teacher_notes=rd["notes"],
        )
        db.add(res)
    db.commit()

    # 5. Teacher Assignment & Learning Pathway
    assignment = TeacherAssignment(
        school_id=school.id,
        student_id=created_students[0].id,
        teacher_id=created_teachers[0].id,
        subject="Mathematics",
        support_hours_per_week=2,
        match_score=92.5,
        explanation={
            "reasons": [
                "Subject expertise verified in Mathematics.",
                "Fluent in student's preferred medium (Marathi).",
                "High available capacity (34 open slots).",
                "Senior educator with 8 years experience.",
            ],
            "factors": {"subject_match": 1.0, "language_match": 1.0, "workload_balance": 0.97, "experience_score": 0.8, "effectiveness_score": 0.88},
            "algorithm": "explainable-nipun-v1",
        },
        status="approved",
        approved_by=admin_user.id,
        approved_at=datetime.now(),
    )
    db.add(assignment)

    pathway = LearningPathway(
        school_id=school.id,
        student_id=created_students[0].id,
        subject="Mathematics",
        current_level="Needs Support",
        target_competency="Grade 5 Fractions & Decimal Operations Mastery",
        identified_gaps=["Fraction Addition", "Denominator Normalization"],
        recommended_topics=["Visual Paper Folding Fraction Model", "Real-life Fraction Word Problems"],
        practice_activities=[
            {"title": "Visual Paper Folding Fraction Model", "type": "Hands-on Activity", "duration_minutes": 20, "language_hint": "अपूर्णांक कागदी घडी सराव"},
            {"title": "Real-life Fraction Word Problems", "type": "Contextual Math", "duration_minutes": 25, "language_hint": "व्यावहारिक उदाहरणे"},
        ],
        status="active",
    )
    db.add(pathway)

    # 6. Sample Attendance
    for idx, st in enumerate(created_students[:6]):
        db.add(AttendanceRecord(
            school_id=school.id,
            student_id=st.id,
            class_id=st.class_id,
            attendance_date=date.today(),
            status="present" if idx != 3 else "absent",
            remarks=None if idx != 3 else "Medical leave",
        ))

    # 7. Additional Demo User Profiles (Teacher & Staff)
    teacher_user = UserProfile(
        id=UUID("00000000-0000-0000-0000-000000000002"),
        school_id=school.id,
        role="teacher",
        display_name="Smt. Sunita Kadam (Teacher)",
        email="teacher@gramshiksha.local",
        phone="+91 98220 54321",
        is_active=True,
    )
    staff_user = UserProfile(
        id=UUID("00000000-0000-0000-0000-000000000003"),
        school_id=school.id,
        role="staff",
        display_name="Shri. Vitthalrao Pawar (Block Staff)",
        email="staff@gramshiksha.local",
        phone="+91 98220 67890",
        is_active=True,
    )
    db.add(teacher_user)
    db.add(staff_user)
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed initial demo dataset if database has no schools yet
    db = Session(bind=engine)
    try:
        school_count = db.query(School).count()
        if school_count == 0:
            school = School(
                id=UUID("00000000-0000-0000-0000-000000000100"),
                name="Zilla Parishad Primary School, Shirur",
                udise_code="27251401201",
                panchayat_name="Shirur Gram Panchayat",
                district="Pune",
                state="Maharashtra",
                contact_email="zp.shirur@gramshiksha.org",
                contact_phone="+91 2138 222100",
                academic_year="2024-2025",
            )
            db.add(school)
            db.commit()

            admin_user = UserProfile(
                id=UUID("00000000-0000-0000-0000-000000000001"),
                school_id=school.id,
                role="school_admin",
                display_name="Shri. Rameshwar Patil (Headmaster)",
                email="admin@gramshiksha.local",
                phone="+91 98220 12345",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()

            seed_sample_data(db, school, admin_user)
    finally:
        db.close()
    yield


app = FastAPI(
    title="GramShiksha AI API",
    version="1.0.0",
    description="School-scoped education support and AI matching platform for rural & Gram Panchayat schools.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)


def record_audit(db: Session, school_id: UUID, actor: CurrentUser | None, action: str, entity_type: str, entity_id: str | None, details: dict):
    event = AuditEvent(
        school_id=school_id,
        actor_id=actor.id if actor else None,
        actor_role=actor.role if actor else "system",
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        details=details,
    )
    db.add(event)
    db.flush()


# =========================================================================
# 1. Health & Identity
# =========================================================================

@app.get("/health/live", tags=["health"])
def live():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/health/ready", tags=["health"])
def ready(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "ok", "app_env": settings.app_env}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database unavailable") from exc

@app.get("/me", tags=["identity"])
def get_me(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == user.school_id).first()
    return {
        "id": str(user.id),
        "school_id": str(user.school_id),
        "role": user.role,
        "display_name": user.display_name,
        "email": user.email,
        "school": {
            "id": str(school.id),
            "name": school.name,
            "udise_code": school.udise_code,
            "panchayat_name": school.panchayat_name,
            "district": school.district,
            "state": school.state,
            "academic_year": school.academic_year,
        } if school else None,
    }


# =========================================================================
# 2. School Administration & Classes
# =========================================================================

@app.get("/school", response_model=SchoolOut, tags=["school"])
def get_school_profile(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == user.school_id).one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school

@app.patch("/school", response_model=SchoolOut, tags=["school"])
def update_school_profile(
    payload: SchoolUpdate,
    user: CurrentUser = Depends(require_roles("school_admin")),
    db: Session = Depends(get_db),
):
    school = db.query(School).filter(School.id == user.school_id).one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(school, field, val)
    record_audit(db, user.school_id, user, "SCHOOL_UPDATED", "School", str(school.id), payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(school)
    return school

@app.get("/school/users", response_model=list[UserProfileOut], tags=["school"])
def list_school_users(user: CurrentUser = Depends(require_roles("school_admin")), db: Session = Depends(get_db)):
    return db.query(UserProfile).filter(UserProfile.school_id == user.school_id).order_by(UserProfile.created_at.desc()).all()

@app.post("/school/users", response_model=UserProfileOut, status_code=201, tags=["school"])
def create_school_user(
    payload: UserProfileCreate,
    user: CurrentUser = Depends(require_roles("school_admin")),
    db: Session = Depends(get_db),
):
    new_profile = UserProfile(
        id=uuid.uuid4(),
        school_id=user.school_id,
        role=payload.role,
        display_name=payload.display_name,
        email=payload.email,
        phone=payload.phone,
        is_active=True,
    )
    db.add(new_profile)
    record_audit(db, user.school_id, user, "USER_PROFILE_CREATED", "UserProfile", str(new_profile.id), payload.model_dump())
    db.commit()
    db.refresh(new_profile)
    return new_profile

@app.get("/school/classes", response_model=list[SchoolClassOut], tags=["school"])
def list_classes(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(SchoolClass).filter(SchoolClass.school_id == user.school_id).order_by(SchoolClass.grade_level, SchoolClass.section).all()

@app.post("/school/classes", response_model=SchoolClassOut, status_code=201, tags=["school"])
def create_class(
    payload: SchoolClassCreate,
    user: CurrentUser = Depends(require_roles("school_admin")),
    db: Session = Depends(get_db),
):
    school_class = SchoolClass(school_id=user.school_id, **payload.model_dump())
    db.add(school_class)
    record_audit(db, user.school_id, user, "CLASS_CREATED", "SchoolClass", str(school_class.id), payload.model_dump())
    db.commit()
    db.refresh(school_class)
    return school_class

@app.get("/school/audit-logs", response_model=list[AuditEventOut], tags=["school"])
def list_audit_logs(user: CurrentUser = Depends(require_roles("school_admin")), db: Session = Depends(get_db)):
    return db.query(AuditEvent).filter(AuditEvent.school_id == user.school_id).order_by(AuditEvent.created_at.desc()).limit(100).all()


# =========================================================================
# 3. Students Management
# =========================================================================

@app.post("/students", response_model=StudentOut, status_code=201, tags=["students"])
def create_student(
    payload: StudentCreate,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher")),
    db: Session = Depends(get_db),
):
    student = Student(school_id=user.school_id, **payload.model_dump())
    db.add(student)
    record_audit(db, user.school_id, user, "STUDENT_CREATED", "Student", str(student.id), {"display_name": student.display_name, "grade": student.grade_level})
    db.commit()
    db.refresh(student)
    return student

@app.get("/students", response_model=list[StudentOut], tags=["students"])
def list_students(
    search: str | None = None,
    grade_level: int | None = None,
    class_id: UUID | None = None,
    language: str | None = None,
    active_only: bool = True,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    user: CurrentUser = Depends(require_roles("school_admin", "teacher", "staff")),
    db: Session = Depends(get_db),
):
    q = db.query(Student).filter(Student.school_id == user.school_id)
    if active_only:
        q = q.filter(Student.active.is_(True))
    if grade_level:
        q = q.filter(Student.grade_level == grade_level)
    if class_id:
        q = q.filter(Student.class_id == class_id)
    if language:
        q = q.filter(Student.preferred_language.ilike(f"%{language}%"))
    if search:
        s = f"%{search.strip()}%"
        q = q.filter(Student.display_name.ilike(s) | Student.roll_number.ilike(s))
    return q.order_by(Student.grade_level, Student.display_name).offset(offset).limit(limit).all()

@app.get("/students/{student_id}", response_model=StudentOut, tags=["students"])
def get_student(
    student_id: UUID,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher", "staff")),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id, Student.school_id == user.school_id).one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@app.patch("/students/{student_id}", response_model=StudentOut, tags=["students"])
def update_student(
    student_id: UUID,
    payload: StudentUpdate,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher")),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id, Student.school_id == user.school_id).one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(student, field, val)
    record_audit(db, user.school_id, user, "STUDENT_UPDATED", "Student", str(student.id), payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(student)
    return student

@app.delete("/students/{student_id}", tags=["students"])
def delete_student(
    student_id: UUID,
    user: CurrentUser = Depends(require_roles("school_admin")),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id, Student.school_id == user.school_id).one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.active = False
    record_audit(db, user.school_id, user, "STUDENT_DEACTIVATED", "Student", str(student.id), {})
    db.commit()
    return {"message": "Student successfully deactivated", "id": str(student_id)}


# =========================================================================
# 4. Teachers Management
# =========================================================================

@app.post("/teachers", response_model=TeacherOut, status_code=201, tags=["teachers"])
def create_teacher(
    payload: TeacherCreate,
    user: CurrentUser = Depends(require_roles("school_admin")),
    db: Session = Depends(get_db),
):
    teacher = Teacher(school_id=user.school_id, **payload.model_dump())
    db.add(teacher)
    record_audit(db, user.school_id, user, "TEACHER_CREATED", "Teacher", str(teacher.id), {"display_name": teacher.display_name, "subjects": teacher.subjects})
    db.commit()
    db.refresh(teacher)
    return teacher

@app.get("/teachers", response_model=list[TeacherOut], tags=["teachers"])
def list_teachers(
    subject: str | None = None,
    language: str | None = None,
    available_only: bool = False,
    search: str | None = None,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher", "staff")),
    db: Session = Depends(get_db),
):
    q = db.query(Teacher).filter(Teacher.school_id == user.school_id, Teacher.active.is_(True))
    if available_only:
        q = q.filter(Teacher.available.is_(True))
    if search:
        q = q.filter(Teacher.display_name.ilike(f"%{search.strip()}%"))
    teachers = q.order_by(Teacher.display_name).all()

    # Compute active assignments count for each teacher
    active_loads = (
        db.query(TeacherAssignment.teacher_id, func.count(TeacherAssignment.id))
        .filter(TeacherAssignment.school_id == user.school_id, TeacherAssignment.status == "approved")
        .group_by(TeacherAssignment.teacher_id)
        .all()
    )
    loads_map = {str(tid): cnt for tid, cnt in active_loads}

    results = []
    for t in teachers:
        if subject:
            subj_lower = subject.lower()
            if not any(subj_lower in s.lower() for s in (t.subjects or [])):
                continue
        if language:
            lang_lower = language.lower()
            if not any(lang_lower in l.lower() for l in (t.languages or [])):
                continue
        t_out = TeacherOut.model_validate(t)
        t_out.active_assignments_count = loads_map.get(str(t.id), 0)
        results.append(t_out)
    return results

@app.get("/teachers/{teacher_id}", response_model=TeacherOut, tags=["teachers"])
def get_teacher(
    teacher_id: UUID,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher", "staff")),
    db: Session = Depends(get_db),
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id, Teacher.school_id == user.school_id).one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    t_out = TeacherOut.model_validate(teacher)
    t_out.active_assignments_count = (
        db.query(func.count(TeacherAssignment.id))
        .filter(TeacherAssignment.teacher_id == teacher.id, TeacherAssignment.status == "approved")
        .scalar()
        or 0
    )
    return t_out

@app.patch("/teachers/{teacher_id}", response_model=TeacherOut, tags=["teachers"])
def update_teacher(
    teacher_id: UUID,
    payload: TeacherUpdate,
    user: CurrentUser = Depends(require_roles("school_admin")),
    db: Session = Depends(get_db),
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id, Teacher.school_id == user.school_id).one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(teacher, field, val)
    record_audit(db, user.school_id, user, "TEACHER_UPDATED", "Teacher", str(teacher.id), payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(teacher)
    return get_teacher(teacher_id, user, db)

@app.delete("/teachers/{teacher_id}", tags=["teachers"])
def delete_teacher(
    teacher_id: UUID,
    user: CurrentUser = Depends(require_roles("school_admin")),
    db: Session = Depends(get_db),
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id, Teacher.school_id == user.school_id).one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    teacher.active = False
    record_audit(db, user.school_id, user, "TEACHER_DEACTIVATED", "Teacher", str(teacher.id), {})
    db.commit()
    return {"message": "Teacher successfully deactivated", "id": str(teacher_id)}


# =========================================================================
# 5. AI Teacher Matching & Assignments
# =========================================================================

@app.post("/matching/recommendations", response_model=MatchResponse, tags=["matching"])
def recommend_teachers(
    payload: MatchRequest,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher")),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(
        Student.id == payload.student_id,
        Student.school_id == user.school_id,
        Student.active.is_(True),
    ).one_or_none()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found in your school")

    teachers = db.query(Teacher).filter(
        Teacher.school_id == user.school_id,
        Teacher.active.is_(True),
        Teacher.available.is_(True),
    ).all()

    if not teachers:
        return MatchResponse(
            student_id=student.id,
            student_name=student.display_name,
            student_grade=student.grade_level,
            preferred_language=student.preferred_language,
            subject=payload.subject,
            candidates=[],
            note="No active, available teachers registered in this school.",
        )

    # Compute current active workloads for teachers
    active_loads = (
        db.query(TeacherAssignment.teacher_id, func.count(TeacherAssignment.id))
        .filter(TeacherAssignment.school_id == user.school_id, TeacherAssignment.status == "approved")
        .group_by(TeacherAssignment.teacher_id)
        .all()
    )
    loads_map = {str(tid): cnt for tid, cnt in active_loads}

    ranked = rank_teachers(
        student=student,
        teachers=teachers,
        subject=payload.subject,
        support_hours=payload.support_hours_per_week,
        teacher_active_loads=loads_map,
    )[:payload.limit]

    candidates = []
    for result in ranked:
        assignment = TeacherAssignment(
            school_id=user.school_id,
            student_id=student.id,
            teacher_id=result.teacher.id,
            subject=payload.subject,
            support_hours_per_week=payload.support_hours_per_week,
            match_score=result.score,
            explanation={
                "reasons": result.reasons,
                "factors": {
                    "subject_match": result.factors.subject_match,
                    "language_match": result.factors.language_match,
                    "experience_score": result.factors.experience_score,
                    "workload_balance": result.factors.workload_balance,
                    "effectiveness_score": result.factors.effectiveness_score,
                },
                "missing_warnings": result.missing_data_warnings,
                "algorithm": "explainable-nipun-v1",
            },
            status="proposed",
        )
        db.add(assignment)
        db.flush()

        candidates.append(
            MatchCandidate(
                assignment_id=assignment.id,
                teacher_id=result.teacher.id,
                teacher_name=result.teacher.display_name,
                teacher_qualification=result.teacher.qualification,
                score=result.score,
                factors=MatchFactors(
                    subject_match=result.factors.subject_match,
                    language_match=result.factors.language_match,
                    experience_score=result.factors.experience_score,
                    workload_balance=result.factors.workload_balance,
                    effectiveness_score=result.factors.effectiveness_score,
                ),
                reasons=result.reasons,
                missing_data_warnings=result.missing_data_warnings,
                current_workload=result.current_workload,
                max_capacity=result.max_capacity,
            )
        )

    record_audit(db, user.school_id, user, "MATCHING_RECOMMENDATIONS_GENERATED", "Student", str(student.id), {"subject": payload.subject, "candidates_count": len(candidates)})
    db.commit()

    return MatchResponse(
        student_id=student.id,
        student_name=student.display_name,
        student_grade=student.grade_level,
        preferred_language=student.preferred_language,
        subject=payload.subject,
        candidates=candidates,
    )

@app.get("/assignments", response_model=list[TeacherAssignmentOut], tags=["assignments"])
def list_assignments(
    status_filter: str | None = None,
    student_id: UUID | None = None,
    teacher_id: UUID | None = None,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher", "staff")),
    db: Session = Depends(get_db),
):
    q = db.query(TeacherAssignment).filter(TeacherAssignment.school_id == user.school_id)
    if status_filter:
        q = q.filter(TeacherAssignment.status == status_filter)
    if student_id:
        q = q.filter(TeacherAssignment.student_id == student_id)
    if teacher_id:
        q = q.filter(TeacherAssignment.teacher_id == teacher_id)

    assignments = q.order_by(TeacherAssignment.created_at.desc()).limit(200).all()

    # Preload names
    student_ids = {a.student_id for a in assignments}
    teacher_ids = {a.teacher_id for a in assignments}
    students_map = {s.id: s.display_name for s in db.query(Student).filter(Student.id.in_(student_ids)).all()}
    teachers_map = {t.id: t.display_name for t in db.query(Teacher).filter(Teacher.id.in_(teacher_ids)).all()}

    results = []
    for a in assignments:
        item = TeacherAssignmentOut.model_validate(a)
        item.student_name = students_map.get(a.student_id, "Unknown Student")
        item.teacher_name = teachers_map.get(a.teacher_id, "Unknown Teacher")
        results.append(item)
    return results

@app.post("/assignments/{assignment_id}/approve", response_model=TeacherAssignmentOut, tags=["assignments"])
def approve_assignment(
    assignment_id: UUID,
    user: CurrentUser = Depends(require_roles("school_admin")),
    db: Session = Depends(get_db),
):
    assignment = db.query(TeacherAssignment).filter(
        TeacherAssignment.id == assignment_id,
        TeacherAssignment.school_id == user.school_id,
    ).one_or_none()
    if assignment is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.status != "proposed":
        raise HTTPException(status_code=409, detail=f"Cannot approve an assignment in '{assignment.status}' status")

    assignment.status = "approved"
    assignment.approved_by = user.id
    assignment.approved_at = datetime.now()
    record_audit(db, user.school_id, user, "ASSIGNMENT_APPROVED", "TeacherAssignment", str(assignment.id), {"teacher_id": str(assignment.teacher_id), "student_id": str(assignment.student_id)})
    db.commit()
    db.refresh(assignment)
    return list_assignments(student_id=assignment.student_id, user=user, db=db)[0]

@app.post("/assignments/{assignment_id}/reject", response_model=TeacherAssignmentOut, tags=["assignments"])
def reject_assignment(
    assignment_id: UUID,
    payload: AssignmentReview,
    user: CurrentUser = Depends(require_roles("school_admin")),
    db: Session = Depends(get_db),
):
    assignment = db.query(TeacherAssignment).filter(
        TeacherAssignment.id == assignment_id,
        TeacherAssignment.school_id == user.school_id,
    ).one_or_none()
    if assignment is None:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.status = "rejected"
    assignment.rejection_reason = payload.rejection_reason or "Declined by school administrator"
    record_audit(db, user.school_id, user, "ASSIGNMENT_REJECTED", "TeacherAssignment", str(assignment.id), {"reason": assignment.rejection_reason})
    db.commit()
    db.refresh(assignment)
    return list_assignments(student_id=assignment.student_id, user=user, db=db)[0]

@app.delete("/assignments/{assignment_id}", tags=["assignments"])
def delete_assignment(
    assignment_id: UUID,
    user: CurrentUser = Depends(require_roles("school_admin")),
    db: Session = Depends(get_db),
):
    assignment = db.query(TeacherAssignment).filter(
        TeacherAssignment.id == assignment_id,
        TeacherAssignment.school_id == user.school_id,
    ).one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    record_audit(db, user.school_id, user, "ASSIGNMENT_DELETED", "TeacherAssignment", str(assignment_id), {})
    db.commit()
    return {"message": "Assignment successfully removed", "id": str(assignment_id)}


# =========================================================================
# 6. Assessments & Learning Analytics
# =========================================================================

@app.post("/assessments", response_model=AssessmentOut, status_code=201, tags=["assessments"])
def create_assessment(
    payload: AssessmentCreate,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher")),
    db: Session = Depends(get_db),
):
    assessment = Assessment(school_id=user.school_id, **payload.model_dump())
    db.add(assessment)
    record_audit(db, user.school_id, user, "ASSESSMENT_CREATED", "Assessment", str(assessment.id), {"title": assessment.title, "subject": assessment.subject})
    db.commit()
    db.refresh(assessment)
    return assessment

@app.get("/assessments", response_model=list[AssessmentOut], tags=["assessments"])
def list_assessments(
    grade_level: int | None = None,
    subject: str | None = None,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher", "staff")),
    db: Session = Depends(get_db),
):
    q = db.query(Assessment).filter(Assessment.school_id == user.school_id)
    if grade_level:
        q = q.filter(Assessment.grade_level == grade_level)
    if subject:
        q = q.filter(Assessment.subject.ilike(f"%{subject}%"))
    assessments = q.order_by(Assessment.assessment_date.desc()).all()

    # Aggregate counts and averages
    results = []
    for asm in assessments:
        stats = (
            db.query(func.count(StudentAssessmentResult.id), func.avg(StudentAssessmentResult.score_percentage))
            .filter(StudentAssessmentResult.assessment_id == asm.id)
            .first()
        )
        count = stats[0] if stats else 0
        avg_score = round(stats[1], 1) if stats and stats[1] is not None else None

        item = AssessmentOut.model_validate(asm)
        item.results_count = count
        item.average_score = avg_score
        results.append(item)
    return results

@app.get("/assessments/{assessment_id}", response_model=AssessmentOut, tags=["assessments"])
def get_assessment(
    assessment_id: UUID,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher", "staff")),
    db: Session = Depends(get_db),
):
    asm = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.school_id == user.school_id).one_or_none()
    if not asm:
        raise HTTPException(status_code=404, detail="Assessment not found")
    stats = (
        db.query(func.count(StudentAssessmentResult.id), func.avg(StudentAssessmentResult.score_percentage))
        .filter(StudentAssessmentResult.assessment_id == asm.id)
        .first()
    )
    item = AssessmentOut.model_validate(asm)
    item.results_count = stats[0] if stats else 0
    item.average_score = round(stats[1], 1) if stats and stats[1] is not None else None
    return item

@app.post("/assessments/{assessment_id}/results", status_code=201, tags=["assessments"])
def record_assessment_results(
    assessment_id: UUID,
    payload: BatchAssessmentResultsCreate,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher")),
    db: Session = Depends(get_db),
):
    asm = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.school_id == user.school_id).one_or_none()
    if not asm:
        raise HTTPException(status_code=404, detail="Assessment not found")

    created_count = 0
    for r in payload.results:
        # Validate student belongs to school
        st = db.query(Student).filter(Student.id == r.student_id, Student.school_id == user.school_id).first()
        if not st:
            continue

        pct = round((r.marks_obtained / asm.total_marks) * 100.0, 1)
        is_gap = r.marks_obtained < asm.passing_marks or len(r.weak_topics) > 0

        # Replace existing result if already present
        existing = db.query(StudentAssessmentResult).filter(
            StudentAssessmentResult.assessment_id == asm.id,
            StudentAssessmentResult.student_id == r.student_id,
        ).first()

        if existing:
            existing.marks_obtained = r.marks_obtained
            existing.score_percentage = pct
            existing.is_learning_gap = is_gap
            existing.weak_topics = r.weak_topics
            existing.teacher_notes = r.teacher_notes
        else:
            db.add(
                StudentAssessmentResult(
                    school_id=user.school_id,
                    assessment_id=asm.id,
                    student_id=r.student_id,
                    marks_obtained=r.marks_obtained,
                    score_percentage=pct,
                    is_learning_gap=is_gap,
                    weak_topics=r.weak_topics,
                    teacher_notes=r.teacher_notes,
                )
            )
        created_count += 1

    record_audit(db, user.school_id, user, "ASSESSMENT_RESULTS_RECORDED", "Assessment", str(asm.id), {"count": created_count})
    db.commit()
    return {"message": f"Successfully recorded results for {created_count} students."}

@app.get("/assessments/{assessment_id}/results", response_model=list[StudentAssessmentResultOut], tags=["assessments"])
def list_assessment_results(
    assessment_id: UUID,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher", "staff")),
    db: Session = Depends(get_db),
):
    asm = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.school_id == user.school_id).one_or_none()
    if not asm:
        raise HTTPException(status_code=404, detail="Assessment not found")

    results = db.query(StudentAssessmentResult).filter(StudentAssessmentResult.assessment_id == asm.id).all()
    student_ids = {r.student_id for r in results}
    students_map = {s.id: s.display_name for s in db.query(Student).filter(Student.id.in_(student_ids)).all()}

    out = []
    for r in results:
        item = StudentAssessmentResultOut.model_validate(r)
        item.assessment_title = asm.title
        item.subject = asm.subject
        item.total_marks = asm.total_marks
        item.student_name = students_map.get(r.student_id, "Unknown")
        out.append(item)
    return out


# =========================================================================
# 7. Student Analytics & Personalized Pathways
# =========================================================================

@app.get("/students/{student_id}/analytics", response_model=StudentAnalyticsOut, tags=["analytics"])
def get_student_analytics(
    student_id: UUID,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher", "staff")),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id, Student.school_id == user.school_id).one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Assessment history joined with assessments
    results_query = (
        db.query(StudentAssessmentResult, Assessment)
        .join(Assessment, StudentAssessmentResult.assessment_id == Assessment.id)
        .filter(StudentAssessmentResult.student_id == student.id)
        .order_by(Assessment.assessment_date.desc())
        .all()
    )

    analysis = analyze_student_learning_gaps(student, results_query)

    # Attendance calculations
    attendance_records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id).all()
    total_att = len(attendance_records)
    present_att = sum(1 for a in attendance_records if a.status == "present")
    attendance_rate = round((present_att / total_att) * 100.0, 1) if total_att > 0 else 100.0

    # Recent results
    recent_res_out = []
    for res, asm in results_query[:10]:
        item = StudentAssessmentResultOut.model_validate(res)
        item.assessment_title = asm.title
        item.subject = asm.subject
        item.total_marks = asm.total_marks
        item.student_name = student.display_name
        recent_res_out.append(item)

    # Active pathways
    pathways = db.query(LearningPathway).filter(LearningPathway.student_id == student.id, LearningPathway.status == "active").all()
    pathways_out = []
    for p in pathways:
        p_item = LearningPathwayOut.model_validate(p)
        p_item.student_name = student.display_name
        pathways_out.append(p_item)

    # Assigned teachers
    assignments = list_assignments(student_id=student.id, user=user, db=db)

    return StudentAnalyticsOut(
        student_id=student.id,
        student_name=student.display_name,
        grade_level=student.grade_level,
        preferred_language=student.preferred_language,
        total_assessments=analysis["total_assessments_taken"],
        average_percentage=analysis["overall_average"],
        attendance_rate_pct=attendance_rate,
        subject_scores=analysis["subject_averages"],
        identified_gaps=analysis["identified_gaps"],
        recent_results=recent_res_out,
        active_pathways=pathways_out,
        assigned_teachers=assignments,
    )

@app.post("/students/{student_id}/pathways", response_model=LearningPathwayOut, status_code=201, tags=["analytics"])
def create_student_pathway(
    student_id: UUID,
    payload: LearningPathwayCreate,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher")),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id, Student.school_id == user.school_id).one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    plan = generate_learning_pathway_plan(student, payload.subject, payload.identified_gaps)

    pathway = LearningPathway(
        school_id=user.school_id,
        student_id=student.id,
        subject=payload.subject,
        current_level=plan["current_level"],
        target_competency=payload.target_competency or plan["target_competency"],
        identified_gaps=payload.identified_gaps,
        recommended_topics=plan["recommended_topics"],
        practice_activities=plan["practice_activities"],
        status="active",
    )
    db.add(pathway)
    record_audit(db, user.school_id, user, "LEARNING_PATHWAY_CREATED", "LearningPathway", str(pathway.id), {"subject": payload.subject})
    db.commit()
    db.refresh(pathway)
    item = LearningPathwayOut.model_validate(pathway)
    item.student_name = student.display_name
    return item

@app.get("/students/{student_id}/pathways", response_model=list[LearningPathwayOut], tags=["analytics"])
def list_student_pathways(
    student_id: UUID,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher", "staff")),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id, Student.school_id == user.school_id).one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    pathways = db.query(LearningPathway).filter(LearningPathway.student_id == student.id).order_by(LearningPathway.created_at.desc()).all()
    results = []
    for p in pathways:
        item = LearningPathwayOut.model_validate(p)
        item.student_name = student.display_name
        results.append(item)
    return results

@app.get("/analytics/school-overview", response_model=SchoolOverviewStats, tags=["analytics"])
def get_school_overview(
    user: CurrentUser = Depends(require_roles("school_admin", "teacher", "staff")),
    db: Session = Depends(get_db),
):
    total_students = db.query(func.count(Student.id)).filter(Student.school_id == user.school_id, Student.active.is_(True)).scalar() or 0
    total_teachers = db.query(func.count(Teacher.id)).filter(Teacher.school_id == user.school_id, Teacher.active.is_(True)).scalar() or 0
    total_classes = db.query(func.count(SchoolClass.id)).filter(SchoolClass.school_id == user.school_id).scalar() or 0
    active_assignments = db.query(func.count(TeacherAssignment.id)).filter(TeacherAssignment.school_id == user.school_id, TeacherAssignment.status == "approved").scalar() or 0
    pending_assignments = db.query(func.count(TeacherAssignment.id)).filter(TeacherAssignment.school_id == user.school_id, TeacherAssignment.status == "proposed").scalar() or 0

    # Attendance overall
    att_stats = (
        db.query(func.count(AttendanceRecord.id), func.sum(case((AttendanceRecord.status == "present", 1), else_=0)))
        .filter(AttendanceRecord.school_id == user.school_id)
        .first()
    )
    total_att = att_stats[0] if att_stats else 0
    present_att = att_stats[1] if att_stats and att_stats[1] is not None else 0
    avg_att = round((present_att / total_att) * 100.0, 1) if total_att > 0 else 94.0

    # Students with learning gaps
    gap_students = (
        db.query(func.count(func.distinct(StudentAssessmentResult.student_id)))
        .filter(StudentAssessmentResult.school_id == user.school_id, StudentAssessmentResult.is_learning_gap.is_(True))
        .scalar()
        or 0
    )

    # Subject health breakdown
    subjects_query = (
        db.query(
            Assessment.subject,
            func.avg(StudentAssessmentResult.score_percentage),
            func.count(StudentAssessmentResult.id),
            func.sum(case((StudentAssessmentResult.is_learning_gap.is_(True), 1), else_=0)),
        )
        .join(StudentAssessmentResult, Assessment.id == StudentAssessmentResult.assessment_id)
        .filter(Assessment.school_id == user.school_id)
        .group_by(Assessment.subject)
        .all()
    )
    subjects_health = []
    for s_name, avg_s, cnt, gaps in subjects_query:
        gap_pct = round((gaps / cnt) * 100.0, 1) if cnt > 0 else 0.0
        subjects_health.append(
            SubjectHealth(
                subject=s_name,
                average_score=round(avg_s, 1) if avg_s is not None else 0.0,
                students_assessed=cnt,
                gap_rate_pct=gap_pct,
            )
        )

    # Recent assessments
    recent_assessments = list_assessments(user=user, db=db)[:5]

    return SchoolOverviewStats(
        total_students=total_students,
        total_teachers=total_teachers,
        total_classes=total_classes,
        active_assignments=active_assignments,
        pending_assignments=pending_assignments,
        average_school_attendance_pct=avg_att,
        learning_gap_students_count=gap_students,
        subjects_health=subjects_health,
        recent_assessments=recent_assessments,
    )


# =========================================================================
# 8. Attendance Management
# =========================================================================

@app.post("/attendance/batch", status_code=201, tags=["attendance"])
def record_batch_attendance(
    payload: BatchAttendanceCreate,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher")),
    db: Session = Depends(get_db),
):
    recorded_count = 0
    for r in payload.records:
        st = db.query(Student).filter(Student.id == r.student_id, Student.school_id == user.school_id).first()
        if not st:
            continue

        existing = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == r.student_id,
            AttendanceRecord.attendance_date == payload.attendance_date,
        ).first()

        if existing:
            existing.status = r.status
            existing.remarks = r.remarks
        else:
            db.add(
                AttendanceRecord(
                    school_id=user.school_id,
                    student_id=r.student_id,
                    class_id=payload.class_id or st.class_id,
                    attendance_date=payload.attendance_date,
                    status=r.status,
                    remarks=r.remarks,
                )
            )
        recorded_count += 1

    record_audit(db, user.school_id, user, "ATTENDANCE_RECORDED", "AttendanceRecord", str(payload.attendance_date), {"count": recorded_count})
    db.commit()
    return {"message": f"Recorded attendance for {recorded_count} students on {payload.attendance_date}."}

@app.get("/attendance", response_model=list[AttendanceRecordOut], tags=["attendance"])
def list_attendance(
    attendance_date: date | None = None,
    class_id: UUID | None = None,
    student_id: UUID | None = None,
    user: CurrentUser = Depends(require_roles("school_admin", "teacher", "staff")),
    db: Session = Depends(get_db),
):
    q = db.query(AttendanceRecord).filter(AttendanceRecord.school_id == user.school_id)
    if attendance_date:
        q = q.filter(AttendanceRecord.attendance_date == attendance_date)
    if class_id:
        q = q.filter(AttendanceRecord.class_id == class_id)
    if student_id:
        q = q.filter(AttendanceRecord.student_id == student_id)

    records = q.order_by(AttendanceRecord.attendance_date.desc()).limit(300).all()
    st_ids = {r.student_id for r in records}
    students_map = {s.id: s.display_name for s in db.query(Student).filter(Student.id.in_(st_ids)).all()}

    results = []
    for r in records:
        item = AttendanceRecordOut.model_validate(r)
        item.student_name = students_map.get(r.student_id, "Unknown")
        results.append(item)
    return results


# =========================================================================
# 9. Downloadable CSV Reports
# =========================================================================

@app.get("/reports/students.csv", tags=["reports"])
def export_students_csv(
    user: CurrentUser = Depends(require_roles("school_admin", "teacher")),
    db: Session = Depends(get_db),
):
    students = db.query(Student).filter(Student.school_id == user.school_id).order_by(Student.grade_level, Student.display_name).all()
    classes_map = {c.id: c.name for c in db.query(SchoolClass).filter(SchoolClass.school_id == user.school_id).all()}

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student ID", "Roll Number", "Full Name", "Grade", "Class / Section", "Medium / Language", "Learning Needs", "Status", "Registered Date"])
    for s in students:
        writer.writerow([
            str(s.id),
            s.roll_number or "-",
            s.display_name,
            s.grade_level,
            classes_map.get(s.class_id, "Unassigned"),
            s.preferred_language,
            s.learning_needs or "-",
            "Active" if s.active else "Inactive",
            s.created_at.strftime("%Y-%m-%d"),
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=students_report_{date.today()}.csv"},
    )

@app.get("/reports/teachers.csv", tags=["reports"])
def export_teachers_csv(
    user: CurrentUser = Depends(require_roles("school_admin")),
    db: Session = Depends(get_db),
):
    teachers = db.query(Teacher).filter(Teacher.school_id == user.school_id).order_by(Teacher.display_name).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Teacher ID", "Full Name", "Email", "Qualification", "Subjects", "Languages", "Experience (Yrs)", "Capacity", "Available", "Effectiveness Score", "Status"])
    for t in teachers:
        writer.writerow([
            str(t.id),
            t.display_name,
            t.email or "-",
            t.qualification or "-",
            ", ".join(t.subjects or []),
            ", ".join(t.languages or []),
            t.experience_years,
            t.capacity,
            "Yes" if t.available else "No",
            f"{int(t.effectiveness_score * 100)}%" if t.effectiveness_score is not None else "Unrecorded",
            "Active" if t.active else "Inactive",
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=teachers_report_{date.today()}.csv"},
    )

@app.get("/reports/assessments.csv", tags=["reports"])
def export_assessments_csv(
    user: CurrentUser = Depends(require_roles("school_admin", "teacher")),
    db: Session = Depends(get_db),
):
    results = (
        db.query(StudentAssessmentResult, Assessment, Student)
        .join(Assessment, StudentAssessmentResult.assessment_id == Assessment.id)
        .join(Student, StudentAssessmentResult.student_id == Student.id)
        .filter(StudentAssessmentResult.school_id == user.school_id)
        .order_by(Assessment.assessment_date.desc(), Student.display_name)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Assessment Date", "Assessment Title", "Subject", "Grade", "Student Name", "Marks Obtained", "Total Marks", "Percentage", "Learning Gap Flag", "Weak Topics", "Teacher Notes"])
    for res, asm, st in results:
        writer.writerow([
            asm.assessment_date.isoformat(),
            asm.title,
            asm.subject,
            asm.grade_level,
            st.display_name,
            res.marks_obtained,
            asm.total_marks,
            f"{res.score_percentage}%",
            "YES" if res.is_learning_gap else "NO",
            ", ".join(res.weak_topics or []),
            res.teacher_notes or "-",
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=assessments_report_{date.today()}.csv"},
    )

@app.get("/reports/matching-summary.csv", tags=["reports"])
def export_matching_summary_csv(
    user: CurrentUser = Depends(require_roles("school_admin")),
    db: Session = Depends(get_db),
):
    assignments = (
        db.query(TeacherAssignment, Student, Teacher)
        .join(Student, TeacherAssignment.student_id == Student.id)
        .join(Teacher, TeacherAssignment.teacher_id == Teacher.id)
        .filter(TeacherAssignment.school_id == user.school_id)
        .order_by(TeacherAssignment.created_at.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Assignment ID", "Student Name", "Grade", "Assigned Teacher", "Subject", "Support Hrs/Wk", "Fit Score", "Status", "Decision Date"])
    for a, st, t in assignments:
        writer.writerow([
            str(a.id),
            st.display_name,
            st.grade_level,
            t.display_name,
            a.subject,
            a.support_hours_per_week,
            f"{a.match_score}%",
            a.status.upper(),
            a.created_at.strftime("%Y-%m-%d"),
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=matching_summary_{date.today()}.csv"},
    )
