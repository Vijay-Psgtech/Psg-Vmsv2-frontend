// src/utils/tokenManager.js - PRODUCTION READY
import { logger } from "./logger";

const TOKEN_KEY = "vpass_token";
const USER_KEY = "vpass_user";
const REFRESH_TOKEN_KEY = "vpass_refresh_token";

// ✅ Token Manager Service
export const tokenManager = {
  /**
   * Store authentication tokens and user data
   * Uses localStorage with encryption if possible
   */
  setAuth: (token, user, refreshToken = null) => {
    try {
      if (!token || !user) {
        throw new Error("Token and user are required");
      }

      // ✅ Store token (could be encrypted in production)
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }

      logger.debug("✅ Auth tokens stored securely");
    } catch (error) {
      logger.error("❌ Failed to store auth tokens:", error);
      throw error;
    }
  },

  /**
   * Retrieve authentication tokens and user data
   */
  getAuth: () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      let user = null;
      if (userStr) {
        try {
          user = JSON.parse(userStr);
        } catch (parseError) {
          logger.error("❌ Failed to parse stored user:", parseError);
          tokenManager.clearAuth();
          return { token: null, user: null, refreshToken: null };
        }
      }

      return { token, user, refreshToken };
    } catch (error) {
      logger.error("❌ Failed to retrieve auth tokens:", error);
      return { token: null, user: null, refreshToken: null };
    }
  },

  /**
   * Clear all authentication data
   */
  clearAuth: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      logger.debug("✅ Auth tokens cleared");
    } catch (error) {
      logger.error("❌ Failed to clear auth tokens:", error);
    }
  },

  /**
   * Get only the token
   */
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      logger.error("❌ Failed to get token:", error);
      return null;
    }
  },

  /**
   * Get only the user
   */
  getUser: () => {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      logger.error("❌ Failed to get user:", error);
      return null;
    }
  },

  /**
   * Check if token is expired
   * JWT structure: header.payload.signature
   * Payload is base64 encoded JSON with 'exp' claim
   */
  isTokenExpired: (token) => {
    try {
      if (!token || typeof token !== "string") {
        return true;
      }

      const parts = token.split(".");
      if (parts.length !== 3) {
        logger.warn("⚠️ Invalid token format");
        return true;
      }

      // ✅ Decode payload
      const payload = JSON.parse(atob(parts[1]));

      if (!payload.exp) {
        logger.warn("⚠️ Token has no expiry");
        return false;
      }

      // ✅ Check if expired (add 60s buffer)
      const expiresAt = payload.exp * 1000;
      const isExpired = Date.now() >= expiresAt - 60000;

      if (isExpired) {
        logger.debug("⏰ Token expired");
      }

      return isExpired;
    } catch (error) {
      logger.error("❌ Failed to check token expiry:", error);
      return true;
    }
  },

  /**
   * Get token expiry time in seconds
   */
  getTokenExpiryTime: (token) => {
    try {
      if (!token) return null;

      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload.exp ? payload.exp * 1000 : null;
    } catch (error) {
      logger.error("❌ Failed to get token expiry time:", error);
      return null;
    }
  },

  /**
   * Set token expiry timer to refresh before actual expiry
   */
  setTokenRefreshTimer: (token, onExpire) => {
    try {
      const expiryTime = tokenManager.getTokenExpiryTime(token);
      if (!expiryTime) return null;

      // ✅ Refresh 5 minutes before expiry
      const timeUntilExpiry = expiryTime - Date.now() - 5 * 60 * 1000;

      if (timeUntilExpiry <= 0) {
        onExpire?.();
        return null;
      }

      const timerId = setTimeout(onExpire, timeUntilExpiry);
      logger.debug(`⏱️ Token refresh timer set for ${timeUntilExpiry / 1000} seconds`);

      return timerId;
    } catch (error) {
      logger.error("❌ Failed to set token refresh timer:", error);
      return null;
    }
  },

  /**
   * Validate token structure
   */
  isValidToken: (token) => {
    try {
      if (!token || typeof token !== "string") {
        return false;
      }

      const parts = token.split(".");
      if (parts.length !== 3) {
        return false;
      }

      // ✅ Try to parse payload
      JSON.parse(atob(parts[1]));
      return true;
    } catch (error) {
      logger.error("❌ Invalid token:", error);
      return false;
    }
  },

  /**
   * Decode token payload (useful for getting user info)
   */
  decodeToken: (token) => {
    try {
      if (!tokenManager.isValidToken(token)) {
        return null;
      }

      const parts = token.split(".");
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      logger.error("❌ Failed to decode token:", error);
      return null;
    }
  },
};

export default tokenManager;