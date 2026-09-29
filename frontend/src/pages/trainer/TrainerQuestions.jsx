import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileQuestion, Check, X, Pencil, Save, Loader2, UploadCloud } from "lucide-react";
import Header from "../../components/layout/Header";
import { EmptyState, ErrorState, CardSkeleton } from "../../components/ui/States";
import {
  fetchTrainerAssessment,
  fetchTrainerAssessments,
  publishAssessment,
  reviewQuestion,
} from "../../services/trainerService";
import { ApiError } from "../../services/api";

const STATUS_LABEL = {
  ai_generated: "Pending Review",
  approved: "Approved",
  edited: "Edited & Approved",
  rejected: "Rejected",
};

const STATUS_COLOR = {
  ai_generated: "var(--color-accent-amber)",
  approved: "var(--color-accent-teal)",
  edited: "var(--color-accent-blue)",
  rejected: "var(--color-accent-pink)",
};

export default function TrainerQuestions() {
  const [searchParams] = useSearchParams();
  const [assessments, setAssessments] = useState([]);
  const [selectedId, setSelectedId] = useState(searchParams.get("assessment") || null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState(null);

  const loadList = () => {
    fetchTrainerAssessments()
      .then((list) => {
        setAssessments(list);
        if (!selectedId && list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => setAssessments([]));
  };

  const loadAssessment = (id) => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchTrainerAssessment(id)
      .then(setAssessment)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load assessment"))
      .finally(() => setLoading(false));
  };

  useEffect(loadList, []);
  useEffect(() => loadAssessment(selectedId), [selectedId]);

  const handleReview = async (questionId, status, overrides = {}) => {
    try {
      const updated = await reviewQuestion(questionId, { status, ...overrides });
      setAssessment((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => (q.id === questionId ? updated : q)),
      }));
      setEditingId(null);
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : "Failed to update question");
    }
  };

  const startEdit = (q) => {
    setEditingId(q.id);
    setEditDraft({ prompt: q.prompt, options: [...q.options], correct_option_index: q.correct_option_index, explanation: q.explanation || "" });
  };

  const saveEdit = (questionId) => {
    handleReview(questionId, "edited", editDraft);
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      const updated = await publishAssessment(assessment.id);
      setAssessment(updated);
      loadList();
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const pendingCount = assessment?.questions.filter((q) => q.status === "ai_generated").length || 0;

  return (
    <div>
      <Header
        title="Question Bank"
        description="Review AI-generated questions before they can be published to learners. Nothing publishes until every question has been approved, edited, or rejected."
      />

      {assessments.length === 0 && !loading ? (
        <EmptyState
          icon={UploadCloud}
          title="No draft assessments yet"
          description="Upload material and click 'Generate Questions' to create one."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <aside className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
            {assessments.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`text-left shrink-0 px-3.5 py-3 rounded-xl border text-[12.5px] ${
                  selectedId === a.id
                    ? "border-[var(--color-brand-500)] bg-[var(--color-accent-blue-soft)]"
                    : "border-[var(--color-ink-200)] bg-white hover:bg-[var(--color-surface)]"
                }`}
              >
                <p className="font-semibold text-[var(--color-ink-900)] truncate max-w-[180px]">{a.title}</p>
                <p className="text-[var(--color-ink-500)] mt-1">
                  {a.is_published ? "Published" : `${a.pending_count} pending`}
                </p>
              </button>
            ))}
          </aside>

          <div>
            {loading && <CardSkeleton />}
            {!loading && error && <ErrorState description={error} onRetry={() => loadAssessment(selectedId)} />}

            {!loading && !error && assessment && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-bold text-[16px] text-[var(--color-ink-900)]">{assessment.title}</h2>
                    <p className="text-[12.5px] text-[var(--color-ink-500)] mt-0.5">
                      {assessment.is_published ? "Published" : `${pendingCount} question(s) pending review`}
                    </p>
                  </div>
                  {!assessment.is_published && (
                    <button
                      onClick={handlePublish}
                      disabled={pendingCount > 0 || publishing}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand-600)] text-white text-[13px] font-semibold disabled:opacity-50"
                    >
                      {publishing ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
                      Publish Assessment
                    </button>
                  )}
                </div>

                {publishError && (
                  <p className="text-[13px] text-[var(--color-accent-pink)] bg-[var(--color-accent-pink-soft)] rounded-xl px-3.5 py-2.5 mb-4">
                    {publishError}
                  </p>
                )}

                <div className="flex flex-col gap-4">
                  {assessment.questions.map((q) => (
                    <div
                      key={q.id}
                      className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        {editingId === q.id ? (
                          <textarea
                            className="w-full text-[14px] font-medium text-[var(--color-ink-900)] border border-[var(--color-ink-200)] rounded-lg p-2"
                            value={editDraft.prompt}
                            onChange={(e) => setEditDraft((d) => ({ ...d, prompt: e.target.value }))}
                          />
                        ) : (
                          <p className="text-[14px] font-semibold text-[var(--color-ink-900)]">{q.prompt}</p>
                        )}
                        <span
                          className="shrink-0 text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${STATUS_COLOR[q.status]}1A`, color: STATUS_COLOR[q.status] }}
                        >
                          {STATUS_LABEL[q.status]}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 mb-3">
                        {(editingId === q.id ? editDraft.options : q.options).map((opt, idx) => (
                          <div
                            key={idx}
                            className={`px-3 py-2 rounded-lg text-[12.5px] border flex items-center gap-2 ${
                              idx === (editingId === q.id ? editDraft.correct_option_index : q.correct_option_index)
                                ? "border-[var(--color-accent-teal)] bg-[var(--color-accent-teal-soft)]"
                                : "border-[var(--color-ink-200)]"
                            }`}
                          >
                            {editingId === q.id ? (
                              <>
                                <input
                                  type="radio"
                                  checked={editDraft.correct_option_index === idx}
                                  onChange={() => setEditDraft((d) => ({ ...d, correct_option_index: idx }))}
                                />
                                <input
                                  className="flex-1 bg-transparent outline-none"
                                  value={opt}
                                  onChange={(e) =>
                                    setEditDraft((d) => ({
                                      ...d,
                                      options: d.options.map((o, i) => (i === idx ? e.target.value : o)),
                                    }))
                                  }
                                />
                              </>
                            ) : (
                              opt
                            )}
                          </div>
                        ))}
                      </div>

                      {q.status === "ai_generated" && editingId !== q.id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(q.id, "approved")}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-accent-teal-soft)] text-[var(--color-accent-teal)] text-[12.5px] font-semibold"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => startEdit(q)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-accent-blue-soft)] text-[var(--color-accent-blue)] text-[12.5px] font-semibold"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleReview(q.id, "rejected")}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-accent-pink-soft)] text-[var(--color-accent-pink)] text-[12.5px] font-semibold"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      )}

                      {editingId === q.id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(q.id)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-brand-600)] text-white text-[12.5px] font-semibold"
                          >
                            <Save size={14} /> Save & Approve
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3.5 py-2 rounded-lg border border-[var(--color-ink-200)] text-[12.5px] font-semibold text-[var(--color-ink-600)]"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
