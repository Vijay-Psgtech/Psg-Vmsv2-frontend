// src/pages/Login.jsx
"use client";
import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import dashboardRoutes from "../routes/dashboardRoutes";

export default function Login() {
  const navigate = useNavigate();
  const { loginUser, user, token } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && token) {
      navigate(dashboardRoutes[user.role] || "/", { replace: true });
    }
  }, [user, token, navigate]);

  // ---------------- PASSWORD LOGIN ----------------
  const handlePasswordLogin = async () => {
    if (!email || !password) return alert("Enter email and password");

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });

      // ✅ SAVE AUTH DATA
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);

      if (res.data.user.gateId) {
        localStorage.setItem("gateId", res.data.user.gateId);
      }

      // keep context login
      loginUser(res.data);

      // redirect
      navigate(dashboardRoutes[res.data.user.role] || "/", {
        replace: true,
      });
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SEND OTP ----------------
  const handleSendOtp = async () => {
    if (!email) return alert("Enter email");

    setLoading(true);
    try {
      await api.post("/auth/send-otp", { email });

      // Store email temporarily for OTP verification
      localStorage.setItem("otpEmail", email);

      navigate("/verify-otp");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: 350, margin: "auto", marginTop: 100 }}>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Enter Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 8, marginTop: 10 }}
      />

      <input
        type="password"
        placeholder="Password (optional)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 8, marginTop: 10 }}
      />

      <button
        onClick={handlePasswordLogin}
        disabled={loading}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      >
        {loading ? "Please wait..." : "Login with Password"}
      </button>

      <p style={{ marginTop: 15 }}>
        <a href="/register">Create Account</a>
      </p>

      <button
        onClick={handleSendOtp}
        disabled={loading}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      >
        {loading ? "Sending OTP..." : "Login via OTP"}
      </button>
    </div>
  );
}
