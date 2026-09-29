import { api } from "./api";

// Courses & enrollments
export async function fetchCourses() {
  return api.get("/courses");
}

export async function enrollInCourse(courseId) {
  return api.post(`/courses/${courseId}/enroll`);
}

export async function fetchMyEnrollments() {
  return api.get("/courses/enrollments/me");
}

export async function updateEnrollmentProgress(enrollmentId, percentComplete) {
  return api.put(`/courses/enrollments/${enrollmentId}/progress`, { percent_complete: percentComplete });
}

// Recommendations
export async function fetchRecommendations() {
  return api.get("/recommendations/me");
}

export async function refreshRecommendations() {
  return api.post("/recommendations/me/refresh");
}

// Skill gaps
export async function fetchMySkillGaps() {
  return api.get("/skill-gaps/me");
}

// Admin analytics
export async function fetchAdminOverview() {
  return api.get("/admin/overview");
}

export async function fetchCompetencyDistribution() {
  return api.get("/admin/competency-distribution");
}

export async function fetchCriticalGaps() {
  return api.get("/admin/critical-gaps");
}

export async function fetchDepartmentBreakdown() {
  return api.get("/admin/department-breakdown");
}
