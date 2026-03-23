/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXAMPLE COMPONENT - HOW TO USE NOTIFICATIONS
 * File: src/components/NotificationCenter.jsx
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from "react";
import useNotifications from "../hooks/useNotifications";

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotif,
    refresh,
  } = useNotifications(true); // Auto-refresh enabled

  if (loading && notifications.length === 0) {
    return <div className="p-4">Loading notifications...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-800">
        Error loading notifications: {error}
        <button
          onClick={refresh}
          className="ml-2 px-3 py-1 bg-red-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
        </h2>
        {notifications.length > 0 && unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No notifications yet
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 rounded border ${
                notif.read
                  ? "bg-gray-50 border-gray-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold">{notif.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!notif.read && (
                    <button
                      onClick={() => markAsRead(notif._id)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotif(notif._id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;