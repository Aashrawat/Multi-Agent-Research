import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Header from "./Header";

/** Where to send the user after signing in (set by RequireAuth). */
export interface FromState {
  from?: string;
}

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
    </div>
  );
}

/** Main app shell. Open to everyone, signed in or not. */
export function AppLayout() {
  const { loading } = useAuth();
  if (loading) return <Spinner />;
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}

/** Wrap pages that need an account (history). Guests are sent to /login. */
export function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    const state: FromState = { from: location.pathname };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}

/** Login / signup shell: signed-in users are sent on to where they were headed. */
export function PublicLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (user) {
    const from = (location.state as FromState | null)?.from;
    return <Navigate to={from ?? "/"} replace />;
  }
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-md px-4 py-12">
        <Outlet />
      </main>
    </div>
  );
}
