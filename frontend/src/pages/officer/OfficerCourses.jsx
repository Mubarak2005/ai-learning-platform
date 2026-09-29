import { useEffect, useState } from "react";
import { GraduationCap, Clock, ExternalLink, CheckCircle2 } from "lucide-react";
import Header from "../../components/layout/Header";
import { CardSkeleton, ErrorState, EmptyState } from "../../components/ui/States";
import { enrollInCourse, fetchCourses, fetchMyEnrollments } from "../../services/learningService";
import { ApiError } from "../../services/api";

const SOURCE_LABEL = {
  igot_karmayogi: "iGOT Karmayogi",
  nssta_tpac: "NSSTA / TPAC",
  internal: "Internal",
};

const SOURCE_COLOR = {
  igot_karmayogi: "var(--color-accent-blue)",
  nssta_tpac: "var(--color-accent-purple)",
  internal: "var(--color-accent-teal)",
};

export default function OfficerCourses() {
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);
  const [sourceFilter, setSourceFilter] = useState("all");

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([fetchCourses(), fetchMyEnrollments()])
      .then(([allCourses, enrollments]) => {
        setCourses(allCourses);
        setEnrolledIds(new Set(enrollments.map((e) => e.course.id)));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load courses"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleEnroll = async (courseId) => {
    setEnrollingId(courseId);
    try {
      await enrollInCourse(courseId);
      setEnrolledIds((prev) => new Set(prev).add(courseId));
    } catch {
      // enroll is idempotent server-side, safe to retry
    } finally {
      setEnrollingId(null);
    }
  };

  const filtered = sourceFilter === "all" ? courses : courses.filter((c) => c.source === sourceFilter);

  return (
    <div>
      <Header
        title="Courses"
        description="Browse courses from iGOT Karmayogi, NSSTA/TPAC and internal resources."
      />

      <div className="flex items-center gap-2 mb-5">
        {["all", "igot_karmayogi", "nssta_tpac", "internal"].map((key) => (
          <button
            key={key}
            onClick={() => setSourceFilter(key)}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border transition-colors ${
              sourceFilter === key
                ? "bg-[var(--color-brand-600)] text-white border-[var(--color-brand-600)]"
                : "bg-white text-[var(--color-ink-700)] border-[var(--color-ink-200)] hover:bg-[var(--color-surface)]"
            }`}
          >
            {key === "all" ? "All Sources" : SOURCE_LABEL[key]}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
        </div>
      )}

      {!loading && error && <ErrorState description={error} onRetry={load} />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState icon={GraduationCap} title="No courses found" />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => {
            const isEnrolled = enrolledIds.has(course.id);
            return (
              <div
                key={course.id}
                className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5 flex flex-col"
              >
                <span
                  className="self-start text-[10.5px] font-bold px-2 py-0.5 rounded-full mb-3"
                  style={{
                    backgroundColor: `${SOURCE_COLOR[course.source]}1A`,
                    color: SOURCE_COLOR[course.source],
                  }}
                >
                  {SOURCE_LABEL[course.source]}
                </span>
                <h3 className="font-bold text-[14.5px] text-[var(--color-ink-900)] leading-snug">
                  {course.title}
                </h3>
                <p className="text-[12.5px] text-[var(--color-ink-500)] mt-1.5 leading-relaxed flex-1">
                  {course.description}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink-400)]">
                    <Clock size={13} /> {course.duration_hours}h
                  </span>
                  {course.url && (
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[11.5px] text-[var(--color-ink-400)] hover:text-[var(--color-brand-600)]"
                    >
                      View <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleEnroll(course.id)}
                  disabled={isEnrolled || enrollingId === course.id}
                  className={`mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
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
