"use client";
import React from "react";

export default function FiltersPanel({ filter, setFilter, search, setSearch }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow space-y-4">
      <div>
        <div className="text-sm text-gray-500 mb-2">Filter by status</div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="all">All</option>
          <option value="registered">Registered</option>
          <option value="profile-completed">Profile Completed</option>
          <option value="in_premise">In Premise</option>
          <option value="surrendered">Surrendered</option>
          <option value="expired">Expired</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div>
        <div className="text-sm text-gray-500 mb-2">Search</div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name or phone"
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  );
}
