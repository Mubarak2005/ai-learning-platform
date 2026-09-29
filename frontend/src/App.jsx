import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import OnboardingGate from "./components/auth/OnboardingGate";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Onboarding from "./pages/onboarding/Onboarding";
import OfficerDashboard from "./pages/officer/OfficerDashboard";
import OfficerProfile from "./pages/officer/OfficerProfile";
import OfficerCompetency from "./pages/officer/OfficerCompetency";
import OfficerAssessments from "./pages/officer/OfficerAssessments";
import OfficerCourses from "./pages/officer/OfficerCourses";
import OfficerRecommendations from "./pages/officer/OfficerRecommendations";
import OfficerLearningPath from "./pages/officer/OfficerLearningPath";
import OfficerAnalytics from "./pages/officer/OfficerAnalytics";
import OfficerCommunity from "./pages/officer/OfficerCommunity";
import OfficerSettings from "./pages/officer/OfficerSettings";
import TrainerDashboard from "./pages/trainer/TrainerDashboard";
import TrainerUpload from "./pages/trainer/TrainerUpload";
import TrainerQuestions from "./pages/trainer/TrainerQuestions";
import TrainerAssessments from "./pages/trainer/TrainerAssessments";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PlaceholderPage from "./pages/PlaceholderPage";

const TRAINER_PLACEHOLDERS = [
  { path: "courses", title: "My Courses", description: "Courses and training material you manage." },
  { path: "performance", title: "Learner Performance", description: "Scores, weak topics and training effectiveness." },
  { path: "settings", title: "Settings", description: "Account and notification preferences." },
];

const ADMIN_PLACEHOLDERS = [
  { path: "workforce", title: "Workforce Overview", description: "Organization-wide competency and workforce composition." },
  { path: "competency", title: "Competency Analytics", description: "Competency distribution across the workforce." },
  { path: "departments", title: "Department Analytics", description: "Department-wise competencies and skill gaps." },
  { path: "training", title: "Training Effectiveness", description: "Completion rates, learning hours and competency improvement." },
  { path: "reports", title: "Reports", description: "Downloadable workforce and training reports." },
  { path: "settings", title: "Settings", description: "Platform and organization-wide configuration." },
];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/onboarding" element={<Onboarding />} />

            <Route element={<OnboardingGate />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to="/officer" replace />} />

                <Route path="/officer" element={<OfficerDashboard />} />
                <Route path="/officer/profile" element={<OfficerProfile />} />
                <Route path="/officer/competency" element={<OfficerCompetency />} />
                <Route path="/officer/assessments" element={<OfficerAssessments />} />
                <Route path="/officer/courses" element={<OfficerCourses />} />
                <Route path="/officer/recommendations" element={<OfficerRecommendations />} />
                <Route path="/officer/learning-path" element={<OfficerLearningPath />} />
                <Route path="/officer/analytics" element={<OfficerAnalytics />} />
                <Route path="/officer/community" element={<OfficerCommunity />} />
                <Route path="/officer/settings" element={<OfficerSettings />} />

                <Route path="/trainer" element={<TrainerDashboard />} />
                <Route path="/trainer/upload" element={<TrainerUpload />} />
                <Route path="/trainer/questions" element={<TrainerQuestions />} />
                <Route path="/trainer/assessments" element={<TrainerAssessments />} />
                {TRAINER_PLACEHOLDERS.map(({ path, ...rest }) => (
                  <Route key={path} path={`/trainer/${path}`} element={<PlaceholderPage {...rest} />} />
                ))}

                <Route path="/admin" element={<AdminDashboard />} />
                {ADMIN_PLACEHOLDERS.map(({ path, ...rest }) => (
                  <Route key={path} path={`/admin/${path}`} element={<PlaceholderPage {...rest} />} />
                ))}

                <Route path="*" element={<Navigate to="/officer" replace />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
