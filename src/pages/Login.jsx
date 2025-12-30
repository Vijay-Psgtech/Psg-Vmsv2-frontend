// src/pages/Login.jsx
"use client";
import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import dashboardRoutes from "../routes/dashboardRoutes";

export default function Login() {
  const navigate = useNavigate();
  const { loginUser, user, token, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && token) {
      const targetRoute = dashboardRoutes[user.role];
      if (targetRoute) {
        navigate(targetRoute, { replace: true });
      }
    }
  }, [user, token, authLoading, navigate]);

  // ---------------- PASSWORD LOGIN ----------------
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });

      // ✅ SAVE AUTH DATA
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);

      if (res.data.user.gateId) {
        localStorage.setItem("gateId", res.data.user.gateId);
      }

      // Update context
      loginUser(res.data);

      // Redirect to appropriate dashboard
      const targetRoute = dashboardRoutes[res.data.user.role];
      if (targetRoute) {
        navigate(targetRoute, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SEND OTP ----------------
  const handleSendOtp = async () => {
    if (!email) {
      alert("Please enter your email");
      return;
    }

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

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{ 
        width: '100%',
        maxWidth: 400, 
        padding: 32,
        backgroundColor: 'white',
        borderRadius: 8,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
            Staff Login
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            Sign in to access your dashboard
          </p>
        </div>

        <form onSubmit={handlePasswordLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 14, 
              fontWeight: 500,
              marginBottom: 8 
            }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 14, 
              fontWeight: 500,
              marginBottom: 8 
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: 12,
              backgroundColor: loading ? '#9ca3af' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              if (!loading) e.target.style.backgroundColor = '#7c3aed';
            }}
            onMouseOut={(e) => {
              if (!loading) e.target.style.backgroundColor = '#8b5cf6';
            }}
          >
            {loading ? "Please wait..." : "Login with Password"}
          </button>
        </form>

        <div style={{ 
          position: 'relative', 
          marginTop: 24, 
          marginBottom: 24 
        }}>
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <div style={{ 
              width: '100%', 
              borderTop: '1px solid #e5e7eb' 
            }}></div>
          </div>
          <div style={{ 
            position: 'relative', 
            display: 'flex', 
            justifyContent: 'center' 
          }}>
            <span style={{ 
              backgroundColor: 'white', 
              padding: '0 12px',
              fontSize: 12,
              color: '#6b7280'
            }}>
              OR
            </span>
          </div>
        </div>

        <button
          onClick={handleSendOtp}
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: 12,
            backgroundColor: 'white',
            color: '#8b5cf6',
            border: '1px solid #8b5cf6',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#f3f4f6';
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = 'white';
            }
          }}
        >
          {loading ? "Sending OTP..." : "Login via OTP"}
        </button>

        <div style={{ 
          marginTop: 20, 
          textAlign: 'center',
          fontSize: 14 
        }}>
          <span style={{ color: '#6b7280' }}>Don't have an account? </span>
          <a 
            href="/register" 
            style={{ 
              color: '#8b5cf6', 
              fontWeight: 500,
              textDecoration: 'none'
            }}
            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
          >
            Create Account
          </a>
        </div>

        <div style={{ 
          marginTop: 24, 
          paddingTop: 20,
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center' 
        }}>
          <a 
            href="/" 
            style={{ 
              color: '#6b7280', 
              fontSize: 13,
              textDecoration: 'none'
            }}
            onMouseOver={(e) => {
              e.target.style.color = '#8b5cf6';
              e.target.style.textDecoration = 'underline';
            }}
            onMouseOut={(e) => {
              e.target.style.color = '#6b7280';
              e.target.style.textDecoration = 'none';
            }}
          >
            ← Back to Visitor Booking
          </a>
        </div>
      </div>
    </div>
  );
}