import { useEffect, useState } from "react";
import { Users2, TrendingUp, AlertOctagon, Building2, GraduationCap } from "lucide-react";
import Header from "../../components/layout/Header";
import { CardSkeleton, ErrorState } from "../../components/ui/States";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchAdminOverview,
  fetchCompetencyDistribution,
  fetchCriticalGaps,
  fetchDepartmentBreakdown,
} from "../../services/learningService";
import { ApiError } from "../../services/api";

const DOMAIN_LABEL = {
  statistical: "Statistical",
  technical: "Technical",
  digital_governance: "Digital Governance",
  behavioural_managerial: "Behavioural & Managerial",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [criticalGaps, setCriticalGaps] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchAdminOverview(), fetchCompetencyDistribution(), fetchCriticalGaps(), fetchDepartmentBreakdown()])
      .then(([ov, dist, gaps, depts]) => {
        setOverview(ov);
        setDistribution(dist);
        setCriticalGaps(gaps);
        setDepartments(depts);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load admin analytics"))
      .finally(() => setLoading(false));
  }, []);

  const stats = overview
    ? [
        { icon: Users2, label: "Total Officers", value: overview.total_officers, color: "var(--color-accent-blue)" },
        { icon: TrendingUp, label: "Active Learners", value: overview.active_learners, color: "var(--color-accent-teal)" },
        { icon: AlertOctagon, label: "Critical Skill Gaps", value: overview.critical_skill_gaps, color: "var(--color-accent-pink)" },
        { icon: Building2, label: "Departments Covered", value: overview.departments_covered, color: "var(--color-accent-purple)" },
      ]
    : [];

  return (
    <div>
      <Header
        title="Admin Dashboard"
        subtitle={`Welcome back, ${user?.name || ""}!`}
        description="Workforce-wide competency, training effectiveness and predictive analytics."
      />

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <CardSkeleton /> <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
        </div>
      )}

      {!loading && error && <ErrorState description={error} />}

      {!loading && !error && overview && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {stats.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${color}1A` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-[22px] font-extrabold text-[var(--color-ink-900)]">{value}</p>
                <p className="text-[12.5px] text-[var(--color-ink-500)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <section className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5">
              <h3 className="font-bold text-[14.5px] text-[var(--color-ink-900)] mb-4">
                Competency Distribution by Domain
              </h3>
              {distribution.length === 0 ? (
                <p className="text-[12.5px] text-[var(--color-ink-400)]">No assessed officers yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {distribution.map((d) => (
                    <div key={d.domain} className="flex items-center justify-between text-[12.5px]">
                      <span className="text-[var(--color-ink-700)]">{DOMAIN_LABEL[d.domain] || d.domain}</span>
                      <span className="font-semibold text-[var(--color-ink-900)]">
                        {d.average_level} / 5 avg ({d.assessed_count} assessed)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5">
              <h3 className="font-bold text-[14.5px] text-[var(--color-ink-900)] mb-4">
                Top Critical Skill Gaps (Emerging Training Priorities)
              </h3>
              {criticalGaps.length === 0 ? (
                <p className="text-[12.5px] text-[var(--color-ink-400)]">No critical gaps recorded yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {criticalGaps.map((g) => (
                    <div key={g.competency_name} className="flex items-center justify-between text-[12.5px]">
                      <span className="text-[var(--color-ink-700)]">{g.competency_name}</span>
                      <span className="font-semibold text-[var(--color-accent-pink)]">
                        {g.officers_affected} officer(s)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5">
            <h3 className="font-bold text-[14.5px] text-[var(--color-ink-900)] mb-4 flex items-center gap-2">
              <GraduationCap size={16} /> Department Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {departments.map((d) => (
                <div key={d.department} className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--color-surface)] text-[12.5px]">
                  <span className="text-[var(--color-ink-700)]">{d.department}</span>
                  <span className="font-semibold text-[var(--color-ink-900)]">{d.officer_count}</span>
                </div>
              ))}
            </div>
          </section>

          <p className="text-[12.5px] text-[var(--color-ink-400)] mt-6">
            Training effectiveness trends and predictive workforce analytics will build on this data as more
            assessments and course completions accumulate.
          </p>
        </>
      )}
    </div>
  );
}
