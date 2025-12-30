"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function SocketProvider({ children }) {
  const { token, user } = useAuth();

  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // ⛔ no auth → no socket
    if (!token || !user) return;

    // ⛔ security must have gateId
    if (user.role === "security" && !user.gateId) return;

    // cleanup existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(SOCKET_URL, {
      auth: {
        token,
        role: user.role,
        gateId: user.gateId ?? null,
      },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.warn("⚠️ Socket disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    token,
    user,        // ✅ ESLint satisfied
    user?.role,
    user?.gateId,
  ]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used inside <SocketProvider>");
  }
  return ctx;
};


