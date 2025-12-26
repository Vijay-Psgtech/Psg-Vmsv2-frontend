"use client";
import React from "react";

export default function ToastNotifications({ message }) {
  if (!message) return null;
  return (
    <div className="fixed right-6 bottom-6 bg-black text-white px-4 py-2 rounded shadow">
      {message}
    </div>
  );
}
