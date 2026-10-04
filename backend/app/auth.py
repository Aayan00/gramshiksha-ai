from dataclasses import dataclass
from functools import lru_cache
from uuid import UUID
import uuid
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models import UserProfile, School

bearer = HTTPBearer(auto_error=False)

@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    school_id: UUID
    role: str
    display_name: str
    email: str | None = None

@lru_cache(maxsize=4)
def jwks_client(url: str) -> PyJWKClient:
    return PyJWKClient(url, cache_jwk_set=True, lifespan=300)

def verify_token(token: str) -> dict:
    # 1. Allow development bypass tokens ONLY if explicitly in development mode and Supabase is not configured
    if settings.app_env == "development" and not settings.supabase_url:
        if token.startswith("dev-"):
            role = token.replace("dev-", "").strip().lower()
            if role in ("school_admin", "admin"):
                role = "school_admin"
            elif role not in ("school_admin", "teacher", "staff"):
                role = "school_admin"
            # Fixed deterministic UUIDs for dev identities
            dev_user_id = UUID("00000000-0000-0000-0000-000000000001") if role == "school_admin" else UUID("00000000-0000-0000-0000-000000000002")
            return {
                "sub": str(dev_user_id),
                "role": role,
                "email": f"{role}@gramshiksha.local",
                "app_metadata": {"role": role},
                "iss": "gramshiksha-dev",
                "aud": settings.jwt_audience,
            }

    if not settings.supabase_url:
        raise HTTPException(status_code=503, detail="Supabase authentication is not configured. Set SUPABASE_URL in .env")

    issuer = settings.supabase_url.rstrip("/") + "/auth/v1"
    jwks_url = issuer + "/.well-known/jwks.json"
    try:
        signing_key = jwks_client(jwks_url).get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience=settings.jwt_audience,
            issuer=issuer,
            options={"require": ["exp", "sub", "iss", "aud"]},
        )
        return claims
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired access token") from exc

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Bearer access token required")

    claims = verify_token(credentials.credentials)
    try:
        user_id = UUID(claims["sub"])
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(status_code=401, detail="Invalid token subject") from exc

    profile = db.query(UserProfile).filter(
        UserProfile.id == user_id,
        UserProfile.is_active.is_(True),
    ).one_or_none()

    # In dev mode, auto-seed default dev school and user profile if missing
    if profile is None and settings.app_env == "development" and not settings.supabase_url and credentials.credentials.startswith("dev-"):
        dev_school = db.query(School).first()
        if dev_school is None:
            dev_school = School(
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
            db.add(dev_school)
            db.commit()

        role = claims.get("role", "school_admin")
        display_name = "Shri. Rameshwar Patil (Headmaster)" if role == "school_admin" else "Smt. Sunita Kadam (Math & Science Teacher)"
        profile = UserProfile(
            id=user_id,
            school_id=dev_school.id,
            role=role,
            display_name=display_name,
            email=claims.get("email"),
            is_active=True,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    if profile is None:
        raise HTTPException(status_code=403, detail="No active school profile is provisioned for this account")

    return CurrentUser(
        id=profile.id,
        school_id=profile.school_id,
        role=profile.role,
        display_name=profile.display_name,
        email=profile.email,
    )

def require_roles(*roles: str):
    def dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail=f"Insufficient permissions. Required one of: {', '.join(roles)}")
        return user
    return dependency
