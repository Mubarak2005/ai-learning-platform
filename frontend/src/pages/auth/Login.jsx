import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, Loader2 } from "lucide-react";
import AuthShell from "./AuthShell";
import FormField, { inputClass } from "../../components/ui/FormField";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../services/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const from = location.state?.from?.pathname || "/officer";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const me = await login({ email, password });
      const roleHome = me.role === "trainer" ? "/trainer" : me.role === "admin" ? "/admin" : "/officer";
      navigate(from.startsWith("/officer") || from === "/" ? roleHome : from, { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your learning journey.">
      <form onSubmit={handleSubmit}>
        <FormField label="Email">
          <input
            type="email"
            required
            className={inputClass}
            placeholder="you@stats.gov.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </FormField>
        <FormField label="Password">
          <input
            type="password"
            required
            className={inputClass}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </FormField>

        <div className="flex justify-end -mt-2 mb-4">
          <Link to="/forgot-password" className="text-[12.5px] font-semibold text-[var(--color-brand-600)]">
            Forgot password?
          </Link>
        </div>

        {formError && (
          <p className="text-[13px] text-[var(--color-accent-pink)] bg-[var(--color-accent-pink-soft)] rounded-xl px-3.5 py-2.5 mb-4">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-brand-600)] text-white font-semibold text-[14px] hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-60"
        >
          {submitting ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
          Sign In
        </button>
      </form>

      <p className="text-[13px] text-[var(--color-ink-500)] text-center mt-6">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-[var(--color-brand-600)]">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
