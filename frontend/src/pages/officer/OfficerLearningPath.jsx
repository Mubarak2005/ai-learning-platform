import { useEffect, useState } from "react";
import { Waypoints, Clock } from "lucide-react";
import Header from "../../components/layout/Header";
import { CardSkeleton, ErrorState, EmptyState } from "../../components/ui/States";
import ProgressBar from "../../components/ui/ProgressBar";
import { fetchMyEnrollments, updateEnrollmentProgress } from "../../services/learningService";
import { ApiError } from "../../services/api";

const STATUS_LABEL = {
  enrolled: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  dropped: "Dropped",
};

const STATUS_COLOR = {
  enrolled: "var(--color-ink-400)",
  in_progress: "var(--color-accent-blue)",
  completed: "var(--color-accent-teal)",
  dropped: "var(--color-accent-pink)",
};

export default function OfficerLearningPath() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchMyEnrollments()
      .then(setEnrollments)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load your learning path"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleProgressChange = async (enrollmentId, percent) => {
    setUpdatingId(enrollmentId);
    try {
      const updated = await updateEnrollmentProgress(enrollmentId, percent);
      setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? updated : e)));
    } catch {
      // leave state unchanged on failure
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <Header
        title="My Learning Path"
        description="Track progress across every course you've enrolled in."
      />

      {loading && (
        <div className="flex flex-col gap-4">
          <CardSkeleton /> <CardSkeleton />
        </div>
      )}

      {!loading && error && <ErrorState description={error} onRetry={load} />}

      {!loading && !error && enrollments.length === 0 && (
        <EmptyState
          icon={Waypoints}
          title="No enrollments yet"
          description="Browse Courses or Recommendations to get started."
        />
      )}

      {!loading && !error && enrollments.length > 0 && (
        <div className="flex flex-col gap-4">
          {enrollments.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-[14.5px] text-[var(--color-ink-900)]">{e.course.title}</h3>
                  <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink-400)] mt-1">
                    <Clock size={12} /> {e.course.duration_hours}h
                  </span>
                </div>
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                  style={{ backgroundColor: `${STATUS_COLOR[e.status]}1A`, color: STATUS_COLOR[e.status] }}
                >
                  {STATUS_LABEL[e.status]}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <ProgressBar value={e.percent_complete} color={STATUS_COLOR[e.status]} />
                <span className="text-[12.5px] font-semibold text-[var(--color-ink-700)] shrink-0">
                  {e.percent_complete}%
                </span>
              </div>

              <div className="flex gap-2">
                {[25, 50, 75, 100].map((p) => (
                  <button
                    key={p}
                    onClick={() => handleProgressChange(e.id, p)}
                    disabled={updatingId === e.id}
                    className="px-3 py-1.5 rounded-lg border border-[var(--color-ink-200)] text-[11.5px] font-medium text-[var(--color-ink-600)] hover:bg-[var(--color-surface)] disabled:opacity-50"
                  >
                    Mark {p}%
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
