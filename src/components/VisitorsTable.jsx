import React from "react";

const STATUS_COLORS = {
  registered: "#60A5FA",
  "profile-completed": "#34D399",
  in_premise: "#F59E0B",
  surrendered: "#94A3B8",
  expired: "#F87171",
  blocked: "#EF4444",
};

export default function VisitorsTable({ visitors, onSelect }) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow p-4">
      <table className="w-full table-auto">
        <thead>
          <tr className="text-left text-sm text-gray-500">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Phone</th>
            <th className="px-3 py-2">Host</th>
            <th className="px-3 py-2">Visit Date</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(visitors) && visitors.map(v => (
            <tr key={v.visitorId || v._id || v.phone} className="border-t">
              <td className="px-3 py-3">{v.name}</td>
              <td className="px-3 py-3">{v.phone}</td>
              <td className="px-3 py-3">{v.whomToMeet}</td>
              <td className="px-3 py-3">{v.visitDate ? new Date(v.visitDate).toLocaleString() : "—"}</td>
              <td className="px-3 py-3">
                <span className="px-2 py-1 rounded text-sm" style={{ background: STATUS_COLORS[v.status] || "#E5E7EB", color: "#111827" }}>
                  {v.status}
                </span>
              </td>
              <td className="px-3 py-3">
                <button onClick={() => onSelect(v)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
