/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HOST ADMINS TABLE - PRODUCTION READY
 * ═══════════════════════════════════════════════════════════════════════════
 * ✅ Displays host admin data in responsive table
 * ✅ Status badges with color coding
 * ✅ Action buttons
 * ✅ Pagination support
 */

import React, { useState } from "react";

const STATUS_COLORS = {
  ACTIVE: {
    bg: "bg-green-900/30",
    border: "border-green-600",
    text: "text-green-300",
  },
  INACTIVE: {
    bg: "bg-gray-900/30",
    border: "border-gray-600",
    text: "text-gray-300",
  },
  SUSPENDED: {
    bg: "bg-red-900/30",
    border: "border-red-600",
    text: "text-red-300",
  },
  PENDING: {
    bg: "bg-yellow-900/30",
    border: "border-yellow-600",
    text: "text-yellow-300",
  },
};

export default function HostAdminsTable({ admins, onSelect, onRefresh }) {
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ═══════════════════════════════════════════════════════════════════════════
  // Sorting Logic
  // ═══════════════════════════════════════════════════════════════════════════

  const sortedAdmins = [...admins].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Pagination Logic
  // ═══════════════════════════════════════════════════════════════════════════

  const totalPages = Math.ceil(sortedAdmins.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdmins = sortedAdmins.slice(startIndex, startIndex + itemsPerPage);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handle Sort
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render Sort Icon
  // ═══════════════════════════════════════════════════════════════════════════

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <span className="text-slate-500">↕️</span>;
    return sortOrder === "asc" ? (
      <span className="text-blue-400">↑</span>
    ) : (
      <span className="text-blue-400">↓</span>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render Table
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort("hostName")}
                  className="font-semibold text-slate-300 flex items-center gap-2 hover:text-white transition"
                >
                  Host Name
                  <SortIcon column="hostName" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort("email")}
                  className="font-semibold text-slate-300 flex items-center gap-2 hover:text-white transition"
                >
                  Email
                  <SortIcon column="email" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort("department")}
                  className="font-semibold text-slate-300 flex items-center gap-2 hover:text-white transition"
                >
                  Department
                  <SortIcon column="department" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort("status")}
                  className="font-semibold text-slate-300 flex items-center gap-2 hover:text-white transition"
                >
                  Status
                  <SortIcon column="status" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="font-semibold text-slate-300">Approved</span>
              </th>
              <th className="px-6 py-3 text-right">
                <span className="font-semibold text-slate-300">Actions</span>
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {paginatedAdmins.map((admin) => (
              <tr
                key={admin._id}
                className="border-b border-white/10 hover:bg-white/5 transition"
              >
                {/* Host Name */}
                <td className="px-6 py-4">
                  <div className="font-semibold text-white">{admin.hostName}</div>
                  <div className="text-sm text-slate-400">
                    {admin.designation || "—"}
                  </div>
                </td>

                {/* Email */}
                <td className="px-6 py-4">
                  <a
                    href={`mailto:${admin.email}`}
                    className="text-blue-400 hover:text-blue-300 transition"
                  >
                    {admin.email}
                  </a>
                </td>

                {/* Department */}
                <td className="px-6 py-4 text-slate-300">{admin.department || "—"}</td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                      STATUS_COLORS[admin.status]?.bg || "bg-slate-900/30"
                    } ${STATUS_COLORS[admin.status]?.border || "border-slate-600"} ${
                      STATUS_COLORS[admin.status]?.text || "text-slate-300"
                    }`}
                  >
                    {admin.status}
                  </span>
                </td>

                {/* Approved */}
                <td className="px-6 py-4">
                  {admin.isApproved ? (
                    <span className="text-green-400 font-medium">✅ Approved</span>
                  ) : (
                    <span className="text-yellow-400 font-medium">⏳ Pending</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onSelect(admin)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm transition"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/5">
          <p className="text-sm text-slate-400">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedAdmins.length)} of{" "}
            {sortedAdmins.length} admins
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded font-medium text-sm transition"
            >
              Previous
            </button>

            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum =
                totalPages <= 5 ? i + 1 : Math.max(1, currentPage - 2) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded font-medium text-sm transition ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-white"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded font-medium text-sm transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}