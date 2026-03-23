// src/App.jsx - PRODUCTION FIXED
import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketProvider";
import ProtectedRoute from "./hooks/ProtectedRoute";
import { logger } from "./utils/logger";

import Login from "./pages/Login";
import Register from "./pages/Register";

// Lazy load dashboards
const HostAdminDashboard = React.lazy(() => import("./pages/Hostadmindashboard kanban"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const SuperAdminDashboard = React.lazy(() => import("./components/SuperAdminDashboard"));
const SecurityDashboard = React.lazy(() => import("./pages/SecurityDashboard"));
const VisitorBooking = React.lazy(() => import("./components/VisitorBookingWebsite"));

const LoadingFallback = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: "16px" }}>
    <div style={{ width: 50, height: 50, border: "5px solid #f3f4f6", borderTop: "5px solid #8b5cf6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    <h2 style={{ color: "#6b7280", fontSize: 18 }}>Loading...</h2>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

/**
 * Maps user role to their dashboard path
 * FIX: security now has its own dashboard, not /admin/dashboard
 */
function getDashboardPath(role) {
  const routes = {
    superadmin: "/superadmin/dashboard",
    admin: "/admin/dashboard",
    hostadmin: "/hostadmin/dashboard",
    security: "/security/dashboard",
    reception: "/admin/dashboard",
  };
  return routes[role] || "/book-visit";
}

// Smart home redirect
const HomePage = () => {
  const navigate = useNavigate();
  const { user, loading, isLoggedIn } = useAuth();

  React.useEffect(() => {
    if (loading) return;
    if (isLoggedIn && user) {
      navigate(getDashboardPath(user.role), { replace: true });
    } else {
      navigate("/book-visit", { replace: true });
    }
  }, [user, loading, isLoggedIn, navigate]);

  return <LoadingFallback />;
};

// Login page — redirects if already logged in
const LoginPage = () => {
  const navigate = useNavigate();
  const { user, loading, isLoggedIn } = useAuth();

  React.useEffect(() => {
    if (loading) return;
    if (isLoggedIn && user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [user, loading, isLoggedIn, navigate]);

  return <Login />;
};

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/book-visit" element={<VisitorBooking />} />
        <Route path="/visitor/book" element={<VisitorBooking />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />

        {/* Host admin dashboard */}
        <Route
          path="/hostadmin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["hostadmin"]}>
              <HostAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "superadmin", "reception"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Super admin dashboard */}
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Security dashboard — FIX: was missing, security had no dedicated route */}
        <Route
          path="/security/dashboard"
          element={
            <ProtectedRoute allowedRoles={["security"]}>
              <SecurityDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirects */}
        <Route path="/admin/*" element={<ProtectedRoute allowedRoles={["admin", "superadmin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/superadmin/*" element={<ProtectedRoute allowedRoles={["superadmin"]}><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="/hostadmin/*" element={<ProtectedRoute allowedRoles={["hostadmin"]}><HostAdminDashboard /></ProtectedRoute>} />
        <Route path="/security/*" element={<ProtectedRoute allowedRoles={["security"]}><SecurityDashboard /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", textAlign: "center", backgroundColor: "#f9fafb", padding: "20px" }}>
            <h1 style={{ fontSize: 72, margin: "0 0 16px 0", color: "#111827", fontWeight: 700 }}>404</h1>
            <p style={{ fontSize: 20, color: "#6b7280", margin: "0 0 32px 0" }}>Page Not Found</p>
            <button onClick={() => window.location.href = "/"} style={{ padding: "12px 32px", backgroundColor: "#8b5cf6", color: "white", border: "none", borderRadius: 6, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
              Go to Home
            </button>
          </div>
        } />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;