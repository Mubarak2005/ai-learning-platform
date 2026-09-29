import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "../services/authService";
import { getToken } from "../services/api";

const AuthContext = createContext(null);

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // raw API user object
  const [status, setStatus] = useState("loading"); // loading | authenticated | unauthenticated
  const [error, setError] = useState(null);

  const refreshUser = async () => {
    const me = await fetchCurrentUser();
    setUser(me);
    return me;
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus("unauthenticated");
      return;
    }
    fetchCurrentUser()
      .then((u) => {
        setUser(u);
        setStatus("authenticated");
      })
      .catch(() => {
        logoutUser();
        setStatus("unauthenticated");
      });
  }, []);

  const login = async ({ email, password }) => {
    setError(null);
    await loginUser({ email, password });
    const me = await refreshUser();
    setStatus("authenticated");
    return me;
  };

  const register = async (payload) => {
    setError(null);
    await registerUser(payload);
    return login({ email: payload.email, password: payload.password });
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    setStatus("unauthenticated");
  };

  const value = useMemo(
    () => ({
      user: user
        ? {
            name: user.full_name,
            email: user.email,
            role: user.role, // e.g. "statistical_officer"
            department: user.department_name,
            initials: initialsOf(user.full_name),
            isEmailVerified: user.is_email_verified,
            onboardingCompleted: user.onboarding_completed,
          }
        : null,
      roleKey: roleKeyFromRole(user?.role),
      status,
      isAuthenticated: status === "authenticated",
      error,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, status, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function roleKeyFromRole(role) {
  switch (role) {
    case "trainer":
      return "trainer";
    case "admin":
      return "admin";
    case "statistical_officer":
    default:
      return "officer";
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
