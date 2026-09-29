import { api } from "./api";

export async function fetchCompetencies(domain) {
  const query = domain ? `?domain=${encodeURIComponent(domain)}` : "";
  return api.get(`/competencies${query}`);
}

export async function fetchJobRoles() {
  return api.get("/competencies/job-roles");
}

export async function fetchJobRoleFramework(jobRole) {
  return api.get(`/competencies/job-roles/${encodeURIComponent(jobRole)}`);
}
