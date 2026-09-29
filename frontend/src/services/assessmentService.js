import { api } from "./api";

export async function startCompetencyCheck() {
  return api.post("/assessments/competency-check/start");
}

export async function submitCompetencyCheck(assessmentId, answers) {
  return api.post(`/assessments/competency-check/${assessmentId}/submit`, { answers });
}

export async function fetchCompetencyCheckHistory() {
  return api.get("/assessments/competency-check/history");
}

export async function fetchMyCompetencies() {
  return api.get("/competencies/me");
}
