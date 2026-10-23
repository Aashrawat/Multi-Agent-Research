"""Central settings, read from environment variables / .env."""

import os
import secrets

from dotenv import load_dotenv

load_dotenv()

# --- MongoDB ---------------------------------------------------------------
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "research_app")

# --- URLs ------------------------------------------------------------------
# The browser talks to the Vite dev server (port 5173), which proxies /api to
# this backend.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

# --- Accounts --------------------------------------------------------------
# Only these email domains may sign up / sign in (comma-separated in .env to change).
ALLOWED_EMAIL_DOMAINS = [
    d.strip().lower()
    for d in os.getenv("ALLOWED_EMAIL_DOMAINS", "gmail.com,yahoo.com,outlook.com").split(",")
    if d.strip()
]

# --- Sessions --------------------------------------------------------------
JWT_SECRET = os.getenv("JWT_SECRET", "")
if not JWT_SECRET:
    # Random per-process secret: works, but everyone is logged out on restart.
    JWT_SECRET = secrets.token_urlsafe(48)
    print("WARNING: JWT_SECRET is not set in .env - using a temporary secret. "
          "Logins will not survive a server restart.")

SESSION_DAYS = int(os.getenv("SESSION_DAYS", "7"))
COOKIE_SECURE = FRONTEND_URL.startswith("https://")
SESSION_COOKIE = "session"
