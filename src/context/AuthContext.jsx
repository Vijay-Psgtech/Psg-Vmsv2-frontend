"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- RESTORE SESSION ---------------- */
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken && savedUser) {
        const parsed = JSON.parse(savedUser);
        setToken(savedToken);
        setUser({
          ...parsed,
          role: parsed.role?.toLowerCase(),
        });
      }
    } catch (e) {
      console.error("Auth restore failed", e);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------- LOGIN ---------------- */
  const loginUser = ({ token, user }) => {
    setToken(token);
    setUser({
      ...user,
      role: user.role.toLowerCase(),
    });

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    if (user.gateId) {
      localStorage.setItem("gateId", user.gateId);
    }
  };

  /* ---------------- REFRESH USER (🔥 FIX) ---------------- */
  const refreshUser = async () => {
    try {
      if (!token) return;

      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        const updatedUser = {
          ...data.user,
          role: data.user.role?.toLowerCase(),
        };

        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        if (updatedUser.gateId) {
          localStorage.setItem("gateId", updatedUser.gateId);
        }
      }
    } catch (err) {
      console.error("Failed to refresh user", err);
    }
  };

  /* ---------------- LOGOUT ---------------- */
  const logoutUser = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginUser,
        logoutUser,
        refreshUser, // ✅ EXPOSED
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ✅ REQUIRED EXPORTS */
export default AuthProvider;

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};