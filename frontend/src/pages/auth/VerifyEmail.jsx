import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MailCheck, Loader2, RotateCw } from "lucide-react";
import AuthShell from "./AuthShell";
import FormField, { inputClass } from "../../components/ui/FormField";
import { useAuth } from "../../hooks/useAuth";
import { sendEmailOtp, verifyEmailOtp } from "../../services/authService";
import { ApiError } from "../../services/api";

export default function VerifyEmail() {
  const { user, refreshUser, roleKey } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState("A verification code was sent to your email when you registered.");

  useEffect(() => {
    if (user?.isEmailVerified) {
      const roleHome = roleKey === "trainer" ? "/trainer" : roleKey === "admin" ? "/admin" : "/officer";
      navigate(roleHome, { replace: true });
    }
  }, [user, roleKey, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifyEmailOtp(code);
      await refreshUser();
      const roleHome = roleKey === "trainer" ? "/trainer" : roleKey === "admin" ? "/admin" : "/officer";
      navigate(roleHome, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      await sendEmailOtp();
      setInfo("A new verification code has been sent.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${user?.email || "your email"}.`}
    >
      <div className="flex items-center gap-2.5 mb-5 text-[13px] text-[var(--color-ink-500)] bg-[var(--color-surface)] rounded-xl px-3.5 py-3">
        <MailCheck size={16} className="text-[var(--color-brand-600)] shrink-0" />
        {info}
      </div>

      <form onSubmit={handleVerify}>
        <FormField label="Verification code">
          <input
            required
            inputMode="numeric"
            maxLength={6}
            className={`${inputClass} tracking-[0.3em] text-center text-[18px] font-semibold`}
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </FormField>

        {error && (
          <p className="text-[13px] text-[var(--color-accent-pink)] bg-[var(--color-accent-pink-soft)] rounded-xl px-3.5 py-2.5 mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || code.length < 4}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-brand-600)] text-white font-semibold text-[14px] hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-60"
        >
          {submitting ? <Loader2 size={17} className="animate-spin" /> : <MailCheck size={17} />}
          Verify Email
        </button>
      </form>

      <button
        onClick={handleResend}
        disabled={resending}
        className="w-full flex items-center justify-center gap-2 mt-4 py-2.5 rounded-xl text-[13px] font-semibold text-[var(--color-brand-600)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-60"
      >
        {resending ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
        Resend code
      </button>
    </AuthShell>
  );
}
