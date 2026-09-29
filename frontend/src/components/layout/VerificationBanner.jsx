import { useNavigate } from "react-router-dom";
import { MailWarning } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function VerificationBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.isEmailVerified) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-[var(--color-accent-amber-soft)] border border-[var(--color-accent-amber)]/25 rounded-2xl px-4 py-3 mb-6">
      <div className="flex items-center gap-2.5 text-[13px] text-[var(--color-ink-700)]">
        <MailWarning size={16} className="text-[var(--color-accent-amber)] shrink-0" />
        Your email isn't verified yet. Some features may be limited.
      </div>
      <button
        onClick={() => navigate("/verify-email")}
        className="text-[12.5px] font-semibold text-[var(--color-brand-600)] shrink-0"
      >
        Verify now
      </button>
    </div>
  );
}
