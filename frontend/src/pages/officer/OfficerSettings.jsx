import { useEffect, useState } from "react";
import { Lock, Bell, Loader2, Save, CheckCircle2 } from "lucide-react";
import Header from "../../components/layout/Header";
import FormField, { inputClass } from "../../components/ui/FormField";
import { changePassword, updateSettings } from "../../services/onboardingService";
import { fetchMyProfile } from "../../services/profileService";
import { ApiError } from "../../services/api";

export default function OfficerSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    fetchMyProfile()
      .then((p) => setNotificationsEnabled(p.email_notifications_enabled))
      .catch(() => {});
  }, []);

  const handleToggleNotifications = async () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    setSavingNotif(true);
    try {
      await updateSettings({ email_notifications_enabled: next });
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2000);
    } catch {
      setNotificationsEnabled(!next);
    } finally {
      setSavingNotif(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div>
      <Header title="Settings" description="Account, notification and security preferences." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-accent-blue-soft)] flex items-center justify-center">
              <Bell size={17} className="text-[var(--color-accent-blue)]" />
            </div>
            <h3 className="font-bold text-[15px] text-[var(--color-ink-900)]">Notifications</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13.5px] font-medium text-[var(--color-ink-900)]">Email notifications</p>
              <p className="text-[12px] text-[var(--color-ink-500)]">Receive updates about your assessments and recommendations.</p>
            </div>
            <button
              onClick={handleToggleNotifications}
              disabled={savingNotif}
              className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors shrink-0 ${
                notificationsEnabled ? "bg-[var(--color-brand-600)] justify-end" : "bg-[var(--color-ink-200)] justify-start"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white block" />
            </button>
          </div>
          {notifSaved && (
            <p className="flex items-center gap-1.5 text-[12px] text-[var(--color-accent-teal)] mt-3">
              <CheckCircle2 size={13} /> Preference saved
            </p>
          )}
        </section>

        <section className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-accent-pink-soft)] flex items-center justify-center">
              <Lock size={17} className="text-[var(--color-accent-pink)]" />
            </div>
            <h3 className="font-bold text-[15px] text-[var(--color-ink-900)]">Change Password</h3>
          </div>
          <form onSubmit={handleChangePassword}>
            <FormField label="Current password">
              <input
                type="password"
                required
                className={inputClass}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </FormField>
            <FormField label="New password">
              <input
                type="password"
                required
                minLength={8}
                className={inputClass}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </FormField>

            {passwordError && (
              <p className="text-[12.5px] text-[var(--color-accent-pink)] bg-[var(--color-accent-pink-soft)] rounded-xl px-3.5 py-2.5 mb-3">
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--color-accent-teal)] mb-3">
                <CheckCircle2 size={13} /> Password changed successfully
              </p>
            )}

            <button
              type="submit"
              disabled={changingPassword}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand-600)] text-white font-semibold text-[13px] disabled:opacity-60"
            >
              {changingPassword ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Update Password
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
