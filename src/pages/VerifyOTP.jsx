// src/pages/VerifyOTP.jsx
"use client";
import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import dashboardRoutes from "../routes/dashboardRoutes";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const { loginUser, user, token } = useAuth();

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");

  // Load OTP email from localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem("otpEmail");
    if (!storedEmail && (!user || !token)) {
      navigate("/login", { replace: true });
    } else {
      setEmail(storedEmail);
    }
  }, [navigate, user, token]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && token) {
      navigate(dashboardRoutes[user.role] || "/", { replace: true });
    }
  }, [user, token, navigate]);

  // ---------------- VERIFY OTP ----------------
  const handleVerify = async () => {
  if (!otp) return alert("Enter OTP");

  try {
    const res = await api.post("/auth/verify-otp", { email, otp });

    loginUser(res.data);

    localStorage.removeItem("otpEmail");

    navigate(dashboardRoutes[res.data.user.role], { replace: true });
  } catch (err) {
    alert(err.response?.data?.error || "OTP verification failed");
  }
};

  return (
    <div style={{ width: 300, margin: "auto", marginTop: 100 }}>
      <h2>Verify OTP</h2>
      <p>Email: {email}</p>

      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter OTP"
        style={{ width: "100%", padding: 8, marginTop: 10 }}
      />

      <button
        onClick={handleVerify}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      >
        Verify
      </button>
    </div>
  );
}
