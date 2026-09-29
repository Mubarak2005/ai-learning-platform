import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, ArrowRight, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import FormField, { inputClass } from "../../components/ui/FormField";
import { useAuth } from "../../hooks/useAuth";
import { fetchDepartments } from "../../services/profileService";
import { fetchJobRoles, fetchJobRoleFramework } from "../../services/competencyService";
import { submitOnboarding } from "../../services/onboardingService";
import { ApiError } from "../../services/api";

const STEPS = ["Professional Details", "Training History", "Self-Rate Your Skills"];

export default function Onboarding() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    designation: "",
    job_role: "",
    department_id: "",
    current_assignment: "",
    education: "",
    years_experience: "",
    previous_training: "",
  });
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    fetchDepartments().then(setDepartments).catch(() => setDepartments([]));
    fetchJobRoles().then(setJobRoles).catch(() => setJobRoles([]));
  }, []);

  const handleJobRoleChange = async (jobRole) => {
    setForm((f) => ({ ...f, job_role: jobRole }));
    if (!jobRole) {
      setRequirements([]);
      return;
    }
    setLoadingRequirements(true);
    try {
      const framework = await fetchJobRoleFramework(jobRole);
      setRequirements(framework.requirements);
      const initialRatings = {};
      framework.requirements.forEach((r) => {
        initialRatings[r.competency_id] = 0;
      });
      setRatings(initialRatings);
    } catch {
      setRequirements([]);
    } finally {
      setLoadingRequirements(false);
    }
  };

  const canProceedStep0 = form.designation.trim() && form.job_role.trim();

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        designation: form.designation,
        job_role: form.job_role,
        department_id: form.department_id || null,
        current_assignment: form.current_assignment || null,
        education: form.education || null,
        years_experience: form.years_experience === "" ? null : Number(form.years_experience),
        previous_training: form.previous_training || null,
        skills: Object.entries(ratings).map(([competency_id, self_rated_level]) => ({
          competency_id,
          self_rated_level,
        })),
      };
      const res = await submitOnboarding(payload);
      setResult(res);
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] px-4">
        <div className="w-full max-w-lg bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card-lg)] p-8 text-center">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "linear-gradient(135deg, var(--color-brand-700), var(--color-accent-blue))" }}
          >
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-[20px] font-bold text-[var(--color-ink-900)]">Your profile is set up</h1>
          <p className="text-[13.5px] text-[var(--color-ink-500)] mt-2">
            The AI engine analyzed your self-reported skills against your job role's requirements.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-[var(--color-surface)] rounded-xl p-3">
              <p className="text-[20px] font-extrabold text-[var(--color-ink-900)]">{result.gaps_identified}</p>
              <p className="text-[11px] text-[var(--color-ink-500)]">Gaps Identified</p>
            </div>
            <div className="bg-[var(--color-accent-pink-soft)] rounded-xl p-3">
              <p className="text-[20px] font-extrabold text-[var(--color-accent-pink)]">{result.critical_gaps}</p>
              <p className="text-[11px] text-[var(--color-ink-500)]">Critical</p>
            </div>
            <div className="bg-[var(--color-accent-teal-soft)] rounded-xl p-3">
              <p className="text-[20px] font-extrabold text-[var(--color-accent-teal)]">{result.recommendations_generated}</p>
              <p className="text-[11px] text-[var(--color-ink-500)]">Recommendations</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/officer", { replace: true })}
            className="w-full flex items-center justify-center gap-2 mt-7 py-3 rounded-xl bg-[var(--color-brand-600)] text-white font-semibold text-[14px] hover:bg-[var(--color-brand-700)]"
          >
            Go to My Dashboard <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 py-10">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center gap-3 justify-center mb-6">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ background: "linear-gradient(135deg, var(--color-brand-700), var(--color-accent-blue))" }}
          >
            <BrainCircuit size={22} />
          </div>
          <div>
            <p className="font-bold text-[15px] text-[var(--color-ink-900)]">Let's set up your profile</p>
            <p className="text-[11.5px] text-[var(--color-ink-500)] -mt-0.5">
              This drives your competency gaps and learning recommendations.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                  idx <= step ? "bg-[var(--color-brand-600)] text-white" : "bg-white border border-[var(--color-ink-200)] text-[var(--color-ink-400)]"
                }`}
              >
                {idx + 1}
              </div>
              <span className={`text-[12px] font-medium hidden sm:block ${idx <= step ? "text-[var(--color-ink-900)]" : "text-[var(--color-ink-400)]"}`}>
                {label}
              </span>
              {idx < STEPS.length - 1 && <div className="w-6 h-px bg-[var(--color-ink-200)]" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card-lg)] p-7">
          {step === 0 && (
            <div>
              <h2 className="font-bold text-[16px] text-[var(--color-ink-900)] mb-4">Professional Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <FormField label="Designation">
                  <input
                    className={inputClass}
                    placeholder="e.g. Deputy Director"
                    value={form.designation}
                    onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                  />
                </FormField>
                <FormField label="Job Role">
                  <select className={inputClass} value={form.job_role} onChange={(e) => handleJobRoleChange(e.target.value)}>
                    <option value="">Select job role</option>
                    {jobRoles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Department">
                  <select className={inputClass} value={form.department_id} onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}>
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Current Assignment">
                  <input
                    className={inputClass}
                    placeholder="e.g. NSS 79th Round Survey"
                    value={form.current_assignment}
                    onChange={(e) => setForm((f) => ({ ...f, current_assignment: e.target.value }))}
                  />
                </FormField>
                <FormField label="Education">
                  <input
                    className={inputClass}
                    placeholder="e.g. M.Sc Statistics"
                    value={form.education}
                    onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))}
                  />
                </FormField>
                <FormField label="Years of Experience">
                  <input
                    type="number" min="0" max="60"
                    className={inputClass}
                    placeholder="e.g. 7"
                    value={form.years_experience}
                    onChange={(e) => setForm((f) => ({ ...f, years_experience: e.target.value }))}
                  />
                </FormField>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setStep(1)}
                  disabled={!canProceedStep0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-brand-600)] text-white font-semibold text-[13.5px] disabled:opacity-50"
                >
                  Next <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-bold text-[16px] text-[var(--color-ink-900)] mb-1">Training History</h2>
              <p className="text-[12.5px] text-[var(--color-ink-500)] mb-4">
                List any prior trainings, workshops or certifications relevant to your role (optional).
              </p>
              <textarea
                className={`${inputClass} min-h-[140px]`}
                placeholder="e.g. Basic Statistics Workshop (2022), Data Collection Methods (2023)..."
                value={form.previous_training}
                onChange={(e) => setForm((f) => ({ ...f, previous_training: e.target.value }))}
              />
              <div className="flex justify-between mt-4">
                <button onClick={() => setStep(0)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-ink-200)] text-[13.5px] font-semibold text-[var(--color-ink-600)]">
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-brand-600)] text-white font-semibold text-[13.5px]"
                >
                  Next <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-bold text-[16px] text-[var(--color-ink-900)] mb-1">Self-Rate Your Skills</h2>
              <p className="text-[12.5px] text-[var(--color-ink-500)] mb-5">
                Rate your current proficiency (0 = none, 5 = expert) in each competency required for{" "}
                <strong>{form.job_role}</strong>. The AI engine compares this against required levels to identify
                your skill gaps and personalize your learning path.
              </p>

              {loadingRequirements && <p className="text-[13px] text-[var(--color-ink-400)]">Loading requirements…</p>}

              {!loadingRequirements && requirements.length === 0 && (
                <p className="text-[13px] text-[var(--color-ink-400)]">
                  No specific requirements configured for this role — you can still finish setup.
                </p>
              )}

              <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto pr-1">
                {requirements.map((r) => (
                  <div key={r.competency_id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium text-[var(--color-ink-700)]">{r.competency_name}</span>
                      <span className="text-[11.5px] text-[var(--color-ink-400)]">
                        Required: {r.required_level} · Your rating: <strong>{ratings[r.competency_id] ?? 0}</strong>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0" max="5" step="0.5"
                      value={ratings[r.competency_id] ?? 0}
                      onChange={(e) =>
                        setRatings((prev) => ({ ...prev, [r.competency_id]: Number(e.target.value) }))
                      }
                      className="w-full accent-[var(--color-brand-600)]"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-[13px] text-[var(--color-accent-pink)] bg-[var(--color-accent-pink-soft)] rounded-xl px-3.5 py-2.5 mt-4">
                  {error}
                </p>
              )}

              <div className="flex justify-between mt-5">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-ink-200)] text-[13.5px] font-semibold text-[var(--color-ink-600)]">
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-brand-600)] text-white font-semibold text-[13.5px] disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Finish Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
