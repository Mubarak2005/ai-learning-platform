import { api } from "./api";

export async function fetchMyProfile() {
  return api.get("/users/me/profile");
}

export async function updateMyProfile(payload) {
  return api.put("/users/me/profile", payload);
}

export async function fetchDepartments() {
  return api.get("/users/departments");
}
