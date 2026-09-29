import { BrainCircuit } from "lucide-react";

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ background: "linear-gradient(135deg, var(--color-brand-700), var(--color-accent-blue))" }}
          >
            <BrainCircuit size={22} />
          </div>
          <div>
            <p className="font-bold leading-tight text-[15px] text-[var(--color-ink-900)]">AI Learning Platform</p>
            <p className="text-[11.5px] text-[var(--color-ink-500)] -mt-0.5">Official Statistical System</p>
          </div>
        </div>

        <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card-lg)] p-8">
          <h1 className="text-[22px] font-extrabold text-[var(--color-ink-900)]">{title}</h1>
          {subtitle && <p className="text-[13.5px] text-[var(--color-ink-500)] mt-1.5">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
