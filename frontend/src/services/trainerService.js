import { getToken } from "./api";
import { api } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export async function uploadMaterial(file) {
  const formData = new FormData();
  formData.append("file", file);
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/trainer/materials/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.detail || "Upload failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function fetchMaterials() {
  return api.get("/trainer/materials");
}

export async function generateQuestions(materialId, questionCount = 10) {
  return api.post(`/trainer/materials/${materialId}/generate-questions`, { question_count: questionCount });
}

export async function fetchTrainerAssessments() {
  return api.get("/trainer/assessments");
}

export async function fetchTrainerAssessment(assessmentId) {
  return api.get(`/trainer/assessments/${assessmentId}`);
}

export async function reviewQuestion(questionId, payload) {
  return api.put(`/trainer/questions/${questionId}`, payload);
}

export async function publishAssessment(assessmentId) {
  return api.post(`/trainer/assessments/${assessmentId}/publish`);
}
