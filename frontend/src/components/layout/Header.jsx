import { useState } from "react";
import { Search, Bell, ChevronDown, LogOut, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ROLE_LABELS = {
  officer: "Statistical Officer",
  trainer: "Trainer",
  admin: "Administrator",
};

export default function Header({ title, subtitle, description }) {
  const { user, roleKey, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const displayName = user?.name || "Guest";
  const displayRole = ROLE_LABELS[roleKey] || user?.role || "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-7">
      <div>
        <h1 className="text-[30px] font-extrabold text-[var(--color-ink-900)] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[15px] font-semibold text-[var(--color-ink-700)] mt-1">{subtitle}</p>
        )}
        {description && (
          <p className="text-[13.5px] text-[var(--color-ink-500)] mt-1 max-w-md">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="relative hidden md:block">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ink-400)]"
          />
          <input
            type="text"
            placeholder="Search courses, topics, or skills..."
            className="w-72 pl-11 pr-4 py-2.5 rounded-full bg-white border border-[var(--color-ink-200)] text-[13.5px] text-[var(--color-ink-700)] placeholder:text-[var(--color-ink-400)] outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/30"
          />
        </label>

        <button
          type="button"
          aria-label="Notifications"
          className="relative w-11 h-11 rounded-full bg-white border border-[var(--color-ink-200)] flex items-center justify-center hover:bg-[var(--color-ink-100)] transition-colors"
        >
          <Bell size={18} className="text-[var(--color-ink-700)]" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[var(--color-accent-pink)]" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full bg-white border border-[var(--color-ink-200)] hover:bg-[var(--color-ink-100)] transition-colors"
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
              style={{ background: "linear-gradient(135deg, var(--color-brand-600), var(--color-accent-blue))" }}
            >
              {user?.initials || "?"}
            </span>
            <span className="text-left hidden sm:block">
              <p className="text-[13.5px] font-semibold text-[var(--color-ink-900)] leading-tight">
                {displayName}
              </p>
              <p className="text-[11.5px] text-[var(--color-ink-500)] leading-tight">{displayRole}</p>
            </span>
            <ChevronDown size={16} className="text-[var(--color-ink-400)]" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[var(--shadow-card-lg)] border border-[var(--color-ink-100)] p-2 z-20">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/officer/profile");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] text-[var(--color-ink-700)] hover:bg-[var(--color-ink-100)]"
              >
                <UserCircle2 size={16} /> My Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] text-[var(--color-accent-pink)] hover:bg-[var(--color-accent-pink-soft)]"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
