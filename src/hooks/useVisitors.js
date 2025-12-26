import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export default function useVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all visitors from backend
  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/visitor/all");
      setVisitors(res.data.visitors || []);
    } catch (err) {
      console.error("Failed to fetch visitors:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  return {
    visitors,
    setVisitors,
    loading,
    fetchVisitors,
  };
}
