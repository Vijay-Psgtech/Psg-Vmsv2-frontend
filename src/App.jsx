import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import  AuthProvider from "./context/AuthContext";

// Auth pages
import Login from "./pages/Login";
import VerifyOTP from "./pages/VerifyOTP";
import Register from "./pages/Register";

// Dashboards
import AdminDashboard from "./pages/AdminDashboard";
import SecurityDashboard from "./pages/SecurityDashboard";
import ReceptionDeskDashboard from "./pages/ReceptionDeskDashboard";

// Visitor
import VisitorRegistrationForm from "./components/VisitorRegistrationForm.jsx";

// Route guards
import ProtectedRoute from "./hooks/ProtectedRoute";
import RoleRoute from "./hooks/RoleRoute";

// Routes map
import dashboardRoutes from "./routes/dashboardRoutes";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* -------- PUBLIC ROUTES -------- */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          {/* -------- VISITOR REGISTRATION (RECEPTION) -------- */}
          <Route
            path="/visitor/register"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["reception"]}>
                  <VisitorRegistrationForm />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* -------- ADMIN DASHBOARD -------- */}
          <Route
            path={dashboardRoutes.admin}
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* -------- SECURITY DASHBOARD -------- */}
          <Route
            path={dashboardRoutes.security}
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["security"]}>
                  <SecurityDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* -------- RECEPTION DASHBOARD -------- */}
          <Route
            path={dashboardRoutes.reception}
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["reception"]}>
                  <ReceptionDeskDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* -------- FALLBACK -------- */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}