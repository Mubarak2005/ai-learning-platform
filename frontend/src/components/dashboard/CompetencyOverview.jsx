import { Target, CalendarCheck2, ClipboardList, Sparkles } from "lucide-react";
import RadialProgress from "../ui/RadialProgress";
import ProgressBar from "../ui/ProgressBar";

const STAT_PILLS = [
  { icon: CalendarCheck2, value: 5, label: "Courses Completed", color: "var(--color-accent-blue)" },
  { icon: ClipboardList, value: 12, label: "Assessments Taken", color: "var(--color-accent-purple)" },
  { icon: Sparkles, value: 3, label: "Skills Improved", color: "var(--color-accent-teal)" },
];

const TOP_COMPETENCIES = [
  { label: "Data Analysis", value: 85, color: "var(--color-accent-blue)" },
  { label: "Statistical Computing", value: 72, color: "var(--color-accent-purple)" },
  { label: "Problem Solving", value: 58, color: "var(--color-accent-pink)" },
  { label: "Communication", value: 46, color: "var(--color-accent-teal)" },
];

export default function CompetencyOverview({ score = 68 }) {
  return (
    <section className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-accent-blue-soft)] flex items-center justify-center">
          <Target size={17} className="text-[var(--color-accent-blue)]" />
        </div>
        <h3 className="font-bold text-[15.5px] text-[var(--color-ink-900)]">My Competency Overview</h3>
      </div>

      <div className="flex items-center gap-4 bg-[var(--color-surface)] rounded-2xl p-4 mb-5">
        <RadialProgress value={score} size={74} strokeWidth={7} color="var(--color-brand-600)" labelSize={17} />
        <div>
          <p className="font-bold text-[14.5px] text-[var(--color-ink-900)] leading-tight">
            Overall Competency
            <br />
            Score
          </p>
          <p className="text-[12px] text-[var(--color-ink-500)] mt-1">Based on latest assessment</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {STAT_PILLS.map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="rounded-xl border border-[var(--color-ink-100)] p-2.5 text-center">
            <div
              className="w-7 h-7 mx-auto rounded-lg flex items-center justify-center mb-1.5"
              style={{ backgroundColor: `${color}1A` }}
            >
              <Icon size={14} style={{ color }} />
            </div>
            <p className="font-bold text-[15px] text-[var(--color-ink-900)] leading-none">{value}</p>
            <p className="text-[10px] text-[var(--color-ink-500)] mt-1 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <h4 className="font-bold text-[13.5px] text-[var(--color-ink-900)] mb-3">Top Competencies</h4>
      <div className="flex flex-col gap-3.5">
        {TOP_COMPETENCIES.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12.5px] font-medium text-[var(--color-ink-700)]">{item.label}</span>
              <span className="text-[12px] font-semibold text-[var(--color-ink-500)]">{item.value}%</span>
            </div>
            <ProgressBar value={item.value} color={item.color} height={6} />
          </div>
        ))}
      </div>
    </section>
  );
}
