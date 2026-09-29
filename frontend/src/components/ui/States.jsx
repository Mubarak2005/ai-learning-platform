import { Inbox, AlertTriangle, RefreshCw } from "lucide-react";

export function EmptyState({ icon: Icon = Inbox, title = "Nothing here yet", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 bg-white rounded-[var(--radius-card)] border border-dashed border-[var(--color-ink-200)]">
      <div className="w-14 h-14 rounded-2xl bg-[var(--color-ink-100)] flex items-center justify-center mb-4">
        <Icon size={24} className="text-[var(--color-ink-400)]" />
      </div>
      <p className="font-semibold text-[15px] text-[var(--color-ink-900)]">{title}</p>
      {description && (
        <p className="text-[13.5px] text-[var(--color-ink-500)] mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-200)]">
      <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent-pink-soft)] flex items-center justify-center mb-4">
        <AlertTriangle size={24} className="text-[var(--color-accent-pink)]" />
      </div>
      <p className="font-semibold text-[15px] text-[var(--color-ink-900)]">{title}</p>
      {description && (
        <p className="text-[13.5px] text-[var(--color-ink-500)] mt-1 max-w-sm">{description}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-brand-600)] text-white text-[13px] font-semibold hover:bg-[var(--color-brand-700)] transition-colors"
        >
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}

export function CardSkeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius-card)] bg-white border border-[var(--color-ink-100)] p-5 ${className}`}
    >
      <div className="h-3.5 w-1/3 bg-[var(--color-ink-100)] rounded-full mb-3" />
      <div className="h-3 w-2/3 bg-[var(--color-ink-100)] rounded-full mb-2" />
      <div className="h-2 w-full bg-[var(--color-ink-100)] rounded-full mt-4" />
    </div>
  );
}
