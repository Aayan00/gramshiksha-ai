import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.db.base import Base
# Import all models so that Base.metadata has all table definitions registered
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
from app.db.session import get_db
from app.auth import get_current_user, CurrentUser
from app.main import app

@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()

@pytest.fixture()
def client(db_session):
    school_id = uuid.uuid4()
    user = CurrentUser(
        id=uuid.uuid4(),
        school_id=school_id,
        role="school_admin",
        display_name="Test Admin",
        email="admin@test.com",
    )
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_current_user] = lambda: user
    with TestClient(app) as c:
        yield c, user
    app.dependency_overrides.clear()
