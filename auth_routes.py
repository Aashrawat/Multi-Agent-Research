"""Authentication endpoints: email + password sign up / sign in."""

from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError

import config
import security
from db import users

router = APIRouter(prefix="/api/auth", tags=["auth"])


def public_user(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "email": doc.get("email"),
    }


def _set_session(response: Response, user_id: str) -> None:
    response.set_cookie(
        config.SESSION_COOKIE,
        security.create_session_token(user_id),
        max_age=config.SESSION_DAYS * 86400,
        httponly=True,
        samesite="lax",
        secure=config.COOKIE_SECURE,
        path="/",
    )


def optional_user(request: Request) -> Optional[dict[str, Any]]:
    """FastAPI dependency: the logged-in user's document, or None for guests.
    A missing, invalid or expired cookie simply means "guest"."""
    token = request.cookies.get(config.SESSION_COOKIE)
    user_id = security.read_session_token(token) if token else None
    if not user_id or not ObjectId.is_valid(user_id):
        return None
    return users().find_one({"_id": ObjectId(user_id)})


def current_user(user: Optional[dict[str, Any]] = Depends(optional_user)) -> dict[str, Any]:
    """FastAPI dependency for protected routes: the logged-in user, or 401."""
    if user is None:
        raise HTTPException(status_code=401, detail="Not signed in.")
    return user


class SignupBody(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


@router.post("/signup")
def signup(body: SignupBody, response: Response) -> dict[str, Any]:
    problem = security.email_problem(body.email) or security.password_problem(body.password)
    if problem:
        raise HTTPException(status_code=422, detail=problem)

    now = datetime.now(timezone.utc)
    doc = {
        "name": body.name.strip(),
        "email": body.email.lower(),
        "password_hash": security.hash_password(body.password),
        "created_at": now,
        "last_login": now,
    }
    try:
        result = users().insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    doc["_id"] = result.inserted_id
    _set_session(response, str(result.inserted_id))
    return public_user(doc)


@router.post("/login")
def login(body: LoginBody, response: Response) -> dict[str, Any]:
    # The same email / password rules apply at sign-in: an address or password
    # that doesn't meet the required format cannot sign in.
    problem = security.email_problem(body.email) or security.password_problem(body.password)
    if problem:
        raise HTTPException(status_code=422, detail=problem)

    doc = users().find_one({"email": body.email.lower()})
    if doc is None or not doc.get("password_hash"):
        security.burn_password_check(body.password)
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not security.verify_password(body.password, doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    users().update_one({"_id": doc["_id"]}, {"$set": {"last_login": datetime.now(timezone.utc)}})
    _set_session(response, str(doc["_id"]))
    return public_user(doc)


@router.post("/logout")
def logout(response: Response) -> dict[str, bool]:
    response.delete_cookie(config.SESSION_COOKIE, path="/")
    return {"ok": True}


@router.get("/me")
def me(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    return public_user(user)
