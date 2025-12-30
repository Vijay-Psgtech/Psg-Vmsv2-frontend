import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./context/AuthContext";

/* ================= AUTH PAGES ================= */
import Login from "./pages/Login";
import VerifyOTP from "./pages/VerifyOTP";
import Register from "./pages/Register";

/* ================= DASHBOARDS ================= */
import SuperAdminDashboard from "./components/SuperAdminDashboard"; // ✅ NEW
import AdminDashboard from "./pages/AdminDashboard";
import AdminOverstayDashboard from "./pages/AdminOverstayDashboard";
import SecurityDashboard from "./pages/SecurityDashboard";
import ReceptionDeskDashboard from "./pages/ReceptionDeskDashboard";

/* ================= VISITOR COMPONENTS ================= */
import VisitorBookingWebsite from "./components/VisitorBookingWebsite"; // ✅ PUBLIC FORM
import VisitorRegistrationForm from "./components/VisitorRegistrationForm"; // ✅ INTERNAL FORM

/* ================= ROUTE GUARDS ================= */
import ProtectedRoute from "./hooks/ProtectedRoute";
import RoleRoute from "./hooks/RoleRoute";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ========================================
              PUBLIC ROUTES (NO PROTECTION)
          ======================================== */}

          {/* Public Visitor Booking - Anyone can access */}
          <Route path="/" element={<VisitorBookingWebsite />} />
          <Route path="/book-visit" element={<VisitorBookingWebsite />} />
          <Route path="/visitor/book" element={<VisitorBookingWebsite />} />

          {/* Staff Authentication Pages - Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          {/* ========================================
              PROTECTED ROUTES (AUTHENTICATION REQUIRED)
          ======================================== */}

          {/* -------- SUPER ADMIN ROUTES -------- */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["superadmin"]}>
                  <SuperAdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["superadmin"]}>
                  <SuperAdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* -------- ADMIN ROUTES -------- */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin", "superadmin"]}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin", "superadmin"]}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/overstay"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin", "superadmin"]}>
                  <AdminOverstayDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* -------- SECURITY ROUTES -------- */}
          <Route
            path="/security"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["security"]}>
                  <SecurityDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/security/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["security"]}>
                  <SecurityDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* -------- RECEPTION ROUTES -------- */}
          <Route
            path="/reception"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["reception"]}>
                  <ReceptionDeskDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reception/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["reception"]}>
                  <ReceptionDeskDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Internal Visitor Registration (Reception Only) */}
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

          {/* ========================================
              FALLBACK ROUTE
          ======================================== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}