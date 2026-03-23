/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SOCKET PROVIDER - PRODUCTION READY (FIXED)
 * ═══════════════════════════════════════════════════════════════════════════
 * ✅ Single socket instance using useRef
 * ✅ Proper connection lifecycle management
 * ✅ Graceful reconnection with backoff
 * ✅ Error handling and logging
 * ✅ Real-time event subscriptions
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";

const SocketContext = createContext(null);

/**
 * SocketProvider Component
 * Manages a single Socket.IO connection for the entire app
 */
export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // ═══════════════════════════════════════════════════════════════════════════
  // Initialize Socket Connection
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    // ✅ Prevent multiple socket instances
    if (socketRef.current) {
      console.log("⚠️ Socket already exists, reusing existing connection");
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const token = localStorage.getItem("vpass_token");
    if (!token) {
  console.warn("⚠️ No auth token found. Socket may fail authentication.");
}

    console.log("🔌 Initializing Socket.IO connection...");
    console.log("   Server URL:", SOCKET_URL);
    console.log("   Has Token:", !!token);

    try {
      // ✅ Create socket instance with proper configuration
     const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: maxReconnectAttempts,

  transports: ["websocket"],
  autoConnect: true,

 auth: {
  token: `Bearer ${token}`,
},

  forceNew: false,
  upgrade: true,
  secure: window.location.protocol === "https:",
});

      // ═══════════════════════════════════════════════════════════════════════
      // Socket Event Handlers
      // ═══════════════════════════════════════════════════════════════════════

      /**
       * Connection successful
       */
      socket.on("connect", () => {
        console.log(`✅ Socket connected successfully (ID: ${socket.id})`);
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // ✅ Emit connection event
        socket.emit("client:connected", {
          timestamp: new Date().toISOString(),
          clientId: socket.id,
        });
      });

      /**
       * Disconnected from server
       */
      socket.on("disconnect", (reason) => {
        console.warn(`⚠️ Socket disconnected (Reason: ${reason})`);
        setConnected(false);

        // ✅ Handle different disconnect reasons
        if (reason === "io server disconnect") {
          console.log("🔄 Server initiated disconnect, will attempt to reconnect...");
          setTimeout(() => {
            if (socketRef.current) {
              socketRef.current.connect();
            }
          }, 1000);
        }
      });

      /**
       * Connection error
       */
      socket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error.message);
        setError(error.message);
        setConnected(false);
      });

      /**
       * Reconnection attempt
       */
      socket.on("reconnect_attempt", () => {
        reconnectAttempts.current += 1;
        console.log(
          `🔄 Reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`
        );
      });

      /**
       * Failed to reconnect
       */
      socket.on("reconnect_failed", () => {
        console.error("❌ Failed to reconnect after maximum attempts");
        setError("Failed to establish connection");
        setConnected(false);
      });

      // ✅ Store socket reference
      socketRef.current = socket;

      console.log("✅ Socket.IO provider initialized");
    } catch (err) {
      console.error("❌ Failed to initialize Socket.IO:", err);
      setError(err.message);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Cleanup on unmount
    // ═══════════════════════════════════════════════════════════════════════

    return () => {
      if (socketRef.current) {
        console.log("🔌 Cleaning up Socket.IO connection");
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // ✅ Empty dependency array - runs only once on mount

  // ═══════════════════════════════════════════════════════════════════════════
  // Public API Methods
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Subscribe to socket event
   */
  const on = useCallback((event, callback) => {
    if (!socketRef.current) {
      console.warn("⚠️ Socket not ready, cannot subscribe to:", event);
      return () => {};
    }

    console.log(`📡 Subscribing to event: ${event}`);
    socketRef.current.on(event, callback);

    // ✅ Return unsubscribe function
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
        console.log(`📡 Unsubscribed from event: ${event}`);
      }
    };
  }, []);

  /**
   * Emit socket event
   */
  const emit = useCallback((event, data) => {
    if (!socketRef.current) {
      console.warn(`⚠️ Socket not ready, cannot emit: ${event}`);
      return;
    }

    if (!socketRef.current.connected) {
      console.warn(`⚠️ Socket not connected, cannot emit: ${event}`);
      return;
    }

    console.log(`📤 Emitting event: ${event}`, data);
    socketRef.current.emit(event, data);
  }, []);

  /**
   * Get current socket instance (use with caution)
   */
  const getSocket = useCallback(() => {
    return socketRef.current;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Context Value
  // ═══════════════════════════════════════════════════════════════════════════

  const value = {
    socket: socketRef.current,
    connected,
    error,
    on,
    emit,
    getSocket,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * useSocket Hook
 * Use this hook to access socket functionality in any component
 */
export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    console.error("❌ useSocket must be used within SocketProvider");
    throw new Error("useSocket must be used within SocketProvider");
  }

  return context;
}

export default SocketProvider;