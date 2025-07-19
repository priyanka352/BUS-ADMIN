// src/hooks/useAdminLogin.js
import { getDatabase, ref, get } from "firebase/database";

export const useAdminLogin = () => {
  const login = async (email, password) => {
    if (email !== "admin@busspass.com") {
      return { success: false, message: "Unauthorized user" };
    }

    const db = getDatabase();
    const snapshot = await get(ref(db, "adminCredentials"));
    const data = snapshot.val();

    if (!data) return { success: false, message: "No admin data found" };

    if (data.email === email && data.password === password) {
      localStorage.setItem("adminAuth", "true");
      return { success: true };
    }

    return { success: false, message: "Invalid email or password" };
  };

  const isLoggedIn = () => localStorage.getItem("adminAuth") === "true";

  const logout = () => localStorage.removeItem("adminAuth");

  return { login, logout, isLoggedIn };
};
