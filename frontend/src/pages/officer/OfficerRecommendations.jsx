import { useEffect, useState } from "react";
import { Compass, RefreshCw, Clock, CheckCircle2 } from "lucide-react";
import Header from "../../components/layout/Header";
import { CardSkeleton, ErrorState, EmptyState } from "../../components/ui/States";
import {
  enrollInCourse,
  fetchMyEnrollments,
  fetchRecommendations,
  refreshRecommendations,
} from "../../services/learningService";
import { ApiError } from "../../services/api";

export default function OfficerRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([fetchRecommendations(), fetchMyEnrollments()])
      .then(([recs, enrollments]) => {
        setRecommendations(recs);
        setEnrolledIds(new Set(enrollments.map((e) => e.course.id)));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load recommendations"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const recs = await refreshRecommendations();
      setRecommendations(recs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to refresh recommendations");
    } finally {
      setRefreshing(false);
    }
  };

  const handleEnroll = async (courseId) => {
    setEnrollingId(courseId);
    try {
      await enrollInCourse(courseId);
      setEnrolledIds((prev) => new Set(prev).add(courseId));
    } catch {
      // idempotent server-side
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div>
      <Header
        title="Recommendations"
        description="AI-ranked learning recommendations based on your skill gaps — set your job role and take the competency assessment to personalize these."
      />

      <div className="flex justify-end mb-4">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-ink-200)] text-[13px] font-semibold text-[var(--color-ink-700)] hover:bg-[var(--color-surface)] disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-4">
          <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
        </div>
      )}

      {!loading && error && <ErrorState description={error} onRetry={load} />}

      {!loading && !error && recommendations.length === 0 && (
        <EmptyState
          icon={Compass}
          title="No recommendations yet"
          description="Set your job role on your profile and complete the competency assessment to get personalized recommendations."
        />
      )}

      {!loading && !error && recommendations.length > 0 && (
        <div className="flex flex-col gap-4">
          {recommendations.map((rec) => {
            const isEnrolled = enrolledIds.has(rec.course.id);
            return (
              <div
                key={rec.id}
                className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-[14.5px] text-[var(--color-ink-900)]">{rec.course.title}</h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-accent-blue-soft)] text-[var(--color-accent-blue)]">
                      Match score {rec.score}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[var(--color-ink-500)] leading-relaxed">{rec.reason}</p>
                  <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink-400)] mt-2">
                    <Clock size={13} /> {rec.course.duration_hours}h
                  </span>
                </div>
                <button
                  onClick={() => handleEnroll(rec.course.id)}
                  disabled={isEnrolled || enrollingId === rec.course.id}
                  className={`shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                    isEnrolled
                      ? "bg-[var(--color-accent-teal-soft)] text-[var(--color-accent-teal)]"
                      : "bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-700)] disabled:opacity-60"
                  }`}
                >
                  {isEnrolled ? (
                    <>
                      <CheckCircle2 size={15} /> Enrolled
                    </>
                  ) : (
                    "Enroll"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
