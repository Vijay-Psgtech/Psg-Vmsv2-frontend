// src/hooks/RoleRoute.jsx
"use client";
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) return null; // or a loader

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-center">
        <h2 className="text-red-600 text-xl">Access Denied</h2>
      </div>
    );
  }

  return children;
}

