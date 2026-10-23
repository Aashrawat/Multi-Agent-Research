"""
Thin HTTP wrapper around the existing research pipeline.

It does NOT modify agents.py / tools.py / pipeline.py - it simply imports
`run_research_pipeline` and exposes it to the React frontend.

Run with:
    uv run uvicorn api:app --port 8000
"""

import re
import sys
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from pymongo.errors import PyMongoError

import db
from auth_routes import optional_user, router as auth_router
from config import FRONTEND_URL
from history_routes import router as history_router, save_research
from pipeline import run_research_pipeline

# ---------------------------------------------------------------------------
# Progress tracking
# ---------------------------------------------------------------------------
# pipeline.py prints "step N - ..." as each stage starts. We tee stdout so we
# can tell the frontend which step a job is on, without touching pipeline.py.

_STEP_RE = re.compile(r"step\s+(\d)\s+-")
_local = threading.local()


class _StdoutTee:
    def __init__(self, wrapped):
        self._wrapped = wrapped

    def write(self, text):
        job = getattr(_local, "job", None)
        if job is not None and isinstance(text, str):
            match = _STEP_RE.search(text)
            if match:
                job["step"] = int(match.group(1))
        return self._wrapped.write(text)

    def __getattr__(self, name):
        return getattr(self._wrapped, name)


sys.stdout = _StdoutTee(sys.stdout)

# ---------------------------------------------------------------------------
# Job store
# ---------------------------------------------------------------------------

_jobs: dict[str, dict[str, Any]] = {}
_executor = ThreadPoolExecutor(max_workers=2)


def _run_job(job_id: str) -> None:
    job = _jobs[job_id]
    _local.job = job
    try:
        state = run_research_pipeline(job["topic"])
        job["result"] = {
            "search_results": state.get("search_results", ""),
            "scraped_content": state.get("scraped_content", ""),
            "report": state.get("report", ""),
            "feedback": state.get("feedback", ""),
        }
        job["step"] = 5
        job["status"] = "done"
        # Signed-in users get the run saved to their history; guests don't.
        # A database problem must not lose the report.
        if job["user_id"] is not None:
            try:
                save_research(job["user_id"], job["topic"], job["result"])
                job["saved"] = True
            except Exception:
                job["saved"] = False
    except Exception as exc:  # surface any pipeline failure to the UI
        job["status"] = "error"
        job["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        job["finished_at"] = time.time()
        _local.job = None


# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------

app = FastAPI(title="Multi-Agent Research API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list({"http://localhost:5173", "http://127.0.0.1:5173", FRONTEND_URL}),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(history_router)


@app.exception_handler(PyMongoError)
async def mongo_error_handler(_: Request, exc: PyMongoError) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={"detail": "The database is unavailable. Check MONGODB_URI and that MongoDB is reachable."},
    )


class ResearchRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=500)


class JobResponse(BaseModel):
    id: str
    topic: str
    status: str  # running | done | error
    step: int  # 0 = starting, 1-4 = pipeline step, 5 = finished
    saved: Optional[bool] = None  # True once stored in the user's history
    result: Optional[dict[str, str]] = None
    error: Optional[str] = None


def _to_response(job: dict[str, Any]) -> JobResponse:
    return JobResponse(
        id=job["id"],
        topic=job["topic"],
        status=job["status"],
        step=job["step"],
        saved=job.get("saved"),
        result=job.get("result"),
        error=job.get("error"),
    )


@app.get("/api/health")
def health() -> dict[str, object]:
    return {"status": "ok", "mongodb": db.ping()}


def _prune_jobs(max_age_seconds: int = 3600) -> None:
    """Drop finished jobs from memory after an hour (guest runs aren't stored anywhere else)."""
    cutoff = time.time() - max_age_seconds
    for job_id in [j for j, job in _jobs.items() if job.get("finished_at", float("inf")) < cutoff]:
        _jobs.pop(job_id, None)


@app.post("/api/research", response_model=JobResponse)
def start_research(
    body: ResearchRequest, user: Optional[dict[str, Any]] = Depends(optional_user)
) -> JobResponse:
    topic = body.topic.strip()
    if not topic:
        raise HTTPException(status_code=422, detail="Topic must not be empty.")

    _prune_jobs()
    job_id = uuid.uuid4().hex
    _jobs[job_id] = {
        "id": job_id,
        "user_id": user["_id"] if user else None,  # None = guest run, not saved
        "topic": topic,
        "status": "running",
        "step": 0,
        "created_at": time.time(),
    }
    _executor.submit(_run_job, job_id)
    return _to_response(_jobs[job_id])


@app.get("/api/research/{job_id}", response_model=JobResponse)
def get_research(
    job_id: str, user: Optional[dict[str, Any]] = Depends(optional_user)
) -> JobResponse:
    job = _jobs.get(job_id)
    # A signed-in user's jobs are private to them. Guest jobs are reachable only
    # by guests, and only with the (unguessable) job id.
    owner = user["_id"] if user else None
    if job is None or job["user_id"] != owner:
        raise HTTPException(status_code=404, detail="Job not found.")
    return _to_response(job)
