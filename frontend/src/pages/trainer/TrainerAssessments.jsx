import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, CheckCircle2, Clock } from "lucide-react";
import Header from "../../components/layout/Header";
import { EmptyState, CardSkeleton } from "../../components/ui/States";
import { fetchTrainerAssessments } from "../../services/trainerService";

export default function TrainerAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainerAssessments()
      .then(setAssessments)
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Header title="Assessments" description="Draft and published assessments you've created from uploaded material." />

      {loading && (
        <div className="flex flex-col gap-4">
          <CardSkeleton /> <CardSkeleton />
        </div>
      )}

      {!loading && assessments.length === 0 && (
        <EmptyState icon={ClipboardCheck} title="No assessments yet" description="Upload material and generate questions to create one." />
      )}

      {!loading && assessments.length > 0 && (
        <div className="flex flex-col gap-3">
          {assessments.map((a) => (
            <Link
              key={a.id}
              to={`/trainer/questions?assessment=${a.id}`}
              className="flex items-center justify-between bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-4 hover:shadow-[var(--shadow-card-lg)] transition-shadow"
            >
              <div>
                <p className="font-semibold text-[13.5px] text-[var(--color-ink-900)]">{a.title}</p>
                <p className="text-[12px] text-[var(--color-ink-500)] mt-0.5">
                  {a.total_questions} questions · {a.approved_count} approved · {a.pending_count} pending
                  {a.rejected_count > 0 && ` · ${a.rejected_count} rejected`}
                </p>
              </div>
              <span
                className={`flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full ${
                  a.is_published
                    ? "bg-[var(--color-accent-teal-soft)] text-[var(--color-accent-teal)]"
                    : "bg-[var(--color-accent-amber-soft)] text-[var(--color-accent-amber)]"
                }`}
              >
                {a.is_published ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                {a.is_published ? "Published" : "Draft"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
