import React from "react";

export default function VisitorModal({ visitor, onClose, onAction }) {
  if (!visitor) return null;

  const handleAction = async (action) => {
    try {
      await onAction(visitor, action);
    } catch (err) {
      console.error("Modal action error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold">Visitor Details</h3>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Name</div>
            <div className="font-medium">{visitor.name}</div>

            <div className="text-sm text-gray-500 mt-2">Phone</div>
            <div className="font-medium">{visitor.phone}</div>

            <div className="text-sm text-gray-500 mt-2">Email</div>
            <div className="font-medium">{visitor.email}</div>

            <div className="text-sm text-gray-500 mt-2">Purpose</div>
            <div className="font-medium">{visitor.purpose}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">Host</div>
            <div className="font-medium">{visitor.whomToMeet}</div>

            <div className="text-sm text-gray-500 mt-2">Visit Date</div>
            <div className="font-medium">{visitor.visitDate ? new Date(visitor.visitDate).toLocaleString() : "—"}</div>

            <div className="text-sm text-gray-500 mt-2">Status</div>
            <div className="font-medium">{visitor.status}</div>

            <div className="text-sm text-gray-500 mt-2">Flags</div>
            <div className="flex gap-2 mt-1">
              {visitor.watchList && <span className="px-2 py-1 bg-yellow-100 rounded text-sm">Watchlist</span>}
              {visitor.blocked && <span className="px-2 py-1 bg-red-100 rounded text-sm">Blocked</span>}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={() => handleAction("surrender")} className="px-4 py-2 bg-green-600 text-white rounded">Mark Surrendered</button>
          <button onClick={() => handleAction("toggleWatch")} className="px-4 py-2 bg-yellow-500 text-black rounded">{visitor.watchList ? "Remove Watchlist" : "Add to Watchlist"}</button>
          <button onClick={() => handleAction("toggleBlock")} className="px-4 py-2 bg-red-600 text-white rounded">{visitor.blocked ? "Unblock Visitor" : "Block Visitor"}</button>
        </div>
      </div>
    </div>
  );
}
