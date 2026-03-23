/**
 * ═══════════════════════════════════════════════════════════════════════════
 * USE VISITOR DATA HOOK - PRODUCTION READY
 * ═══════════════════════════════════════════════════════════════════════════
 * ✅ Manages visitor data fetching and real-time updates
 * ✅ Socket event subscriptions
 * ✅ Auto-refresh on data changes
 * ✅ Error handling and loading states
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketProvider";
import dataServices from "../utils/visitorDataService";

export function useVisitorData(dataType = "admin") {
  const { on, emit } = useSocket();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const refreshTimeoutRef = useRef(null);
  const subscriptionsRef = useRef([]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Select appropriate service based on dataType
  // ═══════════════════════════════════════════════════════════════════════════

  const getService = useCallback(() => {
    switch (dataType) {
      case "admin":
        return dataServices.admin;
      case "hostAdmin":
        return dataServices.hostAdmin;
      case "superAdmin":
        return dataServices.superAdmin;
      case "security":
        return dataServices.security;
      default:
        return dataServices.admin;
    }
  }, [dataType]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Fetch Data
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const service = getService();
      let newData = [];

      console.log(`📡 [useVisitorData] Fetching ${dataType} data...`);

      // ✅ Call appropriate fetch method based on type
      if (dataType === "superAdmin") {
        newData = await service.getAllHostAdmins();
      } else if (dataType === "hostAdmin") {
        newData = await service.getHostVisitors();
      } else if (dataType === "security") {
        newData = await service.getGateVisitors();
      } else {
        newData = await service.getAllVisitors();
      }

      setData(newData);

      // ✅ Calculate stats
      const newStats = service.calculateStats(newData);
      setStats(newStats);

      console.log(`✅ [useVisitorData] Loaded ${newData.length} items with stats:`, newStats);
    } catch (err) {
      console.error(`❌ [useVisitorData] Error fetching ${dataType}:`, err);
      setError(err.message || "Failed to fetch data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [dataType, getService]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Setup Socket Listeners
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    // ✅ Initial fetch
    fetchData();

    // ═══════════════════════════════════════════════════════════════════════════
    // Setup event listeners based on data type
    // ═══════════════════════════════════════════════════════════════════════════

    if (dataType === "superAdmin") {
      // ✅ Host admin events
      subscriptionsRef.current.push(
        on("hostadmin:created", (data) => {
          console.log("🔔 Host admin created:", data);
          fetchData();
        })
      );

      subscriptionsRef.current.push(
        on("hostadmin:updated", (data) => {
          console.log("🔔 Host admin updated:", data);
          fetchData();
        })
      );

      subscriptionsRef.current.push(
        on("hostadmin:deleted", (data) => {
          console.log("🔔 Host admin deleted:", data);
          fetchData();
        })
      );

      subscriptionsRef.current.push(
        on("hostadmin:approved", (data) => {
          console.log("🔔 Host admin approved:", data);
          fetchData();
        })
      );
    } else if (dataType === "security") {
      // ✅ Visitor check-in/check-out events
      subscriptionsRef.current.push(
        on("visitor:checkin", (data) => {
          console.log("🔔 Visitor checked in:", data);
          fetchData();
        })
      );

      subscriptionsRef.current.push(
        on("visitor:checkout", (data) => {
          console.log("🔔 Visitor checked out:", data);
          fetchData();
        })
      );

      subscriptionsRef.current.push(
        on("visitor:overstay", (data) => {
          console.log("🔔 Visitor overstay detected:", data);
          fetchData();
        })
      );
    } else {
      // ✅ General visitor events (admin/hostAdmin)
      subscriptionsRef.current.push(
        on("visitor:created", (data) => {
          console.log("🔔 Visitor created:", data);
          fetchData();
        })
      );

      subscriptionsRef.current.push(
        on("visitor:updated", (data) => {
          console.log("🔔 Visitor updated:", data);
          fetchData();
        })
      );

      subscriptionsRef.current.push(
        on("visitor:approved", (data) => {
          console.log("🔔 Visitor approved:", data);
          fetchData();
        })
      );

      subscriptionsRef.current.push(
        on("visitor:rejected", (data) => {
          console.log("🔔 Visitor rejected:", data);
          fetchData();
        })
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Cleanup
    // ═══════════════════════════════════════════════════════════════════════════

    return () => {
      // ✅ Unsubscribe from all events
      subscriptionsRef.current.forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
      subscriptionsRef.current = [];

      // ✅ Clear refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [dataType, on, fetchData]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Utility Methods
  // ═══════════════════════════════════════════════════════════════════════════

  const refresh = useCallback(() => {
    console.log(`🔄 [useVisitorData] Refreshing ${dataType} data...`);
    fetchData();
  }, [fetchData, dataType]);

  const filter = useCallback(
    (filterKey, filterValue) => {
      const service = getService();

      if (filterKey === "status") {
        return service.filterByStatus(data, filterValue);
      }

      if (typeof service[`filter${filterKey}`] === "function") {
        return service[`filter${filterKey}`](data);
      }

      return data;
    },
    [data, getService]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Return API
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    data,
    loading,
    error,
    stats,
    refresh,
    filter,
    isEmpty: data.length === 0,
  };
}

export default useVisitorData;