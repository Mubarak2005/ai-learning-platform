export default function FormField({ label, error, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[12.5px] font-semibold text-[var(--color-ink-700)] mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[12px] text-[var(--color-accent-pink)] mt-1.5">{error}</p>}
    </div>
  );
}

export const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-[var(--color-ink-200)] text-[13.5px] text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-400)] outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/30 focus:border-[var(--color-brand-500)] transition-colors bg-white";
