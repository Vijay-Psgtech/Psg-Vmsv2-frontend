import { useEffect } from "react";
import { io } from "socket.io-client";

export default function useVisitorSocket({ onNew, onUpdate }) {
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");

    // Listen to new visitor
    socket.on("visitor:new", (data) => {
      if (onNew) onNew(data);
    });

    // Listen to updates
    socket.on("visitor:update", (data) => {
      if (onUpdate) onUpdate(data);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [onNew, onUpdate]);
}
