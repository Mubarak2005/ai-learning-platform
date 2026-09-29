import { UploadCloud, FileQuestion, ClipboardCheck, BarChart3 } from "lucide-react";
import Header from "../../components/layout/Header";
import { useAuth } from "../../hooks/useAuth";

const STATS = [
  { icon: UploadCloud, label: "Materials Uploaded", value: 18, color: "var(--color-accent-blue)" },
  { icon: FileQuestion, label: "Questions Generated", value: 246, color: "var(--color-accent-purple)" },
  { icon: ClipboardCheck, label: "Assessments Published", value: 9, color: "var(--color-accent-pink)" },
  { icon: BarChart3, label: "Avg. Learner Score", value: "74%", color: "var(--color-accent-teal)" },
];

export default function TrainerDashboard() {
  const { user } = useAuth();
  return (
    <div>
      <Header
        title="Trainer Dashboard"
        subtitle={`Welcome back, ${user.name}!`}
        description="Manage course content, generate assessments and track learner performance."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STATS.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${color}1A` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="text-[22px] font-extrabold text-[var(--color-ink-900)]">{value}</p>
            <p className="text-[12.5px] text-[var(--color-ink-500)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-[13px] text-[var(--color-ink-400)] mt-6">
        Content upload, AI question generation and learner analytics are built out in Phase 8–9.
      </p>
    </div>
  );
}
