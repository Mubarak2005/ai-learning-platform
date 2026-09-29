import { useEffect, useState } from "react";
import { Target, FlaskConical, Cpu, ShieldCheck, Users } from "lucide-react";
import Header from "../../components/layout/Header";
import { CardSkeleton, ErrorState, EmptyState } from "../../components/ui/States";
import ProgressBar from "../../components/ui/ProgressBar";
import { fetchCompetencies, fetchJobRoleFramework } from "../../services/competencyService";
import { fetchMyProfile } from "../../services/profileService";
import { fetchMySkillGaps } from "../../services/learningService";
import { ApiError } from "../../services/api";

const DOMAIN_META = {
  statistical: { label: "Statistical Competencies", icon: FlaskConical, color: "var(--color-accent-blue)" },
  technical: { label: "Technical Competencies", icon: Cpu, color: "var(--color-accent-purple)" },
  digital_governance: { label: "Digital Governance", icon: ShieldCheck, color: "var(--color-accent-pink)" },
  behavioural_managerial: { label: "Behavioural & Managerial", icon: Users, color: "var(--color-accent-teal)" },
};

const SEVERITY_COLOR = {
  critical: "var(--color-accent-pink)",
  moderate: "var(--color-accent-amber)",
  low: "var(--color-accent-blue)",
  none: "var(--color-accent-teal)",
};

export default function OfficerCompetency() {
  const [competencies, setCompetencies] = useState([]);
  const [jobRole, setJobRole] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchMyProfile()
      .then((profile) => {
        setJobRole(profile.job_role);
        return Promise.all([
          fetchCompetencies(),
          profile.job_role ? fetchJobRoleFramework(profile.job_role) : Promise.resolve(null),
          profile.job_role ? fetchMySkillGaps() : Promise.resolve([]),
        ]);
      })
      .then(([comps, framework, skillGaps]) => {
        setCompetencies(comps);
        setRequirements(framework?.requirements || []);
        setGaps(skillGaps);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load competency framework"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const requiredByCompetencyId = Object.fromEntries(
    requirements.map((r) => [r.competency_id, r.required_level])
  );
  const gapByCompetencyId = Object.fromEntries(gaps.map((g) => [g.competency_id, g]));

  const grouped = competencies.reduce((acc, c) => {
    acc[c.domain] = acc[c.domain] || [];
    acc[c.domain].push(c);
    return acc;
  }, {});

  return (
    <div>
      <Header
        title="Competency Framework"
        description="The full skill map for Official Statistics, your current levels, and what's required for your job role."
      />

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CardSkeleton /> <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
        </div>
      )}

      {!loading && error && <ErrorState description={error} onRetry={load} />}

      {!loading && !error && (
        <>
          {!jobRole && (
            <div className="bg-[var(--color-accent-amber-soft)] text-[13.5px] text-[var(--color-ink-700)] rounded-2xl px-4 py-3 mb-6 border border-[var(--color-accent-amber)]/20">
              Set your <strong>Job Role</strong> on your{" "}
              <a href="/officer/profile" className="font-semibold text-[var(--color-brand-600)]">
                profile
              </a>{" "}
              to see which competency levels are required for you.
            </div>
          )}

          {competencies.length === 0 ? (
            <EmptyState icon={Target} title="No competency framework loaded yet" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Object.entries(DOMAIN_META).map(([domainKey, meta]) => {
                const items = grouped[domainKey] || [];
                if (items.length === 0) return null;
                const Icon = meta.icon;
                return (
                  <section
                    key={domainKey}
                    className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5"
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${meta.color}1A` }}
                      >
                        <Icon size={17} style={{ color: meta.color }} />
                      </div>
                      <h3 className="font-bold text-[14.5px] text-[var(--color-ink-900)]">{meta.label}</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {items.map((c) => {
                        const required = requiredByCompetencyId[c.id];
                        const gap = gapByCompetencyId[c.id];
                        return (
                          <div key={c.id} className="px-3 py-2 rounded-xl hover:bg-[var(--color-surface)]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[13px] text-[var(--color-ink-700)]">{c.name}</span>
                              <div className="flex items-center gap-1.5">
                                {required != null && (
                                  <span className="text-[11px] text-[var(--color-ink-400)]">
                                    Req. {required}
                                  </span>
                                )}
                                {gap && (
                                  <span
                                    className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full capitalize"
                                    style={{
                                      backgroundColor: `${SEVERITY_COLOR[gap.severity]}1A`,
                                      color: SEVERITY_COLOR[gap.severity],
                                    }}
                                  >
                                    {gap.severity === "none" ? "On track" : `${gap.severity} gap`}
                                  </span>
                                )}
                              </div>
                            </div>
                            {gap && (
                              <ProgressBar
                                value={(gap.current_level / 5) * 100}
                                color={SEVERITY_COLOR[gap.severity]}
                                height={5}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

