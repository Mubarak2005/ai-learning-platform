import { useEffect, useState } from "react";
import { Laptop2, GraduationCap, ClipboardCheck } from "lucide-react";
import Header from "../../components/layout/Header";
import QuickAccessCard from "../../components/dashboard/QuickAccessCard";
import { CardSkeleton } from "../../components/ui/States";
import RadialProgress from "../../components/ui/RadialProgress";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAuth } from "../../hooks/useAuth";
import { fetchMySkillGaps } from "../../services/learningService";
import { fetchMyAnalytics } from "../../services/onboardingService";
import { fetchMyEnrollments } from "../../services/learningService";

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [gaps, setGaps] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMySkillGaps().catch(() => []), fetchMyAnalytics().catch(() => null), fetchMyEnrollments().catch(() => [])])
      .then(([g, a, e]) => {
        setGaps(g);
        setAnalytics(a);
        setEnrollments(e);
      })
      .finally(() => setLoading(false));
  }, []);

  // Real overall competency score: average of (current/required) across all
  // tracked gaps, capped at 100. Empty state (no job role / no gaps yet) is
  // shown honestly rather than faked.
  const overallScore = gaps.length
    ? Math.round(
        (gaps.reduce((sum, g) => sum + Math.min(1, g.current_level / (g.required_level || 1)), 0) / gaps.length) * 100
      )
    : null;

  const topCompetencies = [...gaps]
    .sort((a, b) => b.current_level - a.current_level)
    .slice(0, 4)
    .map((g) => ({
      label: g.competency_name,
      value: Math.round((g.current_level / 5) * 100),
      color:
        g.domain === "statistical"
          ? "var(--color-accent-blue)"
          : g.domain === "technical"
          ? "var(--color-accent-purple)"
          : g.domain === "digital_governance"
          ? "var(--color-accent-pink)"
          : "var(--color-accent-teal)",
    }));

  const coursesCompleted = analytics?.courses_completed ?? 0;
  const assessmentsTaken = analytics?.assessments_taken ?? 0;
  const skillsTracked = gaps.length;

  const learningPathProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + e.percent_complete, 0) / enrollments.length)
    : 0;

  const quickAccess = [
    {
      icon: Laptop2,
      gradient: "linear-gradient(135deg, #5B7DF5, #7C6DF0)",
      title: "My Learning Path",
      description: "Continue your personalized learning journey",
      progress: learningPathProgress,
      progressColor: "var(--color-accent-blue)",
      to: "/officer/learning-path",
    },
    {
      icon: GraduationCap,
      gradient: "linear-gradient(135deg, #8B6EF5, #B07DEF)",
      title: "Available Courses",
      description: "Explore courses from iGOT, NSSTA and internal resources",
      progress: enrollments.length > 0 ? Math.round((coursesCompleted / enrollments.length) * 100) : 0,
      progressColor: "var(--color-accent-purple)",
      to: "/officer/courses",
    },
    {
      icon: ClipboardCheck,
      gradient: "linear-gradient(135deg, #F16FA8, #F0708F)",
      title: "Assessments",
      description: "Take quizzes and evaluate your progress",
      progress: analytics?.average_assessment_score ?? 0,
      progressColor: "var(--color-accent-pink)",
      to: "/officer/assessments",
    },
  ];

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name || ""}!`}
        description="Track your learning progress, complete assessments and improve your competencies."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="flex flex-col gap-6 min-w-0">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[19px] font-bold text-[var(--color-ink-900)]">Quick Access</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {quickAccess.map((card) => (
                <QuickAccessCard key={card.title} {...card} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[19px] font-bold text-[var(--color-ink-900)] mb-4">Skill Gaps at a Glance</h2>
            {loading ? (
              <CardSkeleton />
            ) : gaps.length === 0 ? (
              <div className="bg-white rounded-[var(--radius-card)] border border-dashed border-[var(--color-ink-200)] p-8 text-center">
                <p className="text-[13.5px] text-[var(--color-ink-500)]">
                  No skill gap data yet. Complete your{" "}
                  <a href="/onboarding" className="text-[var(--color-brand-600)] font-semibold">
                    onboarding
                  </a>{" "}
                  or a competency assessment to see this.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gaps
                  .filter((g) => g.severity !== "none")
                  .slice(0, 4)
                  .map((g) => (
                    <div key={g.competency_id} className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-medium text-[var(--color-ink-700)]">{g.competency_name}</span>
                        <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-accent-pink-soft)] text-[var(--color-accent-pink)] capitalize">
                          {g.severity} gap
                        </span>
                      </div>
                      <ProgressBar value={(g.current_level / g.required_level) * 100} color="var(--color-accent-pink)" />
                      <p className="text-[11.5px] text-[var(--color-ink-400)] mt-1.5">
                        {g.current_level} / {g.required_level} required
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-6">
            <h3 className="font-bold text-[15.5px] text-[var(--color-ink-900)] mb-5">My Competency Overview</h3>

            {loading ? (
              <CardSkeleton />
            ) : overallScore === null ? (
              <p className="text-[13px] text-[var(--color-ink-400)]">
                Complete onboarding to see your competency score.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-4 bg-[var(--color-surface)] rounded-2xl p-4 mb-5">
                  <RadialProgress value={overallScore} size={74} strokeWidth={7} color="var(--color-brand-600)" labelSize={17} />
                  <div>
                    <p className="font-bold text-[14.5px] text-[var(--color-ink-900)] leading-tight">
                      Overall Competency
                      <br />
                      Score
                    </p>
                    <p className="text-[12px] text-[var(--color-ink-500)] mt-1">Based on your latest assessment data</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="rounded-xl border border-[var(--color-ink-100)] p-2.5 text-center">
                    <p className="font-bold text-[16px] text-[var(--color-ink-900)]">{coursesCompleted}</p>
                    <p className="text-[10px] text-[var(--color-ink-500)] mt-1">Courses Completed</p>
                  </div>
                  <div className="rounded-xl border border-[var(--color-ink-100)] p-2.5 text-center">
                    <p className="font-bold text-[16px] text-[var(--color-ink-900)]">{assessmentsTaken}</p>
                    <p className="text-[10px] text-[var(--color-ink-500)] mt-1">Assessments Taken</p>
                  </div>
                  <div className="rounded-xl border border-[var(--color-ink-100)] p-2.5 text-center">
                    <p className="font-bold text-[16px] text-[var(--color-ink-900)]">{skillsTracked}</p>
                    <p className="text-[10px] text-[var(--color-ink-500)] mt-1">Skills Tracked</p>
                  </div>
                </div>

                {topCompetencies.length > 0 && (
                  <>
                    <h4 className="font-bold text-[13.5px] text-[var(--color-ink-900)] mb-3">Top Competencies</h4>
                    <div className="flex flex-col gap-3.5">
                      {topCompetencies.map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[12.5px] font-medium text-[var(--color-ink-700)]">{item.label}</span>
                            <span className="text-[12px] font-semibold text-[var(--color-ink-500)]">{item.value}%</span>
                          </div>
                          <ProgressBar value={item.value} color={item.color} height={6} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
