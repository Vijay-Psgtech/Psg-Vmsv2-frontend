// src/components/ProtectedRoute.jsx - COMPLETE PRODUCTION VERSION
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logger } from "../utils/logger";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, token, loading } = useAuth();

  logger.debug("🔐 ProtectedRoute: Checking authorization", {
    hasToken: !!token,
    hasUser: !!user,
    isLoading: loading,
    userRole: user?.role,
    userName: user?.name,
    userEmail: user?.email,
    allowedRoles,
  });

  // ✅ STEP 1: Show loading spinner while auth is initializing
  if (loading) {
    logger.debug("⏳ ProtectedRoute: Auth still loading, displaying spinner");
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            border: "5px solid #f3f4f6",
            borderTop: "5px solid #8b5cf6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <h2 style={{ color: "#6b7280", fontSize: 18 }}>Loading...</h2>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ✅ STEP 2: Check if user is authenticated (has token and user data)
  if (!token || !user || !user._id) {
    logger.warn("❌ ProtectedRoute: User not authenticated", {
      hasToken: !!token,
      hasUser: !!user,
      hasUserId: !!user?._id,
    });
    logger.debug("ℹ️ ProtectedRoute: Redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  logger.debug("✅ ProtectedRoute: User authenticated", {
    email: user.email,
    role: user.role,
    name: user.name,
  });

  // ✅ STEP 3: Check if user has required role (only if allowedRoles is specified)
  if (allowedRoles && allowedRoles.length > 0) {
    logger.debug("🔍 ProtectedRoute: Checking role-based access", {
      userRole: user.role,
      allowedRoles,
      isSuperAdmin: user.role === "superadmin",
    });

    // ✅ SuperAdmin has access to ALL protected routes
    if (user.role === "superadmin") {
      logger.debug("✅ ProtectedRoute: Access granted - user is superadmin");
      return children;
    }

    // ✅ Check if user's role is in allowed roles list
    if (!allowedRoles.includes(user.role)) {
      logger.error("❌ ProtectedRoute: Access denied - insufficient permissions", {
        userRole: user.role,
        allowedRoles,
        userName: user.name,
        userEmail: user.email,
      });

      // ✅ Display access denied screen
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            flexDirection: "column",
            gap: "16px",
            padding: "20px",
            backgroundColor: "#fff5f5",
          }}
        >
          {/* Icon */}
          <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>

          {/* Title */}
          <h1 style={{ color: "#ef4444", fontSize: 28, marginBottom: 8, margin: 0 }}>
            Access Denied
          </h1>

          {/* Main message */}
          <p
            style={{
              color: "#6b7280",
              fontSize: 16,
              textAlign: "center",
              maxWidth: 400,
              marginBottom: 8,
              margin: "8px 0",
            }}
          >
            Your role <strong>{user.role}</strong> does not have permission to access this page.
          </p>

          {/* Required roles info */}
          <p
            style={{
              color: "#9ca3af",
              fontSize: 14,
              textAlign: "center",
              maxWidth: 400,
              marginBottom: 24,
              margin: "0 0 24px 0",
            }}
          >
            Required roles: <strong>{allowedRoles.join(", ")}</strong>
          </p>

          {/* User info */}
          <div
            style={{
              backgroundColor: "#f3f4f6",
              padding: "12px 16px",
              borderRadius: 6,
              marginBottom: 24,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            <p style={{ margin: "4px 0" }}>
              <strong>Logged in as:</strong> {user.name || user.email}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Current role:</strong> {user.role}
            </p>
          </div>

          {/* Home button */}
          <button
            onClick={() => (window.location.href = "/")}
            style={{
              padding: "12px 32px",
              backgroundColor: "#8b5cf6",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#7c3aed";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#8b5cf6";
              e.target.style.transform = "scale(1)";
            }}
          >
            Go to Home
          </button>
        </div>
      );
    }

    logger.debug("✅ ProtectedRoute: Access granted - user has required role");
  }

  // ✅ STEP 4: User is authenticated and authorized - render the protected component
  logger.debug("✅ ProtectedRoute: Rendering protected component for", user.name);
  return children;
};

export default ProtectedRoute;