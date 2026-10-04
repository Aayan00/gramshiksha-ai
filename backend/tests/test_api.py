import uuid
from datetime import date
from app.models import School, Student, Teacher, UserProfile, SchoolClass, Assessment, StudentAssessmentResult, AttendanceRecord, TeacherAssignment

def seed_school(db, school_id, user_id, role="school_admin"):
    school = School(
        id=school_id,
        name="Zilla Parishad School Shirur",
        udise_code="27251401201",
        panchayat_name="Shirur Gram Panchayat",
        district="Pune",
        state="Maharashtra",
    )
    db.add(school)
    profile = UserProfile(
        id=user_id,
        school_id=school_id,
        role=role,
        display_name="Test Staff Member",
        email=f"{role}@test.com",
    )
    db.add(profile)
    db.commit()
    return school, profile


# 1. Student Management Tests
def test_create_and_list_students(client, db_session):
    c, user = client
    seed_school(db_session, user.school_id, user.id)
    response = c.post(
        "/students",
        json={
            "display_name": "Aarav Patil",
            "grade_level": 5,
            "preferred_language": "Marathi",
            "roll_number": "01",
            "learning_needs": "Fractions practice",
        },
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["display_name"] == "Aarav Patil"
    assert data["roll_number"] == "01"

    # List
    list_res = c.get("/students")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # Filter by grade
    filter_res = c.get("/students?grade_level=5")
    assert filter_res.status_code == 200
    assert len(filter_res.json()) >= 1

    # Update
    student_id = data["id"]
    patch_res = c.patch(f"/students/{student_id}", json={"display_name": "Aarav S. Patil"})
    assert patch_res.status_code == 200
    assert patch_res.json()["display_name"] == "Aarav S. Patil"

    # Deactivate
    del_res = c.delete(f"/students/{student_id}")
    assert del_res.status_code == 200
    # Active only list should now exclude it
    assert len(c.get("/students?active_only=true").json()) == 0


# 2. Teacher Management & RBAC Tests
def test_teacher_creation_requires_admin(client, db_session):
    from app.auth import get_current_user, CurrentUser
    from app.main import app

    c, user = client
    seed_school(db_session, user.school_id, user.id, role="teacher")
    teacher_user = CurrentUser(id=user.id, school_id=user.school_id, role="teacher", display_name="Teacher")
    app.dependency_overrides[get_current_user] = lambda: teacher_user

    # Teacher role should be forbidden from creating a teacher
    res = c.post(
        "/teachers",
        json={
            "display_name": "New Teacher",
            "subjects": ["Mathematics"],
            "languages": ["Marathi"],
            "experience_years": 5,
        },
    )
    assert res.status_code == 403

    # Switch back to admin
    app.dependency_overrides[get_current_user] = lambda: user
    admin_res = c.post(
        "/teachers",
        json={
            "display_name": "Smt. Kadam",
            "subjects": ["Mathematics", "Science"],
            "languages": ["Marathi", "English"],
            "experience_years": 8,
            "capacity": 30,
            "qualification": "B.Sc, B.Ed",
            "effectiveness_score": 0.85,
        },
    )
    assert admin_res.status_code == 201
    assert admin_res.json()["display_name"] == "Smt. Kadam"
    assert admin_res.json()["qualification"] == "B.Sc, B.Ed"


# 3. AI Teacher Matching Engine Tests
def test_matching_recommendation_and_approval_workflow(client, db_session):
    c, user = client
    seed_school(db_session, user.school_id, user.id)

    student = Student(
        school_id=user.school_id,
        display_name="Snehal Jagtap",
        grade_level=4,
        preferred_language="Marathi",
    )
    db_session.add(student)

    # Teacher 1: High math & marathi match
    t1 = Teacher(
        school_id=user.school_id,
        display_name="Math Specialist",
        subjects=["Mathematics", "Science"],
        languages=["Marathi", "English"],
        experience_years=8,
        capacity=30,
        available=True,
        effectiveness_score=0.90,
    )
    # Teacher 2: No math, different subject
    t2 = Teacher(
        school_id=user.school_id,
        display_name="Language Specialist",
        subjects=["English"],
        languages=["English"],
        experience_years=2,
        capacity=20,
        available=True,
        effectiveness_score=None,
    )
    db_session.add_all([t1, t2])
    db_session.commit()

    # Request recommendations for Math
    res = c.post("/matching/recommendations", json={"student_id": str(student.id), "subject": "Mathematics"})
    assert res.status_code == 200, res.text
    body = res.json()
    assert len(body["candidates"]) == 2
    top_candidate = body["candidates"][0]
    assert top_candidate["teacher_id"] == str(t1.id)
    assert top_candidate["score"] >= 80.0
    assert len(top_candidate["reasons"]) > 0
    assert top_candidate["factors"]["subject_match"] == 1.0

    # Test assignment approval
    assignment_id = top_candidate["assignment_id"]
    approve_res = c.post(f"/assignments/{assignment_id}/approve")
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"

    # List assignments
    assignments_res = c.get("/assignments")
    assert assignments_res.status_code == 200
    assert len(assignments_res.json()) >= 1


# 4. Cross-School Isolation Tests
def test_cross_school_access_is_blocked(client, db_session):
    c, user = client
    seed_school(db_session, user.school_id, user.id)

    other_school_id = uuid.uuid4()
    other_school = School(id=other_school_id, name="Other District School")
    foreign_student = Student(
        school_id=other_school_id,
        display_name="Foreign Student",
        grade_level=6,
        preferred_language="Hindi",
    )
    db_session.add_all([other_school, foreign_student])
    db_session.commit()

    # Cross school student should return 404
    match_res = c.post("/matching/recommendations", json={"student_id": str(foreign_student.id), "subject": "Mathematics"})
    assert match_res.status_code == 404

    get_res = c.get(f"/students/{foreign_student.id}")
    assert get_res.status_code == 404


# 5. Assessments, Learning Analytics & Pathways Tests
def test_assessments_and_learning_analytics(client, db_session):
    c, user = client
    seed_school(db_session, user.school_id, user.id)

    student = Student(school_id=user.school_id, display_name="Pranav Shirole", grade_level=5, preferred_language="Marathi")
    db_session.add(student)
    db_session.commit()

    # 1. Create assessment
    asm_res = c.post(
        "/assessments",
        json={
            "title": "Unit 2: Fraction Division & Decimals",
            "subject": "Mathematics",
            "grade_level": 5,
            "total_marks": 50.0,
            "passing_marks": 17.5,
            "competency_tag": "FLN_MATH_L5",
        },
    )
    assert asm_res.status_code == 201
    assessment_id = asm_res.json()["id"]

    # 2. Record batch results with learning gap
    res_record = c.post(
        f"/assessments/{assessment_id}/results",
        json={
            "results": [
                {
                    "student_id": str(student.id),
                    "marks_obtained": 14.0,
                    "weak_topics": ["Fraction Division", "Reciprocal Concepts"],
                    "teacher_notes": "Needs extra practice with reciprocals.",
                }
            ]
        },
    )
    assert res_record.status_code == 201

    # 3. Fetch student analytics
    analytics_res = c.get(f"/students/{student.id}/analytics")
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()
    assert analytics_data["total_assessments"] == 1
    assert "Fraction Division" in analytics_data["identified_gaps"]

    # 4. Generate learning pathway
    pathway_res = c.post(
        f"/students/{student.id}/pathways",
        json={
            "student_id": str(student.id),
            "subject": "Mathematics",
            "target_competency": "Grade 5 Fraction Operations Mastery",
            "identified_gaps": ["Fraction Division"],
            "recommended_topics": ["Hands-on Fraction Kit"],
        },
    )
    assert pathway_res.status_code == 201
    pathway_data = pathway_res.json()
    assert pathway_data["subject"] == "Mathematics"
    assert len(pathway_data["practice_activities"]) > 0


# 6. Attendance & CSV Reports Tests
def test_attendance_and_csv_reports(client, db_session):
    c, user = client
    seed_school(db_session, user.school_id, user.id)

    student = Student(school_id=user.school_id, display_name="Omkar Bhise", grade_level=5, preferred_language="Marathi")
    db_session.add(student)
    db_session.commit()

    # Record attendance
    att_res = c.post(
        "/attendance/batch",
        json={
            "attendance_date": str(date.today()),
            "records": [{"student_id": str(student.id), "status": "present", "remarks": "On time"}],
        },
    )
    assert att_res.status_code == 201

    # Check attendance list
    att_list = c.get("/attendance")
    assert att_list.status_code == 200
    assert len(att_list.json()) >= 1

    # CSV Exports
    s_csv = c.get("/reports/students.csv")
    assert s_csv.status_code == 200
    assert "text/csv" in s_csv.headers["content-type"]
    assert "Omkar Bhise" in s_csv.text

    t_csv = c.get("/reports/teachers.csv")
    assert t_csv.status_code == 200
    assert "text/csv" in t_csv.headers["content-type"]

    asm_csv = c.get("/reports/assessments.csv")
    assert asm_csv.status_code == 200
    assert "text/csv" in asm_csv.headers["content-type"]

    m_csv = c.get("/reports/matching-summary.csv")
    assert m_csv.status_code == 200
    assert "text/csv" in m_csv.headers["content-type"]
