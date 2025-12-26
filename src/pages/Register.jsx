"use client";
import React, { useState } from "react";
import api from "../utils/api"; 
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "reception",
  });

  const [loading, setLoading] = useState(false);

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const registerUser = async () => {
    const { name, email, password, role } = form;

    if (!name || !email || !password) {
      alert("All fields are required");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
        role,
      });

      alert("User registered successfully");

      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: 380, margin: "auto", marginTop: 60 }}>
      <h2>Create New User</h2>
      <p style={{ color: "#555" }}>Admin can register new users here.</p>

      <input
        name="name"
        placeholder="Full Name"
        value={form.name}
        onChange={update}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={update}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={update}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <select
        name="role"
        value={form.role}
        onChange={update}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      >
        <option value="admin">Admin</option>
        <option value="reception">Reception</option>
        <option value="security">Security</option>
      </select>

      <button
        onClick={registerUser}
        disabled={loading}
        style={{
          width: "100%",
          padding: 12,
          marginTop: 15,
          background: "#4A3AFF",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        {loading ? "Registering..." : "Register User"}
      </button>
    </div>
  );
}
