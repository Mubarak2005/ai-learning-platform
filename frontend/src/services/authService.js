import { api, setToken } from "./api";

export async function registerUser({ fullName, email, password, role, departmentId }) {
  return api.post(
    "/auth/register",
    {
      full_name: fullName,
      email,
      password,
      role,
      department_id: departmentId || null,
    },
    { auth: false }
  );
}

export async function loginUser({ email, password }) {
  const data = await api.post("/auth/login-json", { email, password }, { auth: false });
  setToken(data.access_token);
  return data;
}

export async function fetchCurrentUser() {
  return api.get("/auth/me");
}

export function logoutUser() {
  setToken(null);
}

export async function sendEmailOtp() {
  return api.post("/auth/otp/send", { purpose: "email_verification" });
}

export async function verifyEmailOtp(code) {
  return api.post("/auth/otp/verify", { code });
}

export async function requestPasswordReset(email) {
  return api.post("/auth/password-reset/request", { email }, { auth: false });
}

export async function confirmPasswordReset({ email, code, newPassword }) {
  return api.post(
    "/auth/password-reset/confirm",
    { email, code, new_password: newPassword },
    { auth: false }
  );
}
