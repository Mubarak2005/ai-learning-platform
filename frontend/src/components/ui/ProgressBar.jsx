export default function ProgressBar({ value, color = "var(--color-brand-600)", track = "var(--color-ink-100)", height = 7 }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height, backgroundColor: track }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}
