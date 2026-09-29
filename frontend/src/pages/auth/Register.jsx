import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Loader2 } from "lucide-react";
import AuthShell from "./AuthShell";
import FormField, { inputClass } from "../../components/ui/FormField";
import { useAuth } from "../../hooks/useAuth";
import { fetchDepartments } from "../../services/profileService";
import { ApiError } from "../../services/api";

const ROLE_OPTIONS = [
  { value: "statistical_officer", label: "Statistical Officer" },
  { value: "trainer", label: "Trainer" },
  { value: "admin", label: "Administrator" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("statistical_officer");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await register({ fullName, email, password, role, departmentId: departmentId || null });
      navigate("/verify-email", { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join the capacity-building platform for India's Official Statistical System.">
      <form onSubmit={handleSubmit}>
        <FormField label="Full name">
          <input
            required
            className={inputClass}
            placeholder="Mubarak Ansari"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
        </FormField>
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
        <FormField label="Password" error={password && password.length < 8 ? "At least 8 characters" : null}>
          <input
            type="password"
            required
            minLength={8}
            className={inputClass}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </FormField>
        <FormField label="Role">
          <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Department (optional)">
          <select className={inputClass} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </FormField>

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
          {submitting ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
          Create Account
        </button>
      </form>

      <p className="text-[13px] text-[var(--color-ink-500)] text-center mt-6">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-[var(--color-brand-600)]">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
