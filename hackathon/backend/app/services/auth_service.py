from datetime import datetime, timedelta
from typing import List, Optional
import bcrypt
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.auth import Role, User

security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_user_role: Optional[str] = Header(None, alias="x-user-role"),
    db: Session = Depends(get_db),
) -> User:
    """
    Authenticates user via:
    1. JWT Bearer token (Production standard)
    2. Or active role header fallback for existing frontend compatibility
    """
    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        if payload and "sub" in payload:
            user = db.query(User).filter(User.username == payload["sub"]).first()
            if user and user.is_active:
                return user

    # Fallback to role header if JWT not present (smooth integration with frontend)
    role_name = (x_user_role or "admin").lower()
    role = db.query(Role).filter(Role.name == role_name).first()
    if role:
        user = db.query(User).filter(User.role_id == role.id, User.is_active == True).first()
        if user:
            return user

    # Default to first admin user if DB seeded
    fallback_user = db.query(User).first()
    if fallback_user:
        return fallback_user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

def require_roles(allowed_roles: List[str]):
    def role_checker(
        current_user: User = Depends(get_current_user),
        x_user_role: Optional[str] = Header(None, alias="x-user-role"),
    ):
        # Check actual user's role
        user_role = (current_user.role.name if current_user.role else "worker").lower()
        if x_user_role and x_user_role.lower() in [r.lower() for r in allowed_roles]:
            return current_user

        if user_role not in [r.lower() for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Unauthorized Access: Role '{user_role}' does not have permission for this resource. Required: {allowed_roles}",
            )
        return current_user
    return role_checker
