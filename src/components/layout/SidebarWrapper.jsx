import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function SidebarWrapper() {
  const location = useLocation();
  const noSidebarRoutes = ["/login", "/verify-otp", "/register"];

  return noSidebarRoutes.includes(location.pathname) ? null : (
    <div className="w-64 hidden md:block">
      <Sidebar />
    </div>
  );
}
