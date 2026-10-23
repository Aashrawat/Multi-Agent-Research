"""Password rules, password hashing and signed session tokens."""

import secrets
import time
from typing import Any, Optional

import bcrypt
import jwt

from config import ALLOWED_EMAIL_DOMAINS, JWT_SECRET, SESSION_DAYS

_ALGO = "HS256"
MAX_PASSWORD_BYTES = 72  # bcrypt limit


MIN_PASSWORD_LENGTH = 12


def password_ok_length(password: str) -> bool:
    return len(password.encode("utf-8")) <= MAX_PASSWORD_BYTES


def email_problem(email: str) -> Optional[str]:
    """Only addresses at the allowed domains (default: gmail.com, yahoo.com,
    outlook.com) are accepted. Returns an error message, or None if it passes."""
    local, at, domain = email.strip().rpartition("@")
    if not local or not at or domain.lower() not in ALLOWED_EMAIL_DOMAINS:
        allowed = ", ".join(f"@{d}" for d in ALLOWED_EMAIL_DOMAINS)
        return f"Email must end with one of: {allowed}."
    return None


def password_problem(password: str) -> Optional[str]:
    """Sign-up password policy. Returns an error message, or None if it passes:
    at least 12 characters, 1 uppercase letter and 1 symbol."""
    if not password_ok_length(password):
        return "Password is too long (max 72 bytes)."
    missing = []
    if len(password) < MIN_PASSWORD_LENGTH:
        missing.append(f"be at least {MIN_PASSWORD_LENGTH} characters")
    if not any(c.isupper() for c in password):
        missing.append("contain at least 1 uppercase letter")
    # a "symbol" is anything that is not a letter, digit or whitespace
    if not any(not c.isalnum() and not c.isspace() for c in password):
        missing.append("contain at least 1 symbol (e.g. ! @ # $ %)")
    if missing:
        return "Password must " + ", ".join(missing) + "."
    return None


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    if not password_ok_length(password):
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


_DUMMY_HASH = hash_password(secrets.token_urlsafe(16))


def burn_password_check(password: str) -> None:
    """Spend the same time as a real check, so login timing doesn't reveal
    whether an email is registered."""
    verify_password(password, _DUMMY_HASH)


def _encode(payload: dict[str, Any], ttl_seconds: int, typ: str) -> str:
    now = int(time.time())
    return jwt.encode(
        {**payload, "typ": typ, "iat": now, "exp": now + ttl_seconds},
        JWT_SECRET,
        algorithm=_ALGO,
    )


def _decode(token: str, typ: str) -> Optional[dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[_ALGO])
    except jwt.PyJWTError:
        return None
    return payload if payload.get("typ") == typ else None


def create_session_token(user_id: str) -> str:
    return _encode({"sub": user_id}, SESSION_DAYS * 86400, "session")


def read_session_token(token: str) -> Optional[str]:
    payload = _decode(token, "session")
    return payload.get("sub") if payload else None
