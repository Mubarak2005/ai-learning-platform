import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import VerificationBanner from "./VerificationBanner";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <Sidebar />
      <main className="flex-1 min-w-0 px-5 py-6 lg:px-9 lg:py-8">
        <VerificationBanner />
        <Outlet />
      </main>
    </div>
  );
}
