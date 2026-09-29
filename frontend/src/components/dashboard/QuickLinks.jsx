import { Link2, UserSquare2, GraduationCap, BookOpenCheck, FileDown, ChevronRight, Quote, TrendingUp } from "lucide-react";

const LINKS = [
  { icon: UserSquare2, label: "View Competency Profile", to: "/officer/competency" },
  { icon: GraduationCap, label: "Browse iGOT Courses", to: "/officer/courses" },
  { icon: BookOpenCheck, label: "NSSTA / TPAC Programs", to: "/officer/courses" },
  { icon: FileDown, label: "Download Reports", to: "/officer/analytics" },
];

export function QuickLinksCard() {
  return (
    <section className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-accent-purple-soft)] flex items-center justify-center">
          <Link2 size={17} className="text-[var(--color-accent-purple)]" />
        </div>
        <h3 className="font-bold text-[15.5px] text-[var(--color-ink-900)]">Quick Links</h3>
      </div>
      <div className="flex flex-col">
        {LINKS.map(({ icon: Icon, label, to }) => (
          <a
            key={label}
            href={to}
            className="flex items-center justify-between py-2.5 border-b last:border-b-0 border-[var(--color-ink-100)] group"
          >
            <span className="flex items-center gap-2.5 text-[13.5px] font-medium text-[var(--color-ink-700)]">
              <Icon size={16} className="text-[var(--color-ink-400)]" />
              {label}
            </span>
            <ChevronRight
              size={16}
              className="text-[var(--color-ink-400)] group-hover:translate-x-0.5 transition-transform"
            />
          </a>
        ))}
      </div>
    </section>
  );
}

export function QuoteCard() {
  return (
    <section
      className="rounded-[var(--radius-card)] p-6 text-white relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--color-brand-700), var(--color-accent-blue))" }}
    >
      <Quote size={22} className="mb-3 text-white/80" />
      <p className="text-[14px] font-medium leading-relaxed italic pr-8">
        "Small steps in learning every day lead to big results tomorrow."
      </p>
      <TrendingUp size={40} className="absolute bottom-4 right-4 text-white/25" />
    </section>
  );
}
