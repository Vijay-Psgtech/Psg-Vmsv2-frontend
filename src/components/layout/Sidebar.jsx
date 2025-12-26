import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.role;

  // Dashboard menu based on role
  const menuItems = {   
    admin: [
      { label: "Dashboard", to: "/admin" },
      { label: "Manage Users", to: "/admin/users" },
      { label: "Visitors", to: "/admin/visitors" }, 
      { label: "Reports", to: "/admin/reports" },
    ],
    security: [
      { label: "Dashboard", to: "/security" },
      { label: "Check-In Visitors", to: "/security/check-in" },
      { label: "Watchlist", to: "/security/watchlist" },
    ],
    reception: [
      { label: "Dashboard", to: "/reception" },
      { label: "Register Visitor", to: "/reception/register" },
      { label: "Visitor Logs", to: "/reception/logs" },
    ],
  };

  const items = menuItems[role] || [];

  return (
    <div className="w-full h-full border-r bg-white p-4">
      <h2 className="text-lg font-semibold mb-4 capitalize">{role} Panel</h2>

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-3 py-2 rounded-md text-sm font-medium 
              ${isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

