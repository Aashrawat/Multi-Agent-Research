import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, getHistoryItem } from "../api";
import { useAuth } from "../auth/AuthContext";
import type { HistoryDetail } from "../types";
import ResultTabs from "../components/ResultTabs";
import { formatDate } from "./HistoryPage";

export default function HistoryDetailPage() {
  const { id = "" } = useParams();
  const { logout } = useAuth();
  const [item, setItem] = useState<HistoryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHistoryItem(id)
      .then((d) => !cancelled && setItem(d))
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) logout(); // session expired -> /login
        else setError(e instanceof Error ? e.message : "Could not load this research.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, logout]);

  return (
    <div>
      <Link to="/history" className="text-sm text-slate-400 hover:text-slate-200">
        ← Back to history
      </Link>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
      )}

      {!item && !error && <p className="mt-6 text-slate-400">Loading…</p>}

      {item && (
        <div className="mt-4 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{item.topic}</h1>
            <p className="mt-1 text-sm text-slate-500">{formatDate(item.created_at)}</p>
          </div>
          <ResultTabs result={item.result} />
        </div>
      )}
    </div>
  );
}
