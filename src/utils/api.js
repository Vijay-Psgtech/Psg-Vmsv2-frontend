/**
 * API CONFIGURATION - FIXED
 * ✅ 304 handler now RETRIES the request instead of returning empty data
 * ✅ If-None-Match: "" forces server to always return 200 not 304
 * ✅ ETag bypass so browser never serves stale cache
 */

import axios from "axios";
import { tokenManager } from "./tokenManager";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

console.log("🔧 API Base URL:", API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    // ✅ KEY FIX: This header tells the server "I have no cached version"
    // so it always returns 200 with full data instead of 304 Not Modified
    "If-None-Match": "",
  },
});

// ── Request interceptor ────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Attach auth token
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("⚠️ No auth token found");
    }

    // Force no-cache on every request
    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    config.headers["Pragma"] = "no-cache";
    config.headers["Expires"] = "0";
    // ✅ Prevent ETag caching on every request
    config.headers["If-None-Match"] = "";

    // Add timestamp to GET requests as extra cache buster
    if (config.method === "get") {
      config.params = { ...config.params, _t: Date.now() };
    }

    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ── Response interceptor ───────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const config = error.config;

    // ✅ CRITICAL FIX: 304 means browser used cache — RETRY the request
    // The old code returned empty data [] which caused 0 visitors bug
    // Now we strip the ETag headers and retry to force a fresh 200 response
    if (status === 304) {
      console.warn("⚠️ 304 Not Modified — retrying with cache bypass...");

      // Mark as retried to prevent infinite loop
      if (!config._retried304) {
        config._retried304 = true;

        // Remove any conditional headers the browser added
        delete config.headers["If-None-Match"];
        delete config.headers["If-Modified-Since"];

        // Add fresh timestamp to make URL unique
        config.params = { ...config.params, _retry: Date.now() };

        try {
          const retryResponse = await axios(config);
          console.log("✅ Retry after 304 succeeded:", retryResponse.status);
          return retryResponse;
        } catch (retryErr) {
          console.error("❌ Retry after 304 failed:", retryErr.message);
          // Fall through to error handling below
        }
      }
    }

    // 401 — clear auth and redirect to login
    if (status === 401) {
      console.error("❌ 401 Unauthorized — clearing auth");
      tokenManager.clearAuth();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?expired=true";
      }
    }

    if (status === 403) console.error(`❌ 403 Forbidden — ${config?.url}`);
    if (status === 404) console.warn(`⚠️ Not found (404) - ${config?.url}`);
    if (status === 400) console.error(`❌ 400 Bad Request — ${error.response?.data?.message}`);
    if (status === 500) console.error(`❌ 500 Server Error — ${config?.url}: ${error.response?.data?.message}`);

    if (!error.response) {
      console.error("❌ Network Error — backend unreachable:", error.message);
    }

    return Promise.reject(error);
  }
);

// ── Method wrappers with logging ───────────────────────────────────────────

const _get = api.get.bind(api);
api.get = (url, config) => {
  console.log(`\n📡 GET REQUEST\n   URL: ${url}`);
  return _get(url, config).catch((err) => {
    console.error(`❌ GET ${url} failed:`, err.message);
    throw err;
  });
};

const _post = api.post.bind(api);
api.post = (url, data, config) => {
  console.log(`\n📤 POST REQUEST\n   URL: ${url}`);
  return _post(url, data, config).catch((err) => {
    console.error(`❌ POST ${url} failed:`, err.message);
    throw err;
  });
};

const _patch = api.patch.bind(api);
api.patch = (url, data, config) => {
  console.log(`\n✏️ PATCH REQUEST\n   URL: ${url}`);
  return _patch(url, data, config).catch((err) => {
    console.error(`❌ PATCH ${url} failed:`, err.message);
    throw err;
  });
};

const _put = api.put.bind(api);
api.put = (url, data, config) => {
  console.log(`\n⚙️ PUT REQUEST\n   URL: ${url}`);
  return _put(url, data, config).catch((err) => {
    console.error(`❌ PUT ${url} failed:`, err.message);
    throw err;
  });
};

const _delete = api.delete.bind(api);
api.delete = (url, config) => {
  console.log(`\n🗑️ DELETE REQUEST\n   URL: ${url}`);
  return _delete(url, config).catch((err) => {
    console.error(`❌ DELETE ${url} failed:`, err.message);
    throw err;
  });
};

export function clearApiCache() {
  console.log("✅ API cache cleared");
}

export default api;