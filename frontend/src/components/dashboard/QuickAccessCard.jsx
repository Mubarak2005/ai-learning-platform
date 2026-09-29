import { ChevronRight } from "lucide-react";
import ProgressBar from "../ui/ProgressBar";

export default function QuickAccessCard({ icon: Icon, gradient, title, description, progress, progressColor, to }) {
  return (
    <a
      href={to}
      className="group flex flex-col bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] overflow-hidden hover:shadow-[var(--shadow-card-lg)] transition-shadow"
    >
      <div className="h-28 flex items-center justify-center" style={{ background: gradient }}>
        <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center">
          <Icon size={26} className="text-white" strokeWidth={2} />
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[15px] text-[var(--color-ink-900)]">{title}</h3>
          <ChevronRight
            size={18}
            className="text-[var(--color-ink-400)] shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform"
          />
        </div>
        <p className="text-[12.5px] text-[var(--color-ink-500)] mt-1.5 leading-relaxed flex-1">
          {description}
        </p>
        <div className="flex items-center gap-3 mt-4">
          <ProgressBar value={progress} color={progressColor} />
          <span className="text-[12.5px] font-semibold text-[var(--color-ink-700)] shrink-0">
            {progress}%
          </span>
        </div>
      </div>
    </a>
  );
}
