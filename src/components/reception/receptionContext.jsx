import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadVisitors = async () => {
    setLoading(true);
    setError(null);
    try {
      // ⚠️ VERIFY THIS ENDPOINT WITH YOUR BACKEND!
      const res = await api.get("/api/visitor/all");
      setVisitors(res.data || []);
    } catch (err) {
      console.error("Failed to load visitors", err);
      setError(err.response?.data?.message || "Failed to load visitors");
    } finally {
      setLoading(false);
    }
  };

  // Filter visitors by search
  const filteredVisitors = useMemo(() => {
    if (!search) return visitors;
    return visitors.filter(v =>
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.phone?.includes(search) ||
      v.host?.toLowerCase().includes(search.toLowerCase()) ||
      v.visitorId?.toLowerCase().includes(search.toLowerCase())
    );
  }, [visitors, search]);

  useEffect(() => {
    loadVisitors();

    if (socket) {
      // Listen for full list updates
      socket.on("visitors:update", (data) => {
        setVisitors(data || []);
      });

      // Listen for new visitor added
      socket.on("visitor:added", (newVisitor) => {
        setVisitors(prev => [newVisitor, ...prev]);
      });

      // Listen for visitor status updated
      socket.on("visitor:updated", (updatedVisitor) => {
        setVisitors(prev =>
          prev.map(v => v._id === updatedVisitor._id ? updatedVisitor : v)
        );
      });

      // Listen for visitor deleted
      socket.on("visitor:deleted", (visitorId) => {
        setVisitors(prev => prev.filter(v => v._id !== visitorId));
      });
    }

    return () => {
      if (socket) {
        socket.off("visitors:update");
        socket.off("visitor:added");
        socket.off("visitor:updated");
        socket.off("visitor:deleted");
      }
    };
  }, [socket]);

  return (
    <ReceptionContext.Provider
      value={{
        visitors,
        filteredVisitors,
        search,
        setSearch,
        loading,
        error,
        loadVisitors,
      }}
    >
      {children}
    </ReceptionContext.Provider>
  );
};