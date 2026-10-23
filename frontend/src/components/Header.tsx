import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm transition ${
    isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
  }`;

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-4 text-sm font-semibold tracking-tight">
          Multi-Agent <span className="text-indigo-400">Research</span>
        </Link>

        <nav className="flex gap-1">
          <NavLink to="/" end className={linkClass}>
            Research
          </NavLink>
          {/* Visible to everyone; guests are asked to sign in when they open it. */}
          <NavLink to="/history" className={linkClass}>
            History
          </NavLink>
        </nav>

        {user ? (
          <div className="ml-auto flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold">
              {(user.name || "?").charAt(0).toUpperCase()}
            </span>
            <span className="hidden text-sm text-slate-300 sm:block">{user.name}</span>
            <button
              onClick={signOut}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-900"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
