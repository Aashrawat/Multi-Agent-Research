"""Per-user research history, stored in MongoDB."""

import re
from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from auth_routes import current_user
from db import researches

router = APIRouter(prefix="/api/history", tags=["history"])

_SCORE_RE = re.compile(r"Score:\s*(\d+(?:\.\d+)?)\s*/\s*10", re.IGNORECASE)


def save_research(user_id: ObjectId, topic: str, result: dict[str, str]) -> str:
    """Persist a finished research run. Returns the new history id."""
    feedback = result.get("feedback", "")
    match = _SCORE_RE.search(feedback)
    doc = {
        "user_id": user_id,
        "topic": topic,
        "search_results": result.get("search_results", ""),
        "scraped_content": result.get("scraped_content", ""),
        "report": result.get("report", ""),
        "feedback": feedback,
        "score": float(match.group(1)) if match else None,
        "created_at": datetime.now(timezone.utc),
    }
    return str(researches().insert_one(doc).inserted_id)


def _iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def _object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=404, detail="Not found.")
    return ObjectId(value)


@router.get("")
def list_history(
    limit: int = Query(30, ge=1, le=100),
    skip: int = Query(0, ge=0),
    user: dict[str, Any] = Depends(current_user),
) -> dict[str, Any]:
    query = {"user_id": user["_id"]}
    cursor = (
        researches()
        .find(query, {"topic": 1, "score": 1, "created_at": 1})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    items = [
        {
            "id": str(d["_id"]),
            "topic": d["topic"],
            "score": d.get("score"),
            "created_at": _iso(d["created_at"]),
        }
        for d in cursor
    ]
    return {"items": items, "total": researches().count_documents(query)}


@router.get("/{item_id}")
def get_history_item(item_id: str, user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    doc: Optional[dict[str, Any]] = researches().find_one({"_id": _object_id(item_id), "user_id": user["_id"]})
    if doc is None:
        raise HTTPException(status_code=404, detail="Not found.")
    return {
        "id": str(doc["_id"]),
        "topic": doc["topic"],
        "score": doc.get("score"),
        "created_at": _iso(doc["created_at"]),
        "result": {
            "search_results": doc.get("search_results", ""),
            "scraped_content": doc.get("scraped_content", ""),
            "report": doc.get("report", ""),
            "feedback": doc.get("feedback", ""),
        },
    }


@router.delete("/{item_id}")
def delete_history_item(item_id: str, user: dict[str, Any] = Depends(current_user)) -> dict[str, bool]:
    res = researches().delete_one({"_id": _object_id(item_id), "user_id": user["_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found.")
    return {"ok": True}
