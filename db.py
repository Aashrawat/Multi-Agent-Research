"""MongoDB connection and collections.

Collections
-----------
users:       { _id, email, name, password_hash, created_at, last_login }
researches:  { _id, user_id, topic, search_results, scraped_content, report,
               feedback, score, created_at }
"""

import threading

from pymongo import MongoClient
from pymongo.collection import Collection

from config import MONGODB_DB, MONGODB_URI

# The client connects lazily, so importing this module never fails even if
# MongoDB is down. Errors surface (as 503s) when a query is actually made.
_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=4000)
_db = _client[MONGODB_DB]

_indexes_ready = False
_lock = threading.Lock()


def ensure_indexes() -> None:
    global _indexes_ready
    if _indexes_ready:
        return
    with _lock:
        if _indexes_ready:
            return
        _db.users.create_index("email", unique=True, sparse=True)
        _db.researches.create_index([("user_id", 1), ("created_at", -1)])
        _indexes_ready = True


def users() -> Collection:
    ensure_indexes()
    return _db.users


def researches() -> Collection:
    ensure_indexes()
    return _db.researches


def ping() -> bool:
    try:
        _client.admin.command("ping")
        return True
    except Exception:
        return False
