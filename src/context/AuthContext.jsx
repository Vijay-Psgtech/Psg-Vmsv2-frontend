// src/context/AuthContext.jsx - COMPLETE PRODUCTION VERSION WITH TOKENMANAGER
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { tokenManager } from "../utils/tokenManager";
import { logger } from "../utils/logger";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Initialize auth on mount - RESTORE FROM LOCALSTORAGE
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        logger.debug("🔍 AuthContext: Initializing authentication");

        // ✅ Try to restore from secure storage via tokenManager
        const { token: storedToken, user: storedUser, refreshToken: storedRefresh } =
          tokenManager.getAuth();

        logger.debug("📋 AuthContext: Checking stored auth", {
          hasToken: !!storedToken,
          hasUser: !!storedUser,
          userName: storedUser?.name,
          userRole: storedUser?.role,
        });

        if (storedToken && storedUser) {
          // ✅ Validate token isn't expired
          if (!tokenManager.isTokenExpired(storedToken)) {
            logger.debug("✅ Valid token found, restoring session", {
              userName: storedUser.name,
              userRole: storedUser.role,
              userEmail: storedUser.email,
            });
            setToken(storedToken);
            setRefreshToken(storedRefresh);
            setUser(storedUser);
            setError(null);
          } else {
            logger.warn("⚠️ Stored token is expired, attempting refresh or clearing");

            // ✅ Try to refresh if we have valid refresh token
            if (storedRefresh && !tokenManager.isTokenExpired(storedRefresh)) {
              logger.debug("🔄 Attempting token refresh with refreshToken");
              // Token refresh will be handled by API interceptor
              // For now, just keep the user session
              setUser(storedUser);
              setRefreshToken(storedRefresh);
            } else {
              logger.debug("🧹 Clearing expired tokens");
              tokenManager.clearAuth();
              setToken(null);
              setUser(null);
              setRefreshToken(null);
            }
          }
        } else {
          logger.debug("ℹ️ No stored auth data found, starting with clean slate");
          setToken(null);
          setUser(null);
          setRefreshToken(null);
        }
      } catch (err) {
        logger.error("❌ Auth initialization error:", err.message);
        setError("Failed to initialize authentication");
        tokenManager.clearAuth();
        setToken(null);
        setUser(null);
        setRefreshToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ✅ Login function with full validation
  const loginUser = useCallback((data) => {
    try {
      logger.debug("🔐 loginUser() called with data");

      const { token: newToken, user: newUser, refreshToken: newRefreshToken } = data;

      // ✅ Validate required fields
      if (!newToken || !newUser) {
        const err = "Missing token or user in login data";
        logger.error("❌ Validation error:", err);
        throw new Error(err);
      }

      // ✅ Validate user object structure
      if (!newUser._id || !newUser.email || !newUser.role) {
        const err = "Invalid user object structure - missing _id, email, or role";
        logger.error("❌ User structure error:", err);
        throw new Error(err);
      }

      logger.debug("✅ Login data validated successfully");

      // ✅ Save to secure storage via tokenManager
      tokenManager.setAuth(newToken, newUser, newRefreshToken);
      logger.debug("✅ Auth saved to localStorage");

      // ✅ Update state
      setToken(newToken);
      setRefreshToken(newRefreshToken || null);
      setUser(newUser);
      setError(null);

      logger.debug("✅ loginUser success:", {
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      });

      return { success: true };
    } catch (error) {
      const errorMsg = error.message || "Login failed";
      logger.error("❌ loginUser error:", errorMsg);
      setError(errorMsg);
      setToken(null);
      setUser(null);
      setRefreshToken(null);
      return { success: false, error: errorMsg };
    }
  }, []);

  // ✅ Logout function with complete cleanup
  const logoutUser = useCallback(() => {
    try {
      logger.debug("🚪 logoutUser() called");

      // ✅ Clear state
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setError(null);

      // ✅ Clear secure storage via tokenManager
      tokenManager.clearAuth();

      logger.debug("✅ Logout successful - all data cleared");

      return { success: true };
    } catch (error) {
      const errorMsg = error.message || "Logout failed";
      logger.error("❌ logoutUser error:", errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // ✅ Update user profile
  const updateUser = useCallback(
    (updatedUserData) => {
      try {
        logger.debug("✏️ updateUser() called with data:", Object.keys(updatedUserData));

        if (!user) {
          throw new Error("No user to update");
        }

        const newUser = { ...user, ...updatedUserData };

        // ✅ Update storage via tokenManager
        tokenManager.setAuth(token, newUser, refreshToken);

        // ✅ Update state
        setUser(newUser);

        logger.debug("✅ User updated:", {
          email: newUser.email,
          role: newUser.role,
        });

        return { success: true, user: newUser };
      } catch (error) {
        const errorMsg = error.message || "Update failed";
        logger.error("❌ updateUser error:", errorMsg);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [user, token, refreshToken]
  );

  // ✅ Helper: Check if authenticated
  const isAuthenticated = useCallback(() => {
    const authenticated = !!token && !!user && !tokenManager.isTokenExpired(token);
    logger.debug("🔍 isAuthenticated check:", {
      result: authenticated,
      hasToken: !!token,
      hasUser: !!user,
      tokenExpired: tokenManager.isTokenExpired(token),
    });
    return authenticated;
  }, [token, user]);

  // ✅ Helper: Check user has specific role
  const hasRole = useCallback(
    (requiredRole) => {
      if (!user) {
        logger.debug("🔍 hasRole check failed - no user");
        return false;
      }

      // ✅ SuperAdmin has all access
      if (user.role === "superadmin") {
        logger.debug("✅ hasRole check passed - superadmin");
        return true;
      }

      if (Array.isArray(requiredRole)) {
        const hasAccess = requiredRole.includes(user.role);
        logger.debug("🔍 hasRole check:", { userRole: user.role, requiredRoles: requiredRole, result: hasAccess });
        return hasAccess;
      }

      const hasAccess = user.role === requiredRole;
      logger.debug("🔍 hasRole check:", { userRole: user.role, requiredRole, result: hasAccess });
      return hasAccess;
    },
    [user]
  );

  // ✅ Helper: Check user has any of multiple roles
  const hasAnyRole = useCallback(
    (roles) => {
      if (!user) return false;

      // ✅ SuperAdmin has all access
      if (user.role === "superadmin") return true;

      const hasAccess = roles.includes(user.role);
      logger.debug("🔍 hasAnyRole check:", { userRole: user.role, roles, result: hasAccess });
      return hasAccess;
    },
    [user]
  );

  // ✅ Helper: Get token for API calls
  const getToken = useCallback(() => {
    return tokenManager.getToken();
  }, []);

  // ✅ Prepare context value with all helpers
  const value = {
    // ── State ──
    user,
    token,
    refreshToken,
    loading,
    error,

    // ── Functions ──
    loginUser,
    logoutUser,
    updateUser,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    getToken,

    // ── Computed helpers for quick checks ──
    isLoggedIn: !!token && !!user,
    isAdmin: user?.role === "admin" || user?.role === "superadmin" || user?.role === "hostadmin",
    isSuperAdmin: user?.role === "superadmin",
    isHostAdmin: user?.role === "hostadmin",
    isReception: user?.role === "reception",
    isSecurity: user?.role === "security",

    // ── Utility ──
    tokenManager,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;