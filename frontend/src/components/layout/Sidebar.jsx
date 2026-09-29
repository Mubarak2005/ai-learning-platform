import { NavLink } from "react-router-dom";
import { BrainCircuit } from "lucide-react";
import { NAV_BY_ROLE } from "../../utils/navigation";
import { useAuth } from "../../hooks/useAuth";

export default function Sidebar() {
  const { roleKey } = useAuth();
  const navItems = NAV_BY_ROLE[roleKey] ?? NAV_BY_ROLE.officer;

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-[270px] shrink-0 h-screen sticky top-0 px-5 py-6 text-white"
      style={{
        background:
          "linear-gradient(165deg, var(--color-brand-900) 0%, var(--color-brand-700) 55%, var(--color-brand-600) 100%)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
          <BrainCircuit size={24} strokeWidth={2} />
        </div>
        <div>
          <p className="font-bold leading-tight text-[15px]">AI Learning</p>
          <p className="font-bold leading-tight text-[15px] -mt-0.5">Platform</p>
        </div>
      </div>
      <p className="px-2 text-[12px] text-white/60 mb-6 tracking-wide">
        Learn <span className="mx-1">•</span> Assess <span className="mx-1">•</span> Grow
      </p>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-none">
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-colors",
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              ].join(" ")
            }
          >
            <Icon size={19} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Govt footer */}
      <div className="mt-6 pt-5 border-t border-white/15 text-center">
        <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center">
          <EmblemIcon />
        </div>
        <p className="text-[13px] font-semibold">शिक्षा विभाग</p>
        <p className="text-[12px] text-white/70 leading-snug mt-0.5">
          Education Department
          <br />
          Government of India
        </p>
      </div>
    </aside>
  );
}

function EmblemIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" />
    </svg>
  );
}
