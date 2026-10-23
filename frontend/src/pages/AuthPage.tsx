import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { FromState } from "../components/Layout";
import { ALLOWED_EMAIL_HINT, emailDomainIsAllowed } from "../emailRules";
import { checkPassword, passwordIsValid } from "../passwordRules";

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60";

export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as FromState | null)?.from;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checks = checkPassword(password);
  const emailTyped = email.trim().length > 0;
  const emailOk = emailDomainIsAllowed(email.trim());
  // The same email + password rules apply to sign up AND sign in.
  const canSubmit = !busy && emailOk && passwordIsValid(password);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    try {
      if (isSignup) await signup(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
      // PublicLayout redirects once the user is set; this is just a fallback.
      navigate((location.state as FromState | null)?.from ?? "/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
      <h1 className="text-2xl font-bold">{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-1 text-sm text-slate-400">
        {from?.startsWith("/history")
          ? "Sign in to view your research history."
          : isSignup
            ? "Sign up to save your research and view your history."
            : "Sign in to see your research history."}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {isSignup && (
          <input
            className={inputClass}
            placeholder="Full name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            required
            maxLength={80}
          />
        )}
        <div>
          <input
            className={inputClass}
            type="email"
            placeholder="Email (e.g. name@gmail.com)"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            required
          />
          <p className={`mt-1.5 text-xs ${emailTyped && !emailOk ? "text-red-400" : "text-slate-500"}`}>
            {emailTyped && emailOk ? "✓ " : ""}Allowed: {ALLOWED_EMAIL_HINT}
          </p>
        </div>

        <div className="relative">
          <input
            className={`${inputClass} pr-16`}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {(isSignup || password.length > 0) && (
          <ul className="space-y-1 text-xs">
            {checks.map((c) => (
              <li key={c.label} className={c.ok ? "text-emerald-400" : "text-slate-500"}>
                {c.ok ? "✓" : "○"} {c.label}
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Please wait…" : isSignup ? "Sign up" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        {isSignup ? "Already have an account?" : "New here?"}{" "}
        <Link
          to={isSignup ? "/login" : "/signup"}
          state={location.state}
          className="text-indigo-400 hover:underline"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
