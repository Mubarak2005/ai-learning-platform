import {
  LayoutDashboard,
  UserCircle2,
  Target,
  ClipboardCheck,
  Waypoints,
  GraduationCap,
  Compass,
  BarChart3,
  Users2,
  Settings,
  UploadCloud,
  FileQuestion,
  BookMarked,
} from "lucide-react";

export const OFFICER_NAV = [
  { label: "Dashboard", to: "/officer", icon: LayoutDashboard, end: true },
  { label: "Profile", to: "/officer/profile", icon: UserCircle2 },
  { label: "Competency", to: "/officer/competency", icon: Target },
  { label: "Assessments", to: "/officer/assessments", icon: ClipboardCheck },
  { label: "Learning Path", to: "/officer/learning-path", icon: Waypoints },
  { label: "Courses", to: "/officer/courses", icon: GraduationCap },
  { label: "Recommendations", to: "/officer/recommendations", icon: Compass },
  { label: "Analytics", to: "/officer/analytics", icon: BarChart3 },
  { label: "Community", to: "/officer/community", icon: Users2 },
  { label: "Settings", to: "/officer/settings", icon: Settings },
];

export const TRAINER_NAV = [
  { label: "Dashboard", to: "/trainer", icon: LayoutDashboard, end: true },
  { label: "My Courses", to: "/trainer/courses", icon: BookMarked },
  { label: "Upload Content", to: "/trainer/upload", icon: UploadCloud },
  { label: "Question Bank", to: "/trainer/questions", icon: FileQuestion },
  { label: "Assessments", to: "/trainer/assessments", icon: ClipboardCheck },
  { label: "Learner Performance", to: "/trainer/performance", icon: BarChart3 },
  { label: "Settings", to: "/trainer/settings", icon: Settings },
];

export const ADMIN_NAV = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Workforce", to: "/admin/workforce", icon: Users2 },
  { label: "Competency Analytics", to: "/admin/competency", icon: Target },
  { label: "Department Analytics", to: "/admin/departments", icon: BarChart3 },
  { label: "Training Effectiveness", to: "/admin/training", icon: GraduationCap },
  { label: "Reports", to: "/admin/reports", icon: ClipboardCheck },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

export const NAV_BY_ROLE = {
  officer: OFFICER_NAV,
  trainer: TRAINER_NAV,
  admin: ADMIN_NAV,
};
