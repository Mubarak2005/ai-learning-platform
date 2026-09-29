export default function RadialProgress({
  value,
  size = 44,
  strokeWidth = 5,
  color = "var(--color-brand-600)",
  track = "var(--color-ink-100)",
  label,
  labelSize = 13,
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <span
        className="absolute font-bold text-[var(--color-ink-900)]"
        style={{ fontSize: labelSize }}
      >
        {label ?? `${clamped}%`}
      </span>
    </div>
  );
}
