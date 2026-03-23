/**
 * ═══════════════════════════════════════════════════════════════════════════
 * USENOTIFICATIONS HOOK
 * File: src/hooks/useNotifications.js
 * ═══════════════════════════════════════════════════════════════════════════
 * ✅ React hook for managing notifications
 * ✅ Automatic refresh
 * ✅ Socket.IO integration ready
 */

import { useState, useEffect, useCallback } from "react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api/apiClient";

export function useNotifications(autoRefresh = true) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  /**
   * Load notifications from API
   */
  const loadNotifications = useCallback(async (skip = 0, limit = 50) => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Loading notifications...");

      const response = await fetchNotifications(skip, limit);

      setNotifications(response.data || []);
      setTotal(response.total || 0);

      console.log(`✅ Loaded ${response.data?.length || 0} notifications`);

      return response;
    } catch (err) {
      setError(err.message);
      console.error("❌ Error loading notifications:", err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load unread count
   */
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await fetchUnreadCount();
      setUnreadCount(response.unreadCount || 0);
      console.log(`✅ Unread count: ${response.unreadCount}`);
      return response;
    } catch (err) {
      console.error("❌ Error loading unread count:", err.message);
      return null;
    }
  }, []);

  /**
   * Mark single notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      // Refresh unread count
      await loadUnreadCount();
      
      console.log(`✅ Marked notification as read: ${notificationId}`);
      
      return response;
    } catch (err) {
      console.error("❌ Error marking notification as read:", err.message);
      throw err;
    }
  }, [loadUnreadCount]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      setUnreadCount(0);
      
      console.log(`✅ Marked all notifications as read`);
      
      return response;
    } catch (err) {
      console.error("❌ Error marking all notifications as read:", err.message);
      throw err;
    }
  }, []);

  /**
   * Delete notification
   */
  const deleteNotif = useCallback(async (notificationId) => {
    try {
      const response = await deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.filter(notif => notif._id !== notificationId)
      );
      
      // Update total
      setTotal(prev => Math.max(0, prev - 1));
      
      // Refresh unread count
      await loadUnreadCount();
      
      console.log(`✅ Deleted notification: ${notificationId}`);
      
      return response;
    } catch (err) {
      console.error("❌ Error deleting notification:", err.message);
      throw err;
    }
  }, [loadUnreadCount]);

  /**
   * Auto-refresh notifications on mount
   */
  useEffect(() => {
    if (autoRefresh) {
      loadNotifications();
      loadUnreadCount();

      // Optional: Refresh every 30 seconds
      const interval = setInterval(() => {
        loadNotifications();
        loadUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadNotifications, loadUnreadCount]);

  return {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotif,
    refresh: () => {
      loadNotifications();
      loadUnreadCount();
    },
  };
}

export default useNotifications;