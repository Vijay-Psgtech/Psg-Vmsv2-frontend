import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../../utils/api";

const ReceptionContext = createContext(null);

export default ReceptionContext;

export function ReceptionProvider({ children, socket }) {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchVisitors = async () => {
  try {
    const res = await api.get("/visitor"); // ✅ FIXED
    setVisitors(res.data);
  } catch (err) {
    console.error("Fetch visitors error:", err);
  }
};

  useEffect(() => {
    fetchVisitors();
  }, []);

  // 🔴 REAL-TIME SOCKET UPDATES
  useEffect(() => {
    if (!socket) return;

    socket.on("visitor:update", fetchVisitors);
    return () => socket.off("visitor:update");
  }, [socket]);

  return (
    <ReceptionContext.Provider
      value={{
        visitors,
        loading,
        fetchVisitors,
      }}
    >
      {children}
    </ReceptionContext.Provider>
  );
}

export function useReception() {
  const ctx = useContext(ReceptionContext);
  if (!ctx) {
    throw new Error("useReception must be used inside <ReceptionProvider>");
  }
  return ctx;
}


