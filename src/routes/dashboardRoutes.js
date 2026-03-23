// src/routes/dashboardRoutes.js - ROLE-BASED ROUTING CONFIGURATION

/**
 * Dashboard routes mapping by user role
 * Used for redirecting after login
 */
const dashboardRoutes = {
  // Admin roles
  admin: "/admin/dashboard",
  superadmin: "/superadmin/dashboard",

  // Staff roles
  security: "/security/dashboard",
  reception: "/reception/dashboard",
  employee: "/employee/dashboard",

  // Default fallback
  default: "/",
};

/**
 * Get redirect URL based on user role
 * @param {string} role - User role
 * @returns {string} - Redirect URL
 */
export const getRedirectUrl = (role) => {
  return dashboardRoutes[role] || dashboardRoutes.default;
};

/**
 * Check if user can access a route based on their role
 * @param {string} userRole - User's role
 * @param {string|array} allowedRoles - Allowed role(s)
 * @returns {boolean}
 */
export const hasAccess = (userRole, allowedRoles) => {
  if (!userRole) return false;

  // SuperAdmin has access to everything
  if (userRole === "superadmin") return true;

  // Admin has access to admin routes
  if (userRole === "admin" && Array.isArray(allowedRoles)) {
    return allowedRoles.includes("admin");
  }

  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(userRole);
  }

  return userRole === allowedRoles;
};

/**
 * Public routes - no auth required
 */
export const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/verify-otp",
  "/forgot-password",
];

/**
 * Protected routes - auth required
 */
export const protectedRoutes = {
  admin: ["/admin/dashboard", "/admin/users", "/admin/settings"],
  superadmin: ["/superadmin/dashboard", "/superadmin/users"],
  security: ["/security/dashboard", "/security/logs"],
  reception: ["/reception/dashboard", "/reception/visitors"],
  employee: ["/employee/profile"],
};

export default dashboardRoutes;