import RadialProgress from "../ui/RadialProgress";

export default function HomeworkCard({ icon: Icon, iconBg, title, deadline, progress, progressColor }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          <Icon size={20} className="text-white" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[13.5px] text-[var(--color-ink-900)] truncate">{title}</p>
          <p className="text-[12px] text-[var(--color-ink-500)] mt-0.5">Deadline: {deadline}</p>
        </div>
      </div>
      <RadialProgress value={progress} size={48} strokeWidth={4.5} color={progressColor} labelSize={12} />
    </div>
  );
}
