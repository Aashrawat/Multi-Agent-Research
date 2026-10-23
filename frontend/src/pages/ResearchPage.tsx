import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getResearch, startResearch } from "../api";
import { useAuth } from "../auth/AuthContext";
import type { Job } from "../types";
import TopicForm from "../components/TopicForm";
import StepTracker from "../components/StepTracker";
import ResultTabs from "../components/ResultTabs";

const POLL_MS = 1500;

export default function ResearchPage() {
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const timer = useRef<number | null>(null);

  const stopPolling = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const poll = useCallback((id: string) => {
    timer.current = window.setTimeout(async () => {
      try {
        const next = await getResearch(id);
        setJob(next);
        if (next.status === "running") poll(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lost connection to the API.");
      }
    }, POLL_MS);
  }, []);

  useEffect(() => stopPolling, []);

  const run = async (topic: string) => {
    stopPolling();
    setError(null);
    setJob(null);
    setStarting(true);
    try {
      const created = await startResearch(topic);
      setJob(created);
      poll(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start research.");
    } finally {
      setStarting(false);
    }
  };

  const running = starting || job?.status === "running";
  const failed = job?.status === "error";

  return (
    <div>
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {user ? `Hi ${user.name.split(" ")[0]}, what` : "What"} should we <span className="text-indigo-400">research</span>?
        </h1>
        <p className="mt-3 text-slate-400">
          A search agent, reader agent, writer and critic collaborate to produce a researched report.
        </p>
      </div>

      <TopicForm disabled={running} onSubmit={run} />

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
      )}

      {job && (
        <div className="mt-10 space-y-8">
          <div>
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 className="truncate text-sm font-medium text-slate-300">
                Topic: <span className="text-slate-100">{job.topic}</span>
              </h2>
              {running && <span className="shrink-0 text-xs text-slate-500">This can take a minute…</span>}
              {job.status === "done" && user && job.saved === true && (
                <Link to="/history" className="shrink-0 text-xs text-emerald-400 hover:underline">
                  ✓ Saved to your history
                </Link>
              )}
              {job.status === "done" && user && job.saved === false && (
                <span className="shrink-0 text-xs text-amber-400">Couldn't save to history (database unavailable)</span>
              )}
            </div>
            <StepTracker step={job.step} failed={failed} />
          </div>

          {failed && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              <p className="font-medium">The pipeline failed</p>
              <p className="mt-1 break-words font-mono text-xs">{job.error}</p>
            </div>
          )}

          {job.status === "done" && !user && (
            <div className="flex flex-col gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-slate-300">
                This research isn't saved. Sign in to keep a history of your research.
              </p>
              <div className="flex shrink-0 gap-2">
                <Link
                  to="/login"
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-slate-200 transition hover:bg-slate-800"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white transition hover:bg-indigo-500"
                >
                  Sign up
                </Link>
              </div>
            </div>
          )}

          {job.status === "done" && job.result && <ResultTabs result={job.result} />}
        </div>
      )}
    </div>
  );
}
