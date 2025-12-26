// components/reception/receptionContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../../utils/api";

const ReceptionContext = createContext();

export const useReception = () => {
  const context = useContext(ReceptionContext);
  if (!context) {
    throw new Error("useReception must be used within ReceptionProvider");
  }
  return context;
};

export const ReceptionProvider = ({ children, socket }) => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadVisitors = async () => {
    setLoading(true);
    try {
      const res = await api.get("/visitor");
      setVisitors(res.data || []);
    } catch (err) {
      console.error("Failed to load visitors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitors();

    if (socket) {
      socket.on("visitors:update", (data) => {
        setVisitors(data || []);
      });
    }

    return () => {
      if (socket) socket.off("visitors:update");
    };
  }, [socket]);

  return (
    <ReceptionContext.Provider
      value={{
        visitors,
        loading,
        loadVisitors,
      }}
    >
      {children}
    </ReceptionContext.Provider>
  );
};