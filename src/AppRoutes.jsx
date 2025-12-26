import { Routes, Route, Navigate } from "react-router-dom";

import RoleRoute from "./hooks/RoleRoute";

import Login from "./pages/Login";
import VerifyOTP from "./pages/VerifyOTP";
import Register from "./pages/Register";

import AdminDashboard from "./pages/AdminDashboard";
import SecurityDashboard from "./pages/SecurityDashboard";
import ReceptionDashboard from "./pages/ReceptionDeskDashboard";
import Unauthorized from "./hooks/Unauthorized";

import dashboardRoutes from "./routes/dashboardRoutes";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin */}
      <Route
        path={dashboardRoutes.admin}
        element={
          <RoleRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </RoleRoute>
        }
      />

      {/* Security */}
      <Route
        path={dashboardRoutes.security}
        element={
          <RoleRoute allowedRoles={["security"]}>
            <SecurityDashboard />
          </RoleRoute>
        }
      />

      {/* Reception */}
      <Route
        path={dashboardRoutes.reception}
        element={
          <RoleRoute allowedRoles={["reception"]}>
            <ReceptionDashboard />
          </RoleRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
