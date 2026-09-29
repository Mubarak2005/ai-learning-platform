import { api } from "./api";

export async function submitOnboarding(payload) {
  return api.post("/users/me/onboarding", payload);
}

export async function changePassword(currentPassword, newPassword) {
  return api.post("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export async function updateSettings(payload) {
  return api.put("/users/me/settings", payload);
}

export async function fetchMyAnalytics() {
  return api.get("/users/me/analytics");
}

export async function fetchCommunityPosts() {
  return api.get("/community");
}

export async function createCommunityPost(content, topic) {
  return api.post("/community", { content, topic });
}
