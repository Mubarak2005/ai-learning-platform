import { useEffect, useState } from "react";
import { Clock, GraduationCap, ClipboardCheck, TrendingUp } from "lucide-react";
import Header from "../../components/layout/Header";
import { CardSkeleton, ErrorState, EmptyState } from "../../components/ui/States";
import { fetchMyAnalytics } from "../../services/onboardingService";
import { ApiError } from "../../services/api";

export default function OfficerAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyAnalytics()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        { icon: Clock, label: "Learning Hours", value: `${data.total_learning_hours}h`, color: "var(--color-accent-blue)" },
        { icon: GraduationCap, label: "Courses Completed", value: `${data.courses_completed}/${data.courses_enrolled}`, color: "var(--color-accent-teal)" },
        { icon: ClipboardCheck, label: "Assessments Taken", value: data.assessments_taken, color: "var(--color-accent-purple)" },
        { icon: TrendingUp, label: "Avg. Score", value: data.average_assessment_score != null ? `${data.average_assessment_score}%` : "—", color: "var(--color-accent-pink)" },
      ]
    : [];

  return (
    <div>
      <Header title="My Analytics" description="Learning hours, assessment scores and competency growth — all computed from your actual activity." />

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <CardSkeleton /> <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
        </div>
      )}

      {!loading && error && <ErrorState description={error} />}

      {!loading && !error && data && (
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

          <section className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5 mb-6">
            <h3 className="font-bold text-[14.5px] text-[var(--color-ink-900)] mb-4">Assessment Score History</h3>
            {data.score_history.length === 0 ? (
              <EmptyState title="No assessments taken yet" description="Take a competency assessment to see your score history here." />
            ) : (
              <div className="flex flex-col gap-2">
                {data.score_history.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-[12.5px] px-3 py-2 rounded-xl bg-[var(--color-surface)]">
                    <span className="text-[var(--color-ink-500)]">{new Date(s.date).toLocaleDateString()}</span>
                    <span className="font-semibold text-[var(--color-ink-900)]">{s.score}%</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5">
            <h3 className="font-bold text-[14.5px] text-[var(--color-ink-900)] mb-4">Competency Growth</h3>
            {data.competency_growth.length === 0 ? (
              <EmptyState title="No competency history yet" description="Complete onboarding or an assessment to start tracking growth." />
            ) : (
              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                {data.competency_growth.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-[12.5px] px-3 py-2 rounded-xl hover:bg-[var(--color-surface)]">
                    <div>
                      <span className="font-medium text-[var(--color-ink-700)]">{c.competency_name}</span>
                      <span className="text-[var(--color-ink-400)] ml-2">{new Date(c.date).toLocaleDateString()}</span>
                    </div>
                    <span className="font-semibold text-[var(--color-ink-900)]">{c.level} / 5</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
