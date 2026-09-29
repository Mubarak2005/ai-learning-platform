import { useEffect, useState } from "react";
import { Save, Loader2, Pencil, X, GraduationCap, Building2, Briefcase, MapPin, Clock } from "lucide-react";
import Header from "../../components/layout/Header";
import FormField, { inputClass } from "../../components/ui/FormField";
import { CardSkeleton, ErrorState } from "../../components/ui/States";
import { fetchDepartments, fetchMyProfile, updateMyProfile } from "../../services/profileService";
import { ApiError } from "../../services/api";

const FIELDS = [
  { key: "designation", label: "Designation", icon: Briefcase, placeholder: "e.g. Deputy Director" },
  { key: "job_role", label: "Job Role", icon: Briefcase, placeholder: "e.g. Statistical Officer" },
  { key: "current_assignment", label: "Current Assignment", icon: MapPin, placeholder: "e.g. NSS 79th Round Survey" },
  { key: "education", label: "Education", icon: GraduationCap, placeholder: "e.g. M.Sc Statistics" },
];

export default function OfficerProfile() {
  const [profile, setProfile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedMessage, setSavedMessage] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    Promise.all([fetchMyProfile(), fetchDepartments()])
      .then(([p, depts]) => {
        setProfile(p);
        setDepartments(depts);
        setForm({
          designation: p.designation || "",
          job_role: p.job_role || "",
          current_assignment: p.current_assignment || "",
          education: p.education || "",
          years_experience: p.years_experience ?? "",
          department_id: p.department_id || "",
        });
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        ...form,
        years_experience: form.years_experience === "" ? null : Number(form.years_experience),
        department_id: form.department_id || null,
      };
      const updated = await updateMyProfile(payload);
      setProfile(updated);
      setEditing(false);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Header
        title="My Profile"
        description="Your designation, department, education and experience feed the competency assessment engine."
      />

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {!loading && loadError && <ErrorState description={loadError} onRetry={load} />}

      {!loading && !loadError && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <section className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[16px] text-[var(--color-ink-900)]">Professional Details</h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-brand-600)]"
                >
                  <Pencil size={14} /> Edit
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditing(false);
                    setSaveError(null);
                  }}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-ink-500)]"
                >
                  <X size={14} /> Cancel
                </button>
              )}
            </div>

            {savedMessage && (
              <p className="text-[13px] text-[var(--color-accent-teal)] bg-[var(--color-accent-teal-soft)] rounded-xl px-3.5 py-2.5 mb-4">
                Profile updated successfully.
              </p>
            )}
            {saveError && (
              <p className="text-[13px] text-[var(--color-accent-pink)] bg-[var(--color-accent-pink-soft)] rounded-xl px-3.5 py-2.5 mb-4">
                {saveError}
              </p>
            )}

            {!editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <ReadField icon={Briefcase} label="Designation" value={profile.designation} />
                <ReadField icon={Briefcase} label="Job Role" value={profile.job_role} />
                <ReadField icon={Building2} label="Department" value={profile.department_name} />
                <ReadField icon={MapPin} label="Current Assignment" value={profile.current_assignment} />
                <ReadField icon={GraduationCap} label="Education" value={profile.education} />
                <ReadField
                  icon={Clock}
                  label="Experience"
                  value={profile.years_experience != null ? `${profile.years_experience} years` : null}
                />
              </div>
            ) : (
              <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
                  {FIELDS.map(({ key, label, placeholder }) => (
                    <FormField key={key} label={label}>
                      <input
                        className={inputClass}
                        placeholder={placeholder}
                        value={form[key] || ""}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      />
                    </FormField>
                  ))}
                  <FormField label="Years of Experience">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      className={inputClass}
                      placeholder="e.g. 7"
                      value={form.years_experience}
                      onChange={(e) => setForm((f) => ({ ...f, years_experience: e.target.value }))}
                    />
                  </FormField>
                  <FormField label="Department">
                    <select
                      className={inputClass}
                      value={form.department_id || ""}
                      onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
                    >
                      <option value="">Select department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand-600)] text-white font-semibold text-[13.5px] hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </form>
            )}
          </section>

          <aside className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-6 h-fit">
            <h3 className="font-bold text-[15px] text-[var(--color-ink-900)] mb-4">Account</h3>
            <div className="flex flex-col gap-3.5 text-[13.5px]">
              <div>
                <p className="text-[var(--color-ink-500)] text-[12px]">Full Name</p>
                <p className="font-semibold text-[var(--color-ink-900)]">{profile.full_name}</p>
              </div>
              <div>
                <p className="text-[var(--color-ink-500)] text-[12px]">Email</p>
                <p className="font-semibold text-[var(--color-ink-900)]">{profile.email}</p>
              </div>
              <div>
                <p className="text-[var(--color-ink-500)] text-[12px]">Role</p>
                <p className="font-semibold text-[var(--color-ink-900)] capitalize">
                  {profile.role?.replace(/_/g, " ")}
                </p>
              </div>
            </div>
            <p className="text-[12px] text-[var(--color-ink-400)] mt-5 leading-relaxed">
              This profile is used to compute your competency gaps and personalize learning
              recommendations from iGOT Karmayogi and NSSTA/TPAC.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

function ReadField({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink-500)] mb-1">
        <Icon size={13} /> {label}
      </p>
      <p className="text-[14px] font-semibold text-[var(--color-ink-900)]">
        {value || <span className="text-[var(--color-ink-400)] font-normal">Not set</span>}
      </p>
    </div>
  );
}
