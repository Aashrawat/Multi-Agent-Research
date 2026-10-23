import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, deleteHistoryItem, listHistory } from "../api";
import { useAuth } from "../auth/AuthContext";
import type { HistoryItem } from "../types";

const PAGE_SIZE = 20;

const scoreColor = (score: number) =>
  score >= 8 ? "text-emerald-400 border-emerald-600/40" : score >= 5 ? "text-amber-400 border-amber-600/40" : "text-red-400 border-red-600/40";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function HistoryPage() {
  const { logout } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (skip: number) => {
    setError(null);
    try {
      const page = await listHistory(PAGE_SIZE, skip);
      setItems((prev) => (skip === 0 ? page.items : [...prev, ...page.items]));
      setTotal(page.total);
    } catch (e) {
      // Session expired: sign out, and RequireAuth sends the user to /login.
      if (e instanceof ApiError && e.status === 401) {
        await logout();
        return;
      }
      setError(e instanceof Error ? e.message : "Could not load history.");
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    load(0);
  }, [load]);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this research from your history?")) return;
    try {
      await deleteHistoryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <h1 className="text-2xl font-bold">Your research history</h1>
        {!loading && <span className="text-sm text-slate-500">{total} saved</span>}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : items.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center">
          <p className="text-slate-400">No research yet.</p>
          <Link to="/" className="mt-3 inline-block text-indigo-400 hover:underline">
            Run your first one →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700"
            >
              <Link to={`/history/${item.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-100">{item.topic}</p>
                <p className="mt-0.5 text-xs text-slate-500">{formatDate(item.created_at)}</p>
              </Link>
              {item.score !== null && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${scoreColor(item.score)}`}>
                  {item.score}/10
                </span>
              )}
              <button
                onClick={() => remove(item.id)}
                className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length < total && (
        <button
          onClick={() => load(items.length)}
          className="mt-4 w-full rounded-xl border border-slate-800 py-2 text-sm text-slate-300 transition hover:bg-slate-900"
        >
          Load more
        </button>
      )}
    </div>
  );
}
