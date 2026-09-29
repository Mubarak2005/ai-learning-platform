import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCw,
  Sparkles,
  History,
} from "lucide-react";
import Header from "../../components/layout/Header";
import { CardSkeleton, ErrorState, EmptyState } from "../../components/ui/States";
import ProgressBar from "../../components/ui/ProgressBar";
import {
  fetchCompetencyCheckHistory,
  startCompetencyCheck,
  submitCompetencyCheck,
} from "../../services/assessmentService";
import { ApiError } from "../../services/api";

const DOMAIN_COLOR = {
  statistical: "var(--color-accent-blue)",
  technical: "var(--color-accent-purple)",
  digital_governance: "var(--color-accent-pink)",
  behavioural_managerial: "var(--color-accent-teal)",
};

export default function OfficerAssessments() {
  const [view, setView] = useState("loading"); // loading | intro | quiz | result | error
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadHistory = () => {
    fetchCompetencyCheckHistory()
      .then(setHistory)
      .catch(() => setHistory([]));
  };

  useEffect(() => {
    loadHistory();
    setView("intro");
  }, []);

  const handleStart = async () => {
    setView("loading");
    setError(null);
    try {
      const data = await startCompetencyCheck();
      setAssessment(data);
      setAnswers({});
      setResult(null);
      setView("quiz");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start the assessment.");
      setView("error");
    }
  };

  const handleAnswer = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const allAnswered = assessment && assessment.questions.every((q) => answers[q.id] !== undefined);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await submitCompetencyCheck(assessment.id, answers);
      setResult(data);
      setView("result");
      loadHistory();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit the assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header
        title="Competency Assessment"
        description="A short AI-generated quiz based on your job role's required competencies. Scoring is deterministic and updates your competency profile."
      />

      {view === "loading" && (
        <div className="flex flex-col gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {view === "error" && <ErrorState description={error} onRetry={handleStart} />}

      {view === "intro" && (
        <IntroView history={history} onStart={handleStart} />
      )}

      {view === "quiz" && assessment && (
        <QuizView
          assessment={assessment}
          answers={answers}
          onAnswer={handleAnswer}
          onSubmit={handleSubmit}
          allAnswered={allAnswered}
          submitting={submitting}
          error={error}
        />
      )}

      {view === "result" && result && (
        <ResultView result={result} onRetake={handleStart} />
      )}
    </div>
  );
}

function IntroView({ history, onStart }) {
  const lastAttempt = history[0];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <section className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-8 text-center">
        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "linear-gradient(135deg, var(--color-brand-700), var(--color-accent-blue))" }}
        >
          <Sparkles size={28} className="text-white" />
        </div>
        <h2 className="text-[19px] font-bold text-[var(--color-ink-900)]">Competency Self-Assessment</h2>
        <p className="text-[13.5px] text-[var(--color-ink-500)] mt-2 max-w-md mx-auto">
          We'll generate a short multiple-choice quiz covering the competencies required for your job
          role. Your answers are scored deterministically and used to update your current competency
          levels — set your job role on your profile first if you haven't already.
        </p>
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-[var(--color-brand-600)] text-white font-semibold text-[14px] hover:bg-[var(--color-brand-700)] transition-colors"
        >
          <ClipboardCheck size={17} />
          Start Assessment
        </button>
      </section>

      <aside className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-6 h-fit">
        <div className="flex items-center gap-2.5 mb-4">
          <History size={17} className="text-[var(--color-ink-500)]" />
          <h3 className="font-bold text-[14.5px] text-[var(--color-ink-900)]">Past Attempts</h3>
        </div>
        {history.length === 0 ? (
          <p className="text-[13px] text-[var(--color-ink-400)]">No attempts yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between text-[13px]">
                <span className="text-[var(--color-ink-500)]">
                  {h.completed_at ? new Date(h.completed_at).toLocaleDateString() : "—"}
                </span>
                <span className="font-semibold text-[var(--color-ink-900)]">{h.score}%</span>
              </div>
            ))}
          </div>
        )}
        {lastAttempt && (
          <p className="text-[12px] text-[var(--color-ink-400)] mt-4 leading-relaxed">
            Retaking the assessment generates a fresh set of questions and updates your competency
            levels again.
          </p>
        )}
      </aside>
    </div>
  );
}

function QuizView({ assessment, answers, onAnswer, onSubmit, allAnswered, submitting, error }) {
  return (
    <div className="flex flex-col gap-5">
      {assessment.questions.map((q, idx) => (
        <div
          key={q.id}
          className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-[14px] font-semibold text-[var(--color-ink-900)] leading-snug">
              <span className="text-[var(--color-ink-400)] mr-1.5">{idx + 1}.</span>
              {q.prompt}
            </p>
            {q.topic && (
              <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-ink-500)]">
                {q.topic}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, optIdx) => {
              const selected = answers[q.id] === optIdx;
              return (
                <button
                  key={optIdx}
                  onClick={() => onAnswer(q.id, optIdx)}
                  className={`text-left px-4 py-2.5 rounded-xl border text-[13.5px] transition-colors ${
                    selected
                      ? "border-[var(--color-brand-500)] bg-[var(--color-accent-blue-soft)] text-[var(--color-ink-900)] font-medium"
                      : "border-[var(--color-ink-200)] text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {error && (
        <p className="text-[13px] text-[var(--color-accent-pink)] bg-[var(--color-accent-pink-soft)] rounded-xl px-3.5 py-2.5">
          {error}
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={!allAnswered || submitting}
        className="self-end flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-brand-600)] text-white font-semibold text-[14px] hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-50"
      >
        {submitting ? <Loader2 size={17} className="animate-spin" /> : <ClipboardCheck size={17} />}
        Submit Assessment
      </button>
    </div>
  );
}

function ResultView({ result, onRetake }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-6 text-center">
        <p className="text-[13px] text-[var(--color-ink-500)] mb-1">Overall Score</p>
        <p className="text-[42px] font-extrabold text-[var(--color-brand-600)] leading-none">
          {result.overall_percent}%
        </p>
        <p className="text-[13px] text-[var(--color-ink-500)] mt-2">
          {result.total_correct} of {result.total_questions} correct
        </p>
        <button
          onClick={onRetake}
          className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl border border-[var(--color-ink-200)] text-[13.5px] font-semibold text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
        >
          <RotateCw size={15} /> Retake Assessment
        </button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {result.breakdown.map((b) => (
          <section
            key={b.competency_id}
            className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-[14px] text-[var(--color-ink-900)]">{b.competency_name}</h3>
              <span className="text-[12px] font-semibold text-[var(--color-ink-500)]">
                {b.correct}/{b.total}
              </span>
            </div>
            <ProgressBar value={b.percent} color={DOMAIN_COLOR[b.domain] || "var(--color-brand-600)"} />
            <p className="text-[12px] text-[var(--color-ink-500)] mt-2">
              New competency level: <span className="font-semibold text-[var(--color-ink-900)]">{b.new_level} / 5</span>
            </p>

            <div className="flex flex-col gap-2.5 mt-4">
              {b.questions.map((q) => (
                <div key={q.question_id} className="flex items-start gap-2 text-[12.5px]">
                  {q.is_correct ? (
                    <CheckCircle2 size={15} className="text-[var(--color-accent-teal)] mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={15} className="text-[var(--color-accent-pink)] mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-[var(--color-ink-700)]">{q.prompt}</p>
                    {!q.is_correct && q.explanation && (
                      <p className="text-[var(--color-ink-400)] mt-0.5">{q.explanation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
